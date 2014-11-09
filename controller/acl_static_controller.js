var bcrypt = alchemy.use('bcrypt'),
    AclPlugin = alchemy.plugins.acl,
    Conduit = alchemy.classes.Conduit;

/**
 * The ACL Static Controller
 *
 * @constructor
 * @extends  alchemy.classes.AppController
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  1.0.0
 */
var AclStatic = Function.inherits('AppController', function AclStaticController(conduit, options) {
	AclStaticController.super.call(this, conduit, options);
});

/**
 * Render the login form (GET-only)
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  1.0.0
 */
AclStatic.setMethod(function loginForm(conduit) {
	this.render('acl/login');
});

/**
 * Log in the user (POST-only)
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  1.0.0
 */
AclStatic.setMethod(function loginPost(conduit) {

	var that = this,
	    conditions,
	    username,
	    password;

	username = conduit.body.username;
	password = conduit.body.password;

	pr(conduit.body, true);

	if (!username || !password) {
		pr('Body not set?');
		return this.notAuthorized();
	}

	Model.get('User').find('first', {conditions: {username: username}}, function gotUser(err, items) {

		var record;

		if (err != null) {
			return that.error(err);
		}

		record = items[0];

		if (!record) {
			return conduit.notAuthorized(true);
		} else {
			record = record.User;
		}

		bcrypt.compare(password, record.password, function compared(err, match) {

			if (err != null) {
				return that.error(err);
			}

			if (match) {
				that.allow(record);
			} else {
				conduit.notAuthorized(true);
			}
		});
	});
});

/**
 * Log the user out
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  1.0.0
 */
AclStatic.setMethod(function logout() {

	// Remove the user data from the session
	this.session('afterLogin', null);
	this.session('UserData', null);

	// Redirect to the root
	this.conduit.redirect('/');
});

/**
 * The user has succesfully authenticated
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  1.0.0
 *
 * @param    {Object}   UserData
 */
AclStatic.setMethod(function allow(UserData) {

	var afterLogin = this.session('afterLogin');

	// Remove the session
	this.session('afterLogin', null);

	if (!afterLogin || !afterLogin.url) {
		afterLogin = {url: '/'};
	}

	// Store the userdata in the session
	this.session('UserData', UserData);

	this.conduit.redirect(afterLogin);
});

/**
 * The current user is not authorized and needs to log in
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {Boolean}   triedAuth   Indicate that this was an auth attempt
 */
Conduit.setMethod(function notAuthorized(triedAuth) {

	var afterLogin

	if (triedAuth) {
		this.set('authError', 'Username/Password are not correct');
	} else {
		// Store the request
		afterLogin = {
			url: this.url,
			body: this.body,
			method: this.method,
			headers: this.headers
		};

		this.session('afterLogin', afterLogin);
	}

	this.setHeader('x-fallback-url', '/login');

	this.status = 401;
	this.render('acl/login');
});

/**
 * The current user is authenticated, but not allowed
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         1.0.0
 * @version       1.0.0
 */
Conduit.setMethod(function forbidden() {

	var user = this.session('UserData');

	if (user) {
		this.deny(403, 'Forbidden');
	} else {
		this.notAuthorized();
	}
});

Router.use(function checkUrl(req, res, next) {

	var options,
	    groups,
	    users,
	    user,
	    path;
	
	path = req.conduit.url.pathname;
	user = req.conduit.session('UserData');
	groups = [AclPlugin.EveryoneGroupId];

	if (user) {
		groups.push(AclPlugin.LoggedInGroupId);
		groups = groups.concat(user.acl_group_id);
		users = [user._id];
	} else {
		user = {};
		users = [];
	}

	options = {
		conditions: {
			'settings.url': {$type: 11}
		},
		recursive: 0,
		sort: {'settings.order': 'DESC'}
	};

	Model.get('AclRule').find('all', options, function gotRules(err, rules) {

		var allowed = true,
		    sharedGroup,
		    sharedUser,
		    rule,
		    i;

		for (i = 0; i < rules.length; i++) {
			rule = rules[i].AclRule;

			// See if this rule applies to this url
			if (rule.settings.url.test(path)) {

				// See if this rule applies to our user
				sharedGroup = groups.shared(rule.target_groups_id, String);
				sharedUser = users.shared(rule.target_users_id, String);

				// If this rule matches a group or the user, use it
				if (sharedGroup.length || sharedUser.length) {
					allowed = rule.settings.allow;

					if (rule.settings.halt) {
						break;
					}
				}
			}
		}

		if (!allowed) {
			req.conduit.forbidden();
		} else {
			next();
		}
	});
}, {weight: 9000});