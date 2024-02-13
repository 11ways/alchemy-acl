/**
 * The base Acl model class.
 * Models meant for the ACL plugin.
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
const Acl = Function.inherits('Alchemy.Model.App', 'Alchemy.Model.Acl', 'Acl');

/**
 * Mark this class as being abstract
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
Acl.makeAbstractClass();

/**
 * Use the `alchemy` prefix for the table name
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
Acl.setTablePrefix('acl');