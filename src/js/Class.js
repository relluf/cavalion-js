define(function(require) {

	require("./extensions");

	var mixIn = require("./mixIn");
	var nameOf = require("./nameOf");
	var Method = require("./Method");
	var Type = require("./Type");

	var classObjKeyName = "@class obj";
	var classKeyName = "class";
	var classMap = {};

	/**
	 * Register method for instances of Class.defin(e)itions
	 */
	nameOf.methods.push(function(obj) {
		if(obj instanceof Function && (obj = obj[classObjKeyName]) !== undefined) {
			return obj.name;
		}
	});

	/**
	 *
	 */
	function getDefaultInherits() {
		if(classMap["js/JsObject"] === undefined) {
			console.log("JsObject not defined!");
            require(["js/JsObject"], function(JsObject) {
                console.log("JsObject defined", classMap["js/JsObject"] === JsObject);
            });
		}
		return classMap["js/JsObject"];
	}

	/**
	 * toString implementation for constructors
	 */
	function classConstructorToString() {
		if(this.hasOwnProperty(classObjKeyName)) {
			return String.format("function %s() { [constructor code] }", this[classObjKeyName].name);
		}
		return Function.prototype.toString.apply(this, arguments);
	}

	/**
	 * This is Chrome specific (as far as I know). It will show fancy names for
	 * object instances in the console.
	 */
	function namedFunction(name, f) {
		var symbol;
		var g = f, fname = f.name;
		
		f = f.toString();
		name = name.split(".");
		if(name.length > 1) {
			symbol = name.shift();
			name = name.join(".");
		} else {
			symbol = "$";
			name = name[0];
		}

		if(fname === "") {
			// FIXME f.replace below should be a centralized method to replace illegal function name chars
			f = String.format("function %s()%s", 
				name.split("/").pop().replace(/\-/g, "_").replace(/\./g, "_"),
				f.substring(f.indexOf("{")));
		}

		try {
			symbol = symbol.replace(/\//g, "_");
			name = name.replace(/\-/g, "_");
			return eval(String.format("(function() { var %s = {'%s': (%s)}; return %s['%s'];})();",
					symbol, name, f, symbol, name));
		} catch (e) {
			console.error(e.message, e);
			return g;
		}
		return f;
	}

	/**
	 * Create a constructor function used for instances of Class.defin(e)itions
	 *
	 * @returns {Function}
	 */
	function createConstructor(name) {
		return namedFunction(name || "AnonymousClass", function() {
			/**
			 * js/Class.constructor: This constructor inspects it's classObj in
			 * order to determine which constructor should be called
			 */
			var classObj = arguments.callee[classObjKeyName];
			if(classObj) {
				if(classObj.implicitConstructorCall === false) {
					if(classObj.hasOwnProperty("constructor")) {
						var args = Array.prototype.slice.apply(arguments, [0]);
						// pass on inherits as last parameter (FIXME should/can
						// length be taken into account?)
						args.concat(classObj.inherits);
						classObj.constructor.apply(this, args);
					}
				} else {
					if(classObj.hasOwnProperty("inherits")) {
						classObj.inherits.apply(this, arguments);
					}
					if(classObj.hasOwnProperty("constructor")) {
						classObj.constructor.apply(this, arguments);
					}
				}
			}
		});
	}

	var Class = {

		Type: Type,

		/**
		 * @overrides http://requirejs.org/docs/plugins.html#apiload
		 */
		load: function(name, parentRequire, load, config) {
			load(classMap[name] || Class.create(name));
		},

		/**
		 *
		 */
		define: function(localRequire, classObj, overwrite) {
			var name = localRequire("module").id;
			var cls = classMap[name];
			if(overwrite || !cls) {
			    cls = Class.create(name);
			}
			return cls.define(classObj);
		},
		
		/**
		 *
		 */
		reference: function(name) {
			return classMap[name] || this.create(name);
		},

		/**
		 *
		 * @param name
		 * @param f
		 * @returns
		 */
		create: function(name, f) {
			var cls = (classMap[name] = createConstructor(name));
			var classObj = Object.create({}, {
				name: {
					value: name
				}
			});
			cls.define = function(classObjEx) {
				/**
				 * Once this method is called, it will delete itself. It was
				 * basically syntaxic sugar, together with possibility to define
				 * the class using itself (the other keys like inherits,
				 * prototype, etc). All the definitions are moved to the
				 * classObj.
				 */
				delete this.define;
				mixIn(classObj, classObjEx, true);
				return Class.make(classObj, cls);
			};

			return typeof f === "function" ? f(cls) : cls;
		},

		/**
		 * 'Makes' (by lack of better name and the fact that create and define
		 * are already taken) the class specified by classObj and ctor
		 *
		 * @param classObj
		 * @param ctor
		 * @returns {Function} Constructor function
		 */
		make: function(classObj, ctor) {
			if(classObj.hasOwnProperty("prototyqe")) {
				// TODO deprecated
				console.warn("prototyqe will be deprecated");
				classObj.prototype = classObj.prototyqe;
			}

			classObj.inherits = classObj.inherits || getDefaultInherits();

			var proto = classObj.prototype || {};
			var superproto = classObj.inherits.prototype;
			var k;

			if(typeof ctor !== "function") {
				ctor = createConstructor();
			}

			ctor[classObjKeyName] = classObj;
			ctor.toString = classConstructorToString;
			ctor.prototype = Object.create(superproto);
			ctor.prototype.constructor = ctor;

			for(k in proto) {
				if(proto.hasOwnProperty(k)) {
					if(k !== "constructor") {
						if(typeof (ctor.prototype[k] = proto[k]) === "function" && k.indexOf("_") !== 0) {
							if(typeof superproto[k] === "function") {
								Method.setInherited(proto[k], superproto[k]);
							}
							//Method.setName(proto[k], classObj.name + ".prototype." + k);
							if(classObj.traceProtoMethods !== false) {
								//Method.trace(proto, k);
							}
							proto[k][classKeyName] = ctor;
						}
					} else {
						classObj.constructor = proto[k];
					}
				}
			}

			// FIXME setName/inherited?
			for(k in classObj.statics) {
				if(classObj.statics.hasOwnProperty(k)) {
					ctor[k] = classObj.statics[k];
					//Method.setName(ctor[k], classObj.name + "." + k);
					if(classObj.traceStaticMethods !== false) {
						//Method.trace(ctor, k);
					}
				}
			}
			
			// for(k in classObj.properties) {
			// 	var prop = classObj.properties[k];
			// 	if(k.indexOf("on") === 0 && k.charAt(2) >= 'A' && k.charAt(2) <= 'Z') {
			// 		if(!prop.hasOwnProperty("set")) {
						
			// 		}
			// 	}
			// }

			classObj.properties = classObj.properties || {};
			classObj['parse-properties'] = true;

			return ctor;
		},

		/**
		 *
		 * @param obj
		 */
		getProperties: function(obj) {
			if(Class.isConstructor(obj)) {
				var classObj = Class.getClassObj(obj);
				if(classObj.hasOwnProperty("parse-properties")) {
					delete classObj['parse-properties'];

					var props = classObj.properties;
					for(var k in props) {
						if(props.hasOwnProperty(k)) {
							props[k] = new ((require)("js/" + "Property"))(obj, k, props[k]);
						}
					}

					var prototype = Class.getProperties(classObj.inherits);
					classObj.properties = mixIn(Object.create(prototype), classObj.properties);
				}
				return classObj.properties;
			}
			return {};
		},

		/**
		 *
		 * @param obj
		 * @returns {Boolean}
		 */
		isConstructor: function(obj) {
			return obj && obj[classObjKeyName] ? classMap[obj[classObjKeyName].name] === obj : false;
		},

		/**
		 *
		 * @param ctor
		 */
		getClassObj: function(ctor) {
			if(Class.isConstructor(ctor)) {
				return ctor[classObjKeyName];
			}
		},

		/**
		 *
		 * @param ctor
		 * @returns
		 */
		getSuperClass: function(ctor) {
			if(Class.isConstructor(ctor)) {
				return ctor[classObjKeyName].inherits;
			}
		}
	};

	return Class;
});
