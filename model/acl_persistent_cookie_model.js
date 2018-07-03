/**
 * The AclPersistentCookie Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.5.0
 */
var Persistent = Function.inherits('Alchemy.Model', function AclPersistentCookie(options) {

});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
Persistent.constitute(function addFields() {

	this.addField('identifier', 'String');
	this.addField('token', 'String');

	this.belongsTo('User');
});