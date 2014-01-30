/**
 * The Field ACL type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('AclDataType', function FieldAclDataType (){

	// Hide = no read
	// preserve = no save

	/**
	 * Do not return fields with the 'hide' flag set
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.afterFind = function afterFind(next, err, results, primary, alias) {

		var item = results[alias],
		    fields = this.settings.fields,
		    replacement = {},
		    field,
		    i;

		for (i = 0; i < fields.length; i++) {
			field = fields[i];

			if (field.flags.indexOf('hide') > -1) {
				delete item[field.field];
			}
		}

		next();
	};

	/**
	 * Do not allow the user to save fields with the "preserve" or "hide" flag
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.beforeSave = function beforeSave(next, item, options) {

		var fields = this.settings.fields,
		    field,
		    i;

		for (i = 0; i < fields.length; i++) {
			field = fields[i];

			// The user should not be able to modify fields that should be preserved,
			// or fields that he shouldn't even see
			if (field.flags.indexOf('preserve') > -1 || field.flags.indexOf('hide') > -1) {
				delete item[field.field];
			}
		}

		next();
	};

	this.prepare = function prepare(options, callback) {

		var that = this;

		this.parent('prepare', null, options, function() {

			callback();

		});
	};

	this.chimeraGroups = function chimeraGroups(next, groups) {

		var fields = this.settings.fields,
		    groupname,
		    group,
		    field,
		    i,
		    j;

		for (i = 0; i < fields.length; i++) {
			field = fields[i];

			if (field.flags.indexOf('hide') > -1) {

				for (groupname in groups) {
					group = groups[groupname];

					for (j = 0; j < group.fields.length; j++) {
						if (group.fields[j].field == field.field) {
							delete group.fields[j];
						}
					}

					group.fields.clean(undefined);
				}
			}
		}

		next();
	};

	this.chimeraEditFields = function chimeraEditFields(next, editFields) {

		var fields = this.settings.fields,
		    field,
		    key,
		    i;

		for (i = 0; i < fields.length; i++) {
			field = fields[i];

			if (field.flags.indexOf('hide') > -1) {

				for (key in editFields) {
					if (key == field.field) {
						delete editFields[key];
					}
				}
			}
		}

		next();
	};

	this.chimeraIndexFields = function chimeraIndexFields(next, indexFields) {

		var fields = this.settings.fields,
		    field,
		    i,
		    j;

		for (i = 0; i < fields.length; i++) {
			field = fields[i];

			if (field.flags.indexOf('hide') > -1) {

				for (j = 0; j < indexFields.length; j++) {
					if (indexFields[j].field == field.field) {
						delete indexFields[j];
					}
				}
			}
		}

		indexFields.clean(undefined);
		next();
	};

});