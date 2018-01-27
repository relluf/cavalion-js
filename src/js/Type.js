define(["require", "module", "./mixIn", "./extensions"], function(require, module, Type) {

	function keys(obj) {
		var r = [];
		for(var k in obj) {
			r.push(k);
		}
		return r;
	}

	var types = {

			ARRAY: {
				"class": Array,
				defaultValue: []
			},

			BOOLEAN: {
				"class": Boolean,
				defaultValue: true,
				trueIdent: "true",
				falseIdent: "false"
			},

			CLASS: {
				"class": Object,
				defaultValue: null
			},

			DATE: {
				"class": Date,
				defaultValue: new Date(0)//{ nameOf: "DATE(null)" }
			},

			TIMESTAMP: {
				"class": Date,
				defaultValue: new Date(0)//{ nameOf: "DATETIME(null)" }
			},

			ENUM: {
				"class": Object,
				defaultValue: undefined//{ nameOf: "ENUM(null)" }
			},

			ERROR: {
				"class": Error,
				defaultValue: undefined
			},

			EVENT: {
				"class": Function,
				defaultValue: function() {}
			},

			FLOAT: {
				"class": Number,
				defaultValue: 0.0
			},

			CONSTRUCTOR: {
				"class": Function,
				defaultValue: function() {}//function() { /** null function */ }
			},

			FUNCTION: {
				"class": Function,
				defaultValue: function() {}//function() { /** null function */ }
			},

			INTEGER: {
				"class": Number,
				defaultValue: 0
			},

			JAVA_OBJECT: {
				"class": "",
				defaultValue: null
			},

			METACLASS: {
				"class": Object,
				defaultValue: null
			},

			NUMBER: {
				"class": Number,
				defaultValue: 0
			},

			OBJECT: {
				"class": Object,
				defaultValue: { }
			},

			PROTOTYPE: {
				"class": Object,
				defaultValue: { }
			},

			PACKAGE: {
				"class": Object,
				defaultValue: null
			},

			STRING: {
				"class": String,
				defaultValue: ""
			},

			TEXT: {
				"class": String,
				defaultValue: ""
			},

			TIME: {
				"class": Date,
				defaultValue: new Date(0)//{ nameOf: "TIME(null)" }
			},

			UNDEFINED: {
				"class": undefined,
				defaultValue: undefined
			} // nicely at the bottom ;-)
		};

		for(var k in types) {
			types[k].name = String.format("%s/Type.%s", module.id, k);
			//types[k].get = eval(String.format("({f:function() { return types.%s; }})", k)).f;
			types[k].get = function() {
                return types[k];
            };
		}

		return (Type = Type(types, {

			types: keys(types),

			/**
			 *
			 */
			byValue: function(value) {
				var type;

				try {
					type = typeof value;
				} catch(e) {
					return types.JAVA_OBJECT;
				}

				switch(type) {
					case "number":
						if(parseInt(value, 10) === parseFloat(value)) {
							return types.INTEGER;
						}
						return types.FLOAT;

					case "string":
						return types.STRING;

					case "boolean":
						return types.BOOLEAN;

					case "function":
						if(Class.isConstructor(value)) {
							return types.CONSTRUCTOR;
						}
						return types.FUNCTION;

					case "object":
						if(value instanceof Class) {
							return types.CLASS;
						} else if(value instanceof Date) {
							return types.TIMESTAMP;
						} else if(value instanceof Error) {
							return types.ERROR;
						} else	if(value instanceof Array) {
							return types.ARRAY;
						}

					return types.OBJECT;
				}

//				console.warn(String.format("returning UNDEFINED for %s", value));
				return types.UNDEFINED;
			},

			/**
			 *
			 */
			isCompatible: function(type, value) {
				var type2 = types.byValue(value);
				if(type === types.FLOAT && type2 === types.INTEGER) {
					return true;
				}
				return type === type2 || value === type.defaultValue;
			},

			/**
			 *
			 */
			isType: function(obj) {
				for(var k in types) {
					if(types[k] === obj) {
						return true;
					}
				}
				return false;
			}
		}));
});