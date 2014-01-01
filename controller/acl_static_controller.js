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
		render('acl/login', {authError: render.req.session.authError||false});
		
		// Remove any authError messages
		delete render.req.session.authError;
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

				var UserData,
				    i;

				if (record) {

					pr(record, true)

					UserData = record[config.model];

					// Delete the entry from the record
					delete record[config.model];

					// And store the rest back under the user
					UserData.extra = record;

					// Make sure there is a groups array
					UserData.groups = {};

					// Add the name of the group
					for (i = 0; i < record.AclGroup.length; i++) {
						UserData.groups[record.AclGroup[i]._id+''] = record.AclGroup[i].name;
					}

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

	// Make sure we have a valid url to redirect to
	var redirectUrl = render.req.session.whenAuthRedirect || alchemy.plugins.acl.redirect;

	// If we still have nothing, go to the root
	if (!redirectUrl) redirectUrl = '/';

	// Store the complete user data in the session
	render.req.session.user = user;

	// Redirect to the correct url
	render.redirect(redirectUrl);

	// Remove the redirect directive
	delete render.req.session.whenAuthRedirect;

	// Remove any authError messages
	delete render.req.session.authError;
}

function deny(render) {

	pr('Access denied!'.red.bold);

	render.req.session.authError = 'Username/Password are not correct';

	// Try logging in again
	render.redirect('/login');
}