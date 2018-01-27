define(function(require) {
	
	var Deferred = require("js/Deferred");
	
	function PropertyValue(uri) {
		this.uri = uri;
	}
	PropertyValue.prototype.resolve = function(factory, component, name) {
		var r = new Deferred();
		
		require([factory.resolveUri(this.uri)], 
			function(res) {
				r.callback(res);
			}, 
			function(err) {
				r.errback(err);
			}
		);
		
		return r;
	};

	function parse() {
	    
	    function mapArrFn(arr, fn) {
	        return arr.map(function(item) {
	            if(item instanceof Array) {
	                item = fn.apply(this, item);
	            }
	            return item;
	        });
	    }
		function $(inherits, name, properties, children) {
			if(typeof inherits === "string" && inherits.charAt(0) === "@") {
				return new PropertyValue(inherits.substring(1));
			}
			
			if(typeof name !== "string") {
				children = properties;
				properties = name;
				name = "";
			}
			if(properties instanceof Array) {
				children = properties;
				properties = {};
			}
			if(typeof inherits === "string") {
				inherits = inherits.split("#");
				if(inherits.length === 2) {
					name = inherits[1];
				}
				inherits = inherits[0];
				if(inherits.endsWith("<>")) {
					inherits = [inherits.split("<").shift()];
				}
			}
			return {
				inherits: inherits instanceof Array ? inherits : undefined,
				className: typeof inherits === "string" ? inherits : undefined,
				name: name,
				properties: properties || {},
				children: mapArrFn(children || [], arguments.callee)
			};
		}
		function $i(name, properties, children) {
			if(properties instanceof Array) {
				children = properties;
				properties = {};
			}
			return {
				name: name,
				properties: properties || {},
				children: mapArrFn(children || [], arguments.callee)
			};
		}

		/* jshint: eval */		
		var r = eval(arguments[0]);
		if(r instanceof Array) {
		    r = $.apply(this, r);
		}
		return r;
	}
	function impl(source, uri, normalize) {

		var Component = require("vcl/Component");
		var Factory = require("vcl/Factory");

		var tree = {
			root: [],
			classes: [],
			factories: [],
			keys: Component.getKeysByUri(uri)
		};

		function walk(node) {
		/**
		 * Dependencies are two-fold:
		 * 	- factories
		 * 	- classes
		 *
		 * @param node
		 *            The scope being walked
		 */
			// Are we inheriting prototypes?
			if(node.inherits instanceof Array) {
				// Test for $([])
				if(node.inherits.length === 0) {
					node.inherits = Component.getImplicitBasesByUri(uri);
				}

				// Test for syntax sugar: $([["{uri}"]])
				if(node.inherits[0] instanceof Array) {
					node.inherits = node.inherits[0];
					node.inherits.forEach(function(item, i) {
						var prefix = require("vcl/Factory").PREFIX_PROTOTYPES;
						if(item.indexOf(prefix) === 0) {
							console.warn("Something is out of the ordinary");
						}
						node.inherits[i] = String.format("%s%s", prefix, item);
					});
				}

				node.inherits.forEach(function(item, i) {
					node.inherits[i] = item = normalize(uri, item);
					item = String.format("vcl/Factory!%s", item);
					if(tree.factories.indexOf(item) === -1) {
						tree.factories.push(item);
					}
				});
				
				/*- #777 */
				node.uri = node.inherits[0];
			}
			if(typeof node.className === "string") {
				/*- #1236 */
				var rootCN = (tree.root && tree.root.className) || "vcl/Component";
				node.className = normalize(rootCN, node.className);
				if(tree.classes.indexOf(node.className) === -1) {
					tree.classes.push(node.className);
				}
			}
			node.children.forEach(function(node) {
				walk(node);
			});
		}
		function adjust(root) {
			walk(root);
		}
		function devtoolsFriendly(uri) {
            if(uri.indexOf(Factory.PREFIX_PROTOTYPES) === 0) {
                uri = uri.substring(Factory.PREFIX_PROTOTYPES.length);
            }
            uri = uri.split("<");
			if(uri.length === 2) {
				uri[1] = uri[1].split("/").join(".");
				uri = uri.join("<");
			}
			return uri;
		}

		source = String.format("%s\n//# sourceURL=http://vcl-%s/%s.js", source,
		    uri.indexOf(Factory.PREFIX_PROTOTYPES) === 0 ? "prototypes" : "comps",
		    devtoolsFriendly(uri));
		tree.root = parse(source);
		tree.root && adjust(tree.root);
		return tree;
	}
	
	impl.PropertyValue = PropertyValue;
	
	return impl;
});