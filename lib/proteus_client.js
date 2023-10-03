let CACHE = alchemy.getCache('proteus_client', {
	max_age : '15 minutes'
});

/**
 * The Proteus client class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 */
const Proteus = Blast.Bound.Function.inherits('Alchemy.Base', 'Alchemy.Acl', function Proteus() {
	this.endpoint = alchemy.plugins.acl.proteus_server;

	if (!this.endpoint) {
		return;
	}

	if (!this.endpoint.endsWith('/')) {
		this.endpoint += '/';
	}

	this.realm_client = alchemy.plugins.acl.proteus_realm_client;
	this.access_key = alchemy.plugins.acl.proteus_access_key;
});

alchemy.plugins.acl.proteus_client = new Proteus();

/**
 * Do a remote request
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 */
Proteus.setMethod(async function doRemote(type, body) {

	let url = RURL.parse(this.endpoint + 'realm/' + this.realm_client + '/api/' + type);

	if (!body) {
		body = {};
	}

	let fetch_options = {
		url     : url,
		headers : {
			'access-key': this.access_key,
		},
		post : body,
	};

	let result = await Blast.fetch(fetch_options);

	// We trust the server to return JSON-Dry messages
	result = JSON.undry(result);

	return result;
});

/**
 * Get the available login methods
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @return   {Array}
 */
Proteus.setMethod(function getAuthenticators() {

	let result = CACHE.get('authenticators');

	if (result) {
		return result;
	}

	return this._fetchAuthenticators();
});

/**
 * Get an authenticator by its slug
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @return   {Object}
 */
Proteus.setMethod(async function getAuthenticator(slug) {

	let authenticators = await this.getAuthenticators(),
	    result;

	for (let authenticator of authenticators) {
		if (authenticator.slug === slug) {
			result = authenticator;
			break;
		}
	}

	return result;
});

/**
 * Get the actual login methods
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @return   {Array}
 */
Proteus.setMethod(async function _fetchAuthenticators() {

	let pledge = new Pledge();

	CACHE.set('authenticators', pledge);

	let result = await this.doRemote('authenticators');

	CACHE.set('authenticators', result);
	pledge.resolve(result);

	return result;
});

/**
 * Start a login
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @param    {Conduit}  conduit 
 * @param    {String}   authenticator_slug
 *
 * @return   {Object}
 */
Proteus.setMethod(async function startLogin(conduit, authenticator_slug) {

	let return_url = alchemy.routeUrl('AclStatic#proteusVerifyLogin', {
		
	}, {
		absolute: true
	});

	let body = {
		authenticator_slug : authenticator_slug,
		return_url         : return_url,
	};

	let result = await this.doRemote('create_login_session', body);
	conduit.session('proteusLoginSession', result);

	if (result?.login_url) {
		conduit.redirect(result.login_url);
		return true;
	}

	return false;
});

/**
 * Get the result of a login
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @param    {String}   remote_id
 *
 * @return   {Object}
 */
Proteus.setMethod(async function getLoginResult(remote_id) {

	let result = await this.doRemote('remote_login_result', {
		rlid : remote_id,
	});

	return result;
});

/**
 * Register an ACPL cookie
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @param    {AclPersistentCookie}   document
 */
Proteus.setMethod(async function registerPersistentLoginCookie(document) {

	if (!document) {
		return;
	}

	let data = document.$main;

	if (!data?.proteus_handle) {
		return;
	}

	let result = await this.doRemote('register_persistent_cookie', data);

	return result;
});

/**
 * Prepare for a remote login with a persistent cookie.
 * Should return an updated User document.
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @param    {AclPersistentCookie}   cookie
 * @param    {User}                  user
 * @param    {Conduit}               conduit   The conduit making the request
 *
 * @return   {User}
 */
Proteus.setMethod(async function remoteLoginWithPersistentCookie(cookie, user, conduit) {

	if (!cookie || !user) {
		return false;
	}

	let proteus_result = await this.doRemote('persistent_cookie_login_result', {
		handle            : cookie.proteus_handle,
		cookie_identifier : cookie.identifier,
		cookie_token      : cookie.token,
		user_handle       : user.proteus_handle,
		ip                : conduit?.ip,
	});

	if (!proteus_result?.success) {
		return false;
	}

	await this.updateUserWithProteusInfo(user, proteus_result);

	return user;
});

/**
 * Update a User document with Proteus information
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.4
 * @version  0.8.4
 *
 * @param    {User}     user
 * @param    {Object}   proteus_info
 *
 * @return   {User}
 */
Proteus.setMethod(async function updateUserWithProteusInfo(user, proteus_info) {

	let identity = proteus_info?.identity;

	if (!identity) {
		return false;
	}

	let has_changes = false;

	if (user.username != identity.handle || user.proteus_handle != identity.handle) {
		user.username = identity.handle;
		user.proteus_handle = identity.handle;
		has_changes = true;
	}

	if (user.proteus_uid != identity.uid) {
		user.proteus_uid = identity.uid;
		has_changes = true;
	}

	if (user.nickname != identity.nickname) {
		user.nickname = identity.nickname;
		has_changes = true;
	}

	if (user.given_name != identity.given_name) {
		user.given_name = identity.given_name;
		user.first_name = identity.given_name;
		has_changes = true;
	}

	if (user.family_name != identity.family_name) {
		user.family_name = identity.family_name;
		user.last_name = identity.family_name;
		has_changes = true;
	}

	if (!Object.alike(user.permissions, proteus_info.permissions)) {
		user.permissions = proteus_info.permissions;
		has_changes = true;
	}

	if (has_changes) {
		let title = '';

		if (user.given_name) {
			title += user.given_name;
		}

		if (user.family_name) {
			if (title) {
				title += ' ';
			}

			title += user.family_name;
		}

		if (!title) {
			title = user.username;
		}

		if (!title) {
			title = user.handle;
		}

		user.title = title;
	}

	if (has_changes) {
		await user.save();
	}

	return user;
});