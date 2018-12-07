var Model = Blast.Classes.Hawkejs.Model;

/**
 * Get the current user's id
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.5.4
 * @version  0.5.4
 *
 * @return   {ObjectID|String|undefined}
 */
Model.setMethod(function getUserId() {

	var user_id;

	if (typeof hawkejs != 'undefined' && hawkejs.scene && hawkejs.scene.exposed['acl-user-data']) {
		user_id = hawkejs.scene.exposed['acl-user-data']._id;
	} else if (this.conduit) {
		let user = this.conduit.session('UserData');

		if (!user) {
			return;
		}

		user_id = user._id;
	}

	return user_id;
});