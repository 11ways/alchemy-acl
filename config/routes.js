Router.get('LoginForm', '/login', 'AclStatic#loginForm');
Router.post('LoginPost', '/login', 'AclStatic#loginPost');

Router.get('JoinForm', '/join', 'AclStatic#joinForm');
Router.post('JoinPost', '/join', 'AclStatic#joinPost');

Router.get('Logout', '/logout', 'AclStatic#logout');

Plugin.addRoute({
	name       : 'AclStatic#proteusLogin',
	methods    : 'get',
	paths      : '/segments/acl/proteus-login',
	visible_location: false,
});

Plugin.addRoute({
	name       : 'AclStatic#proteusRealmLogin',
	methods    : 'get',
	paths      : '/acl/proteus/login/{authenticator}',
	visible_location: false,
});

Plugin.addRoute({
	name       : 'AclStatic#proteusVerifyLogin',
	methods    : 'get',
	paths      : '/acl/proteus/verify',
	visible_location: false,
});

Plugin.addRoute({
	name       : 'AclStatic#proteusPollLogin',
	methods    : ['get', 'post'],
	paths      : '/acl/proteus/poll',
	visible_location: false,
});

// Add models to the menu deck
if (alchemy.plugins.chimera && alchemy.plugins.chimera.menu) {
	alchemy.plugins.chimera.menu.set('acl_group', {
		name : 'acl_groups',
		title: 'ACL Groups',
		route: 'chimera@ModelAction',
		parameters: {
			controller: 'editor',
			subject: 'acl_group',
			action: 'index'
		},
		icon: {svg: 'connection'}
	});

	alchemy.plugins.chimera.menu.set('acl_rule', {
		name : 'acl_rules',
		title: 'ACL Rules',
		route: 'chimera@ModelAction',
		parameters: {
			controller: 'editor',
			subject: 'acl_rule',
			action: 'index'
		},
		icon: {svg: 'connection'}
	});
}

/**
 * Look for persistent login cookies
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.9.0
 */
Router.use(function persistentLoginCheck(req, res, next) {

	var conduit = req.conduit;

	// Do nothing if userdata is already set
	if (conduit.getSession(false) && conduit.session('UserData')) {
		return next();
	}

	// Get the persistent cookie
	let acpl = conduit.cookie('acpl');

	if (acpl) {
		let Persistent = conduit.getModel('Acl.PersistentCookie');

		Pledge.done(Persistent.getUserFromCookieForLogin(conduit, acpl), (err, user) => {

			if (err || !user) {
				return next();
			}

			Plugin.addUserDataToSession(conduit, user);

			if (typeof user.onAcplLogin == 'function') {
				user.onAcplLogin(conduit);
			}

			next();
		});
	} else {
		if (alchemy.settings.environment != 'live' && alchemy.settings.force_user_login) {
			conduit.getModel('User').findById(alchemy.settings.force_user_login, function gotUser(err, user) {

				if (err) {
					console.log('Failed to login test user');
					return next();
				}

				if (!user) {
					console.log('Could not find test user ' + alchemy.settings.force_user_login);
					return next();
				}

				Plugin.addUserDataToSession(conduit, user);
				next();
			});
		} else {
			next();
		}
	}
}, {weight: 99999});