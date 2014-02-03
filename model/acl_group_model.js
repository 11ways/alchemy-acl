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

		this.displayField = 'name';

		this.sort = {
			root: 'DESC',
			weight: 'DESC'
		};

		this.belongsTo = {
			ParentGroup: {
				modelName: 'AclGroup',
				foreignKey: 'parent_group_id'
			}
		};

		this.hasMany = {
			ChildGroup: {
				modelName: 'AclGroup',
				foreignKey: 'parent_group_id'
			},
			GroupPermission: {
				modelName: 'AclPermission',
				foreignKey: 'target_group'
			}
		};

		this.hasAndBelongsToMany = {
			User: {
				modelName: 'User',
				associationKey: 'acl_group_id'
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
			},
			weight: {
				type: 'Number',
				default: 10
			},
			root: {
				type: 'Boolean',
				default: false
			}
		};

		/**
		 * Chimera settings
		 */
		this.modelIndex = {
			fields: ['name', 'weight', 'root', 'parent_group_id']
		};

		this.modelEdit = {
			general: {
				title: __('chimera', 'General'),
				fields: ['name', 'weight', 'root', 'parent_group_id']
			}
		};
	};
});