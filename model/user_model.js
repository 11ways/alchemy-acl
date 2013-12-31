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
 * @version  0.0.1
 */
Model.extend(function UserModel() {

	/**
	 * The preInit constructor
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.preInit = function preInit() {

		this.parent();
		
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
	};
});