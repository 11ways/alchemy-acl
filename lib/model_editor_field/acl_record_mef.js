/**
 * The Acl Record field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function AclRecordMEF() {

	this.input = function input(callback) {

		var flags = alchemy.shared('Acl.modelFlags');

		this.fieldView = 'acl_record';

		// @todo: fix issue with JSON-Dry
		var v = alchemy.cloneSafe(this.value);

		this.value = {
			value: v,
			flags: flags,
			groupUrl: '/' + alchemy.plugins.chimera.routename + '/editor/user/assocOptions/acl_group_id/0',
			userUrl: '/' + alchemy.plugins.chimera.routename + '/editor/acl_rule/assocOptions/target_users/0'
		};
		
		callback();
	};


	/**
	 * Modify the return value before saving
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.save = function save(callback) {

		var value = {},
		    groups,
		    users,
		    flag;

		for (flag in this.value) {

			groups = this.value[flag].groups || '';
			users = this.value[flag].users || '';

			groups = groups.split(',');
			users = users.split(',');

			for (i = 0; i < groups.length; i++) {
				if (String(groups[i]).isObjectId()) {
					groups[i] = alchemy.ObjectId(groups[i]);
				} else {
					groups[i] = undefined;
				}
			}

			for (i = 0; i < users.length; i++) {
				if (String(users[i]).isObjectId()) {
					users[i] = alchemy.ObjectId(users[i]);
				} else {
					users[i] = undefined;
				}
			}

			// Remove undefined values
			groups.clean(undefined);
			users.clean(undefined);

			value[flag] = {
				groups: groups,
				users: users
			};
		}

		this.value = value;
		callback();
	};

});