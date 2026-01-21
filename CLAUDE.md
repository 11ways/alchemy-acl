# Alchemy ACL Development Guide

## Overview

Alchemy ACL is an access control and authentication plugin for AlchemyMVC. It provides user authentication, permission-based access control, session management with persistent cookies, and optional integration with Proteus (remote authentication server).

## Commands
- Run tests: `npm test`

## Dependencies
- bcrypt (~5.1.1) - Password hashing

## Directory Structure

```
model/
├── 00-acl_model.js              # Base Acl model class
├── user_model.js                # User model with auth & passwords
├── acl_permission_group_model.js # Permission groups
└── acl_persistent_cookie_model.js # Persistent login cookies

helper/
├── acl_helper.js                # View helper for user info
└── permissions.js               # Permission system core

helper_model/
├── model.js                     # getUserId() for models
└── user_model.js                # hasPermission() for User docs

helper_controller/
├── controller.js                # getUserId() for controllers
└── conduit.js                   # Conduit extensions

controller/
└── acl_static_controller.js     # Login/logout/join forms

lib/
└── proteus_client.js            # Remote auth server integration

element/
└── alchemy_permissions_editor.js # Permissions UI element

view/
├── acl/                         # Login/join templates
└── layouts/                     # ACL-specific layouts
```

## Permission System

### Permission Structure
```javascript
// Direct permission
{permission: 'articles.edit', value: true}

// Group membership
{permission: 'group.admin', value: true}

// Wildcard (grants all)
{permission: '*', value: true}
```

### Checking Permissions
```javascript
// In controllers/models
const hasAccess = user.hasPermission('articles.edit');

// In views (via acl helper)
<% if (acl.hasPermission('articles.edit')) { %>
    <button>Edit</button>
<% } %>

// Get detailed lookup
const lookup = permissions.lookupPermission('articles.edit');
```

### Permission Resolution Order
1. **Direct permissions** - Exact match in user's nodes
2. **Wildcard matching** - `articles.*` matches `articles.edit`
3. **Group inheritance** - Enabled groups grant their permissions
4. **Fallback** - Returns `false` if not found

### Permission Groups
```javascript
// Create a permission group
const group = {
    title: 'Editor',
    slug: 'editor',
    permissions: [
        {permission: 'articles.*', value: true},
        {permission: 'comments.moderate', value: true}
    ]
};

// Users can be assigned to groups
user.permissions = [
    {permission: 'group.editor', value: true}
];
```

## User Model

### Fields
- `username` (String) - Login identifier
- `password` (Password) - Bcrypt-hashed (is_private)
- `enabled` (Boolean) - Account active status
- `permissions` (Permissions) - Direct permission list
- `settings` (Settings) - User-specific settings

### Proteus Fields (when enabled)
- `proteus_uid` (BigInt) - Unique ID from Proteus
- `proteus_handle` (String) - Human-readable handle
- `title`, `nickname`, `given_name`, `family_name` (String)

### User Methods
```javascript
// Check permission
user.hasPermission('articles.edit');

// Get permission value
user.getPermissionValue('articles.edit');

// Create persistent cookie
await user.createPersistentCookie(conduit);
```

## Configuration

### Settings (`alchemy.settings.plugins.acl`)

```javascript
{
    // Redirect after login
    redirect_url: '/',
    destroy_session_on_logout: true,

    // User model configuration
    model: {
        name: 'User',
        username_field: 'username',
        password_field: 'password',
        password_checker: null,  // Custom validator function
        super_user_id: '52efff0000a1c00000000000'
    },

    // Bcrypt configuration
    password: {
        rounds: 10
    },

    // Layout customization
    layout: {
        base_layout: 'layouts/acl_base',
        body_layout: 'layouts/acl_body',
        main_layout: 'layouts/acl_main',
        not_authorized_template: 'acl/login',
        not_authorized_ajax_template: 'acl/login_modal',
        login_logo: '/public/acl_login_logo.svg'
    },

    // Proteus remote auth (optional)
    proteus: {
        server: null,        // Proteus server URL
        access_key: null,    // API key
        realm_client: null   // App identifier
    }
}
```

## Routes

| Route | Method | Handler | Description |
|-------|--------|---------|-------------|
| `/login` | GET | `AclStatic#loginForm` | Show login form |
| `/login` | POST | `AclStatic#loginPost` | Process login |
| `/join` | GET | `AclStatic#joinForm` | Show registration |
| `/join` | POST | `AclStatic#joinPost` | Process registration |
| `/logout` | GET | `AclStatic#logout` | Logout user |

### Proteus Routes (when enabled)
| Route | Handler |
|-------|---------|
| `/segments/acl/proteus-login` | Show Proteus auth methods |
| `/acl/proteus/login/{authenticator}` | Start Proteus login |
| `/acl/proteus/verify` | Complete Proteus login |
| `/acl/proteus/poll` | Poll for login status |

## View Helper (acl.*)

Available in templates:

```ejs
<% if (acl.loggedIn) { %>
    Welcome, <%= acl.fullname %>!

    <% if (acl.hasPermission('admin')) { %>
        <a href="/admin">Admin</a>
    <% } %>
<% } %>
```

### Properties
- `acl.data` - Full user data from session
- `acl.loggedIn` - Boolean: user is authenticated
- `acl.username` - User's username
- `acl.firstname`, `acl.lastname` - Name parts
- `acl.fullname` - Combined full name
- `acl.handle` - Single display name

### Methods
- `acl.hasPermission(permission)` - Check permission
- `acl.getSetting(path)` - Get user setting

## Authentication Flow

### Standard Login
1. User submits username + password
2. Password verified with bcrypt
3. User document stored in session (`UserData`)
4. Optional persistent cookie created
5. Redirect to `redirect_url`

### Persistent Cookie
Cookie name: `acpl`
```javascript
// Cookie structure
{i: 'identifier', t: 'token'}
```

Auto-login middleware checks this cookie on each request.

### Proteus Login
1. Display authenticators from Proteus server
2. User selects method → redirected to Proteus
3. Poll for completion
4. Verify result & create local session

## Controller/Model Helpers

```javascript
// In controllers
const userId = this.getUserId();

// In conduits
const userId = conduit.getUserId();

// In models (static method)
const userId = this.getUserId();
```

## Session Management

```javascript
// Add user to session
await Plugin.addUserDataToSession(conduit, user);

// Update all sessions for a user (after profile change)
await Plugin.updateUserDataSessions(user);
```

Session key: `'UserData'`

## Permissions Editor Element

```html
<alchemy-permissions-editor name="permissions">
</alchemy-permissions-editor>
```

Table-based UI for editing permission arrays in forms.

## Bootstrap Initialization

1. Load Proteus client (if configured)
2. Create 'superuser' group (if missing) with `*` permission
3. Load all permission groups into cache
4. Create/verify admin user exists
5. Set up user data exposure to client

## Gotchas

1. **Password hashing:** Passwords are hashed on `beforeSave` with bcrypt (8-10 rounds)

2. **Session updates:** After modifying a user, call `updateUserDataSessions()` to refresh logged-in sessions

3. **Permission wildcards:** `*` grants everything, `articles.*` grants all under `articles`

4. **Group priority:** Direct permissions override group-inherited permissions

5. **Proteus optional:** Plugin works standalone; Proteus features only activate when configured

6. **Private fields:** Password field has `is_private: true` - excluded from client responses

7. **Superuser group:** Created automatically in bootstrap with slug `'superuser'`

8. **Middleware order:** `persistentLoginCheck` runs on each request before route handlers
