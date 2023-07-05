define(function(require) {

	var js = require("js/_js");
	var Method = require("js/Method");
	var Class = require("js/Class");
	var JsObject = require("js/JsObject");
	var Type = require("js/Type");
	var Property = require("js/referenceClass!./js/Property");
	var Enum = require("js/Enum");

	return js.mixIn(js, {
		Method: Method,
		Class: Class,
		Object: JsObject,
		Type: Type,
		Property: Property,
		Enum: Enum,

		cs: function() {
			return Method.getCallStack();
		},
		parse: function(str) {
			try {
				return JSON.parse(str);
			} catch(e) {
				return e;
			}
		}		
	});

});