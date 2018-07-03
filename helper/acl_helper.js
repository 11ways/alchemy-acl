/**
 * The ACL helper
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.5.0
 *
 * @param    {ViewRender}    view
 */
var Acl = Function.inherits('Alchemy.Helper', function Acl(view) {
	Acl.super.call(this, view);
});

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