const VALUE = Symbol('value'),
      NODE_COUNT = Symbol('node_count'),
	  GROUP_COUNT = Symbol('group_count');

/**
 * Permissions
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {Array}   list
 */
const Permissions = Function.inherits(null, 'Alchemy.Permissions', function Permissions(list) {

	// The actual permissions
	this.nodes = null;

	// The groups this inherits from
	this.groups = null;

	// The direct group values
	this.group_values = {};

	if (list) {
		this.applyList(list);
	}
});

/**
 * Check a conduit for a permission
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {Conduit}   conduit
 * @param    {String}    permission
 *
 * @return   {Permissions}
 */
Permissions.setStatic(function conduitHasPermission(conduit, permission) {

	if (!conduit || !permission) {
		return false;
	}

	let user = conduit.session('UserData');

	if (!user) {
		return false;
	}

	return user.hasPermission?.(permission);
});

/**
 * Cast to a permissions list
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.1
 *
 * @return   {Permissions}
 */
Permissions.setStatic(function cast(value) {

	if (!value || typeof value != 'object') {
		return;
	}

	if (value instanceof Permissions) {
		return value;
	}

	if (!Array.isArray(value)) {
		value = [value];
	}

	return new Permissions(value);
});

/**
 * unDry an object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @return   {Permissions}
 */
Permissions.setStatic(function unDry(obj) {
	return new this(obj.nodes);
});

/**
 * Get the node count
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @type     {Number}
 */
Permissions.setProperty(function node_count() {
	return this[NODE_COUNT] || 0;
});

/**
 * Get the group count
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @type     {Number}
 */
Permissions.setProperty(function group_count() {
	return this[GROUP_COUNT] || 0;
});

/**
 * Return an simple object for JSON-ifying
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @return   {Object}
 */
Permissions.setMethod(function toJSON() {
	return {
		nodes : this.toArray(),
	};
});

/**
 * Return an object for json-drying this object
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @return   {Object}
 */
Permissions.setMethod(function toDry() {
	return {
		value : this.toJSON(),
	};
});

/**
 * Return a simplified array of these permissions
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @return   {Array}
 */
Permissions.setMethod(function toArray() {

	let result = [];

	_toArray(result, 'group', this.groups);
	_toArray(result, '', this.nodes);

	return result;
});


/**
 * Return a simplified array of these permissions
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @return   {Array}
 */
function _toArray(list, container_path, obj) {

	let entry,
	    path,
	    key;

	for (key in obj) {
		entry = obj[key];

		if (container_path) {
			path = container_path + '.' + key;
		} else {
			path = key;
		}

		if (entry[VALUE]) {
			list.push({
				permission : path,
				value      : entry[VALUE],
			});
		}

		_toArray(list, path, entry);
	}
}

/**
 * Apply the list of permissions
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {Array}   list
 */
Permissions.setMethod(function applyList(list) {

	this.nodes = {};
	this.groups = {};
	this.group_values = {};

	this[NODE_COUNT] = 0;
	this[GROUP_COUNT] = 0;

	let target,
	    permission,
		count_key,
	    pieces,
	    entry,
		path,
		node;

	for (entry of list) {
		permission = entry.permission;
		
		if (!permission) {
			continue;
		}

		pieces = permission.split('.');

		if (pieces[0] == 'group') {
			path = pieces[1];
			target = this.groups;
			count_key = GROUP_COUNT;
		} else {
			path = permission;
			target = this.nodes;
			count_key = NODE_COUNT;
		}

		node = Object.path(target, path);

		if (!node) {
			node = {
				[VALUE] : null,
			};

			Object.setPath(target, path, node);
		}

		node[VALUE] = entry.value;
		this[count_key]++;
	}

	for (let name in this.groups) {
		this.group_values[name] = this.groups[name][VALUE];
	}
});

/**
 * Get all global group definitions
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {String}   name
 *
 * @return   {Permissions}
 */
Permissions.setMethod(function getGlobalGroup(name) {

	if (Blast.isNode) {
		return Classes.Alchemy.Model.PermissionGroup.getGroup(name);
	}

});

/**
 * Get permission info
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {String}   permission
 *
 * @return   {Object}
 */
Permissions.setMethod(function lookupPermission(permission) {

	let result = this.lookupNonInheritedPermission(permission);

	if (!result) {
		result = this.lookupInheritedPermission(permission);
	}

	return result;
});

/**
 * Lookup a non-inherited permission
 * (These always get priority)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {String}   permission
 *
 * @return   {Object}
 */
Permissions.setMethod(function lookupNonInheritedPermission(permission) {

	if (!this.node_count) {
		return null;
	}

	let result,
	    entry;

	// See if it's directly defined
	entry = Object.path(this.nodes, permission);

	if (entry && entry[VALUE] != null) {
		result = {
			level : 0,
			group : null,
			value : entry[VALUE]
		};

		return result;
	}

	// See if any wildcards apply
	let pieces = permission.split('.');

	while (true) {
		let wildcard_permission = pieces.slice(0).concat('*');

		entry = Object.path(this.nodes, wildcard_permission);

		if (entry && entry[VALUE] != null) {
			result = {
				level : 0,
				group : null,
				value : entry[VALUE]
			};

			return result;
		}

		if (pieces.length == 0) {
			break;
		}

		pieces.pop();
	}

	return null;
});

/**
 * Lookup an inherited permission
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 *
 * @param    {String}   permission
 *
 * @return   {Object}
 */
Permissions.setMethod(function lookupInheritedPermission(permission) {

	if (!this.group_count) {
		return null;
	}

	let candidates = [],
	    group,
		info,
		name;
	
	// Iterate over all the groups this should inherit
	for (name in this.groups) {
		let group_permission = this.group_values[name];

		if (!group_permission) {
			continue;
		}

		group = this.getGlobalGroup(name);

		if (!group) {
			continue;
		}

		info = group.lookupPermission(permission);

		if (!info) {
			continue;
		}

		// If this comes from a group that is explicitly disabled, do not use it
		if (info.group && this.group_values[info.group] === false) {
			continue;
		}

		// If no group name is set, it came from the group's main permissions,
		// so set it now.
		if (!info.group) {
			info.group = name;
		}

		// Increase the level, to indicate it comes from a group
		info.level++;

		// Add it to the candidates
		candidates.push(info);
	}

	if (candidates.length) {
		candidates.sortByPath(1, 'level');

		let final_candidates = [],
		    candidate,
			level = null;
		
		for (candidate of candidates) {

			if (level == null) {
				level = candidate.level;
			}

			if (level != candidate.level) {
				break;
			}

			final_candidates.push(candidate);
		}

		// If any of the final candidates (candidates of the same level) are false,
		// that value will be returned!
		for (candidate of final_candidates) {
			if (!candidate.value) {
				return candidate;
			}
		}

		return final_candidates[0];
	}

	return null;
});

/**
 * Is the given permission available?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.2
 * @version  0.8.2
 *
 * @param    {String}   permission
 *
 * @return   {Boolean}
 */
Permissions.setMethod(function hasPermission(permission) {

	let entry = this.lookupPermission(permission);

	if (entry) {
		return entry.value;
	}

	return false;
});

// Make this the persmission checker
alchemy.setPermissionChecker(Permissions);