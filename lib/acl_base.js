/**
 * The base Acl class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
const Base = Function.inherits('Alchemy.Base', 'Alchemy.Acl', 'Base');

/**
 * This is an abstract class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Base.makeAbstractClass();