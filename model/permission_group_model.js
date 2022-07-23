const ALL_GROUPS = new Map();
let reloading_pledge;

/**
 * The PermissionGroup Model class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
const Group = Function.inherits('Alchemy.Model', 'PermissionGroup');

/**
 * Get a group by its name
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {String}   name
 *
 * @return   {Group}
 */
Group.setStatic(function getGroup(name) {
	return ALL_GROUPS.get(name);
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
Group.constitute(function addFields() {

	// The group title
	this.addField('title', 'String');

	// The actual permissions
	this.addField('permissions', 'Permissions');

	// The unique slug of each group
	this.addBehaviour('Sluggable');
});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
Group.constitute(function chimeraConfig() {

	if (!this.chimera) {
		return;
	}

	// Get the list group
	const list = this.chimera.getActionFields('list');

	list.addField('title');
	list.addField('slug');

	// Get the edit group
	const edit = this.chimera.getActionFields('edit');
	
	edit.addField('title');
	edit.addField('permissions');
	edit.addField('slug');
});

/**
 * Reload the groups after a save
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
Group.setMethod(function afterSave(result, options, created) {
	this.loadAllGroups();
});

/**
 * Load all the groups
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
Group.setMethod(function loadAllGroups() {

	if (reloading_pledge) {
		return reloading_pledge;
	}

	let pledge = reloading_pledge = new Pledge();

	const that = this;

	setTimeout(async function doGroupReload() {
		reloading_pledge = null;

		let groups = await that.find('all');

		ALL_GROUPS.clear();

		for (let group of groups) {

			if (!group.permissions || !group.slug) {
				continue;
			}

			ALL_GROUPS.set(group.slug, group.permissions);
		}

		pledge.resolve();
	}, 50);

	return reloading_pledge;
});