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
	SuperUserId: alchemy.ObjectId('52efff0000a1c00000000000')
};

// Inject the user-overridden options
alchemy.plugins.acl = Object.assign(options, alchemy.plugins.acl);

// Make sure the model name is correct
options.model = options.model.modelName();

// Ensure these groups exist
var ensureGroups = [];

// The everyone group
ensureGroups[ensureGroups.length] = {
	_id: options.EveryoneGroupId,
	name: 'Everyone',
	special: true,
	special_command: 'everyone',
	forfeit_to_group_id: options.LoggedInGroupId,
	weight: 1
};

// The logged in user group
ensureGroups[ensureGroups.length] = {
	_id: options.LoggedInGroupId,
	name: 'Logged in',
	special: true,
	special_command: 'loggedin',
	forfeit_to_group_id: options.SuperUserGroupId,
	weight: 5
};

// The super user group
ensureGroups[ensureGroups.length] = {
	_id: options.SuperUserGroupId,
	name: 'Superuser',
	root: true,
	weight: 10001
};

/**
 * Ensure the ACL groups and SuperUser exist
 */
alchemy.sputnik.before('startServer', function beforeStartServer(done) {
	var AclGroup    = Model.get('AclGroup'),
	    User        = Model.get('User'),
	    SuperUserGroupId = alchemy.plugins.acl.SuperUserGroupId,
	    SuperUserId      = alchemy.plugins.acl.SuperUserId;

	// Make sure the required ACL groups exist
	AclGroup.ensureIds(ensureGroups);

	// Make sure the super user exists
	User.ensureIds({
		_id: SuperUserId,
		username: 'admin',
		name: 'Superuser',
		password: '$2a$10$sTLrARZ6hEJwnof6f6ZLDO2L.i.oumyWFC2jC4FB2k3fdkfszYzZC', // "admin"
		acl_group_id: [SuperUserGroupId]
	});
});

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
 * @version       0.5.0
 */
Router.use(function persistentLoginCheck(req, res, next) {

	var acpl,
	    conduit = req.conduit,
	    Persistent;

	// Do nothing if userdata is already set
	if (conduit.getSession(false) && conduit.session('UserData')) {
		return next();
	}

	// Get the persistent cookie
	acpl = conduit.cookie('acpl');

	if (acpl) {
		Persistent = conduit.getModel('AclPersistentCookie');

		Persistent.find('first', {conditions: {identifier: acpl.i, token: acpl.t}}, function gotCookie(err, cookie) {

			if (!err && cookie && cookie.User) {
				conduit.getModel('User').find('first', {conditions: {_id: cookie.User._id}}, function gotUser(err, user) {

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
		next();
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
alchemy.hawkejs.on({type: 'viewrender', status: 'begin', client: false}, function onBegin(viewRender) {
	// Expose the viewsettings only once (they don't change)
	viewRender.expose('acl-view-setting', viewSettings);
});

// Send the user info to the client
alchemy.hawkejs.on({type: 'viewrender', status: 'begin'}, function onBegin(viewRender) {

	var data,
	    user;

	if (!viewRender.conduit) {
		return;
	}

	data = viewRender.conduit.session('UserData');

	if (data) {
		data = data.User;
	}

	if (data && data.username) {

		user = Object.assign({}, data);
		delete user.password;

		viewRender.expose('acl-user-data', user);
	}
});