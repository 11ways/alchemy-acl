## 0.9.0 (WIP)

* Upgrade to alchemy v1.4.0

## 0.8.7 (2024-01-14)

* Show useful error when communication fails with proteus server
* Use correct displayfield for user models

## 0.8.6 (2023-10-17)

* Add proteus verification-error page (shown when a remote login fails)
* Decouple some of the proteus logic from the global settings

## 0.8.5 (2023-10-15)

* Fix proteus users not being found on login due to wrong field name
* Add remote-login with polling support for Proteus

## 0.8.4 (2023-10-05)

* Make login form images configurable
* Make the `Permissions` field inherit from `Field.Schema` & allow adding custom fields
* Add support for logging in with `Proteus` remote auth server
* Make `Conduit#notAuthorized()` use the `AclStatic` controller to render the login form

## 0.8.3 (2022-11-02)

* Add permission fields to chimera editor
* Make sure a user record has a password before trying to compare it
* Fix `Superuser` permission group not having any permissions by default
* Use `al-` prefix for custom elements
* Flatten the user's `permissions` property for the client-side

## 0.8.2 (2022-10-02)

* Add `hasPermission(permission)` method to AclHelper & Permissions class

## 0.8.1 (2022-08-25)

* Don't cast permissions twice

## 0.8.0 (2022-07-23)

* Add new Permissions system

## 0.7.4 (2022-07-06)

* Fix peerdependency version issue
* Add password field support for the alchemy-form plugin

## 0.7.3 (2022-05-31)

* Fix Chimera error in AclRule model

## 0.7.2 (2022-02-20)

* Move User's beforeSave logic to a method instead of an event
* Add title & description field to ACL Group model
* Move rule types into the Acl namespace

## 0.7.1 (2021-09-12)

* Fix `Conduit` methods not being set properly

## 0.7.0 (2020-12-10)

* Implement alchemy v1.1.3 fixes

## 0.6.0 (2020-07-21)

* Make compatible with Alchemymvc v1.1.0
* Don't re-hash bcrypted passwords
* Add `not_authorized_template` and `not_authorized_ajax_template` options
* Use regular acl/login template when auth attempt failed
* Pass `u` get parameter to join template
* Use $pk instead of _id
* Destroy session on logout
* Allow forcing user login during development with the `force_user_login` setting
* Don't query for `undefined` values, it doesn't work the same on all datasources
* Allow setting a redirect_url parameter to the logout route
* Remove fingerprint when logging out
* Upgrade bcrypt dependency to 4.0.1
* 

## 0.5.4 (2019-01-19)

* Add `Model#getUserId()` method to get the user id on either client- or server-side

## 0.5.3 (2018-12-06)

* Redesign login screen
* Set the `is_private` flag on the `User#password` field
* Set a default page title on the login screen

## 0.5.2 (2018-10-18)

* Fix setting the default password
* Remove stray `pr` call

## 0.5.1 (2018-07-04)

* Use `alchemy.getCache()` instead of `expirable` module

## 0.5.0 (2018-07-04)

* Make compatible with alchemy v1.0.0

## 0.4.0 (2017-08-27)

* Remove acpl cookie when logging out
* Show `acl/login_modal` when logging in over ajax
* Don't create `UserModel` when `custom_model` has been set