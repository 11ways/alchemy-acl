/**
 * The URL ACL Rule Type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('RequestAclRuleType', function UrlAclRuleType() {

	this.pathMentions = alchemy.plugins.acl.placeholders;

	this.blueprint = {
		path: {
			type: 'String'
		}
	};

	/**
	 * See if this rule applies.
	 * This does not mean it's allowed or not, since that's inside the rule.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.check = function check(rule, route, req) {

		// If the url matches the original url,
		// return true because this rule does apply
		if (RegExp('^' + rule.parent_name + '$').exec(req.originalUrl)) {
			return true;
		}

		return false;
	};

});