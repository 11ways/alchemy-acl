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
	baselayout: 'acl_base',

	// The name of the body layout
	bodylayout: 'acl_body',

	// The main layout
	mainlayout: 'acl_main',

	// The name of the body block
	bodyblock: 'acl-base',

	// The name of the main block
	mainblock: 'acl-main',

	// The name of the content block
	contentblock: 'acl-content',

	// Placeholder variables to use in certain strings
	placeholders: {},

	// The everyone group id
	EveryoneGroupId: alchemy.ObjectId('52efff0000A1C00001000000'),

	// The logged in user group id
	LoggedInGroupId: alchemy.ObjectId('52efff0000A1C00001000003'),

	// The super user group id
	SuperUserGroupId: alchemy.ObjectId('52efff0000A1C00001000001'),

	// The super user id
	SuperUserId: alchemy.ObjectId('52efff0000A1C00000000000')
};

// Inject the user-overridden options
alchemy.plugins.acl = alchemy.inject(options, alchemy.plugins.acl);

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


// Get the view settings
var viewSettings = {
	baselayout: alchemy.layoutify(options.baselayout),
	bodylayout: alchemy.layoutify(options.bodylayout),
	mainlayout: alchemy.layoutify(options.mainlayout),
	bodyblock: options.bodyblock,
	mainblock: options.mainblock,
	contentblock: options.contentblock,
	username: options.username,
	password: options.password
};

// Create route connections, which can be overridden
alchemy.connect('ACL::loginform', '/login', {
	controller: 'AclStatic',
	action: 'loginForm',
	method: 'get',
	order: 20
});

alchemy.connect('ACL::loginuser', '/acl/login', {
	controller: 'AclStatic',
	action: 'loginUser',
	method: 'post',
	order: 20
});

alchemy.connect('ACL::unauthorized', '/acl/unauthorized', {
	controller: 'AclStatic',
	action: 'unauthorized',
	method: 'get',
	order: 20
});

// Add the middleware to intercept the routes
alchemy.addMiddleware(99, 'acl-routes', function(req, res, next){
	Model.get('AclPermission').checkRequest(req, res, next);
});

// Send the acl layout options to the client
alchemy.on('render.callback', function(render, callback) {

	var user = render.req.session.user,
	    display = __('acl', 'Unnamed User');

	// Only send this data on the initial pageload
	if (!render.ajax) {
		render.store('acl-view-setting', viewSettings);
	}
	
	if(user){
		if(user.first_name && user.last_name){
			user.fullname = user.first_name + ' ' + user.last_name;
		}
		display = user.fullname || user.name || user.username || user.email;
		render.viewVars.name = display;
	}
	
	callback();
});

alchemy.sputnik.after('datasources', function() {
	
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
		acl_group_id: [SuperUserGroupId]
	});
});

