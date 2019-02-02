var bcrypt = alchemy.use('bcrypt');

// Don't load this file if a user model already exists
if (Classes.Alchemy.Model.User || alchemy.plugins.acl.custom_model) {
	return;
}

/**
 * The User Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.6.0
 */
var User = Function.inherits('Alchemy.Model', function User(options) {

	User.super.call(this, options);

	this.on('saving', function beforeSave(data, options, creating) {

		var next;

		if (!data.password || data.password.startsWith('$2b$')) {
			return;
		}

		next = this.wait();

		bcrypt.hash(data.password, 8, function gotHash(err, hash) {

			if (err != null) {
				return next(err);
			}

			data.password = hash;
			next();
		});
	});
});

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
 * @version  0.5.3
 */
User.constitute(function addFields() {

	var field,
	    i;

	this.addField('username', 'String');
	this.addField('password', 'Password', {is_private: true});

	for (i = 0; i < alchemy.plugins.acl.userModelFields.length; i++) {
		field = alchemy.plugins.acl.userModelFields[i];

		this.addField.apply(this, field);
	}

	this.hasAndBelongsToMany('AclGroup');
});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
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

	// Get the edit group
	edit = this.chimera.getActionFields('edit');

	edit.addField('username');
	edit.addField('password');
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
			identifier: result[0],
			token: result[1],
			user_id: that._id
		};

		Persistent.save(data, function saved(err) {

			if (err) {
				return callback(err);
			}

			callback(null, data);
		});
	});
});