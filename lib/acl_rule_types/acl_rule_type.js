var AclRuleTypes = alchemy.shared('Acl.ruleTypes');

/**
 * The ACL Rule Type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create(function AclRuleType(){

	// Indicate the user can configure this acl type
	this.configurable = true;

	// Indicate if this is a type meant for extending
	this.extendonly = true;

	/**
	 * The default blueprint
	 *
	 * @type {Object}
	 */
	this.baseBlueprint = {
		// Allow access?
		allow: {
			type: 'Boolean',
			default: null
		},

		// Halt further checks?
		halt: {
			type: 'Boolean',
			default: false
		},

		// The order of execution
		order: {
			type: 'Number',
			default: 10
		}
	};

	/**
	 * The blueprint children can modify
	 *
	 * @type {Object}
	 */
	this.blueprint = null;

	/**
	 * The domains this rule can be applied to
	 *
	 * @type {Array}
	 */
	this.domains = null;

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

		var blueprint = {},
		    typeName = childAclType.name.replace(/AclRuleType$/, ''),
		    proto    = childAclType.prototype,
		    key;

		// Store the names in the prototype
		proto.title = typeName;
		typeName = typeName.underscore();
		proto.typeName = typeName;

		proto.defaultSettings = {};

		// Merge the blueprints together
		alchemy.inject(blueprint, proto.baseBlueprint, proto.blueprint);

		// Store them back into the blueprints property
		proto.blueprint = blueprint;

		// Create the default settings object
		for (key in blueprint) {
			proto.defaultSettings[key] = blueprint[key].default || null;
		}

		// Do not let the child inherit the extendonly setting
		if (!proto.hasOwnProperty('extendonly')) {
			proto.extendonly = false;
		}

		// Create a new instance if this is a useable type
		if (!proto.extendonly) {
			AclRuleTypes[typeName] = new childAclType();
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
	 * Prepare the options
	 */
	this.prepare = function prepare(options) {
		this.options = options;
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
