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

				if (record.length) {

					record = record[0];
					
					UserData = record[config.model];

					// Delete the entry from the record
					//delete record[config.model];

					// And store the rest back under the user
					UserData.extra = record;

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
	
	this.logout = function logout(render){
		delete render.req.session.user;
		render.redirect('/');
	};

});

function allow(render, user) {

	// Make sure we have a valid url to redirect to
	var redirectUrl = render.req.session.whenAuthRedirect || alchemy.plugins.acl.redirect;

	// If we still have nothing, go to the root
	if (!redirectUrl) redirectUrl = '/';

	// For the moment we can't store extra data, because when the object gets
	// too big, it won't save the session
	delete user.extra;

	// Get all the ACL Groups this user belongs to or apply to him
	Model.get('AclGroup').getUserGroups(user, function(err, groups){

		user.groups = groups;

		// Store the complete user data in the session
		render.req.session.user = alchemy.cloneSafe(user);

		// Redirect to the correct url
		render.redirect(redirectUrl);

		// Remove the redirect directive
		delete render.req.session.whenAuthRedirect;

		// Remove any authError messages
		delete render.req.session.authError;
		
	});
}

function deny(render) {

	pr('Access denied!'.red.bold);

	render.req.session.authError = 'Username/Password are not correct';

	// Try logging in again
	render.redirect('/login');
}