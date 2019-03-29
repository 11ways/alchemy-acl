/**
 * Get the current user's id
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @return   {ObjectID|String|undefined}
 */
Classes.Alchemy.Client.Conduit.setMethod(function getUserId() {

	var user_id;

	if (typeof hawkejs != 'undefined' && hawkejs.scene && hawkejs.scene.exposed['acl-user-data']) {
		let data = hawkejs.scene.exposed['acl-user-data'];
		user_id = data._id || data.id;
	} else if (this.conduit) {
		let user = this.conduit.session('UserData');

		if (!user) {
			return;
		}

		user_id = user.$pk;
	}

	return user_id;
});