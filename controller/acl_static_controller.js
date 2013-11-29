var bcrypt = alchemy.use('bcrypt'),
    config = alchemy.plugins.acl;

/**
 * The ACL Static Controller
 *
 * @constructor
 * @extends       alchemy.classes.AppController
 *
 * @author        Jelle De Loecker   <jelle@kipdola.be>
 * @since         0.0.1
 * @version       0.0.1
 */
Controller.extend(function AclStaticController (){
	
	this.useModel = false;

	/**
	 * Render the login form (GET-only)
	 */
	this.loginForm = function loginForm(render) {

		var i = 0;
  		while (i < 1e6) i++;

		render('acl/login');
	};

	/**
	 * Log in the user (POST-only)
	 */
	this.loginUser =  function loginUser(render) {

		pr('Logging in the user');
		pr(render.req.body)

		var data = render.req.body.data,
		    username,
		    password,
		    conditions = {};

		if (data && data.Login) {
			username = data.Login.username;
			password = data.Login.password;
		}

		if (username && password) {

			// Add a condition for the username field
			conditions[config.username] = username;

			Model.get(config.model).find('first', {conditions: conditions}, function(err, record) {

				if (record) {

					var UserData = record[config.model];
					
					bcrypt.compare(password, UserData.password, function(err, match) {
						if (match) {
							allow(render, UserData);
						} else {
							deny(render);
						}
					});
				} else {
					deny(render);
				}
			});
		} else {
			deny(render);
		}

	};

	/**
	 * This logged in user is not authorized to see this
	 */
	this.unauthorized = function unauthorized(render) {
		render('acl/unauthorized');
	};

});

function allow(render, user) {

	pr(user);

	// Store the user data in the session
	render.req.session.user = user[config.username];

	// Redirect to the correct url
	render.redirect(render.req.session.whenAuthRedirect);

	// Remove the redirect directive
	delete render.req.session.whenAuthRedirect;
}

function deny(render) {

	pr('Access denied!'.red.bold);

	// Try logging in again
	render.redirect('/login');
}