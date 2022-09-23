# cavalion-js

Cavalion common JavaScript library. It consist of:

* Constructor class registration
* Console
* Data interfaces
* Design(er) package (in development)
* Utility Classes
* RequireJS plugins

# Installation

## Node

	$ npm install cavalion-js

## RequireJS

	require.config({ paths: { js: `${path-to-cavalion-js}/src/js`}})

	require("js");

# Class System

* [defineClass](src/js/:.js) - _basically a shortcut to Class.define with some sugar_
	* [JsObject](src/js/:.js) - _kind of super class_
		* [Method](src/js/:.js) - _hacking with functions_
	* [Class](src/js/:.js) - _Class.make() is where the meat is_
		* [extensions](src/js/:.js)
			* [mixIn](src/js/:.js)
		* [nameOf](src/js/:.js)
		* [Method](src/js/:.js)
		* [Type](src/js/:.js)

![20220915-014041-tAzlRV](https://raw.githubusercontent.com/relluf/screenshots/master/20220915-014041-tAzlRV.png)

# RequireJS plugins

* [json](src/:.js)
* [stylesheet](src/:.js)
* [script](src/:.js)
* [relscript](src/:.js)
* [text](src/:.js)


