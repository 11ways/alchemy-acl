/**
 * The base Acl Rule Type Class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.3.0
 *
 * @param    {Document}   record
 */
var AclRuleType = Function.inherits('Alchemy.Base', 'Alchemy.Acl.Rule', function Rule(document) {
	this.document = document;
	this.settings = document.settings || {};
});

/**
 * This is a wrapper class
 */
AclRuleType.makeAbstractClass();

/**
 * This wrapper class starts a new group
 */
AclRuleType.startNewGroup('acl_rule_types');

/**
 * Set the 'shared group' prefix
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 */
AclRuleType.setProperty(function schema() {
	return this.constructor.schema;
});

/**
 * Rule type schema
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 */
AclRuleType.constitute(function createSchema() {

	var schema = new Classes.Alchemy.Schema(this);

	// Does this rule allow or deny access when it applies?
	schema.addField('allow',  'Boolean');

	// Should we stop testing other rules once this applies?
	schema.addField('halt',   'Boolean');

	// What's the weight of this rule?
	schema.addField('weight', 'Number', {default: 10});

	this.schema = schema;
});

/**
 * Check request, callback with true if this rule allows acces
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 */
AclRuleType.setMethod(function checkRequest(conduit, next) {

	var that = this;

	this.doesRuleApply(conduit, function checkedIfApplies(err, applies) {

		if (err) {
			return next(err);
		}

		if (!applies) {
			return next(null, true);
		}

		that.test(conduit, next)
	});
});

/**
 * See if this rule applies
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 */
AclRuleType.setMethod(function doesRuleApply(conduit, next) {
	return next(new Error('Rule type ' + this.name + ' has not implemented doesRuleApply method'));
});

/**
 * Test this rule:
 * by default just returns the documents 'allow' value
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 */
AclRuleType.setMethod(function test(conduit, next) {
	next(null, this.settings.allow);
});
