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
const User = Function.inherits('Alchemy.Model', 'User');

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.8.7
 */
User.constitute(function addFields() {

	let has_displayfield = this.prototype.hasOwnProperty('display_field'),
	    display_field;

	this.addField('username', 'String');

	if (alchemy.plugins.acl.has_proteus) {
		display_field = 'title';

		this.addField('title', 'String', {
			description : 'The text that will be used to represent this record',
		});

		this.addField('proteus_uid', 'BigInt', {
			description : 'The unique identifier number',
		});
	
		this.addField('proteus_handle', 'String', {
			description : 'The human-readable representation of the identifier',
		});
	
		this.addField('nickname', 'String', {
			description : 'A nickname for this user',
		});
	
		this.addField('given_name', 'String', {
			description : 'The given name of this user',
		});
	
		this.addField('family_name', 'String', {
			description : 'The family name of this user'
		});

		this.addIndex('proteus_uid', {
			unique : true,
			sparse : true,
		});

		this.addIndex('proteus_handle', {
			unique : true,
			sparse : true,
		});

	} else {
		display_field = 'username';

		this.addField('password', 'Password', {is_private: true});

		// If the user is still enabled
		this.addField('enabled', 'Boolean', {default: true});
	}

	if (!has_displayfield) {
		this.setProperty('display_field', display_field);
	}

	// The user's permissions
	this.addField('permissions', 'Permissions');

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
 * @version  0.8.3
 */
User.constitute(function chimeraConfig() {

	if (!this.chimera) {
		return;
	}

	let list = this.chimera.getActionFields('list'),
	    edit = this.chimera.getActionFields('edit');

	if (alchemy.plugins.acl.has_proteus) {
		list.addField('proteus_handle', {readonly: true});
		list.addField('nickname', {readonly: true});
		list.addField('given_name', {readonly: true});
		list.addField('family_name', {readonly: true});

		edit.addField('proteus_handle', {readonly: true});
		edit.addField('nickname', {readonly: true});
		edit.addField('given_name', {readonly: true});
		edit.addField('family_name', {readonly: true});
		edit.addField('permissions', {readonly: true});
	} else {
		list.addField('username');
		list.addField('enabled');

		edit.addField('username');
		edit.addField('password');
		edit.addField('enabled');
		edit.addField('permissions');
		edit.addField('acl_group_id');
	}

	let field,
	    i;

	for (i = 0; i < alchemy.plugins.acl.userModelFields.length; i++) {
		field = alchemy.plugins.acl.userModelFields[i];
		edit.addField(field[0]);
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
 * @version  0.9.0
 *
 * @param    {String}   existing   The existing session to remove
 * @param    {Function} callback
 */
User.setDocumentMethod(function createPersistentCookie(existing, callback) {

	if (typeof existing == 'function') {
		callback = existing;
		existing = null;
	}

	const that = this;
	const pledge = new Pledge();
	pledge.done(callback);

	Function.parallel(function session(next) {
		Crypto.randomHex(16, next);
	}, function token(next) {
		Crypto.randomHex(16, next);
	}, async function done(err, result) {

		if (err) {
			return pledge.reject(err);
		}

		try {

			let data = {
				identifier : result[0],
				token      : result[1],
				user_id    : that.$pk,
			};

			const Persistent = Model.get('Acl.PersistentCookie');
			let doc = Persistent.createDocument(data);

			if (alchemy.plugins.acl.has_proteus) {
				doc.proteus_handle = that.proteus_handle;

				// Register the cookie without awaiting it
				alchemy.plugins.acl.proteus_client.registerPersistentLoginCookie(doc);
			}

			await doc.save();

			pledge.resolve(doc);
		} catch (err) {
			pledge.reject(err);
		}
	});

	return pledge;
});