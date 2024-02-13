var bcrypt = alchemy.use('bcrypt'),
    AclPlugin = alchemy.plugins.acl,
    Conduit = Classes.Alchemy.Conduit.Conduit;

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
const AclStatic = Function.inherits('Alchemy.Controller.App', 'AclStatic');

/**
 * Get the Proteus client instance
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @type     {Alchemy.Acl.Proteus}
 */
AclStatic.setProperty(function proteus() {
	return alchemy.plugins.acl.proteus_client;
});

/**
 * Ensure the title has been set
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 */
AclStatic.setMethod(function ensurePageTitle() {
	if (!this.set('pagetitle')) {
		let page_title = alchemy.settings.page_title;

		if (!page_title) {
			page_title = alchemy.settings.title;
		}

		this.setTitle('Login | ' + (page_title || 'Alchemy'));
	}
});

/**
 * Render given view and add default variables
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.5.3
 * @version  0.8.4
 */
AclStatic.setMethod(function render(status, template) {
	this.ensurePageTitle();
	return render.super.call(this, status, template);
});

/**
 * Render the proteus login form as a segment
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.7
 */
AclStatic.setAction(async function proteusLogin(conduit) {

	let authenticators;

	try {
		authenticators = await this.proteus.getAuthenticators();
	} catch (err) {
		this.set('proteus_error', this.proteus.getPublicErrorMessage(err));
	}

	this.set('authenticators', authenticators);

	this.renderSegment('acl/proteus_login_segment');
});

/**
 * Handle a proteus realm login request
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 */
AclStatic.setAction(async function proteusRealmLogin(conduit, authenticator_slug) {
	this.ensurePageTitle();
	return this.proteus.startLogin(conduit, authenticator_slug);
});

/**
 * The current user is logging in via another browser and we need to poll for the result.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.5
 * @version  0.8.5
 *
 * @param    {Conduit}  conduit
 */
AclStatic.setAction(async function proteusPollLogin(conduit) {

	let login_session = conduit.session('proteusLoginSession');

	if (!login_session?.id) {
		return conduit.notAuthorized();
	}

	if (conduit.method == 'post') {
		let result = await this.proteus.getLoginResult(login_session.id);
		let redirect;

		if (result?.success) {
			redirect = alchemy.routeUrl('AclStatic#proteusVerifyLogin', {
				rlid: login_session.id
			});
		}

		return conduit.end({
			finished : result?.finished,
			success  : result?.success,
			redirect : redirect,
		});
	}

	this.set('polling', true);
	this.render('acl/login');
});

/**
 * Show a verificatin error
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.6
 * @version  0.8.6
 */
AclStatic.setMethod(function showVerificationError(type) {
	this.set('verification_error_type', type);
	this.render('acl/proteus_verification_error');
});

/**
 * Verify a proteus login
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.6
 */
AclStatic.setAction(async function proteusVerifyLogin(conduit) {

	let rlid = conduit.param('rlid');

	if (!rlid) {
		return this.showVerificationError('no_rlid');
	}

	let login_session = conduit.session('proteusLoginSession');

	if (!login_session) {
		return this.showVerificationError('no_session');
	}

	if (login_session.id != rlid) {
		return this.showVerificationError('wrong_rlid');
	}

	let result = await this.proteus.getLoginResult(rlid);

	if (!result?.success || !result?.identity) {
		return this.showVerificationError('no_success');
	}

	let user = await this.proteus.handleSuccessfulLoginResult(conduit, result);

	return this.allow(user, true);
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
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.0.1
 * @version  0.9.0
 */
AclStatic.setAction(function loginPost(conduit) {

	// Disable simple login when Proteus is enabled
	if (alchemy.plugins.acl.has_proteus) {
		return conduit.notAuthorized();
	}

	let username = conduit.body[alchemy.settings.plugins.acl.model.username_field];
	let password = conduit.body[alchemy.settings.plugins.acl.model.password_field];

	if (!username || !password) {
		return conduit.notAuthorized();
	}

	let that = this,
	    User = Model.get('User'),
	    remember = conduit.body.remember === 'on',
	    crit = User.find();

	crit.where(alchemy.settings.plugins.acl.model.username_field).equals(username);

	User.find('first', crit, function gotUser(err, record) {

		if (err != null) {
			return conduit.error(err);
		}

		if (!record) {
			return conduit.notAuthorized(true);
		}

		if (!record.password) {
			return conduit.error(400, new Error('You can not log in with this user'));
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
 * @version  0.9.0
 */
AclStatic.setAction(function logout() {

	var redirect_url,
	    fingerprint = this.conduit.fingerprint;

	if (alchemy.settings.plugins.acl.destroy_session_on_logout) {
		let session = this.conduit.getSession(false);

		if (session) {
			session.destroy();
		}
	} else {
		// Remove the user data from the session
		this.session('afterLogin', null);
		this.session('UserData', null);
	}

	if (fingerprint && alchemy.fingerprints) {
		alchemy.fingerprints.remove(fingerprint);
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
 * @version  0.9.0
 *
 * @param    {Document.User}   UserData
 * @param    {Boolean}         remember
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
	Plugin.addUserDataToSession(this.conduit, UserData);

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
 * @version  0.9.0
 *
 * @param    {Boolean}   tried_auth   Indicate that this was an auth attempt
 */
Conduit.setMethod(function notAuthorized(tried_auth) {

	let template;

	if (tried_auth) {
		this.set('authError', 'Username/Password are not correct');
	} else {
		// Store the request
		let afterLogin = {
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
		template = alchemy.settings.plugins.acl.layout.not_authorized_ajax_template;
	}

	if (!template) {
		template = alchemy.settings.plugins.acl.layout.not_authorized_template;
	}

	if (!template) {
		template = 'acl/login';
	}

	if (tried_auth) {
		template = 'acl/login';
	}

	let controller = this.getController('AclStatic');

	return controller.render(template);
});

/**
 * The current user is authenticated, but not allowed
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.2.0
 * @version       0.2.0
 */
Conduit.setMethod(function forbidden() {

	let user = this.session('UserData');

	if (user) {
		this.deny(403, 'Forbidden');
	} else {
		this.notAuthorized();
	}
});
