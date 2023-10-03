const ENTRIES = Symbol('entries'),
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
 * @version  0.8.4
 *
 * @return   {Permissions}
 */
Permissions.setStatic(function cast(value) {

	if (!value || typeof value != 'object') {
		return;
	}

	const PermissionsClass = this;

	if (value instanceof PermissionsClass) {
		return value;
	}

	if (!Array.isArray(value)) {
		value = [value];
	}

	return new PermissionsClass(value);
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
 * Cast to a permissions list
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @type     {Function}
 */
Permissions.setMethod(function cast(value) {
	return this.constructor.cast(value);
});

/**
 * The default group resolver
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @type     {Function}
 */
Permissions.setMethod(function defaultGroupResolver(name) {
	if (Blast.isNode) {
		return Classes.Alchemy.Model.PermissionGroup.getGroup(name);
	}
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
 * Return a flattened version of these permissions
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.3
 * @version  0.8.4
 *
 * @return   {Permissions}
 */
Permissions.setMethod(function flattened() {
	let flattened = this.toArray(true);
	return this.cast(flattened);
});

/**
 * See if 1 permissions object is equal to another
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @return   {Boolean}
 */
Permissions.setMethod(Blast.alikeSymbol, function isAlike(other, seen) {

	if (!other || !(other instanceof Permissions)) {
		return false;
	}

	let this_arr = this.toArray(true),
	    other_arr = other.toArray(true);

	if (this_arr.length != other_arr.length) {
		return false;
	}

	return Object.alike(this_arr, other_arr, seen);
});

/**
 * Return a simplified array of these permissions
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.3
 *
 * @return   {Array}
 */
Permissions.setMethod(function toArray(flatten_groups) {

	let result = [];

	_toArray(result, 'group', this.groups);
	_toArray(result, '', this.nodes);

	if (flatten_groups) {
		_flattenGroupPermissions.call(this, result);
	}

	return result;
});

/**
 * Flatten group permissions and add them to the array
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.4
 *
 * @param    {Array}   result
 *
 * @return   {Array}
 */
function _flattenGroupPermissions(target) {

	let name;

	for (name in this.groups) {

		if (!this.hasGroupPermission(name)) {
			continue;
		}

		let group = this.getGlobalGroup(name);

		if (!group) {
			continue;
		}

		let flattened_group = group.toArray(true);

		for (let entry of flattened_group) {
			let existing = target.findByPath('permission', entry.permission);

			if (existing) {
				continue;
			}

			// Make sure the correct permission levels are taken into account
			let has_permission = this.hasPermission(entry.permission);
			
			if (has_permission) {
				target.push(entry);
			}
		}
	}
};

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
	    node,
	    path,
	    key;

	for (key in obj) {
		node = obj[key];

		if (container_path) {
			path = container_path + '.' + key;
		} else {
			path = key;
		}

		if (node?.[ENTRIES]?.length) {
			for (entry of node[ENTRIES]) {
				list.push({
					permission : path,
					...entry
				});
			}
		}

		_toArray(list, path, node);
	}
}

/**
 * Apply the list of permissions
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.4
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

		if (typeof permission != 'string') {
			continue;
		}

		permission = permission.trim().toLowerCase();
		
		// Skip permission entries without a valid permission path
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
				[ENTRIES] : [],
			};

			Object.setPath(target, path, node);
		}

		node[ENTRIES].push(entry);
		this[count_key]++;
	}
});

/**
 * Add the given permissions and return as a new instance
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @param    {Permissions}   other
 *
 * @return   {Permissions}
 */
Permissions.setMethod(function concat(other) {

	let this_array = JSON.clone(this.toArray(true)),
	    other_array = JSON.clone(other.toArray(true));

	let result = this.cast(this_array.concat(other_array));

	return result;
});

/**
 * Get all global group definitions
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.4
 *
 * @param    {String}   name
 *
 * @return   {Permissions}
 */
Permissions.setMethod(function getGlobalGroup(name) {
	if (this.group_resolver) {
		return this.group_resolver(name);
	} else {
		return this.defaultGroupResolver(name);
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
 * @version  0.8.4
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
	    entry,
	    node;

	// See if it's directly defined
	node = Object.path(this.nodes, permission);

	if (node?.[ENTRIES]?.length) {
		result = {
			level : 0,
			group : null,
			value : null,
		};

		for (entry of node[ENTRIES]) {
			if (entry.value) {
				result.value = true;
			}
		}

		if (!result.value) {
			result.value = false;
		}

		return result;
	}

	// See if any wildcards apply
	let pieces = permission.split('.');

	while (true) {
		let wildcard_permission = pieces.slice(0).concat('*');

		node = Object.path(this.nodes, wildcard_permission);

		if (node?.[ENTRIES]?.length) {
			result = {
				level : 0,
				group : null,
				value : null,
			};

			for (entry of node[ENTRIES]) {
				if (entry.value) {
					result.value = true;
				}
			}

			if (!result.value) {
				result.value = false;
			}

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
 * Is the given group enabled?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @param    {String}   group_name
 *
 * @return   {Boolean}
 */
Permissions.setMethod(function hasGroupPermission(group_name) {

	let group = this.groups[group_name];

	if (!group) {
		return false;
	}

	let has_group_permission = null,
	    entry;

	if (group?.[ENTRIES]?.length) {
		for (entry of group[ENTRIES]) {
			if (entry.value) {
				has_group_permission = true;
				break;
			}
		}
	}

	return has_group_permission;
});

/**
 * Lookup an inherited permission
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.4
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
	    entry,
	    info,
	    name;
	
	// Iterate over all the groups this should inherit
	for (name in this.groups) {
		
		if (!this.hasGroupPermission(name)) {
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