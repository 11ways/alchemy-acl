/**
 * A Permissions field lets you add permissions
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
const Permissions = Function.inherits('Alchemy.Field', 'Permissions');

/**
 * Set the datatype name
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
Permissions.setDatatype('object');

/**
 * This field value is self-contained
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
Permissions.setSelfContained(true);

/**
 * Cast the given value to this field's type
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
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

	return Blast.Classes.Alchemy.Permissions.Permissions.cast(value);
});

/**
 * Convert value from the datasource
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {Object}   query     The original query
 * @param    {Object}   options   The original query options
 * @param    {Mixed}    value     The field value, as stored in the DB
 * @param    {Function} callback
 */
Permissions.setMethod(function _toApp(query, options, value, callback) {

	if (!value) {
		return callback();
	}

	let result = this.cast(value);

	callback(null, result);
});

/**
 * Prepare the value of this field to be stored in the database
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {Mixed}        value       The field's own value
 * @param    {Object}       data        The main record
 * @param    {Datasource}   datasource  The datasource instance
 *
 * @return   {Mixed}
 */
Permissions.setMethod(function _toDatasource(value, data, datasource, callback) {
	callback(null, value?.toArray?.());
});
