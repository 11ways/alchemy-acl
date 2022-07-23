const User = Hawkejs.Model.getClass('User');

/**
 * Check if this user has a permission.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {String}    permission
 *
 * @return   {Boolean}   True if the user has the permission, false otherwise
 */
User.setDocumentMethod(function hasPermission(permission) {

	let value = this.getPermissionValue(permission);

	if (value == null) {
		return false;
	}

	return value;
});

/**
 * Get the value the permission is set to
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {String}    permission
 *
 * @return   {Boolean|Null}
 */
User.setDocumentMethod(function getPermissionValue(permission) {

	if (this.permissions) {
		let entry = this.permissions.lookupPermission(permission);

		if (entry) {
			return entry.value;
		}
	}

	return null;
});