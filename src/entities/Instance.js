define(function(require) {

	var Instance = require("js/defineClass");
	var Source = require("../data/Source");
	var js = require("js");

	var all = {};
	var log = [];

	return (Instance = Instance(require, {
		implementing: [Source],
		statics: {
			all: all,
			log: log,
			model: null,
			getModel: function(entity) {
				var r;
				if(!this._model || (r = this._model[entity] === undefined)) {
					r = entity;
				} else {
					
				}
				return r;
			},
			get: function(entity, key) {
				var instance;
				if(all[entity] === undefined) {
					all[entity] = {};
				}
				if((instance = all[entity][key]) === undefined) {
					instance = all[entity][key] = new Instance(entity, key);
				}
				return instance;
			},
			clearAll: function() {
				for(var k in all) {
					delete all[k];
				}
			}
		},
		prototype: {
			_entity: null,
			_values: null,
			_key: null,
			_dirty: null,
			_model: null,
			
			constructor: function(entity, key, values) {
				if(typeof entity === "string") {
					entity = Instance.getModel(entity);
				}
				
				this._entity = entity;
				this._key = key;
				this._values = values || {};
				this._dirty = {};
			},

			/**
			 * @see js/serialize
			 */
			serializeJson: function() {
				return js.sj(String.format(
				    "@@%s:%s", this._entity, this.getKey()));
			},

			/**
			 * @overrides Object.prototype.toString
			 */
			toString: function() {
				return String.format("%s:%s#%d", this._entity, this._key, this.hashCode());
			},
			getEntity: function() {
				return this._entity;
			},
			getKey: function() {
				if(this._key === null) {
					return "/" + this.hashCode();
				}
				return this._key;
			},
			setKey: function(value) {
				if(this._key !== value) {
					this._key = value;
					this.notifyEvent("changed", {attributes: "@key"});
				}
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.getSize
			 */
			getSize: function() {
				return 1;
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.getObject
			 */
			getObject: function() {
				return this._values;
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.getObjects
			 */
			getObjects: function() {
				return [this.getObject()];
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.getMonitor
			 */
			getMonitor: function(start, end) {},

			/**
			 * @overrides cavalion.org/data/Source.prototype.releaseMonitor
			 */
			releaseMonitor: function(monitor) {},

			/**
			 * @overrides cavalion.org/data/Source.prototype.isActive
			 */
			isActive: function() {
				return true;
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.isBusy
			 */
			isBusy: function() {
				return false;
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.notifyEvent
			 */
			notifyEvent: function(event, data) {},

			/**
			 * @overrides cavalion.org/data/Source.prototype.getAttributeNames
			 */
			getAttributeNames: function() {
				return this._entity.getAttributeNames();
				// return js.keys(this._value);
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.getAttributeValue
			 */
			getAttributeValue: function(name) {
				var names = name.split(".");
				var value = this._values[names.shift()];
				if(names.length) {
					if(value instanceof Instance) {
						return value.getAttributeValue(names.join("."));
					} else {
						return js.get(names.join("."), value);
					}
				}
				return value;
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.getAttributeValue
			 */
			setAttributeValue: function(name, value, index, changes, preserve_dirty) {
				name = name.split(".");
				if(name.length > 1) {
					var key = name.shift();
					var instance = this._values[key];
					if(!(instance instanceof Instance)) {
						throw new Error("Shitty shit!");
/*
						attribute = this._entity.getAttribute(key);
						if(attribute.entity === undefined || attribute.oneToMany === true) {
							throw new Error(String.format("%s.%s is not a many-to-one attribute", this._entity.getName(), key));
						}
						instance = attribute.entity.newInstance();
						this.setAttributeValue(key, instance, changes, merging);
*/
					}
					instance.setAttributeValue(name.join("."), value, changes, preserve_dirty);
				} else {
					name = name[0];

					var changed = false;
					var oldValue = this._values[name];
					var hadValue = this._values.hasOwnProperty(name);
//					var isNew = this._key === null;

					if(oldValue instanceof Date && value instanceof Date) {
						changed = oldValue.getTime() !== value.getTime();
					} else if(oldValue instanceof Array && value instanceof Array) {
						if(oldValue.length === value.length) {
							for(var i = 0; i < oldValue.length && changed === false; ++i) {
								changed = value.indexOf(oldValue) !== -1;
							}
						} else {
							changed = true;
						}
					} else {
						changed = oldValue !== value;
					}

					/*- Update the value if it changed while not being dirty already */
					if(changed === true && (preserve_dirty !== true || !this.isDirty(name))) {
						this._values[name] = value;
						if(hadValue === true) {// || isNew === true) {
							if(!this._dirty.hasOwnProperty(name)) {
								this._dirty[name] = {oldValue: oldValue, attribute: name};
							}
							this._dirty[name].time = Date.now();

							if(this._dirty[name].oldValue === value) {
								delete this._dirty[name];
							}
						}
						if(changes !== undefined) {
							changes[name] = {oldValue: oldValue, newValue: value};
						} else {
							var obj = {};
							obj[name] = {oldValue: oldValue, newValue: value};
							this._values[name] = value;
							this.notifyEvent("attributesChanged", obj);
						}
					}
				}
			},

			/**
			 * @param value
			 */
			setAttributeValues: function(values, preserve_dirty) {
				var changes = {};
				for(var k in values) {
				    // var value = this.getAttributeValue(k);
				    // if(value instanceof Instance) {
				    //     /*- TODO handle array of instances */
				    //     //console.log("setting", k, "to", values[k], "was", value);
				    // }
					this.setAttributeValue(k, values[k], 0, changes, preserve_dirty);
				}
				// for(var k in changes) {
				// 	log.push([this.toString(), k, values[k]]);
				// }
			},
			isDirty: function(attribute) {
				if(attribute !== undefined) {
					return this._dirty !== null &&
						this._dirty.hasOwnProperty(attribute);
				}
				return js.keys(this._dirty).length > 0;
			},
			isManaged: function() {
				return this._key !== null;
			},
			getDirtyAttributeValues: function(resetDirty) {
				var obj;
				if(this._key !== null) {
					obj = {};
					for(var k in this._dirty) {
						obj[k] = this.getAttributeValue(k);
					}
				} else {
					obj = js.mixIn({}, this._values);
				}

				if(resetDirty === true) {
					this._dirty = {};
					this.notifyEvent("dirtyChanged", false);
				}

				return obj;
			},
			revert: function() {
				if(this.isDirty()) {
					var changes = {};
					var changed = false;
					for(var k in this._dirty) {
						if(this._values[k] !== this._dirty[k].oldValue) {
							changed = true;
							changes[k] = {
								oldValue: this._values[k],
								newValue: this._dirty[k].oldValue
							};
							this._values[k] = this._dirty[k].oldValue;
						}
						delete this._dirty[k];
					}
					if(changed === true) {
						this.notifyEvent("attributesChanged", changes);
					}
					this.notifyEvent("dirtyChanged", false);
					this.notifyEvent("changed");
				}
			},
			resetDirty: function() {
				this._dirty = {};
			}
		}

	}));

});
