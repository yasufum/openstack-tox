# openstack-tox

## Features

A helper extension tool for developing OpenStack, mainly focusing on tacker
currently.

This is a trial project, so you don't use it without testing purpose.

## Requirements

* Install Tacker on devstack env.

## Extension Settings

Nothing now.

## Known Issues

## Release Notes

### 0.0.1

Support basic jobs of tox.

### 0.0.2

Improve debugging features.

### 0.0.7

* Update default python version from 3.8 to 3.10.
* Fix a test path given to tox command should be separated with "--" on a command line.
* Fix some other bugs.

### 0.0.8

* Support other than tacker for debugging.

### 0.0.9

* Add `JustMyCode: false` option in debug configuration to enable debugging libs.

### 0.0.10

* Fix wrong `JustMyCode` to `justMyCode`.

### 0.0.11

* Fix missing `justMyCode` in openstack-tox.debug-unittest.
