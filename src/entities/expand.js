define(["js"], (js) => {

// TODO join and expand => @join, @expand
	
	const KEY_name = "@_name", KEY_expanders = "@_expanders";

	function Entity(name) {
		this[KEY_name] = name;
		this[KEY_expanders] = {};
	}
	Entity.prototype.join = function(alias, attributes) {
		const expanders = this[KEY_expanders];
		const expander = expanders[alias] || expanders[alias.toLowerCase()];

		if(!expander) {
			throw new Error("Unknown join alias/entity: " + alias);
		}
		
		return expander(attributes);
	};
	Entity.prototype.expand = function(...args) {
		const arr = (args.length === 1 && Array.isArray(args[0])) ? args[0] : args;
		return expand.attributes4(this, arr);
	};

	const isFn = (f) => typeof f === "function";
	const makeFn = (path) => {
		/**
		 * makeFn(path) -> function(as) { ... }
		 * Creates a self-recursive expander that calls expand(fn, as, path).
		 */
		function fn(as) {
			return expand(fn, as, path);
		}
		return fn;
	};
	const prefixId = (s) => !s ? "id" : s.startsWith("id") || s.startsWith("count:id") ? s : "id," + s;

	function expand(expander, as, path) {
		/**
		 * expand(expanderFn, as, path)
		 *
		 * - If as === undefined: returns path (so expanders can self-describe)
		 * - If as is "a,b,c": treated as ["a","b","c"]
		 * - If as is Array: maps each element through the same expander
		 * - If as contains "attr alias": returns "path.attr alias"
		 * - If as contains "type:attr": returns "type:path.attr"
		 */
		if(as === undefined) {
			return path;
		}
		if(typeof as === "string" && as.indexOf(",") !== -1) {
			as = as.split(",").map(function(s) { return s.trim(); });
		}
		if(Array.isArray(as)) {
			return as.map(function(a) { return expander(a); });
		}
	
		var attr = String(as);
	
		if(path) {
			// typed prefix: "Watermonster:id" => "Watermonster:path.id"
			if(attr.indexOf(":") !== -1) {
				var t = attr.split(":");
				return js.sf("%s:%s.%s", t[0], path, t[1]);
			}

			// aliasing: "id foo" => "path.id foo"
			if(attr.indexOf(" ") !== -1) {
				var parts = attr.split(" ");
				return js.sf("%s.%s %s", path, parts[0], parts.slice(1).join(" "));
			}
	
	
			return js.sf("%s.%s", path, attr);
		}
	
		// No path: just return the attribute as-is (e.g. root filter fields)
		return attr;
	}
	expand.newEntity = function(name, paths, joinToExpander) {
		/**
		 * expand.entity(name, paths, joinToExpander)
		 *
		 * paths: { bedrijf: "meetpunt.onderzoek.bedrijf", ... }
		 * joinToExpander: { Watermonster: "watermonsters", ... }
		 *
		 * Returns an object where each expander is available directly as a method:
		 *	Entity.bedrijf("id") -> "meetpunt.onderzoek.bedrijf.id"
		 *
		 * Also provides:
		 *	Entity.join("Bedrijf", "id") -> same, via joinToExpander / expanders lookup
		 */
		const entity = new Entity(name);

		// Build expanders and attach them as direct methods (Entity.bedrijf(...))
		for(const k in paths) {
			if(paths.hasOwnProperty(k)) {
				const fn = makeFn(paths[k] || undefined);
				entity[KEY_expanders][k] = fn;
				if(!entity[k]) entity[k] = fn;
			}
		}
	
		// Normalize join map keys to lower-case
		for(const j in joinToExpander) {
			if(joinToExpander.hasOwnProperty(j) && !entity[KEY_expanders][j]) {
				entity[KEY_expanders][j] = entity[KEY_expanders][joinToExpander[j]];
			}
		}
	
		return entity;
	};
	expand.attributes4 = (entity, arr) => arr.map(a => {
		if(a instanceof Array) {
			if(!entity[a[0]]) { 
				if(a.length === 1) {
					return a[0] + ".id";
				}
				return prefixId(a[1]).split(",").map(s => a[0] + "." + s);
			}
			return entity[a[0]](prefixId(a[1]));
		} else if(typeof a === "string") {
			return prefixId(a).split(",");
		}
	}).flat();

	function DefaultEntity(name) {
		this[KEY_name] = name;
		this.join = (alias, attributes) => {
			return attributes.split(",").map(a => [alias, a].join("."));
		},
		this.expand = (...args) => {
			return args.map(a => {
				if(a instanceof Array) {
					const arr = prefixId(a[1]).split(",");
					return arr.map(path => [a[0], path].join("."));
				} else if(typeof a === "string") {
					return prefixId(a).split(",");
				}
			});
		};
	}

	return js.mi(expand, { DefaultEntity });
});