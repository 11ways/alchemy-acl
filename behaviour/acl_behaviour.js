var dataTypes = alchemy.shared('Acl.dataTypes'),
    cache     = alchemy.getCache('acl', '15 minutes');

/**
 * The ACL Behaviour class
 *
 * @constructor
 * @extends       alchemy.classes.Behaviour
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.0.1
 * @version       0.2.0
 */
var Acl = Function.inherits('Alchemy.Behaviour', function Acl(model, options) {
	Acl.super.call(model, options);
});

Acl.setProperty('dataTypes', dataTypes);

/**
 * Get all the rule types that can be applied
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.5.1
 */
Acl.setMethod(function getTypesToApply(callback) {

	var ruleTypes,
	    useTypes,
	    cacheId,
	    doCache,
	    aclRule,
	    result,
	    tasks,
	    that,
	    i;

	that = this;
	tasks = [];
	cacheId = 'tta-' + this.modelName + '-';

	if (this.render.req.session.user && this.render.req.session.user._id) {
		cacheId += this.render.req.session.user._id;
	} else {
		cacheId += 'undefined_user';
	}

	// Get the types from the cache
	result = cache.peek(cacheId);

	if (!result) {

		// Get the required model
		AclRule   = Model.get('AclRule');
		ruleTypes = AclRule.getTypesByDomain('behaviour');

		// Tell it to store it in cache later
		doCache = true;

		result = [];

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
							result.push(type);
						}

						next_task();
					});
				};

			}(ruleTypes[i]));
		}
	}

	Function.parallel(tasks, function() {

		if (doCache) {
			cache.set(cacheId, result);
		}

		useTypes = [];

		for (i = 0; i < result.length; i++) {
			useTypes.push(result[i].augment({model: that.model, render: that.render}));
		}

		callback(useTypes);
	});
});

/**
 * Launch the beforeRemove methods of the rule types, if they are defined
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Acl.setMethod(function beforeRemove(next, data) {

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
		Function.parallel(tasks, function() {
			next();
		});
	});
});

/**
 * Launch the beforeFind methods of the rule types, if they are defined
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 */
Acl.setMethod(function beforeFind(next, options) {

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

	this.beforeFindInItem(options);

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
		Function.parallel(tasks, function() {
			next();
		});
	});
});

/**
 * Add in-item acl conditions
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Acl.setMethod(function beforeFindInItem(options) {

	var inItemPath,
	    groups = [],
	    user = this.render.req.session.user,
	    $or = [],
	    $and,
	    key,
	    obj,
	    gid,
	    i;

	if (this.model.inItemAclPath) {
		inItemPath = this.model.inItemAclPath;
	} else {
		inItemPath = '_acl';
	}

	obj = {};
	obj[inItemPath] = null; // Is null or does not exist, better than {$exists: false};

	// Include items without any _acl settings
	$or.push(obj);

	obj = {};
	obj[inItemPath + '.read.groups'] = {$size: 0};
	obj[inItemPath + '.read.users'] = {$size: 0};

	// Or items where the _acl settings are empty
	$or.push(obj);

	if (user && user._id) {
		obj = {};
		obj[inItemPath + '.read.users'] = {$in: [alchemy.castObjectId(user._id)]};

		// Or items where this user is allowed
		$or.push(obj);

		// Or items where one of this user's group is allowed
		for (i = 0; i < user.acl_group_id.length; i++) {
			gid = alchemy.castObjectId(user.acl_group_id[i]);
			groups.push(gid);
			groups.push(''+gid);
		}

		obj = {};
		obj[inItemPath + '.read.groups'] = {$in: groups};

		$or.push(obj);
	}

	if (!options.conditions.$and) {
		options.conditions.$and = {};
	}

	$and = options.conditions.$and;

	if (!$and.$or) {
		$and.$or = $or;
	} else {

		if (Array.isArray($and.$or)) {
			$and.$or = $and.$or.concat($or);
		} else {

			for (key in $and.$or) {
				obj = {};
				obj[key] = options.conditions.$or[key];
				$or.push(obj);
			}

			$and.$or = $or;
		}
	}
});

/**
 * Launch the afterFind methods of the rule types, if they are defined
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Acl.setMethod(function afterFind(next, err, results, primary, alias) {

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
		Function.parallel(tasks, function() {

			

			next();
		});
	});
});

/**
 * Launch the beforeSave methods of the rule types, if they are defined
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Acl.setMethod(function beforeSave(next, record, options) {

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
	Function.series(getOriginal, function(result) {

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
			Function.parallel(tasks, function() {
				next();
			});
		});

	});
});