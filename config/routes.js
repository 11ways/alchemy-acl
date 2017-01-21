Router.get('LoginForm', '/login', 'AclStatic#loginForm');
Router.post('LoginPost', '/login', 'AclStatic#loginPost');
Router.get('Logout', '/logout', 'AclStatic#logout');

// Add models to the menu deck
if (alchemy.plugins.chimera) {
	alchemy.plugins.chimera.menu.set('acl_group', {
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