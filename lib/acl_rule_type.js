var AclRuleTypes = alchemy.shared('Acl.ruleTypes'),
    AclRuleType,
    Blast      = __Protoblast;

Blast.on('extended', function(parent, child) {

	var typeName,
	    name;

	if (parent.name.endsWith('AclRuleType')) {
		name = child.name.beforeLast('AclRuleType') || 'AclRuleType';
		typeName = name.underscore();

		child.setProperty('title', name.humanize());
		child.setProperty('typeName', typeName);

		AclRuleTypes[typeName] = child;
	}
});

/**
 * The base Acl Rule Type Class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 */
AclRuleType = Function.inherits(function AclRuleType() {
	this.blueprint = this.constructor.blueprint;
});

AclRuleType.constitute(function createBlueprint() {

	var schema = new alchemy.classes.Schema(this);

	schema.addField('allow', 'Boolean');
	schema.addField('halt', 'Boolean');
	schema.addField('order', 'Number', {default: 10});

	this.blueprint = schema;
});