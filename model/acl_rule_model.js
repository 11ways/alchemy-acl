var async = alchemy.use('async');

/**
 * ACL Rules Model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function AclRuleModel() {

	this.types = alchemy.shared('Acl.ruleTypes');

	this.preInit = function preInit() {

		this.parent();

		this.hasAndBelongsToMany = {
			TargetGroups: {
				modelName: 'AclGroup',
				foreignKey: 'target_groups'
			},
			TargetUsers: {
				modelName: 'User',
				foreignKey: 'target_users'
			}
		};

		this.blueprint = {
			// What to filter
			type: {
				type: 'Enum'
			},
			settings: {
				type: 'Object'
			}
		};

		this.modelEdit = {
			general: {
				title: __('chimera', 'General'),
				fields: [
					'type',
					'target_groups',
					'target_users'
				]
			},
			settings: {
				title: __('chimera', 'Settings'),
				fields: [
					{
						field: 'settings',
						type: 'blueprint',
						origin: 'type'
					}
				]
			}
		};
	};

	/**
	 * Get all the ACL Rule Types that can be applied to the given domain
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.getTypesByDomain = function getTypesByDomain(domain) {

		var key,
		    type,
		    result = [];

		for (key in this.types) {

			type = this.types[key];

			if (type.domains && type.domains.indexOf(domain) > -1) {
				result.push(type);
			}
		}

		return result;
	};

	/**
	 * Get all the groups that apply to the given user
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.getUserGroups = function getUserGroups(user) {

		var groups;

		// Always include the 'everyone' group
		groups = [alchemy.plugins.acl.EveryoneGroupId];

		if (user) {
			// If the user entry exists, include the logged in group
			groups.push(alchemy.plugins.acl.LoggedInGroupId);

			// Include the groups this user has been assigned to
			groups = groups.concat(user.acl_group_id);
		}

		return groups;
	};

	/**
	 * Get all the rules for the given user
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   user      The user object as it is in the session
	 * @param    {Function} callback  The function to pass the rules to
	 */
	this.getUserRules = function getUserRules(user, callback) {

		var condition = {},
		    groups,
		    users;

		// Always include the 'everyone' group
		groups = [alchemy.plugins.acl.EveryoneGroupId];

		if (user) {
			// If the user entry exists, include the logged in group
			groups.push(alchemy.plugins.acl.LoggedInGroupId);

			// Include the groups this user has been assigned to
			groups = groups.concat(user.acl_group_id);

			users = [user._id];
		}

		// @todo: fix dbquery so this works
		condition.or = {
			'target_groups': groups,
			'target_users': users
		};

		this.find('all', function(err, items) {

			var sharedGroup,
			    sharedUser,
			    rules = [],
			    rule,
			    use;

			for (var i = 0; i < items.length; i++) {

				rule = items[i]['AclRule'];
				use = false;

				sharedGroup = groups.shared(rule.target_groups, String);
				sharedUser = users.shared(rule.target_users, String);

				// If this rule matches a group or the user, use it
				if (sharedGroup.length || sharedUser.length) {
					rules.push(rule);
				}
			}

			rules = alchemy.hawkejs.order(rules, {mainName: 'settings.order'})

			callback(rules);
		});
	};

	/**
	 * Get the field settings for the given model for this user
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.getModelFields = function getModelFields(model, callback) {

		var that = this,
		    type;

		if (!this.render) {
			return callback(alchemy.createError('Tried to get the ACL Model fields without render object'));
		}

		if (typeof model == 'object' && model.modelName) {
			model = model.modelName;
		}

		// If the model is still a string, we have to get an augmented instance
		// if it's not, it's probably a sub-blueprint
		if (typeof model == 'string') {
			// Get the augmented model
			model = this.getModel(model);
		}

		// Get the model rule type
		type = this.types['model'];
		type = type.augment({model: model, render: that.render});

		type.getFieldFlags(true, function(err, fields, modelFlags) {

			var fieldFlags = alchemy.inject({}, fields);
			fieldFlags.__modelFlags = modelFlags;

			callback(null, fieldFlags);
		});
	};

	/**
	 * Get all the fields for this model and its associations
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Object}   model
	 */
	this.getAllFields = function getAllFields(model, callback) {

		// Find out which models we need to get
		var that      = this,
		    tasks     = {},
		    aliasMap  = Model.getAssociationsMap(model),
		    alias;

		// Get the model field flags for every alias
		Object.each(aliasMap, function(modelName, alias) {
			tasks[alias] = function(next) {
				that.getModelFields(modelName, next);
			};
		});

		async.parallel(tasks, callback);
	};

});