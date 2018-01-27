define(function(require) {

	/*-	The letters refer to specific cases in ./Component.getImplicitBasesByUri

		[A] ui/entities/Query<Channel.by:a.by:b>.A.B
		[E]		ui/entities/Query<Channel.by:a.by:b>
		[G]			ui/entities/Query<Channel>
		[F]			ui/entities/Query<Channel.by:a>
		[G]				ui/entities/Query<Channel>
		[I]					ui/entities/Query
		[J]						prototypes/entities/Query
									!!!
		[F]			ui/entities/Query<Channel.by:b> --> ...
		[B]		ui/entities/Query<Channel.by:a.by:b>.A
		[E]			ui/entities/Query<Channel.by:a.by:b> --> ...
		[C]			ui/entities/Query<Channel.by:a>.A
		[F]				ui/entities/Query<Channel.by:a> --> ...
		[D]				ui/entities/Query<Channel>.A
		[G]					ui/entities/Query<Channel> --> ...
		[H]					ui/entities/Query.A
		[I]						ui/entities/Query --> ...
		[K]						prototypes/entities/Query.A
		[J]							prototypes/entities/Query --> ...
		[C]			ui/entities/Query<Channel.by:a>.A --> ...
		[B]		ui/entities/Query<Channel.by:a.by:b>.B
		[E]			ui/entities/Query<Channel.by:a.by:b> --> ...
		[C]			ui/entities/Query<Channel.by:a>.B --> ...
	
		[I]		ui/entities/Query
		[H]		ui/entities/Query.A
		[A]*	ui/entities/Query.A.B
		[G]		ui/entities/Query<Channel>
		[D]		ui/entities/Query<Channel>.A
		[A]*	ui/entities/Query<Channel>.A.B
		[F]		ui/entities/Query<Channel.by:a>
		[C]		ui/entities/Query<Channel.by:a>.A
		[A]*	ui/entities/Query<Channel.by:a>.A.B
		[E]		ui/entities/Query<Channel.by:a.by:b>
		[B]		ui/entities/Query<Channel.by:a.by:b>.A
		[A]		ui/entities/Query<Channel.by:a.by:b>.A.B

		[A]	ui/entities/Query.custom.lang:du --> ...
			ui/entities/Query<Channel.new>
	*/

	var Factory = require("js/defineClass");
	var Class = require("js/Class");
	var Type = require("js/Type");
	var Method = require("js/Method");
	var Component = require("./Component");
	var Deferred = require("js/Deferred");
	var parse = require("./Factory.parse");
	var js = require("js");
	var PropertyValue = parse.PropertyValue;

	var namespaces = js.mixIn(Factory.DEFAULT_NAMESPACES);

	function walk(node, f) {
		f(node);
		node.children && node.children.forEach(function(node) {
			walk(node, f);
		});
	}
	function getClassName(className) {
		if(className.indexOf(":") !== -1) {
			className = className.split(":");
			if(namespaces[className[0]] === undefined) {
				throw new Error(String.format("Unknown namespace %s (%s)",
						className[0], js.keys(namespaces)));
			}
			className = String.format("%s/%s",
					namespaces[className[0]], className[1]);
		}
		return className;
	}
	function getFactoryUri(name) {
		return String.format("vcl/Factory!%s", name);
	}

	return (Factory = Factory(require, {
		prototype: {
			_parentRequire: null,
			_uri: "",
			_root: null,
			_sourceUri: null,

			constructor: function(parentRequire, uri, sourceUri) {
				this._parentRequire = parentRequire;
				this._uri = uri;
				sourceUri && (this._sourceUri = sourceUri);
			},
			toString: function() {
                return String.format("%n#%s#%d", this.constructor, this._uri, 
                	this.hashCode());
			},
			getCtor: function() {
				return this._root.ctor;
			},
			resolveUri: function(uri) {
				if(uri.startsWith(".")) {
					uri = String.format("%s$/%s", Factory.makeUri(this._uri), 
						uri);
				}
				return "text!" + uri;
			},
			load: function(source, success, failure) {
                if(source.charAt(0) === "\"") {
    				/*- Parse require section */
                    var i = source.indexOf("\";");
                    if(i !== -1) {
                        deps = source.substring(1, i).replace(/\s/g, "");
                        deps = deps.split(",");
                        
                        /*- require all dependecies */
                        var me = this;
                        return this._parentRequire(deps, function() {
                            me.doLoad(source, success, failure);
                        }, failure);
                    }
                }
                return this.doLoad(source, success, failure);
			},
			doLoad: function(source, success, failure) {
				if(typeof failure === "function") {
					try {
						return this.doLoad_(source, success, failure);
					} catch(e) {
						/*- devtools/Editor<vcl> wants the actual Error */
						failure(e);
					}
				}
				return this.doLoad_(source, success, failure);
			},
			doLoad_: function(source, success, failure) {

				var me = this;
				var require = me._parentRequire;

				/*- Parse the source into a JS structure */
				var tree = parse(source, me._uri, js.normalize);
				/*- Make sure there is always something to require */
				tree.factories.push("module");
				tree.classes.push("module");
				
				/*- TODO deprecated temporary hack in order to require classes */
				if(tree.root.properties['@require'] !== undefined) {
					tree.classes.push.apply(tree.classes, 
						tree.root.properties['@require']);
					delete tree.root.properties['@require'];
					console.warn("@require will be deprecated - " + me._uri);
				}

				/*- namespace support */
				var ns = tree.root.properties['@namespaces'];
				if(typeof ns === "string") {
					ns = js.str2obj(ns);
				}
				if(ns !== undefined) {
					js.mixIn(namespaces, tree.root.properties['@namespaces']);
				}
				tree.classes.forEach(function(className, index) {
					tree.classes[index] = getClassName(className);
				});

				me._root = tree.root;
				/*- Load all the factories that are need to constructor the 
					component associated with the Factory */
				Factory.require(tree.factories, function() {
					/*- Make sure all the needed classes are loaded */
					require(tree.classes, function() {
						var propVals = [];
						/*- Walk every node set it's constructor and gather PropertyValue instances */
						
						// TODO Quick and dirty, needs refactoring, accessing privates
						var classes = Component.getKeysByUri(me._uri).classes;
						if(classes.indexOf("scaffold") !== -1) {
							var props = tree.root.properties, f;
							if(props.onLoad && !props['@scaffold']) {
								console.log(me._uri, "DEPRECATED onLoad in .scaffold resource");
								props['@scaffold'] = props.onLoad;
								delete props.onLoad;
							}
						}
						
						walk(tree.root, function(node) {
							if(typeof node.className === "string") {
								node.ctor = require(getClassName(node.className));
							} else if(node.inherits instanceof Array) {
								node.factories = [];
								for(var i = 0; i < node.inherits.length; ++i) {
									var factory = require(getFactoryUri(node.inherits[i]));
									node.factories.push(factory);
									if(node.ctor === undefined) {
										node.ctor = factory.getCtor();
									}
								}
							}
							for(var k in node.properties) {
								if(node.properties[k] instanceof PropertyValue) {
									propVals.push([node, k, node.properties[k]]);
								}
							}
						});
						
						if(propVals.length > 0) {
							me.handlePropertyValues(propVals)
								.addCallback(success);
						} else {
							success();
						}
					}, failure);
				}, failure);
			},
			newInstance: function(owner, uri, options) {
			/*- Instantiates the component based upon the structure parsed */
                var component;
                
				if(this._root.ctor === undefined) {
					/* Bad news */
					throw new Error(String.format("This component class does " +
						"not know its constructor (%s)", this._uri));
				}

				if(uri !== undefined) {
                    if(uri.charAt(0) === "#") {
                    	console.warn("DEPRECATED # should no longer be used");
                        uri = this._uri + uri;
                    }
				} else {
                    uri = this._uri;
				}

				// FIXME find a more elegant manner
				var this_uri = this._uri;
				this._uri = uri;

				try {
					var fixUps = [];
					var applied = [];

                    component = new this._root.ctor();//(owner, this._uri, true);

					/*- TODO/FEATURE Do this in the end and support nested 
						components, so that only 1 @override key/value-pair
						is needed per source file */
    				if(this._root.properties.hasOwnProperty("@override")) {
    					console.warn("refactor @override to -> override");
    					component.override(this._root.properties['@override']);
    					delete this._root.properties['@override'];
    				}

                    component.beginLoading();
                    component.setUri(this._uri);
                    component.setName(this._root.name);
                    component.setIsRoot(true);
                    component.setOwner(owner || null);

					this.apply(component, component, this._root, applied, fixUps);

					fixUps.forEach(function(ref, i) {
						var v;
						if(ref.property.isReference()) {
							if(ref.value && (ref.value.charAt(0) === "#")) {
								v = component.qs(ref.value);
							} else {
								v = (ref.value && ref.component.scope()[ref.value]);
							}
							if(v !== null) {
								if(!(v instanceof Component)) {
									console.warn(String.format("Component %s referenced by %n.%s does not exist",
									 		ref.value, ref.component, ref.property.getName()));
									 return;
								}
								if(!(v instanceof ref.property._type)) {
									throw new Error(String.format("Property %n.%s should reference a %s (not %n)",
											ref.component, ref.property.getName(), ref.property._type, v));
								}
							}
						} else {
							v = ref.value;
						}
						ref.property.set(ref.component, v);
					});

				} finally {
					component.endLoading();
					this._uri = this_uri;
				}

                // FIXME #173 Ugly construction
                if(options && typeof options.loaded === "function") {
                    options.loaded(component);
                } else {
				    component.loaded();
                }
				return component;
			},
			apply: function(root, component, node, applied, fixUps) {
				/**
				 * Applies a node definition on an (readily) constructed component.
				 * This method is to be called automatically via newInstance and
				 * apply itself.
				 *
				 * @param root The root component being constructed/factoried
				 * @param component The component to apply the node on
				 * @param node Optional, defaults to _root. Identifies the name,
				 *            properties and children of the component
				 * @param applied Array, keeps track of which factories have already
				 *            been applied on the component (any factory can and
				 *            should only be applied once).
				 * @param fixUps
				 */
				var me = this;
				node = node || this._root;
				applied.push(this);
				
				if(node.factories instanceof Array) {
					// This node inherits other component(s)
					node.factories.forEach(function(factory) {
						// A component can be inherited only once...
						if(applied.indexOf(factory) === -1) {
							factory.apply(component, component, null, applied, fixUps);
							me.factoryApplied(factory, root, component, node, applied, fixUps);
						}
					});
				}
				
				this.setProperties(component, node, fixUps);

				var parent = component;
				node.children.forEach(function(node) {
					var component;
					if(node.ctor !== undefined) {
						component = new (node.ctor)();
						component.setOwner(root);
						component.setParentComponent(parent);
						component.setName(node.name);
						component.setUri(node.uri || me._uri);
					} else {
						// First check the current scope (parent)
						if((component = parent.getScope()[node.name]) === undefined) {
							component = root.findComponent(node.name);
						}
						if(component === null) {
							console.warn(String.format("Inherited component %s not found (%s)", node.name, me._uri));
							return;
						}
					}

					me.apply(root, component, node, [], fixUps);
				});
			},
			factoryApplied: function(factory, root, component, node, applied, fixUps) {
				/* Callback for when a factory is applied */
				
				// TODO Hook scaffold. Quick and dirty, needs refactoring, accessing privates
				var classes = Component.getKeysByUri(factory._uri).classes;
				if(classes.indexOf("scaffold") !== -1) {
	
					var props = factory._root.properties, f;
					if(typeof (f = props['@scaffold']) === "function") {
						console.log("factoryApplied", "@", js.nameOf(component), component._uri, ">>>", js.nameOf(factory));
						// console.debug("scaffolding #" + component.hashCode(), [component._uri, factory._uri]);
						try {
							f.apply(component, []);
						} catch(e) {
							console.error("Error while scaffolding "+ js.nameOf(component), e);
						}
					}
				}
				
			},
			handlePropertyValues: function(propVals) {
				var r = new Deferred(), me = this, count = propVals.length;
				
				function done() {
					if(--count === 0) {
						r.callback();
					}
				}
				
				var modules = propVals.map(function(propValue) {
					var node = propValue[0], name = propValue[1];
					propValue = propValue.pop();
					
					propValue.resolve(me, node, name)
						.addCallback(function(value) {
							node.properties[name] = value;
							done();
						});
				});
				
				return r;
			},
			setProperties: function(component, node, fixUps) {
				component['@properties'] = js.extend(component['@properties'] || {}, node.properties);
				//component['@properties']['@uri'] = this._uri;
				component['@factory'] = this;

				var properties = component.defineProperties(), property;
				for( var k in node.properties) {
					if(k === "@scaffold") continue;
					
					if(node.properties[k] instanceof parse.PropertyValue) {
						console.log(">>>", node.properties[k]);
						continue;
					}
					
					if((property = properties[k]) === undefined) {
						console.warn(String.format("Property %n.%s does not exist - %n\nuri: %s",
								component.constructor, k, component, component._uri));
					} else {
						var value = node.properties[k];
						this.setPropertyValue(property, component, value, fixUps);
					}
				}
			},
			setPropertyValue: function(property, component, value, fixUps) {
				/**
				 * @param property
				 * @param component
				 * @param value
				 * @param fixUps
				 */
				if(property.isReference()) {
					fixUps.push({
						property: property,
						component: component,
						value: value
					});
				} else if(property.needsFixUp()) {
					// if(property._name !== "override") {
					// 	console.warn(property._name, "fixUp");
					// }
					fixUps.push({
						property: property,
						component: component,
						value: value
					});
				} else {
					if(property._type === Type.EVENT) {
						if(typeof value === "string") {
							value = eval(String.format("({f:%s})", value)).f
						}
						if(typeof value === "function") {
							Method.setName(value, String.format("%n.%s", 
								component, property._name));
							Method.setInherited(value, property.get(component, 
								value));
							value = Method.trace(value);
						} else {
							value = undefined;
						}
					}
					if(value !== undefined) {
						try {
							property.set(component, value);
						} catch(e) {
							throw new Error(String.format("Setting property %s of %s caused %s", 
								property, component, e.message), value);
						}
					} else {
						console.warn(String.format("Property %s of %s not set to undefined", 
							property, component), component);
					}
				}
			}
		},
		statics: {
			POSTFIX_SPECIALIZED: "$/",
			PREFIX_PROTOTYPES: "vcl/prototypes/", //TODO vcl-prototypes/
			PREFIX_APP: "vcl-comps/",
			DEFAULT_NAMESPACES: {
			},
			
			implicit_sources: {},

			load: function(name, parentRequire, load, config) {
				/** @overrides http://requirejs.org/docs/plugins.html#apiload */
				var sourceUri = Factory.makeTextUri(name);

				function f(source) {
					var factory = new Factory(parentRequire, name, sourceUri);
					factory.load(source, function() {
						load(factory);
					});
				}

				parentRequire([sourceUri], function(source) {
					f(source);
				}, function(err) {
					// Source not found, assume it...
					var source = Component.getImplicitSourceByUri(name);
					if(source === "$([\"\"]);") {
						source = "$(\"vcl/Component\", \"dead-end\");";
					}
					//console.log("304", name, "-->", source);
					Factory.implicit_sources[sourceUri] = source;
					f(source);
				});
			},
			resolveUri: function(uri) {
				if(uri.substring(uri.length - 2, uri.length) === "<>") {
/**/				console.warn(uri);
					uri = uri.split("!");
					if(uri.length === 1) {
						uri = String.format("%s%s", Factory.PREFIX_PROTOTYPES, 
							uri[0].substring(0, uri[0].length - 2));
					} else {
						uri = String.format("%s!%s%s", uri[0], 
							Factory.PREFIX_PROTOTYPES, uri[1].split("<")[0]);
					}
				} else {
					var keys = Component.getKeysByUri(uri);
					if(keys.template && keys.specializer) {
						uri = String.format("%s%s%s", keys.template, 
							Factory.POSTFIX_SPECIALIZED, keys.specializer);
						if(keys.classes.length) {
							uri += ("." + keys.classes.join("."));
						}
					} else if(keys.classes.length) {
						uri = String.format("%s%s%s.%s", keys.namespace, 
							keys.namespace ? "/" : "", keys.name, 
							keys.classes.join("."));
					} else {
						//throw new Error("Did not expect this " + uri);
					}
				}
			    if(uri.indexOf(Factory.PREFIX_PROTOTYPES) !== 0) {
			        uri = Factory.PREFIX_APP + uri;
			    }
				return uri;
			},
			makeUri: function(uri) {
				/*- DEPRECATED/RENAMED resolveUri */
				console.warn("deprecated usage");
				return this.resolveUri(uri);
			},
			makeTextUri: function(uri, suffix) {
				uri = "text!" + this.resolveUri(uri);
				suffix = arguments.length === 2 ? suffix : ".js";
				return !uri.endsWith(suffix) ? uri + suffix : uri;
			},
			unreq: function(name) {
			    var factory;
			    try {
			        factory = require(String.format("vcl/Factory!%s", name));
			    } catch(e) {
			        return;
			    }

				requirejs.undef(String.format("vcl/Factory!%s", factory._uri));
				requirejs.undef(Factory.makeTextUri(factory._uri));

			    var factories = factory._root.inherits;
			    factories && factories.forEach(function(name) {
			        Factory.unreq(name);
			    });
			},
			require: function(name, callback, failback) {

				var ocallback = callback;
				if(ocallback && typeof name === "string") {
					callback = function() {
						//console.log("200 " + name);
						return ocallback.apply(this, arguments);
					};
				}

				if(typeof name === "string") {
					return require([String.format("vcl/Factory!%s", name)], 
						callback, failback);
				}

				var count = name.length;
				var thisObj = this;

				for(var i = 0; i < name.length; ++i) {
					(function(i){
						require([name[i]], function(module) {
							name[i] = module;
							if(--count === 0) {
								callback.apply(thisObj, name);
							}
						}, function(err) {
							name[i] = err;
							if(--count === 0) {
								callback.apply(thisObj, name);
							}
						});
					}(i));
				}
			},
			getFactoryUri: getFactoryUri
		}

	}));
});
