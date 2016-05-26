/**
 * The User Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 */
var Group = Model.extend(function AclGroupModel(options) {

	var chimera,
	    list,
	    edit,
	    view;

	AclGroupModel.super.call(this, options);

	// Create the chimera behaviour
	chimera = this.addBehaviour('chimera');

	if (chimera) {
		// Get the list group
		list = chimera.getActionFields('list');

		list.addField('name');
		list.addField('weight');

		// Get the edit group
		edit = chimera.getActionFields('edit');

		edit.addField('name');
		edit.addField('weight');

		// Get the view group
		view = chimera.getActionFields('view');

		view.addField('name');
		view.addField('weight');
	}
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