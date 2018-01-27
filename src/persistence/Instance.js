define(function(require) {

	var ns = require("namespace!.");
	var js = require("js");

	var Url = require("../util/net/Url");
	var Persistence = ns.Constructor.reference("./Persistence");

	var Instance = ns.Constructor.define("./Instance", {

		/**
		 *
		 * @param entity
		 * @param key
		 * @param object
		 */
		Instance: function(entity, key, object) {
			this._entity = entity;
			this._key = key;
			this._object = object || {};
			this._dirty = {};
		},

		Prototype: {
			_entity: null,
			_key: null,
			_object: null,
			_obj: null,
			_dirty: null,

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
			 * @overrides cavalion.org/data/Source.prototype.isDirty
			 */
			isDirty: function(attribute) {
				if(attribute !== undefined) {
					return js.keys(this._dirty).indexOf(attribute) !== -1;
				}

				return js.keys(this._dirty).length > 0;
			},

			/**
			 *	@overrides cavalion.org/data/Source.prototype.notifyEvent
			 */
			notifyEvent: function(event, data) {
				Persistence.instanceNotifyEvent(this, event, data);
			},

			/**
			 *	@overrides cavalion.org/data/Source.prototype.getAttributeValue
			 */
			getAttributeValue: function(name) {
				name = name.split(".");
				var value = this._object[name.splice(0, 1)[0]];
				if(name.length) {
					if(value instanceof Instance) {
						return value.getAttributeValue(name.join("."));
					} else {
						return undefined;
					}
				}
				return value;
			},

			/**
			 *	@overrides cavalion.org/data/Source.prototype.setAttributeValue
			 */
			setAttributeValue: function(name, value, changes, merging) {
				var attribute;

	//console.log(String.format("%n.%s := %n", this, name, value));

				name = name.split(".");
				if(name.length > 1) {
					var key = name.shift();
					var instance = this._object[key];
					if(!(instance instanceof Instance)) {
						attribute = this._entity.getAttribute(key);
						if(attribute.entity === undefined || attribute.oneToMany === true) {
							throw new Error(String.format("%s.%s is not a many-to-one attribute", this._entity.getName(), key));
						}
						instance = attribute.entity.newInstance();
						this.setAttributeValue(key, instance, changes, merging);
					}
					instance.setAttributeValue(name.join("."), value, changes, merging);
				} else {
					name = name[0];
					attribute = this._entity.getAttribute(name);

					var changed = false;
					var oldValue = this._object[name];
					var hadValue = js.keys(this._object).indexOf(name) !== -1;
					var isNew = this._key === null;

					// FIXME Explain expression below...
					if(oldValue === undefined || changes === undefined || this._dirty[name] === undefined) {
						// no value or not called from merge or not dirty
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

						if(changed === true) {
							this._object[name] = value;
							// oneToMany is allowed, so that iphone:ui.forms.persistence.Edit<sikb.MeetpuntBodemlaag> works better ;-)
							if(/*attribute.isOneToMany !== true && */(hadValue === true || isNew === true)) {
								if(this._dirty[name] === undefined /*&& oldValue !== undefined*/ && merging !== true) {
									this._dirty[name] = {oldValue: oldValue, attribute: attribute};
								}

								if(this._dirty[name] !== undefined) {
									this._dirty[name].time = new Date().getTime();
								}
							}

							if(changes !== undefined) {
								changes[name] = {oldValue: oldValue, newValue: value};
							} else {
								var obj = {};
								obj[name] = {oldValue: oldValue, newValue: value};
								this._object[name] = value;
								this.notifyEvent("attributesChanged", obj);
							}
						}
					}
				}
			},

			/**
			 *
			 * @param attributes
			 */
			getAttributeValues: function(attributes) {
				var r = [];
				attributes.split(",").forEach(function(attribute) {
					if(attribute === ".") {
						r.push(this);
					} else {
						r.push(this.getAttributeValue(attribute));
					}
				}, this);
				return r;
			},

			/**
			 *
			 * @param values
			 * @param prefix
			 */
			setAttributeValues: function(values, prefix) {
				var path = [];
				if(prefix !== undefined) {
					path.push(prefix);
				}

				for(var k in values) {
					var v = values[k];
					path.push(k);
					if(v !== null && typeof v === "object" && !(v instanceof Date) &&
							!(v instanceof Instance)) {
						this.setAttributeValues(v, path.join("."));
					} else {
						this.setAttributeValue(path.join("."), values[k]);
					}
					path.pop();
				}
			},

			/**
			 *
			 */
			getEntity: function() {
				return this._entity;
			},

			/**
			 *
			 */
			getKey: function() {
				return this._key !== null ? this._key : String.format("/%d", this.hashCode());
			},

			/**
			 *
			 */
			setKey: function(value) {
				if(this._key !== value) {
					this._key = value;
					this.notifyEvent("attributesChanged", {'.': {oldValue: null, newValue: value}});
				}
			},

			/**
			 *
			 */
			getObj: function() {
				var r = this._obj;
				if(r === null) {
					var Obj = this._entity.getObj();
					r = (this._obj = new Obj(this));
				}
				return r;
			},

			/**
			 *
			 */
			getObject: function() {
				return this._object;
			},

			/**
			 *
			 */
			getPreferredKey: function() {
				return this._preferredKey || null;
			},

			/**
			 *
			 */
			setPreferredKey: function(value) {
				this._preferredKey = value;
			},

			/**
			 *
			 */
			isManaged: function() {
				return this._key !== null;
			},

			/**
			 *
			 */
			getName: function() {
				return this._entity.nameOf(this);
			},

			/**
			 *
			 */
			getDirtyObject: function() {
				var obj = {};
				var dirty = this._key === null ? this._object : this._dirty;
				for(var k in dirty) {
					// Filter out one-to-many attribute, as they currently cause problems in VeldwerkM, Edit<sikb.MeetpuntBodemlaag>
					if(dirty[k].attribute === undefined || dirty[k].attribute.isOneToMany !== true) {
						obj[k] = this._object[k];
					}
				}
				return obj;
			},

			/**
			 *	Merges the current object with value, leaving dirty attributes intact, except when
			 *	reset_dirty is set to true, in which case all values will be merged.
			 *
			 *	Typically called by ./Persistence.prototype.processInstance/s()
			 */
			merge: function(value, reset_dirty) {
				var changes = {};

				if(reset_dirty === true) {
					reset_dirty = this.isDirty();
					this._dirty = {};
	//console.log(String.format("%n - reset dirty", this), js.cs());
				}

				var keyName = this._entity.getKeyName();
				for(var k in value) {
					// FIXME when fetch_attributes is used in ./Query/View the key value is returned, ignore
					if(k !== keyName) {
						this.setAttributeValue(k, value[k], changes, true);
					}
				}
				if(js.keys(changes).length > 0) {
					this.notifyEvent("attributesChanged", changes);
				}
				if(reset_dirty === true) {
					this.notifyEvent("changed");
				}
			},

			/**
			 *	Restore all dirty attributes
			 */
			revert: function() {
				if(js.keys(this._dirty).length > 0) {
					var changes = {};
					for(var k in this._dirty) {
						changes[k] = {oldValue: this._object[k], newValue: this._object[k]};
						this._object[k] = this._dirty[k].oldValue;
					}
					this._dirty = {};
					this.notifyEvent("attributesChanged", changes);
				}
			}
		},

		/**
		 *
		 * @param instance
		 * @returns
		 */
		NameOf: function(instance) {
			var name = instance.getName();
			if(name !== null) {
				return String.format("[instance %s[%s - %s]#%d]", instance._entity.getQName(), instance._key,
						name, instance.hashCode());
			}
			return String.format("[instance %s[%s]#%d]", instance._entity.getQName(), instance._key,
					instance.hashCode());
		}

	});

	Url.registerToUrlParamValueFactory(Instance, function(instance) {
		return instance.getKey();
	});

	return Instance;

});
