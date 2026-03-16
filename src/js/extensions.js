define(function(require) {

//	var nameOf = require("./nameOf");
	var mixIn = require("./mixIn");

	// RequireJS stuff, needed for make/Build
	(function() {
		var ctx = requirejs.s.contexts._;
		var inh = ctx.completeLoad;
		ctx.modulesLoaded = [];
		ctx.completeLoad = function(moduleName) {
			// console.log(moduleName);
			ctx.modulesLoaded.push(moduleName);
			//console.log(moduleName);
			return inh.apply(this, arguments);
		};
	}());

	Error.chain = function(e, cause) {
		return mixIn(e, { cause: cause });
	};

	// if(Array.prototype.indexOf === undefined) {

	// 	/**
	// 	 *
	// 	 * @param element
	// 	 * @returns {Number}
	// 	 */
	// 	Array.prototype.indexOf = function(element) {
	// 		for(var i = 0, l = this.length; i < l; ++i) {
	// 			if(this[i] === element) {
	// 				return i;
	// 			}
	// 		}
	// 		return -1;
	// 	};
	// 	//console.debug("Array.prototype.indexOf declared");
	// }
	// if(Array.prototype.forEach === undefined) {
	// 	var thiz = this;

	// 	/**
	// 	 *
	// 	 * @param f
	// 	 * @param this_
	// 	 */
	// 	Array.prototype.forEach = function(f, this_) {
	// 		for(var i = 0, l = this.length; i < l; ++i) {
	// 			f.apply(this_ || thiz, [this[i], i, this]);
	// 		}
	// 	};
	// 	//console.debug("Array.prototype.forEach declared");
	// }
	// if(Array.prototype.remove === undefined) {

	// 	/**
	// 	 *
	// 	 * @param obj
	// 	 * @returns
	// 	 */
	// 	function remove(obj) {
	// 		var i = this.indexOf(obj);
	// 		return i !== -1 ? this.splice(i, 1)[0] : undefined;
	// 	}

	// 	if(Object.create) {
	// 		Array.prototype = Object.create(Array, {
	// 			remove: {
	// 				value: remove
	// 			}
	// 		});
	// 	} else {
	// 		Array.prototype.remove = remove;
	// 	}
	// 	console.debug("Array.prototype.remove declared");
	// }
	// if(Array.prototype.last === undefined) {
	// 	Array.prototype.last = function() {
	// 		return this[this.length - 1];
	// 	};
	// }
	// if(Array.prototype.first === undefined) {
	// 	Array.prototype.first = function() {
	// 		return this[0];
	// 	};
	// }
	
	Array.as = function(arrObjOrNull) {
		if(arrObjOrNull instanceof Array) {
			return arrObjOrNull;
		}
		if(arrObjOrNull === null || arrObjOrNull === undefined) {
			return arrObjOrNull;
		}
		return [arrObjOrNull];
	};
	Array.move = function(array, oldIndex, newIndex) {
		/**
		 *
		 * @param array
		 * @param oldIndex
		 * @param newIndex
		 * @returns
		 */
		var arr = [].concat(array);
		var item = arr.splice(oldIndex, 1)[0];
		before = arr.splice(0, newIndex);
		return before.concat([item]).concat(arr);
	};
	Array.fn = {
		nonNil(item) { return item !== null && item !== undefined; },
		nonNull(item) { return item !== null },
		truthy(item) { return !!item; },
		falsy(item) { return !item; },
		unique(item, index, array) { return array.indexOf(item) === index; },
		// sort()
	};
	
	
	if (!Array.sortValues) {
	
		// Define priority for type-based sorting
		const TYPE_ORDER = {
			'undefined': 0,
			'null': 1,
			'boolean': 2,
			'number': 3,
			'string': 4,
			'object': 5,
			'function': 6,
			'symbol': 7,
		};
	
const stringify = (obj) => {
	try {
		return Object.entries(obj)
			.map(e => js.sf("%s=%n", e[0], js.nameOf(e[1], "compare")))
			.join(";");
	} catch (err) {
		console.warn("stringify error:", err, obj);
		return String(obj);
	}
};
		
		const retval = (n) => n < 0 ? -1 : n > 0 ? 1 : 0;

		// Generalized sort function with type-aware ordering
		Array.sortValues = function generalizedSort(a, b) {
			if (Array.onSortValues) return Array.onSortValues(a, b);
	
			const typeA = a === null ? 'null' : typeof a;
			const typeB = b === null ? 'null' : typeof b;
			
			if(a instanceof Array && b instanceof Array) {
				return a.length - b.length;
			}
	
			// Sort by type priority if types differ
			if (TYPE_ORDER[typeA] !== TYPE_ORDER[typeB]) {
				return retval(TYPE_ORDER[typeA] - TYPE_ORDER[typeB]);
			}
	
			// Sort within same type
			switch (typeA) {
				case 'boolean':
				case 'number':
					return retval(a - b);
				case 'string':
					return a.localeCompare(b);
				case 'null':
				case 'undefined':
					return 0;
				case 'object':
					return stringify(a).localeCompare(stringify(b));
				default:
					console.warn("Unhandled type in sortValues:", typeA);
					return 0;
			}
		};
	}

	if (typeof String.prototype.startsWith !== 'function') {
	    String.prototype.startsWith = function(s) {
	        return this.indexOf(s) === 0;
	    };
	}
	if (typeof String.prototype.endsWith !== 'function') {
	    String.prototype.endsWith = function(s) {
	        return this.indexOf(s, this.length - s.length) !== -1;
	    };
	}

	if(String.of === undefined) {
		String.of = function(obj) {
			return obj && obj.toString();
		};
	}

	String.camelize = function(str) {
		/**
		 *
		 * @param str
		 * @returns
		 */
		return str.substring(0, 1).toUpperCase() + str.substring(1);
	};
	String.decamelize = String.decamelcase = function(s) {
		var r = s.charAt(0), i = 0, ch = r;
		while(++i < s.length) {
			if(ch === undefined || ((ch < 'A' || ch > 'Z') || (ch < '0' && ch > '9'))) {
				ch = s.charAt(i);
				if((ch >= 'A' && ch <= 'Z')) {// || (ch >= '0' && ch <= '9')) {
					r += " ";
				}
			} else {
				ch = s.charAt(i);
			}
			r += ch;
		}
		return r.toLowerCase();
	};
	String.escape = function (s) {
		return JSON.stringify(s).slice(1, -1);
		/**
		 *
		 * @param s
		 * @returns
		 */
		// return ('"' + s.replace(/(["\\])/g, '\\$1') + '"').
		// 	replace(/[\f]/g, "\\f").
		// 	replace(/[\b]/g, "\\b").
		// 	replace(/\n/g, "\\n").
		// 	replace(/[\t]/g, "\\t").
		// 	replace(/[\r]/g, "\\r");
	};
	String.unescape = (escapedString) => JSON.parse(`"${escapedString}"`);
	String.escapeHtml = function(s) {
		/**
		 *
		 * @param s
		 * @returns
		 */
		return s && s.replace ? s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : s;
	};
	String.unescapeHtml = function(s) {
		/**
		 *
		 * @param s
		 * @returns
		 */
		return s && s.replace ? s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">") : s;
	};
	String.trim = function(str) {
		/**
		 *
		 * @param str
		 * @returns
		 */
		return str.replace(/\s+$/, "").replace(/^\s+/, "");
	};
	String.toJS = function(s) {
		/**
		 *
		 * @param s
		 * @returns
		 */
		return String.format("%s", s);
	};
	String.split = function(str, on, escape) {
		/**
		 *
		 * @param str
		 * @param on
		 * @param escape
		 * @returns {Array}
		 */
		var r = [];
	    var s = "";
	    var c;
	    var b = false;

	    if(escape === undefined) {
	    	escape = "\\a".charAt(0);
	    }

	    for (var i = 0, l = str.length; i < l; ++i) {
	        c = str.charAt(i);
	        if (b === true) {
	            s += c;
	            b = false;
	        } else if (c === on) {
	            r.push(s);
	            s = "";
	        } else if (c === escape) {
	            b = true;
	        } else {
	            s += c;
	        }
	    }
	    r.push(s);
	    return r;
	};
	String.format = function(fmt/*, ... */) {
		/**
		 *
		 * @param fmt
		 * @returns
		 */
		var s = [];
		var idx = -1, pos = 0;
		var argi = 1;
		var specifiers = "cdfsHn";
	
		do {
			idx = fmt.indexOf("%", ++idx);
	
			if(idx !== -1) {
				if(fmt.charAt(idx + 1) === "%") {
					s.push(fmt.substring(pos, idx));
					s.push("%");
					idx++;
					pos = idx + 1;
				} else {
					s.push(fmt.substring(pos, idx));
	
					var mod = "";
					var ch = fmt.charAt(idx + 1);
	
					while(specifiers.indexOf(ch) === -1 && ch !== "") {
						mod += ch;
						idx++;
						ch = fmt.charAt(idx + 1);
					}
	
					if(ch === "c") {
						if(mod === "*") {
							var n = arguments[argi++];
							while(n--) {
								s.push(arguments[argi]);
							}
							argi++;
						} else {
							s.push(arguments[argi++]);
						}
	
					} else if(ch === "d") {
						var n = parseInt(arguments[argi++], 10);
						var value = "" + n;
	
						if(mod.length) {
							var len;
	
							if(mod.charAt(0) === "0") {
								len = parseInt(mod.substring(1), 10) || 0;
	
								if(value.charAt(0) === "-") {
									while(value.length < len) {
										value = "-0" + value.substring(1);
									}
								} else {
									while(value.length < len) {
										value = "0" + value;
									}
								}
							} else {
								len = parseInt(mod, 10) || 0;
								while(value.length < len) {
									value = " " + value;
								}
							}
						}
	
						s.push(value);
	
					} else if(ch === "f") {
						var parts = mod.split(".");
						var raw = Number(arguments[argi++]);
	
						if(parts.length === 2 && !isNaN(raw)) {
							var widthSpec = parts[0];
							var precision = parseInt(parts[1], 10);
							if(isNaN(precision)) {
								precision = 0;
							}
	
							var negative = raw < 0 || (raw === 0 && 1 / raw < 0);
							var abs = Math.abs(raw);
							var fixed = abs.toFixed(precision);
							var out = negative ? "-" + fixed : fixed;
	
							if(widthSpec.length) {
								var width;
	
								if(widthSpec.charAt(0) === "0") {
									width = parseInt(widthSpec.substring(1), 10) || 0;
	
									if(out.charAt(0) === "-") {
										while(out.length < width) {
											out = "-0" + out.substring(1);
										}
									} else {
										while(out.length < width) {
											out = "0" + out;
										}
									}
								} else {
									width = parseInt(widthSpec, 10) || 0;
									while(out.length < width) {
										out = " " + out;
									}
								}
							}
	
							s.push(out);
						} else {
							s.push(arguments[argi - 1]);
						}
	
					} else if(ch === "s" || ch === "H" || ch === "n") {
						var value;
						var len;
	
						if(ch === "n") {
							value = String.of(arguments[argi++]);
						} else {
							value = "" + arguments[argi++];
						}
	
						if(mod.charAt(0) === "-") {
							len = parseInt(mod.substring(1), 10) || 0;
							while(value.length < len) {
								value += " ";
							}
						} else {
							len = parseInt(mod, 10) || 0;
							if(mod === "*") {
								len = parseInt(value, 10);
								value = "" + arguments[argi++];
							}
							while(value.length < len) {
								value = " " + value;
							}
						}
	
						if(ch === "H" && value) {
							try {
								value = String.escapeHtml(value);
							} catch(e) {
								value = e.message;
							}
						}
	
						s.push(value);
	
					} else {
						s.push(arguments[argi++]);
					}
	
					pos = idx + 2;
				}
			}
		} while(idx !== -1);
	
		s.push(fmt.substring(pos));
		return s.join("");
	};

/*--- Math */

	// @see https://stackoverflow.com/questions/11695618/dealing-with-float-precision-in-javascript
	var _cf = (
		function() {
			function _shift(x) {
				var parts = x.toString().split('.');
				return (parts.length < 2) ? 1 : Math.pow(10, parts[1].length);
			}
			return function() { 
				return Array.prototype.reduce.call(arguments, (prev, next) => { 
					return prev === undefined || next === undefined 
							? undefined : Math.max(prev, _shift(next)); 
					}, -Infinity);
			};
		})();
	
	Math.a = function () {
		var f = _cf.apply(null, arguments); if(f === undefined) return undefined;
		function cb(x, y, i, o) { 
			return x + f * y; 
		}
		return Array.prototype.reduce.call(arguments, cb, 0) / f;
	};
	Math.s = function(l, r) { 
		var f = _cf(l, r); 
		return (l * f - r * f) / f; 
	};
	Math.m = function() {
		var f = _cf.apply(null, arguments);
		function cb(x, y, i, o) { 
			return (x*f) * (y*f) / (f * f); 
		}
		return Array.prototype.reduce.call(arguments, cb, 1);
	};	
	Math.d = function(l, r) { 
		var f = _cf(l, r); 
		return (l * f) / (r * f); 
	};
	Math.f = (n, d) => {
		if(!isNaN(n)) {
			var r = String(n), i, dot = r.indexOf(".");
			
			n = parseFloat(n);
			
			if((i = r.indexOf("0000")) > dot) {
				var t = n.toFixed(i - dot - 1);
				if(t === "0" && n > 0) return n;
				return t;
			}
			if((i = r.indexOf("9999")) > dot) {
				return n.toFixed(i - dot - 1);
			}
			
			if(d) {
				return n.toFixed(d).replace(/0*$/, "").replace(/\.$/, "");
			}
		}			
		return n;
	};
	Math.f_= (value, regexps) => {
		if(value === undefined || value === null) return null;
		
		regexps = regexps || [/0000+.$/, /9999+.$/];

		value = value.toString();
		regexps.forEach(re => value = value.replace(re, ""));

		return parseFloat(value);
	};


/*--- */

	Date.getWeekNumber = function(dt){
	    dt = new Date(+dt);
	    dt.setHours(0, 0, 0);
	    dt.setDate(dt.getDate() + 4 - (dt.getDay() || 7));
	    return Math.ceil((((dt - new Date(dt.getFullYear(), 0, 1))
	    		/ 8.64e7) + 1) / 7);
	};
	Date.format = function (dt, fmt) {
		if(!(dt instanceof Date)) {
			dt = new Date(dt);
		}
		const formatter = Date.format.formats[fmt];
		
		if(typeof formatter === "function") {
			return formatter(dt, fmt);
		}
		
		return "unknown format " + fmt + " (" + dt.toISOString() + ")";
	};
	Date.format.formats = {
		'YYYY/MM/DD hh:mm': (dt, fmt) => js.sf("%d/%02d/%02d %02d:%02d", 
				dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), 
				dt.getHours(), dt.getMinutes()),
		'YYYY/MM/DD': (dt, fmt) => js.sf("%d/%02d/%02d", 
				dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
	};

});