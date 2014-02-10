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
			InheritFromGroup: {
				modelName: 'AclGroup',
				foreignKey: 'inherit_from_group_id'
			},
			ForfeitToGroup: {
				modelName: 'AclGroup',
				foreignKey: 'forfeit_to_group_id',
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
			inherit_from_group_id: {
				type: 'ObjectId',
				index: {
					unique: true,
					name: 'acl_group_name',
				}
			},
			forfeit_to_group_id: {
				type: 'ObjectId'
			},
			weight: {
				type: 'Number',
				default: 10
			},
			root: {
				type: 'Boolean',
				default: false
			},
			special: {
				type: 'Boolean',
				default: false
			},
			special_command: {
				type: 'String'
			}
		};

		/**
		 * Chimera settings
		 */
		this.modelIndex = {
			fields: ['name', 'weight', 'root', 'inherit_from_group_id', 'forfeit_to_group_id']
		};

		this.modelEdit = {
			general: {
				title: __('chimera', 'General'),
				fields: ['name', 'weight', 'root', 'inherit_from_group_id', 'forfeit_to_group_id']
			}
		};
	};

	/**
	 * Make sure every group forfeits its right to another group,
	 * unless it's the highest group (superusers)
	 */
	this.beforeSave = function beforeSave(next, record, options) {

		var that = this;

		this.parent('beforeSave', null, function() {

			if (!record.forfeit_to_group_id && (record._id && 'forfeit_to_group_id' in record)) {

				that.find('first', {sort: {weight: 'DESC'}}, function (err, item) {

					var id;

					if (item.length) {
						// Get the id of the highest found item
						id = item[0].AclGroup._id;

						// Make sure it doesn't forfeit to itself
						if ((''+id) != record._id) {
							record.forfeit_to_group_id = item[0].AclGroup._id;
						}
					}
					
					next();
				});
			} else {
				next();
			}

		}, record, options);
	};
});