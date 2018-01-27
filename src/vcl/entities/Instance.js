define(function(require) {

    var Instance = require("js/defineClass");
	var Type = require("js/Type");
	var Method = require("js/Method");
	var js = require("js");

	var Component = require("../Component");

	var Source = require("../../data/Source");
	var SourceEvent = require("../../data/SourceEvent");

	var EntityInstance = require("../../entities/Instance");
	var EM = require("../../entities/EM");

	/**
	 *
	 */
	function sortForCommit(instances) {
		var sorted = [];
		var referenced = [];

		instances.forEach(function(instance) {
			if(referenced.indexOf(instance) === -1) {
				sorted.push(instance);
			} else {
				sorted.splice(0, 0, instance);
			}
			//TODO!!
			//var attrs = instance.getEntity().getOneToManyAttributes();
			//for(var k in attrs) {
			//	var value = instance.getAttributeValue(k);
			//	if(value !== null && referenced.indexOf(value) === -1) {
			//		referenced.push(value);
			//	}
			//}
		});

		return sorted;
	}

    return Instance(require, {

    	inherits: Component,

		implementing: [Source],

    	prototype: {

			_entity: "",
			_attributes: null,
			_instance: null,

			_updating: null,
			_commiting: null,
			_hooks: null,

			_wasDirty: false,

			_onNotifyEvent: null,

			/**
			 * Constructor
			 */
			constructor: function() {
				this._hooks = {};
				this._commiting = [];
				this._updating = [];
				this._attributes = ["*"];
			},

			/**
			 * @see org.cavalion.comp.Component
			 */
			destroy: function() {
				this.setInstance(null);
				this.inherited(arguments);
			},

			/**
			 *	@see Source.prototype.getSize
			 */
			getSize: function() {
				return this._instance !== null ? 1 : 0;
			},

			/**
			 *	@see Source.prototype.getObject
			 */
			getObject: function(index) {
				this.assertInstance();
				return this._instance.getObject();
			},

			/**
			 *	@see Source.prototype.getObjects
			 */
			getObjects: function(start, end) {
				return [this.getObject()];
			},

			/**
			 *	@see Source.prototype.getMonitor
			 */
			getMonitor: function(start, end) {
				this.assertInstance();
				return this._instance.getMonitor(start, end);
			},

			/**
			 *	@see Source.prototype.releaseMonitor
			 */
			releaseMonitor: function(monitor) {
				this.assertInstance();
				return this._instance.releaseMonitor(monitor);
			},

			/**
			 *	@see Source.prototype.isActive
			 */
			isActive: function() {
				return this._instance !== null;
			},

			/**
			 *	@see Source.prototype.isBusy
			 */
			isBusy: function() {
				var instance = this._instance;
				if(instance !== null) {
					return this._updating.indexOf(instance) !== -1 ||
						this._commiting.indexOf(instance) !== -1;
				}

				return false;
			},

			/**
			 *	@see Source.prototype.notifyEvent
			 */
			notifyEvent: function(event, data) {
				this.dispatch("notifyevent", event, data);
			},

			/**
			 *	@see Source.prototype.getAttributeValue
			 */
			getAttributeValue: function(name) {
				this.assertInstance();
				return this._instance.getAttributeValue(name);
			},

			/**
			 *	@see Source.prototype.setAttributeValue
			 */
			setAttributeValue: function(name, value) {
				this.assertInstance();

				if(this._hooks[name] !== undefined && !(value instanceof EntityInstance)) {
					value = null;
				}

				this._instance.setAttributeValue(name, value);
			},

			/**
			 *
			 */
			assertInstance: function() {
				if(this._instance === null) {
					throw new Error("No instance available");
				}
			},

			/**
			 *
			 */
			assertEntity: function() {
				if(this._entity === null) {
					throw new Error("No entity set");
				}
			},

			/**
			 *
			 */
			assertManaged: function() {
				if(!this._instance.isManaged()) {
					throw new Error("Instance not managed");
				}
			},

			/**
			 *
			 */
			hookInstance: function(instance, prefix) {
				var wasDirty = this.isDirty();

				if(prefix === undefined) {
					prefix = ".";
				}
				//console.log(String.format("hookInstance: %n - '%s'", instance, prefix));

				var obj;
				var hash = instance.hashCode();
				var map = this._hooks[prefix];

				if(map === undefined) {
					map = this._hooks[prefix] = {};
				}

				if(map[hash] === undefined) {
					obj = map[hash] = {
						owner: this,
						prefix: prefix,
						instance: instance,
						notifyEvent: function(event, data) {
							this.owner.receiveInstanceEvent(this.instance, this.prefix, event, data);
						}
					};
					Method.connect(instance, "notifyEvent", obj, "notifyEvent");
				}

				var isDirty = this.isDirty();
				if(isDirty !== wasDirty) {
					this.notifyEvent("dirtyChanged", this.isDirty());
				}
			},

			/**
			 *
			 */
			unhookInstance: function(instance, prefix) {
				if(prefix === undefined) {
					prefix = ".";
				}

				var hash = instance.hashCode();
				var map = this._hooks[prefix];
				if(map === undefined) {
					throw new Error(String.format("Instance %n not hooked", instance));
				}
				var obj = map[hash];
				if(obj === undefined) {
					throw new Error(String.format("Instance %n not hooked", instance));
				}
				delete map[hash];
				Method.disconnect(obj.instance, "notifyEvent", obj, "notifyEvent");
			},

			/**
			 *
			 */
			hookInstances: function(instance, prefix) {
				if(prefix === undefined) {
					this.hookInstance(instance, prefix);
				}
				this._attributes.forEach(function(k) {
					if(k.indexOf(".") !== -1 && (prefix === undefined || k.indexOf(prefix) === 0)) {
						var a = k.split(".");
						a.pop();
						a = a.join(".");
						instance = this.getAttributeValue(a);
						if(instance instanceof EntityInstance) {
							this.hookInstance(instance, a);
						}
					}
				}, this);
			},

			/**
			 *
			 */
			unhookInstances: function(prefix) {
				if(prefix === undefined) {
					prefix = ".";
				}

				for(var m in this._hooks) {
					if(prefix === "." || m.indexOf(prefix) === 0) {
						var map = this._hooks[m];
						for(var k in map) {
							var obj = map[k];
							Method.disconnect(obj.instance, "notifyEvent", obj, "notifyEvent");
						}
						delete this._hooks[m];
					}
				}
			},

			/**
			 *
			 */
			onnotifyevent: function(event, data) {
				this.fire("onNotifyEvent", arguments);
			},

			/**
			 *
			 */
			checkDirty: function() {
				var isDirty = this.isDirty();
				if(this._wasDirty !== isDirty) {
					this._wasDirty = isDirty;
					this.notifyEvent(SourceEvent.dirtyChanged, isDirty);
				}

			},

			/**
			 *
			 */
			receiveInstanceEvent: function(instance, prefix, event, data) {
				this.setTimeout("checkDirty", 200);
				if(event === SourceEvent.dirtyChanged) {
					/*- TODO the first line should be here and work, but doesn't */
				} else if(event === SourceEvent.attributesChanged) {
					var obj = {};

					for(var k in data) {
						var attribute = k;
						if(prefix !== ".") {
							attribute = String.format("%s.%s", prefix, attribute);
						}
						if(this._attributes[0] === "*" || this._attributes.indexOf(attribute) !== -1) {
							if(this._hooks[attribute]) {
								instance = data[k].oldValue;
								if(instance instanceof EntityInstance) {
									this.unhookInstances(attribute);
								}
								instance = data[k].newValue;
								if(instance instanceof EntityInstance) {
									this.hookInstances(instance, attribute);
								}
							} else if(instance.getAttributeValue(attribute) instanceof EntityInstance) {
								// no hook for attribute, so let's hook it
								this.hookInstances(instance, attribute);
							}
							this._attributes.forEach(function(a) {
								if(a.indexOf(attribute) === 0) {
									obj[a] = {};
								}
							});
							obj[attribute] = data[k];
						}
					}
					this.notifyEvent(SourceEvent.attributesChanged, obj);
				} else {
					this.notifyEvent(SourceEvent.changed);
				}
			},

			/**
			 *
			 */
			getInstancesToPersist: function() {
				var instances = [];
				// loop in descending sorted order
				var keys = js.keys(this._hooks).sort();
				while(keys.length > 0) {
					var m = keys.pop();
					var map = this._hooks[m];
					for(var k in map) {
						var obj = map[k];
						if(obj.instance.isDirty() || !obj.instance.isManaged()) {
							instances.push(obj.instance);
						}
					}
				}
				return instances;
			},

			/**
			 *
			 */
			getInstancesToRemove: function() {
				return [];
			},

			/**
			 *
			 */
			commit: function() {

				var instance = this._instance;
				var wasBusy = this.isBusy();
				var persist, remove;
				var r;

				this.assertInstance();
				if(this._commiting.indexOf(instance) !== -1) {
					throw new Error("Already commiting");
				}

				var me = this;
					/**
					 *
					 */
					function fn(res) {
						var i = me._commiting.indexOf(instance);
						me._commiting.splice(i, 1);
						if(me.isBusy() === false) {
							me.notifyEvent(SourceEvent.busyChanged, false);
						}
						me.setTimeout("checkDirty", 200);
						return res;
					}

				persist = sortForCommit(this.getInstancesToPersist());
				remove = this.getInstancesToRemove();

				if(!persist.length && !remove.length) {
					throw new Error("Nothing to commit");
				}

				r = EM.commit(persist);

				this._commiting.push(instance);

				if(wasBusy === false) {
					this.notifyEvent(SourceEvent.busyChanged, true);
				}

				r.addBoth(fn);
				return r;
			},

			/**
			 *
			 */
			refresh: function() {
				// TODO define this in ../data/Source?
				this.fetch();
			},

			/**
			 *
			 */
			fetch: function() {

				var instance = this._instance;
				var r;

				this.assertInstance();
				this.assertManaged();

				var key = instance.getKey();
				var wasBusy = this.isBusy();
				var me = this;

					/**
					 *
					 */
					function remove() {
						me._updating.splice(me._updating.indexOf(instance), 1);
						if(me.isBusy() === false) {
							me.notifyEvent(SourceEvent.busyChanged, false);
						}
					}

					/**
					 *
					 */
					function cb(res) {
						remove.apply(me, []);
						if(res.tuples.length !== 1) {
							throw new Error(String.format("Instance %s#%s not available",
									me._entity, key));
						}
						return res.instances[0];
					}

					/**
					 *
					 */
					function err(res) {
						remove.apply(me, []);
						throw new Error(String.format("Instance %s#%s not available",
								me._entity, key), res);
					}

				r = EM.query(this._entity, this._attributes, {
							count: false, where: EM.eb.eq("id", key)});
				this._updating.push(instance);

				if(wasBusy === false) {
					this.notifyEvent(SourceEvent.busyChanged, true);
				}

				r.addCallbacks(cb, err);
				return r;
			},

			/**
			 * 	Reverts all changes made to managed attributes
			 */
			revert: function() {
				this.assertInstance();

				var instances = [];
				for(var m in this._hooks) {
					var map = this._hooks[m];
					for(var k in map) {
						instances.push(map[k].instance);
					}
				}

				instances.forEach(function(instance) {
					instance.revert();
				});
			},

			/**
			 *
			 */
			remove: function() {
				var instance = this._instance;
				var wasBusy = this.isBusy();
				var me = this;
				var r;

					function fn(result) {
						var i = me._commiting.indexOf(instance);
						me._commiting.splice(i, 1);
						if(me.isBusy() === false) {
							me.notifyEvent(SourceEvent.busyChanged, false);
						}

						if(Error.isError(result)) {
							me.setInstance(instance);
						}

						return result;
					}

				this.assertInstance();
				this.assertManaged();
				this.setInstance(null);

				r = EM.remove(instance);
				this._commiting.push(instance);

				if(wasBusy === false) {
					this.notifyEvent(SourceEvent.busyChanged, true);
				}

				r.addBoth(fn);
				return r;
			},

			/**
			 *
			 */
			canCommit: function() {
				if(this.isDirty() === true) {
					return this._instance !== null ? this.canUpdate() &&
							this._commiting.indexOf(this._instance) === -1 : false;
				}
				return false;
			},

			/**
			 *
			 */
			canUpdate: function() {
				return this._instance !== null ?
						this._updating.indexOf(this._instance) === -1 : false;
			},

			/**
			 *
			 */
			canRevert: function() {
				return this.canCommit() === true;
			},

			/**
			 *
			 */
			canRemove: function() {
				return this._instance !== null && this._instance.isManaged() &&
						this._commiting.indexOf(this._instance) === -1;
			},

			/**
			 *
			 */
			isDirty: function() {
				if(this._instance !== null) {
					for(var m in this._hooks) {
						var map = this._hooks[m];
						for(var k in map) {
							if(map[k].instance.isDirty()) {
								return true;
							}
						}
					}
				}

				return false;
			},

			/**
			 *
			 */
			resetDirty: function() {
				this.assertInstance();
				for(var m in this._hooks) {
					var map = this._hooks[m];
					for(var k in map) {
						map[k].instance.merge({}, true);
					}
				}
			},

			/**
			 *
			 */
			getAttributes: function() {
				return this._attributes.join(".");
			},

			/**
			 *
			 */
			setAttributes: function(value) {
				this._attributes = value.replace(/\s/g, "").split(",");
			},

			/**
			 * Returns an array with all hooked (hookInstance) instances, in no particular order
			 */
			getInstances: function() {
				var r = [];
				var map = this._hooks['.'];
				for(var k in map) {
					r.push(map[k].instance);
				}
				return r;
			},

			/**
			 *
			 */
			getInstance: function() {
				return this._instance;
			},

			/**
			 *
			 */
			setInstance: function(value, update) {
				if(this._instance !== value) {
					var wasBusy = this.isBusy();
					var wasActive = this.isActive();
					var active;

					if(this._instance !== null) {
						this.unhookInstances();
					}
					active = (this._instance = value) !== null;
					if(value !== null) {
						this.hookInstances(value);
						// FIXME This should be done via setEntity?
						this._entity = value._entity;
						if(value.isManaged() && update !== false) {
							this.fetch();
						}
						this.notifyEvent(SourceEvent.changed, {});
						this.checkDirty();
					} else {
						if(this._wasDirty === true) {
							this._wasDirty = false;
							this.notifyEvent(SourceEvent.dirtyChanged, false);
						}
					}

					var busy = this.isBusy();
					if(busy !== wasBusy) {
						this.notifyEvent(SourceEvent.busyChanged, busy);
					}

					if(active !== wasActive) {
						this.notifyEvent(SourceEvent.activeChanged, active);
					}
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
			setEntity: function(value) {
				if(this._entity !== value) {
					this._entity = value;
				}
			},

			/**
			 *
			 */
			getOnNotifyEvent: function() {
				return this._onNotifyEvent;
			},

			/**
			 *
			 */
			setOnNotifyEvent: function(value) {
				this._onNotifyEvent = value;
			}
    	},

    	properties: {

    		"attributes": {
    			type: Type.STRING,
    			set: Function,
    			defaultValue: "*"
    		},

    		"entity": {
    			type: Type.STRING
    		},

    		"onNotifyEvent": {
    			type: Type.EVENT,
    			editorInfo: {
    				defaultValue: "(function(event, data) {})"
    			}
    		}

    	}

    });

});
