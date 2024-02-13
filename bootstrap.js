const USER_SESSIONS = new Classes.WeakValueSetMap();

alchemy.requirePlugin('form');

// Create the user settings group
const USER_SETTINGS = new Classes.Alchemy.Setting.Group('user', null);
Plugin.USER_SETTINGS = USER_SETTINGS;

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

/**
 * Load all permissions before starting the server
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.9.0
 */
STAGES.getStage('server.start').addPreTask(async function beforeStartServer() {

	const PermissionGroup = Model.get('Acl.PermissionGroup'),
	      User = Model.get('User');

	let superuser_group = await PermissionGroup.findByValues({slug: 'superuser'});

	if (!superuser_group) {
		superuser_group = PermissionGroup.createDocument();
		superuser_group.title = 'Superuser';
		superuser_group.slug = 'superuser';
		superuser_group.permissions = [{permission: '*', value: true}];
		await superuser_group.save();
	}

	await PermissionGroup.loadAllGroups();

	if (!Plugin.has_proteus) {
		let super_user_id = alchemy.settings.plugins.acl.model.super_user_id;

		await User.ensureIds({
			_id          : super_user_id,
			username     : 'admin',
			name         : 'Superuser',
			password     : 'admin',
			permissions  : [{permission: 'group.superuser', value: true}],
		});
	}
});

/**
 * Set the user data for the given session
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {Conduit}   conduit
 * @param    {User}      user
 */
Plugin.addUserDataToSession = function addUserDataToSession(conduit, user) {

	let user_id = '' + user.$pk;

	conduit.session('UserData', user);

	USER_SESSIONS.add(user_id, conduit.getSession());
};

/**
 * Update sessions for the given usre data
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {User}   user
 */
Plugin.updateUserDataSessions = function updateUserDataSessions(user) {

	let user_id = '' + user.$pk;

	let sessions = USER_SESSIONS.get(user_id);

	if (!sessions) {
		return;
	}

	for (let session of sessions) {
		let existing_data = session.get('UserData');

		// If this session no longer has existing data, skip it
		if (!existing_data) {
			sessions.delete(session);
			continue;
		}

		session.set('UserData', JSON.clone(user));
	}
};

// Send the user info to the client
alchemy.hawkejs.on({type: 'renderer', status: 'begin'}, function onBegin(renderer) {

	if (!renderer.conduit) {
		return;
	}

	let data = renderer.conduit.session('UserData');

	if (data) {
		data = data.User;
	}

	if (data && data.username) {

		let user = Object.assign({}, data);
		delete user.password;

		if (user.permissions) {
			user.permissions = user.permissions.flattened();
		}

		renderer.expose('acl-user-data', user);
	}
});