define(function(require) {

	var Entity = require("js/defineClass");
//	var js = require("js");

	var Instance = require("./Instance");
	var PersistenceObject = require("./Object");

    Entity = Entity(require, {

    	prototype: {

			/**
			 *
			 * @param model
			 * @param name
			 * @param attributes
			 */
			constructor: function(model, name, attributes) {
				this._model = model;
				this._name = name;
				this._attributes = attributes;
				this._meta = {};

				for(var k in attributes) {
					if(k.charAt(0) === "@") {
						this._meta[k] = attributes[k];
						delete attributes[k];
					}
				}
			},

			Instance: null,
			Obj: null,

			_model: null,
			_name: "",
			_attributes: null,
			_meta: null,

			/**
			 *
			 */
			link: function() {
				for(var k in this._attributes) {
					var attribute = this._attributes[k];
					if(typeof attribute.entity === "string") {
						attribute.entity = this._model.getEntity(attribute.entity);
					}
					if(attribute.link !== undefined && typeof attribute.link.entity === "string") {
						attribute.link.entity = this._model.getEntity(attribute.link.entity);
					}
				}
			},

			/**
			 *
			 * @returns
			 */
			getModel: function() {
				return this._model;
			},

			/**
			 *
			 * @returns {String}
			 */
			getName: function() {
				return this._name;
			},

			/**
			 *
			 * @returns {String}
			 */
			getQName: function() {
				return String.format("%s:%s", this._model.getName(), this._name);
			},

			/**
			 *
			 * @returns {String}
			 */
			getLocalName: function() {
				return this._name.split("/").pop();
			},


			/**
			 *
			 * @param name
			 * @returns {Object}
			 */
			getAttribute: function(name) {
				var entity = this;
				var names = name.split(".");
				while(names.length > 1) {
					entity = entity.getAttribute(names.splice(0, 1)[0]);
					if(entity === null || (entity = entity.entity) === undefined) {
						throw new Error(String.format("Attribute %s.%s does not exist", this.getQName(), name));
					}
				}
				return entity._attributes[names[0]] || null;
			},

			/**
			 *
			 * @param selector
			 * @returns {Object} Hashmap of all matched attributes
			 */
			getAttributes: function(selector) {
				if(selector === undefined) {
					return this._attributes;
				} else if(typeof selector === "string") {
				}
				return this._attributes;
			},

			/**
			 *
			 */
			getObject: function() {
				var Obj = this.Obj;
				var k;
				// create prototype in case it does not exist
				if(Obj === null) {

					Obj = function(instance) {
						this.$ = instance;
					};

					Obj.prototype = new PersistenceObject();

					var attributes = this._attributes;
					for(k in attributes) {
						var attribute = attributes[k];
						if(attribute.type === "many-to-one" || attribute.type === "one-to-one") {
							(function(k) {
								Obj.prototype.__defineGetter__(k, function() {
									var obj = this.$.getAttributeValue(k);
									return obj ? obj.getObject() : obj;
								});
								Obj.prototype.__defineSetter__(k, function(value) {
									if(value instanceof PersistenceObject) {
										value = value.$;
									}
									if(value !== null && !(value instanceof PersistenceInstance)) {
										throw new Error("Expected null or an instance");
									}
									return this.$.setAttributeValue(k, value);
								});
							}).apply(this, [k]);
						} else if(attribute.type === "one-to-many" || attribute.type === "many-to-many") {
							(function(k) {
								Obj.prototype.__defineGetter__(k, function() {
									var v = this.$.getAttributeValue(k);
									if(v instanceof Array) {
										// copy the array, as the contents will be changed
										var arr = [].concat(v);
										for(var i = 0; i < arr.length; ++i) {
											arr[i] = arr[i] ? arr[i].getObject() : null;
										}
										v = arr;
									}
									return v;
								});
								Obj.prototype.__defineSetter__(k, function(value) {
									if(!(value instanceof Array)) {
										throw new Error("Expected array");
									}
									var v = [].concat(value);
									for(var i = 0; i < v.length; ++i) {
										if(v[i] instanceof PersistenceObject) {
											v[i] = v[i].$;
										}
									}
									return this.$.setAttributeValue(k, v);
								});
							}).apply(this, [k]);
						} else { // normal attribute
							(function(k) {
								Obj.prototype.__defineGetter__(k, function() {
									return this.$.getAttributeValue(k);
								});
								Obj.prototype.__defineSetter__(k, function(value) {
									return this.$.setAttributeValue(k, value);
								});
							}).apply(this, [k]);
						}
					}
					this.Obj = Obj;
				}

				return Obj;
			},

			/**
			 *
			 */
			newInstance: function(key, obj, setAttributeValues) {
				var instance = new this.Instance(this, key || null);
				if(obj !== undefined) {
					if(setAttributeValues === false) {
						instance._object = obj;
					} else {
						for(var k in obj) {
							if(obj[k] instanceof PersistenceObject) {
								obj[k] = obj[k].$;
							}
						}
						instance.setAttributeValues(obj);
					}
				}
				return instance;
			},

			/**
			 *
			 */
			newObject: function(key, obj) {
				return this.newInstance(key, obj).getObject();
			}
		},

		/**
		 *
		 */
		NameOf: function(instance) {
			//return String.format("[object %s[%s]#%d]", instance.getClass().getName(), instance.getName(), instance.hashCode());
			return String.format("[entity %s#%d]", instance.getName(), instance.hashCode());
		}

	});

	Entity.prototype.Instance = Instance;

	return Entity;
});