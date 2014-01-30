var AclDataTypes = alchemy.shared('Acl.dataTypes');

/**
 * The ACL type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create(function AclDataType (){

	// Indicate the user can configure this acl type
	this.configurable = true;

	// Indicate if this is a type meant for extending
	this.extendonly = true;

	/**
	 * Instantiate a newly created acltype after this class has been extended
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}   parent   The parent class
	 * @param    {Function}   child    The (extended) child class
	 */
	this.__extended__ = function __extended__(parentAclType, childAclType) {

		// Remove AclType from the name
		var typeName = childAclType.name.replace(/AclDataType$/, '');

		// Store the names in the prototype
		childAclType.prototype.title = typeName;

		typeName = typeName.underscore();

		childAclType.prototype.typeName = typeName;

		// Do not let the child inherit the extendonly setting
		if (!childAclType.prototype.hasOwnProperty('extendonly')) {
			childAclType.prototype.extendonly = false;
		}

		// Create a new instance if this is a useable type
		if (!childAclType.prototype.extendonly) {
			AclDataTypes[typeName] = new childAclType();
		}
	};

	/**
	 * Prepare the properties
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.preInit = function preInit() {
		// Call the parent preInit()
		this.parent();
	};

	/**
	 * Prepare the type
	 */
	this.prepare = function prepare(options, callback) {

		this.options = options;
		this.rule = options.rule;
		this.model = options.model;
		this.settings = this.rule.settings;

		// Get the context: an object where data can be fetched from
		if (options.context) {
			this.context = options.context;
		} else {
			this.context = this.model;
		}

		this.item = options.item;

		callback();
	};

	/**
	 * Modify chimera groups by reference
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}  next      The function to execute when we're done
	 * @param    {Object}    groups    The currently found groups
	 *
	 * @return   {undefined}
	 */
	this.chimeraGroups = function chimeraGroups(next, groups) {
		next();
	};

	/**
	 * Modify chimera index fields
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}  next      The function to execute when we're done
	 * @param    {Object}    fields
	 *
	 * @return   {undefined}
	 */
	this.chimeraIndexFields = function chimeraIndexFields(next, fields) {
		next();
	};

	/**
	 * Modify chimera base edit fields
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}  next      The function to execute when we're done
	 * @param    {Object}    fields
	 *
	 * @return   {undefined}
	 */
	this.chimeraEditFields = function chimeraEditFields(next, fields) {
		next();
	};

	/**
	 * Function that runs before every find operation
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}  next      The function to execute when we're done
	 * @param    {Object}    options   The find/query options
	 *
	 * @return   {undefined}
	 */
	this.beforeFind = function beforeFind(next, options) {
		next();
	};
	
	/**
	 * Function that runs after every find operation,
	 * with the result items passed
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}   next     The callback method, pass false to stop
	 */
	this.afterFind = function afterFind(next, err, results, primary, alias) {
		next();
	};
	
	/**
	 * Called before the model saves a record,
	 * but after it has applied the strictFields
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}  next    The callback to call when we're done
	 *
	 * @return void
	 */
	this.beforeSave = function beforeSave(next, record, options) {
		next();
	};
	
	/**
	 * Called after the model saves a record.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}  next    The callback to call when we're done
	 * @param    {Object}    record  The data that has been saved
	 * @param    {Object}    errors
	 *
	 * @return void
	 */
	this.afterSave = function afterSave(next, record, errors) {
		next();
	};

	/**
	 * The function that needs to check the given rule
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.check = function check() {
		log.warn('The original check function has not been replaced inside ' + this.name);
	};

	/**
	 * Do something when this acl turns out to be allowed
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.allowed = function allowed(rule, user) {};

	/**
	 * Do something when this acl turns out to be denied
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.denied = function denied(rule, user) {};
});
