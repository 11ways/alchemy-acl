/**
 * The Routeclass ACL type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('RequestAclType', function RouteclassAclType (){

	/**
	 * See if this rule applies.
	 * This does not mean it's allowed or not, since that's inside the rule.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.check = function check(rule, route, req) {

		// If the name of the routes is the same as the one set in the rule,
		// return true because this rule does apply
		if (route.name === rule.parent_name) {
			return true;
		}

		return false;
	};

});