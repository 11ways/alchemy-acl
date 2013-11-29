/**
 * ACL Users (Group Members)
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function AclUserModel (){

	this.belongsTo = {
		AclGroup: {
			modelName: 'AclGroup',
			foreignKey: 'acl_group_id'
		}
	};

	this.blueprint = {
		user_id: {
			type: 'ObjectId',
			index: {
				unique: true,
				name: 'acl_group_membership',
			}
		},
		acl_group_id: {
			type: 'ObjectId',
			index: {
				unique: true,
				name: 'acl_group_membership',
			}
		}
	};
	
});