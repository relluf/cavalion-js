define(function(require) {

	var Property = require("./defineClass");
	var js = require("./_js");

	var Type = require("./Type");
	var Enum = require("./Enum");
	var Class = require("./Class");
//	var PropertyEditor = require("./PropertyEditor");

	var get_impl = "__get";
	var set_impl = "__set";

	var UNDEFINED = {};

	var referencedClasses = [];

	return (Property = Property(require, {

		prototype: {
			constructor: function(declaringClass, name, decl) {
				this._declaringClass = declaringClass;
				this._name = name;

				Property.initialize(this, decl);
			},

			_defaultValue: undefined,
			_editorClass: null,
			_editorInfo: null,
			_fixUp: false,
			_strict: false,//true,
			_getter: undefined,
			_setter: undefined,
			_reference: undefined,
			_decl: undefined,
			_name: undefined,
			_type: undefined,
			_declaringClass: undefined,

			_assignable: undefined,
			_enabled: undefined,
			_stored: undefined,
			_visible: undefined,

			/**
			 * @overrides Object.prototype.toString
			 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString
			 */
			toString: function() {
				return String.format("[property %n::%s#%d]",
						this._declaringClass, this._name, this.hashCode());
			},

			/**
			 * Returns the name of the calling property
			 */
			getName: function() {
				return this._name;
			},

			/**
			 * Returns the type of the calling property
			 */
			getType: function() {
				return this._type;
			},

			/**
			 * Returns the class declaring the calling property
			 */
			getDeclaringClass: function() {
				return this._declaringClass;
			},
			getPropertyClass: function() {
				throw new Error("Unknown class");
			},

			/**
			 * Returns the PropertyEditor derived class which this property should be edited with
			 */
			getEditorClass: function() {
				if(this._editorClass === null) {
					var type = this.getType();
					if(type === Type.CLASS) {
						this._editorClass = PropertyEditor.getClassByType(this._type);
					} else {
						this._editorClass = PropertyEditor.getClassByType(type);
					}
				} else if(typeof(this._editorClass) === "string") {
// TODO
					this._editorClass = require(this._editorClass);
				}
				return this._editorClass;
			},
			getEditorInfo: function(path) {
				return path === undefined ? this._editorInfo : js.get(path, this._editorInfo || {});
			},

			/**
			 * Indicates whether the property value is a reference to a named instance
			 */
			isReference: function() {
				return this._reference === true;
			},

			/**
			 * Indicates whether the property value should be set after the resource is entirely read
			 */
			needsFixUp: function() {
				return this._fixUp === true;
			},

			/**
			 * Returns the default value for the property for the instance -obj-
			 */
			getDefaultValue: function(obj) {
				return this._defaultValue;
			},

			/**
			 *
			 * @param obj
			 */
			isAssignable: function(obj) {
				if(this._assignable === false || this._stored === false || this._enabled === false) {
					return false;
				}
				return true;
			},

			/**
			 * Indicates whether the property is enabled for the instance -obj-
			 */
			isEnabled: function(obj) {
				return this._enabled !== false;
			},

			/**
			 * Indicates whether the property is visiblefor the instance -obj-
			 */
			isVisible: function(obj) {
				return this._visible !== false;
			},

			/**
			 * Indicates whether the value of the property of -obj- should be stored
			 */
			isStored: function(obj) {
				return !this.hasDefaultValue(obj);
			},

			/**
			 * Indicates whether type checking is enabled for setting the properties value
			 */
			isStrict: function() {
				return this._strict;
			},
			isReadOnly: function() {
				return this.__set === Property.prototype.__set;
			},

			/**
			 * Returns whether the value of the property of -obj- reflects its default value
			 */
			hasDefaultValue: function(obj) {
				var value = this.get(obj);
				var def = this.getDefaultValue(obj);
				var inh = org.cavalion.comp.Component.getInheritedPropertyValue(obj, this._name);
// TODO
				return inh === undefined ? equals(value, def) : equals(value, inh);
			},

			/**
			 * Returns whether the value of the property of -obj- reflects its inherited value
			 */
			hasInheritedValue: function(obj) {
// TODO
				return org.cavalion.comp.Component.getInheritedPropertyValue(obj, this._name) === this.__get(obj);
				//return equals(org.cavalion.comp.Component.getInheritedPropertyValue(obj, this._name), this.__get(obj), true);
			},

			/**
			 * Returns the value of the property for the instance -obj-
			 */
			get: function(obj) {
				return this.__get(obj);
			},
			__get: function(obj) {
				throw new Error("No getter defined");
			},

			/**
			 * Set the value of the property for the instance -obj-
			 */
			set: function(obj, value) {
				return this.__set(obj, value);
			},
			__set: function(obj, value) {
				throw new Error("No setter defined");
			}

		},

		statics: {
			isReferencedClass: function(cls) {
				if(Class.isConstructor(cls)) {
					if(referencedClasses.indexOf(cls) !== -1) {
						return true;
					}
					return this.isReferencedClass(Class.getClassObj(cls).inherits);
				}
				return false;
			},

			registerReferencedClass: function(cls) {
				if(Class.isConstructor(cls)) {
					referencedClasses.push(cls);
				} else {
					throw new Error(String.format("%s is not a class constructor"));
				}
			},
			initialize: function(property, prop) {

				var ctor = property._declaringClass;
				var name = property._name;

				if(prop instanceof Property) {
					prop = prop._decl;
				}

				property._decl = js.mixIn({}, prop);

				/*
				 *	Getter
				 */
				if(prop.get === undefined) {
					property._getter = String.format("_%s", name);
					property[get_impl] = Property.Getter.MEMBER;
				} else if(prop.get === Function) {
					property._getter = String.format("get%s", String.camelize(name));
					property[get_impl] = Property.Getter.METHOD;
				} else if(typeof prop.get === "function") {
					property._getter = prop.get;
					property[get_impl] = Property.Getter.INLINE;
				} else if(typeof prop.get === "string") {
					property._getter = prop.get;
					property[get_impl] = Property.Getter.METHOD;
				}

				/*
				 *	Setter
				 */
				if(prop.set === undefined) {
					property._setter = String.format("_%s", name);
					property[set_impl] = Property.Setter.MEMBER;
				} else if(prop.set === Function) {
					property._setter = String.format("set%s", String.camelize(name));
					property[set_impl] = Property.Setter.METHOD;
				} else if(typeof prop.set === "function") {
					property._setter = prop.set;
					property[set_impl] = Property.Setter.INLINE;
				} else if(typeof prop.set === "string") {
					property._setter = prop.set;
					property[set_impl] = Property.Setter.METHOD;
				}

				/*
				 *	Default
				 */
				if(prop.def === Function) {
					property._defaultValue = String.format("has%sDefaultValue", String.camelize(name));
					property.getDefaultValue = Property.GetDefaultValue.METHOD;
					prop.def = undefined;
				} else if(typeof prop.def === "function") {
					property._defaultValue = prop.def;
					property.getDefaultValue = Property.GetDefaultValue.INLINE;
					prop.def = undefined;
				} else if(js.keys(prop).indexOf("def") === -1) {
					//hostenv.printf("%s does not have default value, assuming _%s", name, name);
					// really undefined
					property._defaultValue = ctor.prototype[String.format("_%s", name)];
				} else {
					property._defaultValue = prop.def === undefined ? UNDEFINED : prop.def;
				}

				/*
				 * Type
				 */
				if(prop.type === undefined) {
					prop.type = Type.byValue(prop.def);
				}

				if(prop.type === Type.UNDEFINED) {
					console.warn(String.format("Can not determine type of property %n::%s",
							property._declaringClass, name));
				}
/**	TODO
				if(typeof prop.type === "string") {
					prop.type = js.lang.Class.require(prop.type)._ctor;
				}
*/
				if(prop.type instanceof Array) {
					prop.type = new Enum(String.format("%n.%s",
							property._declaringClass, name.toUpperCase()), prop.type);
				}

				if(prop.type instanceof Enum) {
					property._type = prop.type;
					property.getType = Type.ENUM.get;
					property.getPropertyClass = function() {
						return this._type;
					};
					if(property._defaultValue === undefined) {
						console.log(String.format("%n._%s %s", ctor, name, property._defaultValue));
						property._defaultValue = prop.type.getKeys()[0];
					}
				} else {
					if(Class.isConstructor(prop.type)) {
						if(Property.isReferencedClass(prop.type)) {
							property._reference = true;
						}
						property._type = prop.type;
						property.getType = Type.CLASS.get;
						// FIXME Move away from here...
						property.getPropertyClass = function() {
							return this._type;
						};
					} else if(Type.isType(prop.type)) {
						property._type = prop.type;
						property.getPropertyClass = prop.type.get;
					} else {
						throw new Error(String.format("Illegal property type %n (%n.%s)", prop.type, ctor, name));
					}
				}

				if(prop.editor !== undefined) {
					property._editorClass = prop.editor;
				}

				if(prop.editorInfo !== undefined) {
					property._editorInfo = prop.editorInfo;
				}

				if(property._defaultValue === undefined) {
//					console.warn(String.format("Can not determine default value for property %n::%s",
//							property._declaringClass, name));
/** TODO
					property._defaultValue = property._type.defaultValue;
*/
				} else if(property._defaultValue === UNDEFINED) {
					property._defaultValue = undefined;
				}

				/*
				 *	FixUp
				 */
				if(prop.fixUp !== undefined) {
					property._fixUp = prop.fixUp;
				}

				/*
				 *	Assignable
				 */
				if(prop.assignable === Function) {
					property._assignable = String.format("is%sAssignable", String.camelize(name));
					property.isAssignable = Property.IsAssignable.METHOD;
				} else if(prop.assignable !== undefined) {
					property._assignable = prop.assignable;
					if(typeof prop.assignable === "boolean") {
						property.isAssignable = Property.IsAssignable.VALUE;
					} else if(typeof prop.assignable === "function") {
						property.isAssignable = Property.IsAssignable.INLINE;
					} else if(typeof prop.assignable === "string") {
						property.isAssignable = Property.IsAssignable.METHOD;
					}
				}

				/*
				 *	Stored
				 */
				if(prop.stored === Function) {
					property._stored = String.format("is%sStored", String.camelize(name));
					property.isStored = Property.IsStored.METHOD;
				} else if(prop.stored !== undefined) {
					property._stored = prop.stored;
					if(typeof prop.stored === "boolean") {
						property.isStored = Property.IsStored.VALUE;
					} else if(typeof prop.stored === "function") {
						property.isStored = Property.IsStored.INLINE;
					} else if(typeof prop.stored === "string") {
						property.isStored = Property.IsStored.METHOD;
					}
				}

				/*
				 *	Enabled
				 */
				if(prop.enabled === Function) {
					property._enabled = String.format("is%sEnabled", String.camelize(name));
					property.isEnabled = Property.IsEnabled.METHOD;
				} else if(prop.enabled !== undefined) {
					property._enabled = prop.enabled;
					if(typeof prop.enabled === "boolean") {
						property.isEnabled = Property.IsEnabled.VALUE;
					} else if(typeof prop.enabled === "function") {
						property.isEnabled = Property.IsEnabled.INLINE;
					} else if(typeof prop.enabled === "string") {
						property.isEnabled = Property.IsEnabled.METHOD;
					}
				}

				/*
				 *	Visible
				 */
				if(prop.visible === Function) {
					property._visible = String.format("is%sVisible", String.camelize(name));
					property.isVisible = Property.IsVisible.METHOD;
				} else if(prop.visible !== undefined) {
					property._visible = prop.visible;
					if(typeof prop.visible === "boolean") {
						property.isVisible = Property.IsVisible.VALUE;
					} else if(typeof prop.visible === "function") {
						property.isVisible = Property.IsVisible.INLINE;
					} else if(typeof prop.visible === "string") {
						property.isVisible = Property.IsVisible.METHOD;
					}
				}
			},

			GetDefaultValue: {
				VALUE: function(obj) {
					return this._defaultValue;
				},
				METHOD: function(obj) {
					return obj[this._defaultValue]();
				},
				INLINE: function(obj) {
					return this._defaultValue.apply(obj, []);
				}
			},
			Getter: {
				MEMBER: function(obj) {
					return obj[this._getter];
				},
				METHOD: function(obj) {
					return obj[this._getter]();
				},
				INLINE: function(obj) {
					return this._getter.apply(obj, []);
				}
			},

			IsAssignable: {
				VALUE: function(obj) {
					return this._assignable;
				},
				METHOD: function(obj) {
					return obj[this._assignable](obj);
				},
				INLINE: function(obj) {
					return this._assignable.apply(this, [obj]);
				}
			},
			IsEnabled: {
				VALUE: function(obj) {
					return this._enabled;
				},
				METHOD: function(obj) {
					return obj[this._enabled]();
				},
				INLINE: function(obj) {
					return this._enabled.apply(obj, []);
				}
			},
			IsStored: {
				VALUE: function(obj) {
					return this.hasDefaultValue(obj) ? false : this._stored;
				},
				METHOD: function(obj) {
					return this.hasDefaultValue(obj) ? false : obj[this._stored](obj);
				},
				INLINE: function(obj) {
					return this.hasDefaultValue(obj) ? false : this._stored.apply(this, [obj]);
				}
			},
			IsVisible: {
				VALUE: function(obj) {
					return this._visible;
				},
				METHOD: function(obj) {
					return obj[this._visible]();
				},
				INLINE: function(obj) {
					return this._visible.apply(obj, []);
				}
			},

			Setter: {
				MEMBER: function(obj, value) {
					if(this._strict === true && !Type.isCompatible(this._type, value)) {
						throw new TypeError(String.format("%s is not a valid %s", value, this._type));
					}
					return (obj[this._setter] = value);
				},
				METHOD: function(obj, value) {
					return obj[this._setter](value);
				},
				INLINE: function(obj, value) {
					return this._setter.apply(obj, [value]);
				}
			}
		}

	}));
});