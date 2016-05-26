/**
 * Route Rule Type
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 */
var RouteRule = Function.inherits('AclRuleType', function RouteAclRuleType() {
	RouteAclRuleType.super.call(this);
});

RouteRule.constitute(function addBlueprint() {
	this.blueprint.addField('url', 'RegExp');
});
