var bcrypt = alchemy.use('bcrypt'),
    AclPlugin = alchemy.plugins.acl,
    Conduit = Classes.Alchemy.Conduit;

/**
 * The ACL Static Controller
 *
 * @constructor
 * @extends  alchemy.classes.AppController
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.5.0
 */
var AclStatic = Function.inherits('Alchemy.Controller.App', function AclStatic(conduit, options) {
	AclStatic.super.call(this, conduit, options);
});

/**
 * Render given view and add default variables
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.5.3
 * @version  0.5.3
 */
AclStatic.setMethod(function render(status, template) {

	if (!this.set('pagetitle')) {
		let page_title = alchemy.settings.page_title;

		if (!page_title) {
			page_title = alchemy.settings.title;
		}

		this.setTitle('Login | ' + (page_title || 'Alchemy'));
	}

	return render.super.call(this, status, template);
});

/**
 * Render the join form (GET-only)
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.5.0
 */
AclStatic.setAction(function joinForm(conduit) {
	this.render('acl/join');
});

/**
 * Render the login form (GET-only)
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.5.0
 */
AclStatic.setAction(function loginForm(conduit) {

	let u = conduit.param('u');

	if (u) {
		this.set('u', u);
	}

	this.render('acl/login');
});

/**
 * Log in the user (POST-only)
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.5.0
 */
AclStatic.setAction(function loginPost(conduit) {

	var username,
	    password;

	username = conduit.body[alchemy.plugins.acl.username];
	password = conduit.body[alchemy.plugins.acl.password];

	if (!username || !password) {
		return conduit.notAuthorized();
	}

	let that = this,
	    User = Model.get('User'),
	    remember = conduit.body.remember === 'on',
	    crit = User.find();

	crit.where(alchemy.plugins.acl.username).equals(username);

	User.find('first', crit, function gotUser(err, record) {

		if (err != null) {
			return conduit.error(err);
		}

		if (!record) {
			return conduit.notAuthorized(true);
		}

		if (alchemy.plugins.acl.password_checker) {
			alchemy.plugins.acl.password_checker(password, record.password, compared);
		} else {
			if (!bcrypt) {
				return conduit.error(new Error('Password comparison error'));
			}

			bcrypt.compare(password, record.password, compared);
		}

		function compared(err, match) {

			if (err != null) {
				return conduit.error(err);
			}

			if (match) {
				that.allow(record, remember);
			} else {
				conduit.notAuthorized(true);
			}
		}
	});
});

/**
 * Log the user out
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.6.0
 */
AclStatic.setAction(function logout() {

	var redirect_url;

	if (alchemy.plugins.acl.destroy_session_on_logout) {
		let session = this.conduit.getSession(false);

		if (session) {
			session.destroy();
		}
	} else {
		// Remove the user data from the session
		this.session('afterLogin', null);
		this.session('UserData', null);
	}

	this.cookie('acpl', null);

	this.conduit.expose('acl-user-data', null);

	// Try getting a url to redirect the user to
	redirect_url = this.conduit.param('redirect_url') || this.conduit.param('return_url');

	if (!redirect_url || typeof redirect_url != 'string') {
		redirect_url = '/';
	}

	// Redirect the user
	this.conduit.redirect(redirect_url);
});

/**
 * The user has succesfully authenticated
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.2.0
 *
 * @param    {UserDocument}   UserData
 * @param    {Boolean}        remember
 */
AclStatic.setMethod(function allow(UserData, remember) {

	var afterLogin = this.session('afterLogin'),
	    that = this;

	// Remove the session
	this.session('afterLogin', null);

	if (!afterLogin || !afterLogin.url) {
		afterLogin = {url: '/'};
	}

	// Store the userdata in the session
	this.session('UserData', UserData);

	if (remember) {
		UserData.createPersistentCookie(function gotCookie(err, result) {
			that.cookie('acpl', {i: result.identifier, t: result.token}, {expires: 'never'});
			that.conduit.redirect(afterLogin);
		});
	} else {
		that.conduit.redirect(afterLogin);
	}
});

/**
 * The current user is not authorized and needs to log in
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.2.0
 * @version  0.6.0
 *
 * @param    {Boolean}   tried_auth   Indicate that this was an auth attempt
 */
Conduit.setMethod(function notAuthorized(tried_auth) {

	var afterLogin,
	    template;

	if (tried_auth) {
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

	if (this.ajax) {
		template = alchemy.plugins.acl.not_authorized_ajax_template;
	}

	if (!template) {
		template = alchemy.plugins.acl.not_authorized_template;
	}

	if (!template) {
		template = 'acl/login';
	}

	if (tried_auth) {
		template = 'acl/login';
	}

	if (this.controller) {
		this.controller.render(template);
	} else {
		this.render(template);
	}
});

/**
 * The current user is authenticated, but not allowed
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.2.0
 * @version       0.2.0
 */
Conduit.setMethod(function forbidden() {

	var user = this.session('UserData');

	if (user) {
		this.deny(403, 'Forbidden');
	} else {
		this.notAuthorized();
	}
});
