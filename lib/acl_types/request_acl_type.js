/**
 * The Controller ACL type class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('AclType', function RequestAclType (){

	this.extendonly = true;

	/**
	 * Do something when this acl turns out to be allowed
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.allowed = function allowed(rule, user, req) {
		log.acl(this.name + 'has ' + 'allowed'.bold.green + ' user ' + user + ' access to url ' + req.originalUrl);
	};

	/**
	 * Do something when this acl turns out to be denied
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.denied = function denied(rule, user, req) {
		log.acl(this.name + ' has ' + 'denied'.bold.red + ' user ' + user + ' access to url ' + req.originalUrl);
	};

});