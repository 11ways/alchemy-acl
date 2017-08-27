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
 * @version  0.3.0
 */
var AclStatic = Function.inherits('Alchemy.AppController', function AclStaticController(conduit, options) {
	AclStaticController.super.call(this, conduit, options);
});

/**
 * Render the join form (GET-only)
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.2.0
 */
AclStatic.setMethod(function joinForm(conduit) {
	this.render('acl/join');
});

/**
 * Render the login form (GET-only)
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.2.0
 */
AclStatic.setMethod(function loginForm(conduit) {
	this.render('acl/login');
});

/**
 * Log in the user (POST-only)
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.2.0
 */
AclStatic.setMethod(function loginPost(conduit) {

	var that = this,
	    conditions,
	    username,
	    password,
	    remember;

	username = conduit.body.username;
	password = conduit.body.password;
	remember = conduit.body.remember === 'on';

	if (!username || !password) {
		return conduit.notAuthorized();
	}

	Model.get('User').find('first', {conditions: {username: username}}, function gotUser(err, record) {

		if (err != null) {
			return conduit.error(err);
		}

		if (!record.length) {
			return conduit.notAuthorized(true);
		}

		if (!bcrypt) {
			return conduit.error(new Error('Password comparison error'));
		}

		bcrypt.compare(password, record.password, function compared(err, match) {

			if (err != null) {
				return conduit.error(err);
			}

			if (match) {
				that.allow(record, remember);
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
 * @version  0.4.0
 */
AclStatic.setMethod(function logout() {

	// Remove the user data from the session
	this.session('afterLogin', null);
	this.session('UserData', null);
	this.cookie('acpl', null);

	this.conduit.expose('acl-user-data', null);

	// Redirect to the root
	this.conduit.redirect('/');
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
 * @version  0.4.0
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

	if (this.ajax) {
		this.render('acl/login_modal');
	} else {
		this.render('acl/login');
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