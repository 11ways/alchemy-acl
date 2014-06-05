var async = alchemy.use('async');

/**
 * ACL Groups
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function AclGroupModel(){

	this.preInit = function preInit() {

		this.parent();

		this.displayField = 'name';

		this.sort = {
			root: 'DESC',
			weight: 'DESC'
		};

		this.belongsTo = {
			InheritFromGroup: {
				modelName: 'AclGroup',
				foreignKey: 'inherit_from_group_id'
			},
			ForfeitToGroup: {
				modelName: 'AclGroup',
				foreignKey: 'forfeit_to_group_id',
			}
		};

		this.hasMany = {
			ChildGroup: {
				modelName: 'AclGroup',
				foreignKey: 'parent_group_id'
			},
			GroupPermission: {
				modelName: 'AclPermission',
				foreignKey: 'target_group'
			}
		};

		this.hasAndBelongsToMany = {
			User: {
				modelName: 'User',
				associationKey: 'acl_group_id'
			}
		};

		this.blueprint = {
			name: {
				type: 'String',
				index: {
					unique: true,
					name: 'acl_group_name',
				}
			},
			description: {
				type: 'Text'
			},
			inherit_from_group_id: {
				type: 'ObjectId',
				index: {
					unique: true,
					name: 'acl_group_name',
				}
			},
			forfeit_to_group_id: {
				type: 'ObjectId'
			},
			weight: {
				type: 'Number',
				default: 10
			},
			root: {
				type: 'Boolean',
				default: false
			},
			special: {
				type: 'Boolean',
				default: false
			},
			special_command: {
				type: 'String'
			}
		};

		/**
		 * Chimera settings
		 */
		this.modelIndex = {
			fields: ['name', 'description', 'weight', 'root', 'inherit_from_group_id', 'forfeit_to_group_id']
		};

		this.modelEdit = {
			general: {
				title: __('chimera', 'General'),
				fields: ['name', 'description', 'weight', 'root', 'inherit_from_group_id', 'forfeit_to_group_id']
			}
		};
	};

	/**
	 * Make sure every group forfeits its right to another group,
	 * unless it's the highest group (superusers)
	 */
	this.beforeSave = function beforeSave(next, record, options) {

		var that = this;

		this.parent('beforeSave', null, function() {

			if (!record.forfeit_to_group_id && (record._id && 'forfeit_to_group_id' in record)) {

				that.find('first', {sort: {weight: 'DESC'}}, function (err, item) {

					var id;

					if (item.length) {
						// Get the id of the highest found item
						id = item[0].AclGroup._id;

						// Make sure it doesn't forfeit to itself
						if ((''+id) != record._id) {
							record.forfeit_to_group_id = item[0].AclGroup._id;
						}
					}
					
					next();
				});
			} else {
				next();
			}

		}, record, options);
	};
	
	/**
	 * Get the title to display for this record
	 *
	 * @author   Kjell Keisse   <kjell@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}        item       The record item of this model
	 * @param    {String|Array}  fallbacks  Extra fallbacks to use
	 * 
	 * @return   {String}        The display title to use
	 */
	this.getDisplayTitle = function getDisplayTitle(item, fallbacks) {

		var html;


		html = '<b>' + item.name + '</b>';
	
		if (item.description) {
			html += '<br/>' + item.description;
		}

		return html;
	};

	/**
	 * Get all the groups that apply to this user
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.getUserGroups = function getUserGroups(user, callback) {

		var that  = this,
		    tasks = {};

		// Get the related groups for every group entry in this user
		user.acl_group_id.forEach(function(groupId) {

			// Get the family of every group
			tasks[groupId] = function(next) {

				that.find('first', {fields: ['name'], conditions: {'_id': groupId}}, function(err, group) {

					var result = {};

					if (err) {
						return next(err);
					}

					result[groupId] = group[0].AclGroup.name;

					that.getGroupFamily(groupId, function(err, family) {
						var key;

						if (err) {
							return next(err);
						}

						for (key in family) {
							result[key] = family[key];
						}

						next(null, result);
					});

				});
			};
		});

		async.parallel(tasks, function(err, result) {

			var groups = {},
			    key,
			    id;

			if (err) {
				return callback(err);
			}

			for (key in result) {
				for (id in result[key]) {
					groups[id] = result[key][id];
				}
			}

			callback(null, groups);
		});
	};

	/**
	 * Get the family groups of the given group
	 * meaning: the rights of these groups also apply to the given group
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String|ObjectId}   groupId
	 * @param    {Boolean}           merge       True by default: merge into 1 object
	 * @param    {Function}          callback
	 * @param    {Object}            ignore
	 */
	this.getGroupFamily = function getGroupFamily(groupId, merge, callback, ignore) {
		
		var that  = this,
		    tasks = {};

		if (typeof ignore == 'undefined') {
			ignore = {};
		}

		if (typeof merge == 'function') {
			ignore = callback;
			callback = merge;
			merge = true;
		}

		// Task to fetch the slaves
		tasks.slaves = function getSlaves(next) {
			that.getGroupSlaves(groupId, next, ignore);
		};

		// Task to fetch the parents to inherit from
		tasks.inheritance = function getParents(next) {
			that.getGroupInheritance(groupId, next, ignore);
		}

		// Put them all together
		async.parallel(tasks, function(err, groups) {

			var result,
			    key;
			
			if (err) {
				return callback(err);
			}

			if (merge) {
				
				result = {};

				for (key in groups.inheritance) {
					result[key] = groups.inheritance[key];
				}

				for (key in groups.slaves) {
					result[key] = groups.slaves[key];
				}
			} else {
				result = groups;
			}

			callback(null, result);
		});
	};

	/**
	 * Get all the slaves group of the current group
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String|ObjectId}   groupId
	 * @param    {Function}          callback
	 * @param    {Object}            ignore
	 */
	this.getGroupSlaves = function getGroupSlaves(groupId, callback, ignore) {

		var that  = this,
		    groups = {},
		    options = {
				conditions: {
					forfeit_to_group_id: groupId
				},
				fields: ['AclGroup._id', 'AclGroup.name', 'AclGroup.forfeit_to_group_id']
			};

		if (typeof ignore == 'undefined') {
			ignore = {};
		}

		// Add this group to the ignore field
		ignore[groupId] = true;

		// Get all the direct slaves of this group
		this.find('all', options, function(err, slaveGroups) {

			var names = {};

			if (err) {
				return callback(err);
			}

			slaveGroups.forEach(function(entry) {

				// Ignore entries we've already queried somewhere
				if (ignore && typeof ignore[entry.AclGroup._id] !== 'undefined') {
					return;
				}

				if (!groups[entry.AclGroup._id]) {

					// Save a link to the name
					names[entry.AclGroup._id] = entry.AclGroup.name;

					// Create the task
					groups[entry.AclGroup._id] = function getSubGroups(next) {
						that.getGroupFamily(entry.AclGroup._id, false, next, ignore);
					};
				}
			});

			async.parallel(groups, function(err, related) {

				var result = {},
				    slaveId,
				    key;

				if (err) {
					return callback(err);
				}

				// Add every group we looked for to the result
				for (slaveId in related) {
					result[slaveId] = names[slaveId];

					// And add its slaves too
					for (key in related[slaveId].slaves) {
						result[key] = related[slaveId].slaves[key];
					}

					// And add its parents, from which it inherits
					for (key in related[slaveId].inheritance) {
						result[key] = related[slaveId].inheritance[key];
					}
				}

				callback(null, result);
			})
		});
	};

	/**
	 * Get every group the given group should inherit rights from
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String|ObjectId}   groupId
	 * @param    {Function}          callback
	 * @param    {Object}            ignore
	 */
	this.getGroupInheritance = function getGroupInheritance(groupId, callback, ignore) {

		var that  = this,
		    groups = {},
		    options = {
				conditions: {
					_id: groupId
				},
				fields: ['AclGroup._id', 'AclGroup.name', 'AclGroup.inherit_from_group_id', 'InheritFromGroup.name']
			};

		if (typeof ignore == 'undefined') {
			ignore = {};
		}

		// Add this group to the ignore field
		ignore[groupId] = true;

		// Get the current group
		this.find('first', options, function(err, result) {

			var names = {},
			    parentId = result[0].AclGroup.inherit_from_group_id;

			if (err) {
				return callback(err);
			}

			if (parentId) {

				// Get all the relatives of the parent, too
				that.getGroupFamily(parentId, false, function(err, relatives) {

					var id;

					// Already store the parent id itself
					groups[parentId] = result[0].InheritFromGroup.name;

					if (relatives.slaves) {
						for (id in relatives.slaves) {
							groups[id] = relatives.slaves[id];
						}
					}

					if (relatives.inheritance) {
						for (id in relatives.inheritance) {
							groups[id] = relatives.inheritance[id];
						}
					}

					callback(null, groups);
				}, ignore);
			} else {
				callback();
			}
		});
	};

	/**
	 * Get all the parent groups of the current group, to which this group must
	 * give its permissions to
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String|ObjectId}   groupId
	 * @param    {Function}          callback
	 * @param    {Object}            ignore
	 */
	this.getGroupMasters = function getGroupMasters(groupId, callback, ignore) {
		
		var that  = this,
		    groups = {},
		    options = {
				conditions: {
					inherit_from_group_id: groupId
				},
				fields: ['AclGroup._id', 'AclGroup.name', 'AclGroup.forfeit_to_group_id']
			};

		if (typeof ignore == 'undefined') {
			ignore = {};
		}

		// Add this group to the ignore field
		ignore[groupId] = true;

		// Get all the direct slaves of this group
		this.find('all', options, function(err, parentGroups) {

			var names = {};

			if (err) {
				return callback(err);
			}

			parentGroups.forEach(function(entry) {

				// Ignore entries we've already queried somewhere
				if (ignore && typeof ignore[entry.AclGroup._id] !== 'undefined') {
					return;
				}

				if (!groups[entry.AclGroup._id]) {

					// Save a link to the name
					names[entry.AclGroup._id] = entry.AclGroup.name;

					// Create the task
					groups[entry.AclGroup._id] = function getSubGroups(next) {
						that.getGroupMasters(entry.AclGroup._id, next, ignore);
					};
				}
			});

			async.parallel(groups, function(err, masters) {

				var result = {},
				    slaveId,
				    key;

				if (err) {
					return callback(err);
				}

				pr('Found related groups:')
				pr(related, true)

				// Add every group we looked for to the result
				for (slaveId in related) {
					result[slaveId] = names[slaveId];

					// And add its parents too
					for (key in related[slaveId].parents) {
						result[key] = related[slaveId].parents[key];
					}

					// And add its slaves too
					for (key in related[slaveId].slaves) {
						result[key] = related[slaveId].slaves[key];
					}
				}
				
				callback(null, result);
			})
		});

	};
});