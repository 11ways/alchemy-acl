// Don't load this file if a user model already exists
if (Classes.Alchemy.Model.User || alchemy.plugins.acl.custom_model) {
	return;
}

let bcrypt = alchemy.use('bcrypt');

/**
 * The User Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.7.2
 */
var User = Function.inherits('Alchemy.Model', 'User');

/**
 * The default field to display is the 'username' one
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.8.3
 */
User.setProperty('display_field', 'username');

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  1.0.0
 */
User.constitute(function addFields() {

});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  1.0.0
 */
User.constitute(function chimeraConfig() {

});

/**
 * Do things before saving
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.2
 * @version  1.0.0
 *
 * @param    {Document.User}   document
 * @param    {Object}          options
 */
User.setMethod(function beforeSave(document, options) {
	return alchemy.plugins.acl.authentication_system.beforeSaveUser(document, options);
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {String}   existing   The existing session to remove
 * @param    {Function} callback
 */
User.setDocumentMethod(function createPersistentCookie(existing, callback) {

	var Persistent,
	    that = this;

	if (typeof existing == 'function') {
		callback = existing;
		existing = null;
	}

	Persistent = Model.get('AclPersistentCookie');

	Function.parallel(function session(next) {
		Crypto.randomHex(16, next);
	}, function token(next) {
		Crypto.randomHex(16, next);
	}, function done(err, result) {

		var data;

		if (err) {
			return callback(err);
		}

		data = {
			identifier : result[0],
			token      : result[1],
			user_id    : that.$pk
		};

		Persistent.save(data, function saved(err) {

			if (err) {
				return callback(err);
			}

			callback(null, data);
		});
	});
});