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