module.exports = function HawkejsMedia(Hawkejs, Blast) {

	var Acl = Hawkejs.Helper.extend(function AclHelper(view) {
		Hawkejs.Helper.call(this, view);
	});

	/**
	 * Get the data object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @return   {Object}
	 */
	Acl.setProperty(function data() {
		return this.view.expose('acl-user-data') || {};
	});

	/**
	 * Set loggedIn property getter
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
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
	 * Set username property getter
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @return   {String}
	 */
	Acl.setProperty(function username() {

		var result = '';

		if (this.data._id) {
			result = this.data.username;
		}

		return result;
	});

	/**
	 * Set name property getter
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @return   {String}
	 */
	Acl.setProperty(function name() {

		var result = '';

		if (this.data._id) {
			result = this.data.name;
		} else {
			result = 'John Doe';
		}

		return result;
	});

};