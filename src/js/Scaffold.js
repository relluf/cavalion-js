define(function(require) {

	var Scaffold = require("js/defineClass");
	var mixInRecursive = require("js/mixInRecursive");

	return (Scaffold = Scaffold(require, {

		statics: {
			all: [],
			runtime: {},
			defaults: {},

			load: function(name, parentRequire, load, config) {
				/** @overrides http://requirejs.org/docs/plugins.html#apiload */
				parentRequire(["scaffold"], function(scaffold) {
					scaffold = new Scaffold(scaffold);
					if(name !== "") {
						scaffold = new Scaffold(scaffold.get(name));
					}
					load(scaffold);
				}, function() {
					console.warn("scaffold.js not available, assuming Scaffold.defaults", Scaffold.defaults);
					load(new Scaffold(Scaffold.defaults));
				});
			}
		},

		prototype: {

			_dict: null,
			_context: null,

			constructor: function(dict, context) {
				Scaffold.all.push(this);
				if(dict instanceof Scaffold) {
					console.trace("Yes it happens...");
					dict = dict._dict;
				}
				this._dict = dict;
				this._context = context;
			},
			get: function() {
				/**- get */
				var r;
				for(var i = 0; i < arguments.length && r === undefined; ++i) {
					var namePath = this.np(arguments[i]); /*- parse context */
					if(typeof(r = this.g([].concat(namePath), this._dict)) === "function") {
						// console.log(arguments[0]);
						r = r(this._context, namePath.join("."), this);
					}
					js.set(namePath.join("."), r, Scaffold.runtime);
					//Scaffold.runtime[namePath.join(".")] = r;
				}
				return r;
			},
			getf: function() {
				/**- get formatted, pass arguments to String.format to obtain namePath for get() */
				return this.get(String.format.apply(String, arguments));
			},
			getObject: function(prefix, keys) {
				/**- get a whole object */
				var obj = {};

				if(typeof keys === "string") {
					keys = keys.split(",");
				}

				keys.forEach(function(key) {
					obj[key] = this.getf("%s.%s", prefix, key);
				}, this);
				return obj;
			},
			np: function(namePath) {
				namePath = namePath.split(".");
				namePath.forEach(function(name, i) {
					if(name.charAt(0) === "%") {
						namePath[i] = js.get(
								name.substring(1).replace(/\//g, "."),
								this._context);
					}
					return namePath;
				}.bind(this));
				return namePath;
			},
			g: function(namePath, obj) {
				/**- g, internal get method */
				var namep = namePath.join(".");

				while(obj !== undefined && typeof obj === "object" && namePath.length) {
					var name = namePath.shift();
					var keys = undefined;

					for(var key in obj) {
						if(key === name) {
							if(typeof obj[key] === "object" && !(obj[key] instanceof Array)) {
								keys = keys || {};
								mixInRecursive(keys, obj[key]);
							} else {
								keys = obj[key];
							}
						} else if(obj.hasOwnProperty(key) && key.charAt(0) === "/") {
							//regexp key, skip slash (first char)
							var re = new RegExp(key.substring(1));
							if(re.exec(name) !== null) {
								if(typeof obj[key] === "object") {
									keys = keys || {};
									mixInRecursive(keys, obj[key], true, false);
								} else {
									keys = obj[key];
								}
							}
						}
					}
					obj = keys;
				}

				return obj;
			}

		}

	}));
});