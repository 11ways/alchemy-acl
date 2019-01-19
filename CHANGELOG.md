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