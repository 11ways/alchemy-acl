/**
 * ACL Groups
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function AclGroupModel(){

	this.preInit = function preInit() {

		this.parent();

		this.hasMany = {
			ChildGroup: {
				modelName: 'AclGroup',
				foreignKey: 'parent_group_id'
			},
			AclUser: {
				modelName: 'AclUser',
				foreignKey: 'acl_group_id'
			}
		};

		this.blueprint = {
			name: {
				type: 'String',
				index: {
					unique: true,
					name: 'acl_group_name',
				}
			},
			parent_group_id: {
				type: 'ObjectId',
				index: {
					unique: true,
					name: 'acl_group_name',
				}
			}
		};
	};
});