/**
 * The AclPersistentCookie Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 */
var Persistent = Model.extend(function AclPersistentCookieModel(options) {

});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 */
Persistent.constitute(function addFields() {

	this.addField('identifier', 'String');
	this.addField('token', 'String');

	this.belongsTo('User');
});