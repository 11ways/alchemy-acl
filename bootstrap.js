alchemy.requirePlugin('form');

// Create an acl log function
log.acl = log.verbose;

// If the i18n translation function does not exist, create a dummy one
if (!global.__) {
	global.__ = function __(domain, name) {

		if (typeof name == 'undefined') {
			name = domain;
		}

		return name;
	};
}

// Define the default options
var options = {
	// The model to use
	model: 'User',

	// The username field
	username: 'username',

	// The password field
	password: 'password',

	// Custom password checked function
	password_checker: null,

	// The default url to redirect to
	redirect: '/',

	// The amount of rounds to process the salt
	rounds: 10,

	// The name of the base layout
	baselayout: 'layouts/acl_base',

	// The name of the body layout
	bodylayout: 'layouts/acl_body',

	// The main layout
	mainlayout: 'layouts/acl_main',

	// The name of the body block
	bodyblock: 'acl-base',

	// The name of the main block
	mainblock: 'acl-main',

	// The name of the content block
	contentblock: 'acl-content',

	// Template to render when not-authorized
	not_authorized_template: 'acl/login',

	// Template to render when not-authorized over ajax
	not_authorized_ajax_template: 'acl/login_modal',

	// The logo to use on the login form
	login_logo: '/public/acl_login_logo.svg',

	// The background logo to use on the login form
	login_background_logo: '/public/acl_background_logo.svg',

	// Placeholder variables to use in certain strings
	placeholders: {},

	// User model extra fields
	userModelFields: [
		['first_name', 'String'],
		['last_name', 'String']
	],

	// The everyone group id
	EveryoneGroupId: alchemy.ObjectId('52efff0000a1c00001000000'),

	// The logged in user group id
	LoggedInGroupId: alchemy.ObjectId('52efff0000a1c00001000003'),

	// The super user group id
	SuperUserGroupId: alchemy.ObjectId('52efff0000a1c00001000001'),

	// The super user id
	SuperUserId: alchemy.ObjectId('52efff0000a1c00000000000'),

	// Destroy session on log out
	destroy_session_on_logout : true,
};

// Inject the user-overridden options
alchemy.plugins.acl = Object.assign(options, alchemy.plugins.acl);

alchemy.exposeStatic('acl_login_logo', alchemy.plugins.acl.login_logo);
alchemy.exposeStatic('acl_background_logo', alchemy.plugins.acl.login_background_logo);

// Make sure the model name is correct
options.model = options.model.modelName();

// Get the view settings
var viewSettings = {
	baselayout: options.baselayout,
	bodylayout: options.bodylayout,
	mainlayout: options.mainlayout,
	bodyblock: options.bodyblock,
	mainblock: options.mainblock,
	contentblock: options.contentblock,
	username: options.username,
	password: options.password
};

/**
 * Look for persistent login cookies
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.2.0
 * @version       0.6.0
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
		let Persistent = conduit.getModel('AclPersistentCookie'),
		    criteria = Persistent.find();

		criteria.where('identifier').equals(acpl.i);
		criteria.where('token').equals(acpl.t);
		criteria.select('User');

		Persistent.find('first', criteria, function gotCookie(err, cookie) {

			if (!err && cookie && cookie.User) {

				// Fetch the user again
				conduit.getModel('User').findById(cookie.User.$pk, function gotUser(err, user) {

					if (err) {
						return next();
					}

					// Only set the user data if a user was actually found
					if (user) {
						conduit.session('UserData', user);

						if (typeof user.onAcplLogin == 'function') {
							user.onAcplLogin(conduit);
						}
					}

					next();
				});
			} else {
				next();
			}
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

				conduit.session('UserData', user);
				next();
			});
		} else {
			next();
		}
	}
}, {weight: 99999});

/**
 * Check permissions
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.3.0
 * @version       0.3.0
 */
Router.use(function rulesCheck(req, res, next) {
	req.conduit.getModel('AclRule').checkRequest(req, res, next);
}, {weight: 99800});

// Send the acl layout options to the client
alchemy.hawkejs.on({type: 'renderer', status: 'begin', client: false}, function onBegin(renderer) {
	// Expose the viewsettings only once (they don't change)
	renderer.expose('acl-view-setting', viewSettings);
});

// Send the user info to the client
alchemy.hawkejs.on({type: 'renderer', status: 'begin'}, function onBegin(renderer) {

	var data,
	    user;

	if (!renderer.conduit) {
		return;
	}

	data = renderer.conduit.session('UserData');

	if (data) {
		data = data.User;
	}

	if (data && data.username) {

		user = Object.assign({}, data);
		delete user.password;

		if (user.permissions) {
			user.permissions = user.permissions.flattened();
		}

		renderer.expose('acl-user-data', user);
	}
});

if (options.ensure_group_records === false) {
	return;
}

// Ensure these groups exist
let ensureGroups = [];

// The everyone group
ensureGroups[ensureGroups.length] = {
	_id: options.EveryoneGroupId,
	title: 'Everyone',
	name: 'everyone',
	description: 'Meta group: targets everyone',
	special: true,
	special_command: 'everyone',
	forfeit_to_group_id: options.LoggedInGroupId,
	weight: 1
};

// The logged in user group
ensureGroups[ensureGroups.length] = {
	_id: options.LoggedInGroupId,
	title: 'Logged In',
	name: 'logged_in',
	description: 'Meta group: targets logged in users',
	special: true,
	special_command: 'loggedin',
	forfeit_to_group_id: options.SuperUserGroupId,
	weight: 5
};

// The super user group
ensureGroups[ensureGroups.length] = {
	_id: options.SuperUserGroupId,
	title: 'Superuser',
	name: 'superuser',
	description: 'Users that have access to everything',
	root: true,
	weight: 10001
};

/**
 * Ensure the ACL groups and SuperUser exist
 */
alchemy.sputnik.before('start_server', function beforeStartServer() {

	console.log('Ensuring ACL')

	var AclGroup    = Model.get('AclGroup'),
	    User        = Model.get('User'),
	    SuperUserGroupId = alchemy.plugins.acl.SuperUserGroupId,
	    SuperUserId      = alchemy.plugins.acl.SuperUserId,
	    pledge,
	    tasks = [];

	// Make sure the required ACL groups exist
	pledge = AclGroup.ensureIds(ensureGroups);
	tasks.push(pledge);

	return Function.parallel(tasks);
});

/**
 * Load all permissions before starting the server
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.8.3
 */
alchemy.sputnik.before('start_server', async function beforeStartServer() {

	const PermissionGroup = Model.get('PermissionGroup'),
	      User = Model.get('User');

	let superuser_group = await PermissionGroup.findByValues({slug: 'superuser'});

	if (!superuser_group) {
		superuser_group = PermissionGroup.createDocument();
		superuser_group.title = 'Superuser';
		superuser_group.slug = 'superuser';
		superuser_group.permissions = [{permission: '*', value: true}];
		await superuser_group.save();
	}

	console.log('Loading all permission groups...');

	await PermissionGroup.loadAllGroups();

	let SuperUserId = alchemy.plugins.acl.SuperUserId;

	await User.ensureIds({
		_id          : SuperUserId,
		username     : 'admin',
		name         : 'Superuser',
		password     : 'admin',
		permissions  : [{permission: 'group.superuser', value: true}],
		acl_group_id : [alchemy.plugins.acl.SuperUserGroupId]
	});
});