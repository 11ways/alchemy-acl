var async = alchemy.use('async');

/**
 * The ACL Behaviour class
 *
 * @constructor
 * @extends       alchemy.classes.Behaviour
 *
 * @author        Jelle De Loecker   <jelle@codedor.be>
 * @since         0.0.1
 * @version       0.0.1
 */
Behaviour.extend(function AclBehaviour (){

	this.dataTypes = alchemy.shared('Acl.dataTypes');

	/**
	 * The preInit constructor
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.preInit = function preInit() {

		// Call the parent preInit function
		this.parent('preInit');

	};

	/**
	 * The behaviour constructor
	 *
	 * @author   Jelle De Loecker   <jelle@kipdola.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Model}     model    Model instance
	 * @param    {Object}    options  Bhaviour options
	 *
	 * @return   {undefined}
	 */
	this.init = function init(model, options) {

		// Call the parent init function
		this.parent('init');

		// Add the acl entry
		// model.blueprint._acl = {
		// 	type: 'Object'
		// };

		this.modelName = model.modelName;
	};

	/**
	 * Get all the rule types that can be applied
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.getTypesToApply = function getTypesToApply(callback) {

		var AclRule   = Model.get('AclRule'),
		    ruleTypes = AclRule.getTypesByDomain('behaviour'),
		    tasks     = [],
		    that      = this,
		    useTypes  = [],
		    i;

		for (i = 0; i < ruleTypes.length; i++) {

			(function(type) {

				tasks[tasks.length] = function(next_task) {

					// Make sure the type has the method to check if it applies
					if (!type.doesTypeApply) {
						return next_task();
					}

					type.doesTypeApply(that.model, function(apply) {

						// If apply is true, add it to the array of types to use
						if (apply) {
							useTypes.push(type.augment({model: that.model, render: that.render}));
						}

						next_task();
					});
				};

			}(ruleTypes[i]));
		}

		async.parallel(tasks, function() {
			callback(useTypes);
		});
	};

	/**
	 * Launch the beforeRemove methods of the rule types, if they are defined
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.beforeRemove = function beforeRemove(next, data) {

		var that  = this,
		    tasks = [],
		    user;

		if (!this.render) {
			return next();
		}

		user = that.render.req.session.user;

		// If the user is a superuser, do nothing
		if (user && user.groups[String(alchemy.plugins.acl.SuperUserGroupId)]) {
			return next();
		}

		// Get the augmented types to apply
		this.getTypesToApply(function(types) {

			types.forEach(function(type) {
				if (type.beforeRemove) {
					tasks[tasks.length] = function (next_task) {
						type.beforeRemove(data, function(response) {

							// If the beforeFind returns an explicit false,
							// ignore the other types and do nothing
							if (response === false) {
								next(false);
							} else {
								next_task();
							}
						});
					};
				}
			});
			
			// Start executing all the types
			async.parallel(tasks, function() {
				next();
			});
		});
	};

	/**
	 * Launch the beforeFind methods of the rule types, if they are defined
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.beforeFind = function beforeFind(next, options) {

		var that  = this,
		    tasks = [],
		    user;

		if (!this.render) {
			return next();
		}

		user = that.render.req.session.user;

		// If the user is a superuser, do nothing
		if (user && user.groups[String(alchemy.plugins.acl.SuperUserGroupId)]) {
			return next();
		}

		// Get the augmented types to apply
		this.getTypesToApply(function(types) {

			types.forEach(function(type) {
				if (type.beforeFind) {
					tasks[tasks.length] = function (next_task) {
						type.beforeFind(options, function(response) {

							// If the beforeFind returns an explicit false,
							// ignore the other types and do nothing
							if (response === false) {
								next(false);
							} else {
								next_task();
							}
						});
					};
				}
			});
			
			// Start executing all the types
			async.parallel(tasks, function() {
				next();
			});
		});
	};

	/**
	 * Launch the afterFind methods of the rule types, if they are defined
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.afterFind = function afterFind(next, err, results, primary, alias) {

		var that  = this,
		    tasks = [],
		    user;

		if (!this.render) {
			return next();
		}

		user = that.render.req.session.user;

		// Get the augmented types to apply
		this.getTypesToApply(function(types) {

			var i;

			for (i = 0; i < types.length; i++) {
				(function(type){

					if (type.afterFind) {
						tasks[tasks.length] = function (next_task) {
							type.afterFind(results, primary, alias, next_task);
						};
					}

				}(types[i]));
			}
			
			// Start executing all the types
			async.parallel(tasks, function() {

				var groups, acl, entry, item, i, j, allow;

				allow = true;

				// If the user is a superuser, do nothing
				if (user && user.groups[String(alchemy.plugins.acl.SuperUserGroupId)]) {
					return next();
				}

				groups = Model.get('AclRule').getUserGroups(user);

				for (i = 0; i < results.length; i++) {

					item = results[i];
					item = item[alias];

					// Cast the item to an array
					if (!Array.isArray(item)) {
						item = [item];
					}

					for (j = 0; j < item.length; j++) {

						entry = item[j];

						if (!entry) {
							continue;
						}

						// Get the ACL setting for this record
						acl = entry._acl;

						if (!acl && entry.settings) {
							acl = entry.settings._acl;
						}

						if (acl) {

							if (acl.read && acl.read.groups.length) {
								allow = false;

								if (acl.read.groups.shared(groups, String).length) {
									allow = true;
								}

								if (acl.read.users.shared([user._id], String).length) {
									allow = true;
								}

								// If allow is false, remove the entry
								if (!allow) {
									item.splice(j, 1);
									j--;

									if (!Array.isArray(results[i][alias])) {
										delete results[i][alias];
									}
								}
							}
						}
					}
				}

				next();
			});
		});
	};

	/**
	 * Launch the beforeSave methods of the rule types, if they are defined
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.beforeSave = function beforeSave(next, record, options) {

		var that  = this,
		    tasks = [],
		    getOriginal = {},
		    user;

		if (!this.render) {
			return next();
		}

		user = that.render.req.session.user;

		// If the user is a superuser, do nothing
		if (user && user.groups[String(alchemy.plugins.acl.SuperUserGroupId)]) {
			return next();
		}

		if (record._id) {
			getOriginal.original = function(next) {

				// Get an unaugmented model
				var model = Model.get(that.model.modelName);

				model.find('first', {conditions: {_id: record._id}}, function(err, result) {

					if (result.length) {
						next(result[0][that.model.modelName]);
					} else {
						next();
					}

				});
			}
		}

		// Get the original record if it exists
		async.series(getOriginal, function(result) {

			var original;

			if (result) {
				original = result;
			} else {
				original = {};
			}

			// Get the augmented types to apply
			that.getTypesToApply(function(types) {

				var i;

				types.forEach(function forEachType(type) {
					if (type.beforeSave) {
						tasks[tasks.length] = function (next_task) {
							type.beforeSave(original, record, options, function(err) {

								if (err) {
									return next(err);
								}

								next_task();
							});
						};
					}
				});

				// Start executing all the types
				async.parallel(tasks, function() {
					next();
				});
			});

		});

		
	};
});