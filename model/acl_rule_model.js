var AclPlugin = alchemy.plugins.acl;

/**
 * The ACL Rule Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 */
var AclRule = Model.extend(function AclRuleModel(options) {

	var chimera,
	    list,
	    edit,
	    view;

	AclRuleModel.super.call(this, options);

	this.types = alchemy.shared('Acl.ruleTypes');

	// Create the chimera behaviour
	chimera = this.addBehaviour('chimera');

	if (chimera) {

		// Get the list group
		list = chimera.getActionFields('list');

		list.addField('_id');

		// Get the edit group
		edit = chimera.getActionFields('edit');

		edit.addField('type');
		edit.addField('target_groups_id');
		edit.addField('target_users_id');

		edit.addField('settings');

		// Get the view group
		view = chimera.getActionFields('view');

		view.addField('type');
	}
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 */
AclRule.constitute(function addFields() {

	this.setEnumValues('types', alchemy.shared('Acl.ruleTypes'));

	this.addField('type', 'Enum');
	this.addField('settings', 'Schema', {schema: 'type'});

	this.hasAndBelongsToMany('TargetUsers', 'User');
	this.hasAndBelongsToMany('TargetGroups', 'AclGroup');
});

/**
 * Get all the rules that apply to the given user
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 *
 * @param    {Object}   user      The user object as it is in the session
 * @param    {Function} callback  The function to pass the rules to
 */
AclRule.setMethod(function getUserRules(user, callback) {

	var condition = {},
	    groups,
	    users;

	// Always include the 'everyone' group
	groups = [AclPlugin.EveryoneGroupId];

	if (user) {
		// If the user entry exists, include the logged in group
		groups.push(AclPlugin.LoggedInGroupId);

		// Include the groups this user has been assigned to
		groups = groups.concat(user.acl_group_id);

		users = [user._id];
	}

	// @todo: fix dbquery so this works
	condition.or = {
		'target_groups_id': groups,
		'target_users_id': users
	};

	this.find('all', {conditions: condition, recursive: 0}, function gotRules(err, items) {

		var rules = Object.extract(items, '$..AclRule');

		pr(rules, true);

		callback(null, rules);
	});
});