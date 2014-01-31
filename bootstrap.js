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

	// The main layout
	mainlayout: 'acl_main',

	// The name of the body block
	bodyblock: 'acl-base',

	// The name of the main block
	mainblock: 'acl-main',

	// The name of the content block
	contentblock: 'acl-content',

	// Placeholder variables to use in certain strings
	placeholders: {}

};

// Inject the user-overridden options
alchemy.plugins.acl = alchemy.inject(options, alchemy.plugins.acl);

// Make sure the model name is correct
options.model = options.model.modelName();

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

	// Only send this data on the initial pageload
	if (!render.ajax) {
		render.store('acl-view-setting', viewSettings);
	}
	
	if(render.req.session.user){
		render.viewVars.name = render.req.session.user.name;
	}
	
	callback();
});