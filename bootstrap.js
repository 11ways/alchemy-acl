// Create an acl log function
log.acl = log.verbose;

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

	// The name of the body block
	bodyblock: 'acl-base',

	// The name of the main block
	mainblock: 'acl-main'

};

// Inject the user-overridden options
alchemy.plugins.acl = alchemy.inject(options, alchemy.plugins.acl);

// Make sure the model name is correct
alchemy.plugins.acl.model = alchemy.plugins.acl.model.modelName();

// Get the view settings
var viewSettings = {
	baselayout: alchemy.plugins.acl.baselayout,
	bodylayout: alchemy.plugins.acl.bodylayout,
	bodyblock: alchemy.plugins.acl.bodyblock,
	mainblock: alchemy.plugins.acl.mainblock,
	username: alchemy.plugins.acl.username,
	password: alchemy.plugins.acl.password
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

	// Only send this data on the initial pageload
	if (!render.ajax) {
		render.store('acl-view-setting', viewSettings);
	}
	
	callback();
});