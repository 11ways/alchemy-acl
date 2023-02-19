/**
 * The base AuthenticationSystem class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
const AuthenticationSystem = Function.inherits('Alchemy.Acl.Base', 'Alchemy.Acl.AuthenticationSystem', function AuthenticationSystem(options) {
	this.options = options || {};
});

/**
 * This is an abstract class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
AuthenticationSystem.makeAbstractClass();

/**
 * Add fields to the User model
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {Function}   User
 */
AuthenticationSystem.setMethod(function addUserModelFields(User) {});

/**
 * Add fields to the User model
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {Function}   User
 */
AuthenticationSystem.setMethod(function configureChimeraModelFields(User) {});

/**
 * Do something before saving the User model
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {Document.User}   document
 * @param    {Object}          options
 */
AuthenticationSystem.setMethod(function beforeSaveUser(User, options) {});

/**
 * Bootstrap the system
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.0
 * @version  1.0.0
 */
AuthenticationSystem.setMethod(async function doBootstrap() {

	const User = Classes.Alchemy.Model.User;

	if (User) {
		await this.addUserModelFields(User);
		await this.configureChimeraModelFields(User);
	}

});