var AclTypes = alchemy.shared('Acl.types');

/**
 * The ACL type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create(function AclType (){

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
		var typeName = childAclType.name.replace(/AclType$/, '');

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
			AclTypes[typeName] = new childAclType();
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
