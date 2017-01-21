/**
 * Route Rule Type
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.3.0
 */
var RouteRule = Function.inherits('Alchemy.AclRuleType', function RouteAclRuleType(document) {
	RouteAclRuleType.super.call(this, document);
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
RouteRule.constitute(function addSchemaFields() {
	this.schema.addField('section', 'Enum', {values: alchemy.shared('Routing.sections')});
});

/**
 * See if this rule applies to the current request
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.3.0
 */
RouteRule.setMethod(function doesRuleApply(conduit, next) {

	// See if the sections match, if they're set
	if (this.settings.section && this.settings.section != conduit.section.name) {
		return next(null, false);
	}

	next(null, true);
});