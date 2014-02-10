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
		    tasks = [];

		if (!this.render) {
			return next();
		}

		// Get the augmented types to apply
		this.getTypesToApply(function(types) {

			var i;

			for (i = 0; i < types.length; i++) {
				(function(type){

					if (type.beforeSave) {
						tasks[tasks.length] = function (next_task) {
							type.beforeSave(record, options, next_task);
						};
					}
					
				}(types[i]));
			}
			
			// Start executing all the types
			async.parallel(tasks, function() {
				next();
			});
		});
	};
});