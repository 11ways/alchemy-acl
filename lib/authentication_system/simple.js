let bcrypt;

/**
 * The Simple AuthenticationSystem class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
const Simple = Function.inherits('Alchemy.Acl.AuthenticationSystem', 'Simple');

/**
 * Set the default options
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {Function}   User
 */
Simple.setStatic('default_configuration', {
	// Custom password checked function
	password_checker: null,

	// The amount of rounds to process the salt
	salt_rounds: 10,

	// User model extra fields
	extra_user_fields: [
		['first_name', 'String'],
		['last_name', 'String']
	],

	// User field adder function
	user_field_adder: null,

	// Custom chimera configurator function
	chimera_configurator: null,
});

/**
 * Add fields to the User model
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {Function}   User
 */
Simple.setMethod(function addUserModelFields(User) {

	User.addField('username', 'String', {
		description : 'The unique username',
		unique: true,
	});

	User.addField('password', 'Password', {
		description : 'The user\'s password',
		is_private: true
	});

	User.addField('permissions', 'Permissions', {
		description : 'The user\'s permissions'
	});

	User.addField('enabled', 'Boolean', {
		description : 'Is the user still enabled?',
		default: true
	});

	const extra_fields = this.options.extra_user_fields;

	if (extra_fields) {
		for (let field of extra_fields) {
			User.addField.apply(User, field);
		}
	}

	if (typeof this.options.user_field_adder == 'function') {
		this.options.user_field_adder.call(User);
	}
});

/**
 * Add chimera configuration
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @param    {Function}   User
 */
Simple.setMethod(function configureChimeraModelFields(User) {

	// Get the list group
	const list = User.chimera.getActionFields('list');

	list.addField('username');
	list.addField('enabled');

	// Get the edit group
	const edit = User.chimera.getActionFields('edit');

	edit.addField('username');
	edit.addField('password');
	edit.addField('enabled');
	edit.addField('permissions');
	edit.addField('acl_group_id');

	const extra_fields = this.options.extra_user_fields;

	if (extra_fields) {
		for (let field of extra_fields) {
			edit.addField(field[0]);
		}
	}

	if (typeof this.options.chimera_configurator == 'function') {
		this.options.chimera_configurator.call(User, list, edit);
	}
});

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
Simple.setMethod(async function beforeSaveUser(user, options) {

	if (!user.password || (user.password.startsWith('$2b$') || user.password.startsWith('$2a$'))) {
		return;
	}

	if (!bcrypt) {
		bcrypt = alchemy.use('bcrypt');
	}

	if (!bcrypt) {
		throw new Error('Failed to load `bcrypt` module');
	}

	let hash = await bcrypt.hash(document.password, 8);
	user.password = hash;
});