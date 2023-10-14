Router.get('LoginForm', '/login', 'AclStatic#loginForm');
Router.post('LoginPost', '/login', 'AclStatic#loginPost');

Router.get('JoinForm', '/join', 'AclStatic#joinForm');
Router.post('JoinPost', '/join', 'AclStatic#joinPost');

Router.get('Logout', '/logout', 'AclStatic#logout');

Router.add({
	name       : 'AclStatic#proteusLogin',
	methods    : 'get',
	paths      : '/segments/acl/proteus-login',
	visible_location: false,
});

Router.add({
	name       : 'AclStatic#proteusRealmLogin',
	methods    : 'get',
	paths      : '/acl/proteus/login/{authenticator}',
	visible_location: false,
});

Router.add({
	name       : 'AclStatic#proteusVerifyLogin',
	methods    : 'get',
	paths      : '/acl/proteus/verify',
	visible_location: false,
});

Router.add({
	name       : 'AclStatic#proteusPollLogin',
	methods    : ['get', 'post'],
	paths      : '/acl/proteus/poll',
	visible_location: false,
});

// Add models to the menu deck
if (alchemy.plugins.chimera && alchemy.plugins.chimera.menu) {
	alchemy.plugins.chimera.menu.set('acl_group', {
		name : 'acl_groups',
		title: 'ACL Groups',
		route: 'chimera@ModelAction',
		parameters: {
			controller: 'editor',
			subject: 'acl_group',
			action: 'index'
		},
		icon: {svg: 'connection'}
	});

	alchemy.plugins.chimera.menu.set('acl_rule', {
		name : 'acl_rules',
		title: 'ACL Rules',
		route: 'chimera@ModelAction',
		parameters: {
			controller: 'editor',
			subject: 'acl_rule',
			action: 'index'
		},
		icon: {svg: 'connection'}
	});
}