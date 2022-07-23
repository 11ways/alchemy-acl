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
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
User.setProperty('displayField', 'username');

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.8.0
 */
User.constitute(function addFields() {

	this.addField('username', 'String');
	this.addField('password', 'Password', {is_private: true});

	// The user's permissions
	this.addField('permissions', 'Permissions');

	// If the user is still enabled
	this.addField('enabled', 'Boolean', {default: true});

	let field,
	    i;

	for (i = 0; i < alchemy.plugins.acl.userModelFields.length; i++) {
		field = alchemy.plugins.acl.userModelFields[i];

		this.addField.apply(this, field);
	}

	this.hasAndBelongsToMany('AclGroup');

	if (typeof alchemy.plugins.acl.addFields == 'function') {
		alchemy.plugins.acl.addFields.call(this);
	}
});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.7.2
 */
User.constitute(function chimeraConfig() {

	var field,
	    list,
	    edit,
	    view,
	    peek,
	    i;

	if (!this.chimera) {
		return;
	}

	// Get the list group
	list = this.chimera.getActionFields('list');

	list.addField('username');
	list.addField('enabled');

	// Get the edit group
	edit = this.chimera.getActionFields('edit');

	edit.addField('username');
	edit.addField('password');
	edit.addField('enabled');
	edit.addField('acl_group_id');

	for (i = 0; i < alchemy.plugins.acl.userModelFields.length; i++) {
		field = alchemy.plugins.acl.userModelFields[i];
		edit.addField(field[0]);
	}

	// Get the view group
	view = this.chimera.getActionFields('view');

	view.addField('username');

	for (i = 0; i < alchemy.plugins.acl.userModelFields.length; i++) {
		field = alchemy.plugins.acl.userModelFields[i];
		view.addField(field[0]);
	}

	// Get the peek group
	peek = this.chimera.getActionFields('peek');

	peek.addField('username');
	peek.addField('acl_group_id');

	if (typeof alchemy.plugins.acl.chimeraConfig == 'function') {
		alchemy.plugins.acl.chimeraConfig.call(this, list, edit);
	}
});

/**
 * Do things before saving
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.2
 * @version  0.7.2
 *
 * @param    {Document.User}   document
 * @param    {Object}          options
 */
User.setMethod(async function beforeSave(document, options) {

	if (!document.password || (document.password.startsWith('$2b$') || document.password.startsWith('$2a$'))) {
		return;
	}

	let hash = await bcrypt.hash(document.password, 8);
	document.password = hash;
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