var flags = alchemy.shared('Acl.modelFlags'),
    async = alchemy.use('async');

// If the uer can read this field
flags.read = 'Read';

// If the user can create this field
flags.create = 'Create';

// If the user can write (update) this field
flags.write = 'Write';

/**
 * The Model ACL Rule Type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('AclRuleType', function ModelAclRuleType() {

	this.models = alchemy.models;

	this.domains = ['behaviour'];

	this.flags = flags;

	this.blueprint = {
		model: {
			type: 'Enum'
		},
		read: {
			type: 'Boolean'
		},
		create: {
			type: 'Boolean'
		},
		write: {
			type: 'Boolean'
		},
		delete: {
			type: 'Boolean'
		},
		field_flags: {
			type: 'Object',
			fieldType: 'FieldFlags',
			field: {
				linked: 'model'
			}
		}
	};

	/**
	 * See if this type applies
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.doesTypeApply = function doesTypeApply(model, callback) {

		var AclRule = Model.get('AclRule');

		// Find all rules of this type (Model)
		AclRule.find('all', {conditions: {type: this.typeName}}, function(err, results) {

			// Get only the rules that apply to this model name
			results = results.filter(function(value) {

				var settings = value.AclRule.settings;

				if (settings && settings.model == model.modelName) {
					return true;
				} else {
					return false;
				}
			});

			if (results.length) {
				callback(true);
			} else {
				callback(false);
			}
		});
	};

	/**
	 * Get the flags for this model and its fields
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.getModelFlags = function getModelFlags(defaultFieldPermission, callback) {

		var AclRule   = Model.get('AclRule'),
		    that      = this,
		    fields    = {},
		    user      = this.render.req.session.user,
		    skipcheck = false,
		    modelFlags,
		    key;

		if (typeof callback == 'undefined') {
			callback = defaultFieldPermission;
			defaultFieldPermission = undefined;
		}

		if (typeof defaultFieldPermission == 'undefined') {
			defaultFieldPermission = false;
		}

		// Superusers can see everything by default
		if (user && user.groups && String(alchemy.plugins.acl.SuperUserGroupId) in user.groups) {
			defaultFieldPermission = true;
			skipcheck = true;
		}

		// If the model isn't actually a model, allow everything
		if (!that.model.modelName) {
			defaultFieldPermission = true;
			skipcheck = true;
		}

		modelFlags = {
			delete: defaultFieldPermission,
			write : defaultFieldPermission,
			create: defaultFieldPermission,
			read  : defaultFieldPermission
		};

		for (key in that.model.blueprint) {
			fields[key] = {write: defaultFieldPermission, read: defaultFieldPermission};
		}

		// If this is a super user, return the fields already
		if (skipcheck) {
			return callback(modelFlags, fields);
		}

		// Find all rules of this type (Model)
		AclRule.getUserRules(this.render.req.session.user, function(rules) {

			rules.filter(function(rule) {

				var field, flag;

				if (rule.type == 'model' && rule.settings && String(rule.settings.model).modelName() == String(that.model.modelName).modelName()) {
					
					// Start overwriting the default field settings
					for (key in rule.settings.field_flags) {
						field = rule.settings.field_flags[key];
						for (flag in field) {

							// Should the field not yet exist (removed?) set it now
							if (!fields[key]) {
								fields[key] = {write: defaultFieldPermission, read: defaultFieldPermission};
							}

							fields[key][flag] = field[flag];
						}
					}

					modelFlags.delete = rule.settings.delete;
					modelFlags.write = rule.settings.write;
					modelFlags.create = rule.settings.create;
					modelFlags.read = rule.settings.read;
				}
			});

			callback(modelFlags, fields);
		});
	};

	/**
	 * Get the fieldflags for this model
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.getFieldFlags = function getFieldFlags(defaultFieldPermission, callback) {

		if (typeof callback == 'undefined') {
			callback = defaultFieldPermission;
			defaultFieldPermission = undefined;
		}

		this.getModelFlags(defaultFieldPermission, function(modelFlags, fieldFlags) {
			callback(fieldFlags);
		});
	};

	/**
	 * See if this user can remove the given record
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.beforeRemove = function beforeRemove(data, callback) {

		var that = this;

		that.getModelFlags(function(modelFlags) {

			if (modelFlags.delete) {
				callback();
			} else {
				callback(false);
			}
		});

	};

	/**
	 * Stop the find if the user isn't allowed to read the model
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.beforeFind = function beforeFind(options, callback) {

		var that = this;

		that.getModelFlags(function(modelFlags) {

			if (modelFlags.read) {
				callback();
			} else {
				callback(false);
			}
		});
	};

	/**
	 * Do not return fields with the 'read' flag set to false
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.afterFind = function afterFind(results, primary, alias, callback) {

		var that = this,
		    user = that.render.req.session.user;

		async.series([function fieldFlagsAcl(next) {
			// Get all the field flags for this user
			that.getFieldFlags(function(fields) {

				results.forEach(function(record) {

					var item = record[alias],
					    field;

					for (field in item) {
						if (!fields[field] || !fields[field].read) {
							delete item[field];
						}
					}
				});

				next();
			});
		}], function done() {
			callback();
		});
	};

	/**
	 * Do not allow the user to save fields with the "write" flag set to false
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.beforeSave = function beforeSave(original, item, options, callback) {

		var that = this,
		    update = true,
		    create = false,
		    flag   = 'write';

		this.getModelFlags(function(modelFlags, fields) {

			var field;

			if (!original._id) {
				update = false;
				create = true;
				flag = 'create';
			}

			pr('Checking ' + flag + ' flag')

			if (create && !modelFlags.create) {
				return callback(alchemy.createError('You can not create new records'));
			}

			if (update && !modelFlags.write) {
				return callback(alchemy.createError('You can not update existing records'));
			}

			for (field in item) {
				if (!fields[field] || !fields[field][flag]) {

					if (original && original[field]) {
						item[field] = original[field];
					} else {
						delete item[field];
					}
				}
			}

			callback();
		});
	};

});