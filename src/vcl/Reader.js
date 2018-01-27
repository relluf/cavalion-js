define(function(require) {

	// FIXME merge ./Reader and ./Factory somehow so that clones of
	// 'read' components can be instantiated based upon the same structure (ie.
	// without the need of evaluating the source again, which is what
	// Factory.newInstance() is doing)

	// 2013-10-09 Making progress for ComponentClass(es), obtaining source via
	// all via require("./Factory"), wow, this is cool. I love
	// symmetry!

	var Reader = require("js/defineClass");
	var Deferred = require("js/Deferred");
	var Method = require("js/Method");
	var Type = require("js/Type");
	var Component = require("./Component");
	var evaluate = require("./Reader.evaluate");
	var js = require("js");

	return (Reader = Reader(require, {

		prototype: {

			_factory: null,
			_root: null,
			_uri: null,
			_references: null,

			/**
			 *
			 */
			constructor: function(factory, root) {
				this._factory = factory;
				if(root !== undefined) {
					this._root = root;
				}
			},

			/**
			 * Read the source of a component. Basically instantiates a
			 * component
			 *
			 * @param source
			 *            The actual source
			 * @param uri
			 *            The uri of the source and thus the resulting root
			 *            component
			 */
			read: function(source, uri) {
				var deferred = new Deferred();
				var thisObj = this;

				this._references = [];
				this._uri = uri;

				source = {
					text: String.format("%s\n//@ sourceURL=%s", source, uri),
					uri: uri
				};

				// Evaluate the source and receive a parsed representation
				evaluate(source, function(result) {
					// result references dependencies and classes which are to
					// be loaded/required first
					thisObj._factory.require(result.factories, function() {
//						var factories = js.copy_args(arguments);
						// ...and classes which should be required
						result.classes.forEach(function(cl, i) {
							result.classes[i] = js.normalize(uri, cl);
						});
						require(result.classes, function() {
//							var classes = js.copy_args(arguments);
							thisObj.createRootComponent(result.root, function(root) {
								deferred.callback(root);
							}, function(e) {
								deferred.errback(e);
							});
						});
					});
				});

				return deferred;
			},

			/**
			 * Instantiates a component based upon a definition hold by a node
			 * which was delivered/parsed by Reader.evaluate. It figures out
			 * whether the node references a inherited ComponentClass or
			 * inherited component.
			 *
			 * @param node
			 *            The actual node holding information to it's inherited
			 *            prototypes, name, properties, children
			 * @param success
			 *            To receive the component
			 * @param failure
			 *            To receive errors
			 */
			instantiateComponent: function(node, success, failure) {
				var component, me = this;
				if(node.inherits instanceof Array) {
					// inherits (a) ComponentClass-instance(s), require all the
					// needed factories
					this._factory.require(node.inherits, function() {
						var factories = js.copy_args(arguments);
						var component;

						function inherit() {
							if(factories.length > 0) {
								var factory = factories.shift();
								factory.apply(component, inherit, failure);
							} else {
								success(component);
							}
						}

						factories.shift().newInstance(function(instance) {
							component = instance;
							inherit();
						}, failure);

					});
				} else if(typeof node.inherits === "string") {
					// inherits a Class-instance
					require([js.normalize(this._uri, node.inherits)], function(ctor) {
						success(new ctor());
					}, failure);
				} else {
					// inherits a Component-instance
					if((component = this._root.findComponent(node.name)) === null) {
						failure(new Error(String.format("%s does not identify an inherited component", node.name)));
					}
					success(component);
				}
			},

			/**
			 *
			 */
			createRootComponent: function(rootNode, success, failure) {
				var me = this;

				function f(root) {
					me._root = root;

					root.beginLoading();
					root.setIsRoot(true);
					console.log("createRootComponent", root._uri, "-->", me._uri);
					root.setUri(me._uri);

					// Instantiate children and set properties
					me.initializeComponent(root, rootNode, function() {
						var scope = root.getScope();
						try {
							me._references.forEach(function(ref) {
								var v = scope[ref.value];
								if(!(v instanceof Component)) {
									throw new Error(String.format("Component %s referenced by %n.%s does not exist",
											ref.value, ref.component, ref.property.getName()));
								}
								if(!(v instanceof ref.property._type)) {
									throw new Error(String.format("Property %n.%s should reference a %s (not %n)",
											ref.component, ref.property.getName(), ref.property._type, v));
								}
								ref.property.set(ref.component, v);
							});
							// console.log(String.format("Read %s in %dms",
							// me._uri, root.endLoading()));
							root.endLoading();
							root.loaded();
							success(root);
						} catch (e) {
							failure(e);
						}
					});
				}

				if(this._root === null) {
					this.instantiateComponent(rootNode, function(c) {
						console.log("instantiated root", c, c.hashCode());
						f(c);
					});
				} else {
					console.log("reusing root", this._root, this._root.hashCode());
					f(this._root);
				}
			},

			/**
			 *
			 */
			initializeComponent: function(component, node, success, failure) {
				if(component !== this._root) {
					// This is an owned/nested component
					component.setOwner(this._root);
					component.setUri(this._uri);
					component.setName(node.name);
				}

				var me = this;

				// Set the properties
				me.setProperties(component, node);

				if(node.children.length > 0) {
					// Create the children
					me.createComponents(node.children, function(children) {

						// Nest the children
						children.forEach(function(child) {
							child.setParentComponent(component);
						});

						// Done
						success(component);
					}, failure);
				} else {

					// Done
					success(component);
				}
			},

			/**
			 *
			 */
			createComponents: function(nodes, success, failure) {
				var count = nodes.length;
				var result;
				result = [];

				if(count === 0) {
					success(result);
				} else {
					var me = this;
					nodes.forEach(function(node, index) {
						me.instantiateComponent(node, function(component) {
							me.initializeComponent(component, node, function() {
								result[index] = component;
								if(--count === 0) {
									success(result);
								}
							}, failure);
						}, failure);
					});
				}
			},

			/**
			 *
			 */
			setProperties: function(component, node) {
				// extend properties
				component['@properties'] = js.extend(component['@properties'] || {}, node.properties);

				var properties = component.defineProperties();
				for( var k in node.properties) {
					var property;
					if((property = properties[k]) === undefined) {
//						console.warn(String.format("Property %n.%s does not exist - %n", component.constructor, k,
//								component));
					} else {
						var value = node.properties[k];
						this.setPropertyValue(property, component, value);
					}
				}
			},

			/**
			 *
			 * @param property
			 * @param component
			 * @param value
			 */
			setPropertyValue: function(property, component, value) {
				if(property.isReference()) {
					this._references.push({
						property: property,
						component: component,
						value: value
					});
				} else {
					if(property._type === Type.EVENT) {
						Method.setName(value, String.format("%n.%s", component, property._name));
						value = Method.trace(value);
					}
					property.set(component, value);
				}
			}
		}
	}));
});