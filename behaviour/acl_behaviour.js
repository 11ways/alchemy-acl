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

	
	this.afterFind = function afterFind(next, err, results, primary, alias) {

		this.preparePermissionType(next, results, alias, function tasker(next_task, type, item) {
			type.afterFind(next_task, null, item, primary, alias);
		});

	};

	this.beforeSave = function beforeSave(next, record, options) {
		this.preparePermissionType(next, record, function tasker(next_task, type, item) {
			type.beforeSave(next_task, item, options);
		});
	};

	this.preparePermissionType = function preparePermissionType(next, results, alias, tasker) {

		if (typeof alias == 'function') {
			tasker = alias;
			alias = undefined;
		}

		// If the render object isn't available, do nothing
		if (!this.render) {
			return next();
		}

		var user = this.render.req.session.user || false,
		    Permission = Model.get('AclDataPermission'),
		    that = this;

		// Make sure the results object is an array
		if (!Array.isArray(results)) {
			results = [results];
		}

		Permission.getUserPermissions(user, this.modelName, function(rules) {

			var tasks = [],
			    i,
			    j;

			for (i = 0; i < rules.length; i++) {

				for (j = 0; j < results.length; j++) {

					(function(rule, item) {
						tasks[tasks.length] = function(next_task) {

							var type = Permission.getDataType(rule.type);

							// If no valid type was found, continue to the next task
							if (!type) {
								return next_task();
							}

							// Prepare the type data
							type.prepare({
								rule: rule,
								model: that.getModel(that.modelName),
								item: item
							}, function afterPrepare() {
								tasker(next_task, type, item);
							});

						};
					}(rules[i], results[j]));
				}
			}

			async.series(tasks, function(err, f_results) {

				// @todo: this should really be structured better,
				// but right now it just needs to work
				if (alias) {
					var items = results,
					    entry,
					    item,
					    _acl,
					    i,
					    j;

					for (i = 0; i < items.length; i++) {
						item = items[i];

						item = item[alias];

						if (!Array.isArray(item)) {
							item = [item];
						}

						for (j = 0; j < item.length; j++) {
							entry = item[j];

							if (!entry) {
								continue;
							}

							_acl = entry._acl;

							if (!_acl && entry.settings) {
								_acl = entry.settings._acl;
							}

							if (_acl && _acl.allow_groups) {
								if (!alchemy.areIn('or', _acl.allow_groups, user.groups)) {
									
									// Remove the item from the array, and detract the counter by 1
									item.splice(j, 1);
									j--;

									// If the original item wasn't an array, remove it there too
									if (!Array.isArray(items[i][alias])) {
										delete items[i][alias];
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

});