define(function(require) {

	var js = require("js");
	var locale_base = "locales/";

	/*- Locale (computer software), a set of parameters that defines the user's language, region and any special variant preferences that the user wants to see in their user interface. Usually a locale identifier consists of at least a language identifier and a region identifier. -- https://en.wikipedia.org/wiki/Locale
	*/
	/*- TODO
	
		require("locale!du-NL");
		var locale = require("locale");
		locale.set("du-NL");
	*/

	function locale(id) {
    	var loc = locale.loc;//arguments.callee.loc;
    	
    	if(id === undefined || locale[loc] === undefined) {
    		return "{{" + id + "}}";
    	}
    	
    	if(id instanceof RegExp) {
    		var m = [], match;
    		for(var k in locale[loc]) {
    			if((match = id.exec(k)) !== null && match.length > 0) {
    				if(m.indexOf(match[0]) === -1) {
    					m.push(match[0]);
    				}
    			}
    		}
    		return m;
    	}
    	
    	if(locale.slashDotRepl === true) {
    		id = id.replace(/\/\./g, "#");
    	}

    	function resolve(id) {
    		if(id === undefined) debugger;

var began;    		
if((began = locale.debug)) {
	console.group("locale-resolve", id);
}
try {
	
			/*- Find in the dictionary */
	    	var r = window.locale[loc][id], i, nid, dash = id.indexOf("-"), dot = id.indexOf(".");
	    	var preferdash = (dot === -1 || dot > dash);
	    	
	    	if(r === undefined && dash !== -1 && preferdash) {
				/*- Not found, insert star and try again become a star and try again 
					eg. Project-customer.title --> *-customer.title */
				i = 0, nid = id.split("-");
				while(nid[i] === "*" && i < nid.length - 1) {
					i++;
				}
				if(i < nid.length && nid[i] !== "*") {
					nid[i] = "*";
					r = resolve(nid.join("-").replace(/\*\-\*/g, "*"));
				}
	    	}
			if(r === undefined && dot !== -1) {
				if(dash !== -1 && preferdash) {
					/*- Not found, let last part fall off and try again 
						eg. Project-customer.title --> Project-customer */
					nid = id.split("."); nid.pop();
					r = resolve(nid.join("."));
				} else {
					/*- Not found, insert star and try again become a star and try again 
						eg. customer.title --> *.title */
					i = 0, nid = id.split(".");
					while(nid[i] === "*" && i < nid.length - 1) {
						i++;
					}
					if(i < nid.length && nid[i] !== "*") {
						nid[i] = "*";
						r = resolve(nid.join("."));
					}
					if(r === undefined) {
						nid = id.split("."); nid.pop();
						r = resolve(nid.join("."));
					}
				}
			}
			
	/*- TODO Still not found, split by / delimiter and replace by star and try again */
	
			/* FR: reference other locale with double colon */
			if(typeof r === "string") {
				if(r.charAt(0) === "\\") {
					r = r.substring(1);
				}
				if(r.charAt(0) === ":" && r.charAt(1) === ":") {
					try {
						r = locale(r.substring(2));
					} catch(e) {
						r = "{" + r + "}: " + e.message;
					}
				}
			}
	
			return r;
} finally {
	if(began) {
		console.groupEnd();
	}
}
    	}
    	
    	var r = resolve(id);
		if(r === undefined) {
    		var arr = (window.locale.missing = (window.locale.missing || []));
    		arr.push(id);
        	// console.warn("undefined locale: " + id);
        	r = "{" + id + "}";
		} else if(typeof r === "function" && r.name === "locale") {
			/* automagically call functions named locale */		
			r = r.apply(this, arguments);
		}
		
		/* Paving the way for formatting? */
		// if(typeof r === "function" && arguments.length > 1) {
		// 	var args = js.copy_args(arguments);
		// 	args.shift();
		// 	r = r.apply(this, args);
		// }
		
    	return r;
	}

	/* What to do with this? */
    locale.instancesOf = function(entity, options) {
    	options = (options && js.str2obj(options)) || {};
    	
    	var r = locale(new RegExp(entity + "#[a-z|A-Z|0-9|_|-][a-z|A-Z|0-9|_|-]*"))
    		.map(function(s) {
	    		var key = s.split("#")[1];
	    		return {entity: entity, key: key, value: locale(s)};
	    	});
	    	
	    if(options['sort-order'] === "key desc") {
	    	r = r.sort(function(i1,i2) { 
	    		return parseInt(i2.key, 10) < parseInt(i1.key, 10) ? -1 : 1;
	    	});
	    }
	    	
	    return r;
    };
    locale.prefixed = function(prefix/*, defaults */) {
    	if(prefix instanceof Array) {
    		prefix = prefix[0];
    	}

    	if(arguments.length > 1) {
    		locale.define(prefix, arguments[1]);
    	}
    	
    	return function(id/*, ... */) {
    		if(arguments.length === 0) {
    			return prefix;
    		}
    		
    		var args = js.copy_args(arguments);
    		args[0] = prefix + id;
    		return locale.apply(this, args);
    	};
    };
	locale.define = function(prefix, defaults) {
		for(var loc in defaults) {
			var L = {}; L[prefix] = defaults[loc];
			
			// console.log(1, locale[loc], L);	

			locale[loc] = locale[loc] || {};
			js.mixIn(locale[loc], js.obj2kvp(L));

			// console.log(2, locale[loc], L);	
		}
    };
    
	if(typeof window !== "undefined" && typeof window.location !== "undefined") {
		locale.loc = (location.search.split('locale=')[1]||'').split('&')[0];
		// locale.loc = locale.loc || localStorage.locale;
		locale.loc = locale.loc || document.documentElement.locale;
		locale.loc = locale.loc || document.documentElement.lang;
		locale.loc = locale.loc || "nl";
		if(window.hasOwnProperty("locale_base")) {
			locale_base = window.locale_base;
		}
		window.locale = locale;
	}
	
	function unwrap(dict, v) {
		/* unwrap arrays */ // TODO why?
		for(var k in dict) {
			if(((v = dict[k]) instanceof Array)) {
				dict[k] = v[0];
			}
		}
		return dict;
	}

	return {
		locale: locale,
		
		prefixed: locale.prefixed,
		module: function(module) {
			return function() {
				var args = js.copy_args(arguments);
				args[0] = module.id + String(args[0]);
				return window.locale.apply(this, args);
			};
		},
        load: function (name, req, onLoad, config) {
        	if(name.split("/").length === 1) {
        		name = locale_base + name;	
        	} else {
        		// name = name.substring(1);
        	}
        	
        	var proto = js.up(name) + "/prototype";
        	var suffix = name.charAt(0) === "/" ? ".js" : "";
    		req([proto + suffix, name + suffix], function(proto, dict) {
        		// group to language (nl_NL/en_UK/en_US/etc)
        		name = name.split("/").pop();
        		locale[name] = locale[name] || {};
        		
        		// unwrap arrays
        		dict = unwrap(js.mixIn(js.obj2kvp(proto || {}), js.obj2kvp(dict)));
        		
        		js.mixIn(locale[name], dict);
        		
        		onLoad(dict);
        	});
        },
        define: locale.define
	};
});