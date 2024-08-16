/**
 * A Permissions field lets you add permissions
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.4
 */
const Permissions = Function.inherits('Alchemy.Field.Schema', function Permissions(schema, name, options) {

	if (!options) {
		options = {};
	}

	// A custom schema should NOT be passed to this class, this class uses
	// a fixed schema that should not be altered.
	// But because that's exactly what happens when cloning (like preparing
	// the data to be sent to Hawkejs) we have to allow it anyway
	if (!options.schema) {

		let permissions_schema = alchemy.createSchema();

		permissions_schema.addField('permission', 'String');
		permissions_schema.addField('value', 'Boolean');

		if (options.extra_fields?.length) {
			for (let entry of options.extra_fields) {

				if (!entry.name || !entry.type) {
					continue;
				}

				permissions_schema.addField(entry.name, entry.type, entry.options);
			}
		}

		options.schema = permissions_schema;
	}

	Permissions.super.call(this, schema, name, options);
});

/**
 * Is this schema field always an array?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @return   {Boolean}
 */
Permissions.setProperty('force_array_contents', true);

/**
 * Cast the given value to this field's type
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.4
 *
 * @param    {Mixed}   value
 *
 * @return   {Permissions}
 */
Permissions.setMethod(function cast(value) {

	// Don't cast falsy values
	if (!value) {
		return null;
	}

	let PermissionsClass = this.options?.permissions_class || Blast.Classes.Alchemy.Permissions.Permissions;
	
	let result = PermissionsClass.cast(value);

	if (this.options?.group_resolver != null) {
		result.group_resolver = this.options.group_resolver;
	}

	return result;
});

/**
 * Prepare the value of this field to be stored in the database
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.9.0
 *
 * @param    {Alchemy.OperationalContext.SaveFieldToDatasource}   context
 * @param    {*} value
 *
 * @return   {Pledge<*>|*}
 */
Permissions.setMethod(function _toDatasource(context, value) {

	// Un-cast the value from a `Permissions` instance to an array
	value = value?.toArray?.();

	return _toDatasource.super.call(this, context, value);
});

/**
 * Get the fieldset for the editor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @return   {Array}
 */
Permissions.setMethod(function getFieldset() {

	let fieldset = [
		{name: 'permission', type: 'string'},
		{name: 'value', type: 'boolean'},
		//{name: 'expiry'},
	];

	if (this.options?.extra_fields?.length) {
		for (let entry of this.options.extra_fields) {

			if (!entry.name) {
				continue;
			}

			let field = this.options.schema.getField(entry.name);

			if (!field) {
				continue;
			}

			fieldset.push({
				name    : entry.name,
				type    : field.constructor.type_name,
				options : field.options,
			});
		}
	}

	return fieldset;
});