/**
 * ACL Target objects
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function AclPermissionModel() {

	this.types = alchemy.shared('Acl.types');

	this.targets = {
		everyone: __('acl', 'Everyone'),
		loggedout: __('acl', 'Logged out'),
		registered: __('acl', 'Registered'),
		user: __('acl', 'User'),
		group: __('acl', 'Group')
	};

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
			// First condition
			parent_name: {
				type: 'String',
				index: {
					unique: true,
					name: 'target_name',
				}
			},
			// Second condition
			child_name: {
				type: 'String',
				index: {
					unique: true,
					name: 'target_name',
				}
			},
			// Allow access?
			allow: {
				type: 'Boolean',
				default: null
			},
			// The order of execution
			order: {
				type: 'Number',
				default: 10
			},
			// Halt further checks?
			halt: {
				type: 'Boolean',
				default: false
			}

		};
	};

	/**
	 * Get all the rules for the given user
	 */
	this.getUserPermissions = function getUserPermissions(user, callback) {

		this.find('all', function(err, items) {

			var rule, use, rules = [];

			for (var i = 0; i < items.length; i++) {

				rule = items[i]['AclPermission'];
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
					if (rule.target_group in user.groups) use = true;
				}

				if (use) {
					rules.push(rule);
				}
			}

			rules.sort(sortRules);
			pr(rules);

			callback(rules);
		});
	};

	/**
	 * Does the given user (if any) have access for this request?
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.checkRequest = function checkRequest(req, res, next) {

		var user   = req.session.user,
		    eroute = req.route,
		    aroute = req.alchemyRoute,
		    that   = this;

		// Get all the rules applying to this user
		this.getUserPermissions(user, function(rules) {

			var rule, allow = true, halt = false, apply, acltype, appliedacl, appliedrule;

			for (var i = 0; i < rules.length; i++) {

				// Reference to the current rule
				rule = rules[i];

				// Get the acltype
				acltype = that.types[rule.type];

				// Make sure the type and the function exist
				if (acltype && acltype.check) {

					// Does this rule apply?
					apply = acltype.check(rule, aroute, req);

					if (apply) {
						allow = rule.allow;
						halt = rule.halt;
						appliedacl = acltype;
						appliedrule = rule;
					}
					
					// If this rule halts all the others, break out the loop
					if (halt) break;
				}
			}

			if (appliedacl) {
				if (allow) {
					appliedacl.allowed(appliedrule, user, req);
				} else {
					appliedacl.denied(appliedrule, user, req);
				}
			} else {
				if (allow) {
					log.acl('User ' + user + ' is ' + 'allowed'.bold.green + ' access to url ' + req.originalUrl);
				} else {
					log.acl('User ' + user + ' is ' + 'denied'.bold.red + ' access to url ' + req.originalUrl);
				}
			}

			// If the request is made with a response object
			if (res) {
				if (allow) {
					next();
				} else if (!user) {
					req.session.whenAuthRedirect = req.originalUrl;
					res.redirect('/login');
				} else {
					res.redirect('/acl/unauthorized');
				}
			} else {
				next(allow);
			}

		});

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