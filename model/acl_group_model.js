/**
 * The User Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.3.0
 */
var Group = Model.extend(function AclGroupModel(options) {
	AclGroupModel.super.call(this, options);
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
Group.constitute(function addFields() {
	this.addField('name', 'String');
	this.addField('weight', 'Number');
});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.4.0
 */
Group.constitute(function chimeraConfig() {

	var list,
	    edit,
	    view;

	if (!this.chimera) {
		return;
	}

	// Get the list group
	list = this.chimera.getActionFields('list');

	list.addField('name');
	list.addField('weight');

	// Get the edit group
	edit = this.chimera.getActionFields('edit');

	edit.addField('name');
	edit.addField('weight');

	// Get the view group
	view = this.chimera.getActionFields('view');

	view.addField('name');
	view.addField('weight');
});