define(function(require) {

	var ns = require("namespace!.");
	var js = require("js");
	
	var PersistenceObject = require("./Obj");
	var PersistenceInstance = require("./Instance");

	var COMPOUND_KEY = {};

	/**
	 *
	 */
	function getDefaultNameAttributeNames() {
		var attrs = this._def.attributes;
		var choices = ["name", "naam", "code", "nummer", "number", "omschrijving"];
		this._cache.nameAttributeNames = [];
		for(var i = 0; i < choices.length; ++i) {
			var attr = attrs[choices[i]];
			if(attr !== undefined) {
				this._cache.nameAttributeNames.push(choices[i]);
				return;
			}
		}
	}

	var Entity = ns.Constructor.define("./Entity", {

		/**
		 *
		 */
		Entity: function(unit, name, def, Instance) {
			var k;

			var m2o = def.manyToOne;
			var attrs = def.attributes;

			this.Instance = Instance;
			this._unit = unit;
			this._name = name;
			this._def = def;
			this._cache = {};

			if(def.manyToOne === undefined) {
				def.manyToOne = {};
			}
			
			if(def.oneToMany === undefined) {
				def.oneToMany = {};
			}
			
			if(def.oneToOne === undefined) {
				def.oneToOne = {};
			}
			
			for(k in m2o) {
				def.attributes[m2o[k].attribute].isManyToOne = true;
			}

			for(k in attrs) {
				if(attrs[k].isKey === true) {
					if(this._key !== null) {
						if(!(this._key instanceof Array)) {
							this._key = [this._key];
						}
						this._key.push(attrs[k]);
						this._cache.keyName = COMPOUND_KEY;
					} else {
						this._key = attrs[k];
						this._cache.keyName = k;
					}
				}
			}

			this._cache.nameFormat = this._def.nameFormat || "%s";
		},

		Prototype: {
			Obj: null,			// constructor for instances supplied via newInstance
			Instance: null,		// constructor for instances supplied via this.Instance.prototype.getObject

			_unit: null,
			_def: null,
			_key: null,
			_cache: null,

			/**
			 *
			 */
			nameOf: function(instance) {
				var values = [].concat(this.getNameAttributeNames());
				if(values.length === 0) {
					values = [this._key];
				}
				for(var i = 0; i < values.length; ++i) {
					if(values[i] === this._key) {
						values[i] = instance.getKey();
					} else {
						values[i] = instance.getAttributeValue(values[i]);
						if(values[i] === undefined) {
							values[i] = "?";
						}
					}
				}
				values = [this.getNameFormat()].concat(values);
				return String.format.apply(String, values);
			},

			/**
			 *
			 */
			getNameAttributeNames: function() {
				if(this._cache.nameAttributeNames === undefined) {
					getDefaultNameAttributeNames.apply(this, []);
				}
				return this._cache.nameAttributeNames;
			},

			/**
			 *
			 */
			getNameFormat: function() {
				return this._cache.nameFormat;
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
			newObj: function(key, obj) {
				return this.newInstance(key, obj).getObj();
			},

			/**
			 *
			 */
			getObj: function() {
				var Obj = this.Obj;
				var k;
				// create prototype in case it does not exist
				if(Obj === null) {

					Obj = function(instance) {
						this.$ = instance;
					};

					Obj.prototype = new PersistenceObject();

					var def = this._def;
					for(k in def.attributes) {
						if(def.attributes[k].isManyToOne !== true && def.attributes[k].isKey !== true) {
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

					for(k in def.manyToOne) {
						(function(k) {
							Obj.prototype.__defineGetter__(k, function() {
								var obj = this.$.getAttributeValue(k);
								return obj ? obj.getObj() : null;
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
					}
					for(k in def.oneToOne) {
						(function(k) {
							Obj.prototype.__defineGetter__(k, function() {
								var obj = this.$.getAttributeValue(k);
								return obj ? obj.getObj() : null;
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
					}
					for(k in def.oneToMany) {
						(function(k) {
							Obj.prototype.__defineGetter__(k, function() {
								// copy the array, as the contents will be changed
								var arr = [].concat(this.$.getAttributeValue(k) || []);
								for(var i = 0; i < arr.length; ++i) {
									arr[i] = arr[i] ? arr[i].getObj() : null;
								}
								return arr;
							});
						}).apply(this, [k]);
					}
					this.Obj = Obj;
				}

				return Obj;
			},

			/**
			 *
			 */
			getUnit: function() {
				return this._unit;
			},

			/**
			 *
			 */
			getName: function() {
				return this._name;
			},

			/**
			 *
			 */
			getQName: function() {
				return String.format('%s:%s', this._unit.getName(), this._name);
			},

			/**
			 *
			 */
			getDefinition: function() {
				return this._def;
			},

			/**
			 *
			 * @param name
			 * @returns
			 */
			getMeta: function(name) {
				return js.get(name, this._def.meta);
			},

			/**
			 *
			 */
			getKey: function() {
				return this._key;
			},

			/**
			 *
			 */
			getKeyName: function() {
				if(this._cache.keyName === COMPOUND_KEY) {
					throw new Error(String.format("Entity %s has a compound key", entity.getQName()));
				}
				if(this._cache.keyName === undefined) {
					throw new Error(String.format("Entity %s doesn't have a key", entity.getQName()));
				}
				return this._cache.keyName;
			},

			/**
			 *
			 */
			getKeyColumn: function() {
				var column = this._cache.keyColumn ;
				if(column !== undefined) {
					return column;
				}
				return (this._cache.keyColumn = this.getColumns(this.getKeyName())[0]);
			},

			/**
			 *
			 */
			getColumns: function(attributes) {
				if(attributes === undefined) {
					if(this._cache.columns === undefined) {
						this._cache.columns = this.getColumns("*");
					}
					return this._cache.columns;
				}

				var attrs = this.getAttributes(attributes);
				var columns = [];

				for(var k in attrs) {
					var attribute = attrs[k];
					var columnName;

					if(attribute.attribute === undefined) {
						columnName = attrs[k].columnName || k;
					} else {
						columnName = this.getAttribute(attribute.attribute).columnName || attribute.attribute;
					}
					columns.push({columnName: columnName, attributeName: k, attribute: attribute});
				}

				return columns;
			},

			/**
			 *
			 */
			getAttribute: function(name) {
				if(name.indexOf('.') !== -1) {
					return this.getAttributes(name)[name];
				}
				// TODO speed this up
				return this.getAttributes(name)[name];
			},

			/**
			 *
			 */
			getAttributes: function(which) {
				if(which === undefined) {
					if(this._cache.attributes === undefined) {
						this._cache.attributes = this.getAttributes(['*']);
					}
					return this._cache.attributes;
				} else if(typeof which === 'string') {
					which = which.split(',');
				}
				var res = {};
				var def = this._def;
				var a, i, k, o, r, s;
				var o2m;
				var obj, entity;

				for(i = 0; i < which.length; ++i) {
					k = which[i];
					if(k.charAt(0) === '*') {
						if(k === '**') {
							for(k in def.oneToMany) {
								res[k] = def.oneToMany[k];
							}
						}
						for(k in def.attributes) {
							a = def.attributes[k];
							if(a.isManyToOne !== true && a.isKey !== true) {
								res[k] = a;
							}
						}
						for(k in def.manyToOne) {
							res[k] = def.manyToOne[k];
						}
						for(k in def.oneToOne) {
							res[k] = def.oneToOne[k];
						}
					} else if(k.indexOf('.') !== -1) {
						s = k.split('.');
						k = s.splice(0, 1)[0];
						o2m = false;
						r = def.manyToOne[k] || def.oneToOne[k];
						if(r === undefined) {
							r = def.oneToMany[k];
							o2m = true;
						}
						if(r === undefined) {
							throw new Error(String.format('Attribute %s.%s does not exist', this.getQName(), k));
						}
						res[k] = js.mixIn({}, r);
						if(o2m === false) {
							entity = r.entity;
							obj = entity.getAttributes(s.join('.'));
							for(var oo in obj) {
								res[k + '.' + oo] = obj[oo];
							}
						}
					} else {
						o = def.attributes[k] || def.manyToOne[k] || def.oneToMany[k] || def.oneToOne[k];
						if(o === undefined) {
							throw new Error(String.format('Attribute %s.%s does not exist', this.getQName(), k));
						}
						res[k] = o;
					}
				}

				return res;
			},

			/**
			 *
			 */
			getOneToManyAttributes: function(referencing) {
				var r;
				if(referencing !== undefined) {
					r = {};
					for(var k in this._def.oneToMany) {
						if(this._def.oneToMany[k].entity === referencing) {
							r[k] = this._def.oneToMany[k];
						}
					}
				} else {
					r = this._def.oneToMany;
				}
				return r;
			},

			/**
			 *
			 */
			getManyToOneAttributes: function(referencing) {
				var r;
				if(referencing !== undefined) {
					r = {};
					for(var k in this._def.manyToOne) {
						var m2o = this._def.manyToOne[k];
						if(m2o.entity === referencing || m2o.attribute === referencing) {
							r[k] = m2o;
						}
					}
				} else {
					r = this._def.manyToOne;
				}
				return r;
			},

			/**
			 *
			 */
			getOneToOneAttributes: function(referencing) {
				var r;
				if(referencing !== undefined) {
					r = {};
					for(var k in this._def.oneToOne) {
						if(this._def.oneToOne[k].entity === referencing) {
							r[k] = this._def.oneToOne[k];
						}
					}
				} else {
					r = this._def.oneToOne;
				}
				return r;
			}
		}
	});

	return Entity;
});