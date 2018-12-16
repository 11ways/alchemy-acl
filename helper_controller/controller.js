var Controller = Blast.Classes.Hawkejs.Controller,
    Model = Blast.Classes.Hawkejs.Model;

/**
 * Get the current user's id
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.5.4
 * @version  0.5.4
 *
 * @return   {ObjectID|String|undefined}
 */
Controller.setMethod(function getUserId() {
	return Model.prototype.getUserId.call(this);
});