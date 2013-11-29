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

	// The amount of rounds to process the salt
	rounds: 10
};

// Inject the user-overridden options
alchemy.plugins.acl = alchemy.inject(options, alchemy.plugins.acl);

// Make sure the model name is correct
alchemy.plugins.acl.model = alchemy.plugins.acl.model.modelName();

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
