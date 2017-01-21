/**
 * Url Rule Type
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.3.0
 */
var UrlRule = Function.inherits('Alchemy.AclRuleType', function UrlAclRuleType(document) {
	UrlAclRuleType.super.call(this, document);
});

/**
 * Add schema fields
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.3.0
 */
UrlRule.constitute(function addSchemaFields() {
	this.schema.addField('url', 'RegExp');
});

/**
 * See if this rule applies to the current request
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 */
UrlRule.setMethod(function doesRuleApply(conduit, next) {
	// Test the path (without GET parameters)
	next(null, this.settings.url.test(conduit.url.pathname));
});