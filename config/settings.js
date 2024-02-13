const ACL_PLUGIN_GROUP = Plugin.getSettingsGroup();

ACL_PLUGIN_GROUP.addSetting('redirect_url', {
	type        : 'string',
	default     : '/',
	description : 'The default url to redirect to',
});

ACL_PLUGIN_GROUP.addSetting('destroy_session_on_logout', {
	type        : 'boolean',
	default     : true,
	description : 'Destroy session on log out',
});

const MODEL = ACL_PLUGIN_GROUP.createGroup('model');

MODEL.addSetting('name', {
	type        : 'string',
	default     : 'User',
	description : 'The model to use for user data',
});

MODEL.addSetting('username_field', {
	type        : 'string',
	default     : 'username',
});

MODEL.addSetting('password_field', {
	type        : 'string',
	default     : 'password',
});

MODEL.addSetting('password_checker', {
	type        : 'function',
	default     : null,
});

MODEL.addSetting('super_user_id', {
	type        : 'string',
	default     : '52efff0000a1c00000000000',
	description : 'The id of the super user',
});

const PASSWORD = ACL_PLUGIN_GROUP.createGroup('password');

PASSWORD.addSetting('rounds', {
	type        : 'number',
	default     : 10,
	description : 'The amount of rounds to process the salt',
});

const LAYOUT = ACL_PLUGIN_GROUP.createGroup('layout');

LAYOUT.addSetting('base_layout', {
	type        : 'string',
	default     : 'layouts/acl_base',
	description : 'The name of the base layout',
	action      : exposeViewSettings,
});

LAYOUT.addSetting('body_layout', {
	type        : 'string',
	default     : 'layouts/acl_body',
	description : 'The name of the body layout',
	action      : exposeViewSettings,
});

LAYOUT.addSetting('main_layout', {
	type        : 'string',
	default     : 'layouts/acl_main',
	description : 'The main layout',
	action      : exposeViewSettings,
});

LAYOUT.addSetting('body_block', {
	type        : 'string',
	default     : 'acl-base',
	description : 'The name of the body block',
	action      : exposeViewSettings,
});

LAYOUT.addSetting('main_block', {
	type        : 'string',
	default     : 'acl-main',
	description : 'The name of the main block',
	action      : exposeViewSettings,
});

LAYOUT.addSetting('content_block', {
	type        : 'string',
	default     : 'acl-content',
	description : 'The name of the content block',
	action      : exposeViewSettings,
});

LAYOUT.addSetting('not_authorized_template', {
	type        : 'string',
	default     : 'acl/login',
	description : 'Template to render when not-authorized',
	action      : exposeViewSettings,
});

LAYOUT.addSetting('not_authorized_ajax_template', {
	type        : 'string',
	default     : 'acl/login_modal',
	description : 'Template to render when not-authorized over ajax',
	action      : exposeViewSettings,
});

LAYOUT.addSetting('login_logo', {
	type        : 'string',
	default     : '/public/acl_login_logo.svg',
	description : 'The logo to use on the login form',
	action      : (value) => {
		alchemy.exposeStatic('acl_login_logo', value);
	},
});

LAYOUT.addSetting('login_background_logo', {
	type        : 'string',
	default     : '/public/acl_background_logo.svg',
	description : 'The background logo to use on the login form',
	action      : (value) => {
		alchemy.exposeStatic('acl_background_logo', value);
	},
});

const PROTEUS = ACL_PLUGIN_GROUP.createGroup('proteus');

PROTEUS.addSetting('server', {
	type        : 'string',
	default     : null,
	description : 'The address of the proteus server',
	action      : (value, value_instance) => {
		alchemy.exposeStatic('acl_proteus_server', value);
		createProteusClient();
	},
});

PROTEUS.addSetting('access_key', {
	type        : 'string',
	default     : null,
	description : 'The key to use when accessing the proteus server',
	action      : createProteusClient,
});

PROTEUS.addSetting('realm_client', {
	type        : 'string',
	default     : null,
	description : 'The realm-client identifier slug to use',
	action      : createProteusClient,
});

/**
 * Create the proteus client (if proteus is enabled)
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
function createProteusClient() {

	let server = alchemy.settings.plugins.acl.proteus.server,
	    realm_client = alchemy.settings.plugins.acl.proteus.realm_client,
	    access_key = alchemy.settings.plugins.acl.proteus.access_key;

	if (!server || !realm_client || !access_key) {
		alchemy.plugins.acl.proteus_client = null;
		alchemy.plugins.acl.has_proteus = false;
		return;
	}

	alchemy.plugins.acl.has_proteus = true;

	alchemy.plugins.acl.proteus_client = new Classes.Alchemy.Acl.Proteus({
		endpoint     : server,
		realm_client : realm_client,
		access_key   : access_key,
	});
}

/**
 * Expose the view settings
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.9.0
 * @version  0.9.0
 */
function exposeViewSettings(value) {

	const settings = alchemy.settings.plugins.acl,
	      layout = settings.layout;

	const view_settings = {
		base_layout   : layout.base_layout,
		body_layout   : layout.body_layout,
		main_layout   : layout.main_layout,
		body_block    : layout.body_block,
		main_block    : layout.main_block,
		content_block : layout.content_block,
		username      : settings.model.username_field,
		password      : settings.model.password_field,
	};

	alchemy.exposeStatic('acl-view-setting', view_settings);
}