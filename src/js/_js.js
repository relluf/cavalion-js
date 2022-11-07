define(function(require) {

	require("./extensions");

	const global = require("./global");
	const minify = require("./minify");
	const mixIn = require("./mixIn");
	const beautify = require("./beautify");
	const nameOf = require("./nameOf");
	const serialize = require("./serialize");
	const defineClass = require("./defineClass");

	const Method = require("./Method");
    const JsObject = require("./JsObject");

    const js_ctx_key = "[[js.ctx]]";
	const groupBy = (arr, key) => arr.reduce((a, o) => 
		((a[js.get(key, o)] || (a[js.get(key, o)] = []))
			.push(o), a), {});

	/*var js;*/
	return (js = {

		// handy-dandy
		inh: Method.callInherited,
		inherited: Method.callInherited,
		override: Method.override,
		connect: Method.connect,
		disconnect: Method.disconnect,
		args2strs: Method.args2strs,
		copy_args: Method.copy_args,
		
		$: JsObject.$,

		b: beautify,
		m: minify,
		n: nameOf,
		sj: JSON.stringify,//serialize.serialize,
		pj: JSON.parse,
		sf: String.format,
		nameOf: nameOf,
		defineClass: defineClass,
		mixIn: mixIn,
		groupBy: (arr, keys, mth) => {
			/*- groupBy: receives an array of objects and returns an object 
					which keys hold reference to the resulting groups.
			
				arr: array to be grouped by keys
				keys: array of strings, or comma-delimited string indicating the keys to group by
				mth: optional, callback receiving and returning each group
			*/

			if(!(keys instanceof Array)) {
				keys = keys.split(",");
			}

			var obj = groupBy(arr, keys.shift());
			
		    for (var k in obj) {
		    	var v = obj.hasOwnProperty(k) ? obj[k] : js.get(k, obj);
		        if (keys.length) {
		            obj[k] = js.groupBy(v, [].concat(keys), mth);
		        } else if (mth) {
		            obj[k] = mth(v);
		        }
		    }
			
			return obj;
		},
		
		ctx: function(obj, defaults) {
			return obj.hasOwnProperty(js_ctx_key) ? obj[js_ctx_key] : obj[js_ctx_key] = (obj[js_ctx_key] || defaults || {});
		},
		
		get: function(name, obj, defaultValue) {
			/**
			 *
			 * @param name
			 * @param obj
			 * @param defaultValue
			 * @returns
			 */
			var root = (obj = obj || global);
			if(typeof name === "string") name = name.split(".");
			
			for( var i = 0, l = name.length - 1; i < l; ++i) {
				obj = obj[name[i]];
				if(obj === null || obj === undefined || (typeof obj !== "object" && typeof obj !== "function")) {
					return defaultValue !== undefined ? js.set(name.join("."), defaultValue, root) : undefined;
				}
			}

			if(defaultValue !== undefined && obj[name[l]] === undefined) {
				return js.set(name.join("."), defaultValue, root);
			}

			return obj[name[l]];
		},
		set: function(name, value, obj) {
			/**
			 *
			 * @param name
			 * @param value
			 * @param obj
			 * @returns
			 */
			obj = obj || global;
			name = name.split(".");
			for( var i = 0, l = name.length - 1; i < l; ++i) {
				if(obj[name[i]] === undefined) {
					obj[name[i]] = {};
				}
				obj = obj[name[i]];
			}

			return (obj[name[name.length - 1]] = value);
		},
		normalize: function(base, uri, first) {
			/**
			 *
			 * @param base
			 * @param uri
			 * @param first
			 * @returns
			 */
			if(uri.charAt(0) === "/") {
				console.log(uri);
				// return uri.substring(1);
			} 
			 
			if(uri.charAt(0) !== ".") {
				return uri;
			}

			var r = base.split("/");
			r.pop();

			uri.split("/").forEach(function(part) {
				if(part === "..") {
					r.pop();
				} else if(part !== ".") {
					r.push(part);
				}
			});

			return r.join("/");
		},
		up: function(path, count) {
			/**
			 *
			 * @param path
			 * @param count
			 * @returns
			 */
			count = count || 1;
			path = path.split("/");
			while(count--) {
				path.pop();
			}
			return path.join("/");
		},
		extend: function(prototype, obj) {
			/**
			 *
			 * @param prototype
			 * @param obj
			 * @returns
			 */
			return js.mixIn(Object.create(prototype), obj);
		},
		forEach: function(obj, f, mustHaveOwnProperty) {
			/**
			 * @param obj
			 * @param f
			 * @param mustHaveOwnProperty
			 */
			for( var k in obj) {
				if(mustHaveOwnProperty === false || obj.hasOwnProperty(k)) {
					var value = obj[k];
					if((value = f(value)) !== undefined) {
						return value;
					}
				}
			}
		},
		keys: function(obj, mustHaveOwnProperty) {
			/**
			 *
			 * @param obj
			 * @returns {Array}
			 */
			var r = [];
			for( var k in obj) {
				if(mustHaveOwnProperty !== true || obj.hasOwnProperty(k)) {
					r.push(k);
				}
			}
			return r;
		},
		trim: function(obj) {
			for(var k in obj) {
				if(obj[k] === undefined) delete obj[k];
			}
			return obj;
		},

		obj2kvp: function(dict, path, r) {
			/*- converts an object 'dictionary' to key/value-pairs
				TODO describe structure of @dict -*/
			r = r || {}; path = path || [];
			for(var key in dict) {
				var obj = dict[key];
				path.push(key);
				if(obj === ".") {
					/*- TODO implement (relative) references */
					obj = path[0];
				}
				if(!(obj instanceof Array || obj instanceof Date) && typeof obj === "object") {
					js.obj2kvp(obj, path, r);
				} else {
					// console.log(path.join(""), obj);
					r[path.join("")] = obj;
				}
				path.pop();
			}
			return r;
		},

		values: function(obj) {
			var arr = [];
			for(var k in obj) {
				arr.push(obj[k]);
			}
			return arr;
		},
		str2obj: function(str) {
			/**
			 *
			 */
			var attrs = str.split(";");
			var obj = {};
			for( var i = 0, l = attrs.length; i < l; ++i) {
				if(attrs[i].indexOf(":") !== -1) {
					var kv = attrs[i].split(":");
					var key = String.trim(kv[0]);
					var value = String.trim(kv[1]);
					obj[key] = value;
				} else if(attrs[i].length) {
					obj[attrs[i]] = true;
				}
			}
			return obj;
		},
		clone: function(obj) {
			/**
			 *
			 * @param obj
			 * @returns {___anonymous2972_2973}
			 */
			var o = {};
			for( var k in obj) {
				if(obj[k] !== null && typeof obj[k] === "object") {
					o[k] = js.clone(obj[k]);
				} else {
					o[k] = obj[k];
				}
			}
			return o;
		},
		equals: function(obj1, obj2, recursive) {
			/**
			 *
			 */
			if(obj1 === obj2) {
				// console.log("===");
				return true;
			}

			if(obj1 instanceof Date) {
				if(obj2 instanceof Date) {
					// console.log("Date.prototype.getTime()");
					return obj1.getTime() === obj2.getTime();
				}
				return false;
			}

			var t1 = typeof obj1;
			var t2 = typeof obj2;

			if(t1 !== t2) {
				// console.log("types differ");
				return false;
			}

			if(obj1 === undefined || obj1 === null || obj2 === undefined || obj2 === null) {
				// console.log("typeof null");
				return false;
			}

			if(t1 === "function") {
				// console.log("function");
				return recursive !== true && obj1.toString() === obj2.toString();
			}

			if(t1 === "object") {

				if(t1.length !== t2.length) {
					// console.log("array or object, length must the same");
					return false;
				}

				var keys = js.keys(obj1);
				if(keys.length !== js.keys(obj2).length) {
					// console.log("keys differ");
					return false;
				}

				for( var v in obj2) {
					if(obj2.hasOwnProperty(v)) {
						var value1 = obj1[v];
						if(value1 !== undefined || keys.indexOf(v) !== -1) {
							var value2 = obj2[v];
							if(value1 !== value2 && (recursive !== true || !js.equals(value1, obj2[v], true))) {
								// console.log(String.format("%s differs", v));
								return false;
							}
						} else {
							// console.log(String.format("%s missing", v));
							return false;
						}
					}
				}
				return true;
			}

			// console.log("types are the same, but values differ");
			return false;
		},
		d: function(deferred, callback, errback, option) {
			/**
			 *
			 * @param deferred
			 * @param callback
			 * @param errback
			 */
			if(typeof errback === "string") {
				option = errback;
				errback = undefined;
			}
			if(callback) {
				if(!errback) {
					if(option === "both") {
						deferred.addBoth(callback);
					} else {
						deferred.addCallback(callback);
					}
				} else {
					deferred.addCallbacks(callback, errback);
				}
			} else if(errback) {
				deferred.addErrback(errback);
			}
			return deferred;
		},
		setTimeout: function(f, ms) {
			/**
			 *
			 * @param f
			 * @param ms
			 * @returns
			 */
			return window.setTimeout(f, ms);
		},
		clearTimeout: function(id) {
			/**
			 *
			 * @param id
			 * @returns
			 */
			return window.clearTimeout(id);
		},
		waitAll: function(/* ... */) {
			return Promise.all(js.copy_args(arguments).flat().map(p => {
				if(typeof p === "string" && p.endsWith("ms")) { // for syntax/code that says it all
					return new Promise(resolve => setTimeout(resolve, parseInt(p, 10)));
				} else if(typeof p === "number") { // ok, we'll do this too ;-)
					return new Promise(resolve => setTimeout(resolve, p));
				} else if(!(p instanceof Promise)) {
					throw new Error("Can not wait for", p);
				}
				return p;
			}));
		},	});
});