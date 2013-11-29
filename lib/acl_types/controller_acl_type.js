/**
 * The Routeclass ACL type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('RequestAclType', function ControllerAclType (){

	/**
	 * See if this rule applies.
	 * This does not mean it's allowed or not, since that's inside the rule.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.check = function check(rule, route, req) {

		// If the name of the controller is the same as the one set in the rule,
		// and if the action name is not given or also matches, return true
		if (route.options.controller === rule.parent_name) {
			// See if there's an action specified, too
			if (!rule.child_name || route.options.action === rule.child_name) {
				return true;
			}
		}

		return false;
	};

});