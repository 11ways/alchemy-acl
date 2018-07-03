var acl_rule_types = alchemy.getClassGroup('acl_rule_types'),
    AclPlugin = alchemy.plugins.acl;

/**
 * The ACL Rule Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.5.0
 */
var AclRule = Function.inherits('Alchemy.Model', function AclRule(options) {
	AclRule.super.call(this, options);
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 */
AclRule.constitute(function addFields() {

	this.addField('type', 'Enum', {values: acl_rule_types});
	this.addField('settings', 'Schema', {schema: 'type'});

	this.hasAndBelongsToMany('TargetUsers', 'User');
	this.hasAndBelongsToMany('TargetGroups', 'AclGroup');

	// Return the rule type instance
	this.Document.setFieldGetter('instance', function getCamera() {

		var before;

		if (acl_rule_types[this.type]) {
			return new acl_rule_types[this.type](this);
		} else {

			// Due to changes in the Base class the type name
			// could have changed, catch that here
			before = this.type.before('_acl_rule_type');

			if (before && acl_rule_types[before]) {
				return new acl_rule_types[before](this);
			} else {
				// We return undefined most of the time,
				// but ACL is important enough to throw an error
				throw new Error('ACL Rule Type "' + this.type + '" was not found!');
			}
		}
	});
});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.4.0
 */
AclRule.constitute(function chimeraConfig() {

	var list,
	    edit,
	    view;

	if (!this.chimera) {
		return;
	}

	// Get the list group
	list = this.chimera.getActionFields('list');

	list.addField('_id');

	// Get the edit group
	edit = this.chimera.getActionFields('edit');

	edit.addField('type');
	edit.addField('target_groups_id');
	edit.addField('target_users_id');

	edit.addField('settings');

	// Get the view group
	view = this.chimera.getActionFields('view');

	view.addField('type');
});

/**
 * Get all the rule documents that apply to the given user
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.3.0
 *
 * @param    {Object}   user      The user object as it is in the session
 * @param    {Function} callback  The function to pass the rules to
 */
AclRule.setMethod(function getUserRules(user, callback) {

	var that = this,
	    cache_key,
	    cached;

	// Try getting it from the cache first
	if (this.cache) {
		if (user) {
			cache_key = 'rules_for_user_id_' + user._id;
		} else {
			cache_key = 'rules_for_everyone';
		}

		// Get the cached rules, but don't update the timestamp
		cached = this.cache.get(cache_key, true);

		if (cached) {
			return cached.push(callback);
		}
	}

	// Make a bottleneck that is asynchronous
	cached = Function.hinder(true, function getRules(done) {

		var condition,
		    options,
		    groups,
		    users;

		// Always include the 'everyone' group
		groups = [AclPlugin.EveryoneGroupId];

		if (user) {
			// If the user entry exists, include the logged in group
			groups.push(AclPlugin.LoggedInGroupId);

			// Include the groups this user has been assigned to
			groups = groups.concat(user.acl_group_id);

			users = [user._id];
		}

		condition = {
			$or: {
				'target_groups_id': groups,
				'target_users_id': users
			}
		};

		options = {
			conditions : condition,
			recursive  : 0,
			sort       : {'settings.weight': 'DESC'}
		};

		that.find('all', options, function gotDocuments(err, documents) {

			if (err) {
				return done(err);
			}

			if (!documents.length) {
				return done(null, []);
			}

			done(null, documents);
		});
	});

	cached.push(callback);

	if (this.cache) {
		this.cache.set(cache_key, cached);
	}
});

/**
 * See if this client has permission
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 */
AclRule.setMethod(function checkRequest(req, res, next) {

	var that = this,
	    conduit = req.conduit,
	    user = conduit.session('UserData');

	this.getUserRules(user, function gotRules(err, rules) {

		var allow = true,
		    halt = false;

		if (err) {
			return next(err);
		}

		Function.forEach(rules, function eachRule(rule, index, next_rule) {
			rule.checkRequest(conduit, function checkedRule(err, allowed) {

				if (err) {
					return next_rule(err);
				}

				allow = allowed;

				if (rule.settings.halt) {
					allDone(null);
				} else {
					next_rule(null);
				}
			});
		}, allDone);

		// Function that will be executed once all rules have been checked
		// (Or when the last rule has halted the process)
		function allDone(err) {

			if (err) {
				return next(err);
			}

			if (!allow) {
				return conduit.forbidden();
			}

			next(null);
		}
	});
});

/**
 * See if this client has permission
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 */
AclRule.setDocumentMethod(function checkRequest(conduit, next) {
	this.instance.checkRequest(conduit, next);
});