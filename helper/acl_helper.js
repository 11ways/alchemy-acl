/**
 * The ACL helper
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.5.0
 *
 * @param    {ViewRender}    view
 */
const Acl = Function.inherits('Alchemy.Helper', 'Acl');

/**
 * Get the data object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @return   {Object}
 */
Acl.setProperty(function data() {
	return this.view.expose('acl-user-data') || {};
});

/**
 * Set loggedIn property getter
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @return   {Boolean}
 */
Acl.setProperty(function loggedIn() {

	var result = false;

	if (this.data._id) {
		result = true;
	}

	return result;
});

/**
 * Get the firstname
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 *
 * @return   {String}
 */
Acl.setProperty(function firstname() {
	return this.data.firstname || this.data.first_name || '';
});

/**
 * Get the lastname
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 *
 * @return   {String}
 */
Acl.setProperty(function lastname() {
	return this.data.lastname || this.data.last_name || '';
});

/**
 * Get the username
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.5.0
 *
 * @return   {String}
 */
Acl.setProperty(function username() {
	return this.data.username || '';
});

/**
 * Get the fullname, or the username
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 *
 * @return   {String}
 */
Acl.setProperty(function fullname() {

	var result = '';

	if (this.data.fullname) {
		return this.data.fullname;
	} else if (this.data.full_name) {
		return this.data.full_name;
	}

	if (this.firstname) {
		result = this.firstname;

		if (this.lastname) {
			result += ' ' + this.lastname;
		}
	} else if (this.username) {
		result = this.username;
	}

	return result;
});

/**
 * Set name property getter
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.5.0
 *
 * @return   {String}
 */
Acl.setProperty(function name() {
	return this.fullname;
});

/**
 * Single name getter
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 *
 * @return   {String}
 */
Acl.setProperty(function handle() {

	if (this.firstname) {
		return this.firstname;
	} else {
		return this.username;
	}
});

/**
 * Does the current logged in user have the given permission?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {String}   permission
 *
 * @return   {Boolean}
 */
Acl.setMethod(function hasPermission(permission) {

	const data = this.data;

	if (data && data.permissions) {
		try {
			return data.permissions.hasPermission(permission);
		} catch (err) {
			console.error('Failed to lookup permission "' + permission + '"');
			return false;
		}
	}

	return false;
});

/**
 * Get a setting value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 *
 * @param    {string}   path
 *
 * @return   {*}
 */
Acl.setMethod(function getSetting(path) {

	let result;

	if (this.data && this.data.settings) {
		result = this.data.settings.getPath(path);

		if (result) {
			result = result.toSimple();
		}
	}

	return result;
});