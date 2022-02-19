/**
 * The User Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.5.0
 */
var Group = Function.inherits('Alchemy.Model', 'AclGroup');

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.7.2
 */
Group.constitute(function addFields() {
	this.addField('name', 'String');
	this.addField('title', 'String');
	this.addField('weight', 'Number');
	this.addField('description', 'String');
});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.7.2
 */
Group.constitute(function chimeraConfig() {

	var list,
	    edit;

	if (!this.chimera) {
		return;
	}

	// Get the list group
	list = this.chimera.getActionFields('list');

	list.addField('title');
	list.addField('name');
	list.addField('weight');
	list.addField('description');

	// Get the edit group
	edit = this.chimera.getActionFields('edit');
	
	edit.addField('title');
	edit.addField('name');
	edit.addField('weight');
	edit.addField('description');
});