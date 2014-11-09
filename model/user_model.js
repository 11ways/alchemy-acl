var bcrypt = alchemy.use('bcrypt');

// Don't load this file if a user model already exists
if (alchemy.classes.UserModel) {
	return;
}

/**
 * The User Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 */
var User = Model.extend(function UserModel(options) {

	var chimera,
	    list,
	    edit,
	    view;

	UserModel.super.call(this, options);

	// Create the chimera behaviour
	chimera = this.addBehaviour('chimera');

	// Get the list group
	list = chimera.getActionFields('list');

	list.addField('username');
	list.addField('name');

	// Get the edit group
	edit = chimera.getActionFields('edit');

	edit.addField('username');
	edit.addField('name');
	edit.addField('password');
	edit.addField('acl_group_id');

	// Get the view group
	view = chimera.getActionFields('view');

	view.addField('username');
	view.addField('name');

	this.on('saving', function beforeSave(data, options, creating) {

		var next;

		if (!data.password) {
			return;
		}

		next = this.wait();

		bcrypt.hash(data.password, 8, function gotHash(err, hash) {

			if (err != null) {
				return next(err);
			}

			pr('Hash: ' + hash);

			data.password = hash;
			next();
		});
	});
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 */
User.constitute(function addFields() {
	this.addField('username', 'String');
	this.addField('name', 'String');
	this.addField('password', 'Password');

	this.hasAndBelongsToMany('AclGroup');
});

return;

(function(){

	/**
	 * The preInit constructor
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.preInit = function preInit() {

		this.parent();

		this.displayField = 'username';
		
		this.hasOneChild = {
			NotificationSetting: {
				modelName: 'NotificationSetting',
				foreignKey: 'user_id'
			}
		};

		this.hasAndBelongsToMany = {
			AclGroup: {
				modelName: 'AclGroup',
				foreignKey: 'acl_group_id'
			}
		};
		
		this.blueprint = {
			username: {
				type: 'String',
				index: {
					unique: true,
					name: 'username',
					sparse: false,
					order: 'asc'
				}
			},
			name: {
				type: 'String',
				rules: {
					notempty: {message: 'This field should not be empty!'}
				}
			},
			password: {
				type: 'Password',
				rules: {
					notempty: {
						mesage: 'A password is required!'
					}
				}
			}
		};

		this.modelEdit = {
			general: {
				title: __('chimera', 'General'),
				fields: [
					'username',
					'name',
					'password',
					'acl_group_id'
				]
			}
		};

		this.modelIndex = {
			fields: [
				'created',
				'username',
				'name',
				'acl_group_id'
			]
		};

		this.actionLists = {
			paginate: ['index', 'add'],
			list: ['export'],
			record: [
				'view',
				'edit',
				'remove'
			]
		};
	};
});