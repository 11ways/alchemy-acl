var AclTargets = alchemy.shared('Acl.targets');
AclTargets.everyone = __('acl', 'Everyone');
AclTargets.loggedout = __('acl', 'Logged out');
AclTargets.registered = __('acl', 'Registered');
AclTargets.user = __('acl', 'User');
AclTargets.group = __('acl', 'Group');

/**
 * ACL Data Permissions
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function AclDataPermissionModel() {

	this.types = alchemy.shared('Acl.dataTypes');
	this.targets = alchemy.shared('Acl.targets');
	this.target_models = alchemy.models;

	this.preInit = function preInit() {

		this.parent();

		this.belongsTo = {
			TargetUser: {
				modelName: 'User',
				foreignKey: 'target_user'
			},
			TargetGroup: {
				modelName: 'AclGroup',
				foreignKey: 'target_group'
			}
		};

		this.blueprint = {
			// The target audience
			target: {
				type: 'Enum',
				index: {
					unique: true,
					name: 'target_name'
				},
			},
			// The target model
			target_model: {
				type: 'Enum',
				index: {
					unique: true,
					name: 'target_name'
				}
			},
			// The target user (if applicable)
			target_user: {
				type: 'ObjectId',
				index: {
					unique: true,
					name: 'target_name'
				}
			},
			// The target group (if applicable)
			target_group: {
				type: 'ObjectId',
				index: {
					unique: true,
					name: 'target_name'
				},
			},
			// What to filter
			type: {
				type: 'Enum',
				index: {
					unique: true,
					name: 'target_name',
				}
			},
			// Settings for this permission
			settings: {
				type: 'Object'
			},
			// The order of execution
			order: {
				type: 'Number',
				default: 10
			}
		};
	};

	/**
	 * Get all the rules for the given user
	 */
	this.getUserPermissions = function getUserPermissions(user, model, callback) {

		var options,
		    modelName;

		if (typeof model == 'object') {
			modelName = model.modelName;
		} else {
			modelName = model.modelName();
		}

		var options = {
			conditions: {
				'target_model': modelName
			}
		};

		this.find('all', options, function(err, items) {

			var rule, use, rules = [];

			for (var i = 0; i < items.length; i++) {

				rule = items[i]['AclDataPermission'];
				use = false;

				if (rule.target === 'everyone') {
					use = true;
				} else if (rule.target === 'loggedout') {
					if (!user) use = true;
				} else	if (rule.target === 'registered') {
					if (user) use = true;
				} else if (rule.target === 'user') {
					if (user._id == rule.target_user) use = true;
				} else if (rule.target === 'group') {
					if (user && user.groups && rule.target_group in user.groups) use = true;
				}

				if (use) {
					rules.push(rule);
				}
			}

			rules.sort(sortRules);

			callback(rules);
		});
	};

	/**
	 * Get the wanted ACL Data Type instance
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.getDataType = function getDataType(name) {

		if (!name){
			log.error('Tried to get invalid data type');
			return false;
		}

		var Type   = this.types[name.underscore()],
		    augment = {};

		// Inject the __augment__ object into this new object
		alchemy.inject(augment, this.__augment__);

		// augment the view instance
		Type = alchemy.augment(Type, augment);

		return Type;
	};

});

/**
 * Sort the rules using this function,
 * while the ordering of the query doesn't work on the mongo side
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 */
function sortRules(a, b) {
	// Smaller orders come first
	if (a.order < b.order) return -1;

	// Biger orders go to the bottom
	if (a.order > b.order) return 1;

	return 0;
}