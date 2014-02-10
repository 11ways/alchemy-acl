var flags = alchemy.shared('Acl.modelFlags'),
    async = alchemy.use('async');

flags.read = 'Read';
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
		AclRule.find('first', {conditions: {type: this.typeName}}, function(err, results) {

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
	 * Get the rule to apply
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.getFieldFlags = function getFieldSettings(defaultFieldPermission, callback) {

		var AclRule   = Model.get('AclRule'),
		    that      = this,
		    fields    = {},
		    user      = this.render.req.session.user,
		    skipcheck = false,
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

		for (key in that.model.blueprint) {
			fields[key] = {write: defaultFieldPermission, read: defaultFieldPermission};
		}

		// If this is a super user, return the fields already
		if (skipcheck) {
			return callback(fields);
		}

		// Find all rules of this type (Model)
		AclRule.getUserRules(this.render.req.session.user, function(rules) {

			rules.filter(function(rule) {

				var field, flag;

				if (rule.type == 'model' && rule.settings && rule.settings.model == that.model.modelName) {
					
					// Start overwriting the default field settings
					for (key in rule.settings.field_flags) {
						field = rule.settings.field_flags[key];
						for (flag in field) {
							fields[key][flag] = field[flag];
						}
					}
				}
			});

			callback(fields);
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

				results.filter(function(record) {

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
	this.beforeSave = function beforeSave(item, options, callback) {

		var that = this;

		this.getFieldFlags(function(fields) {

			var field;

			for (field in item) {
				if (!fields[field] || !fields[field].write) {
					delete item[field];
				}
			}

			callback();
		});
	};

});