/**
 * ResultList.js
 */
define(function(require) {
	
	var ns = require("namespace!.");
	var js = require("js");

	var Instance = require("./Instance");
	var Deferred = require("js/util/Deferred");
	
	var ResultList = ns.Constructor.define("./ResultList", {

		/**
		 * 
		 * @param objs
		 */
		ResultList: function(objs) {
			this._objs = objs;
		},
		
		Prototype: {
			_objs: null,
			_monitors: null,

			/**
			 * 
			 * @param attr
			 * @param f
			 */
			forEach: function(attr, f) {
				if(f === undefined) {
					this._objs.forEach(attr);
				} else {
					this._objs.forEach(function(obj) {
						return f(obj[attr]);					
					});
				}			
			},

			/**
			 * 
			 * @param f
			 * @returns
			 */
			forEachInstance: function(f) {
				return this.forEach(".", f);
			},

			/**
			 * 
			 * @returns {Array}
			 */
			getObjs: function() {
				var objs = [];
				this.forEachInstance(function(instance) {
					objs.push(instance.getObj());
				});
				return objs;
			},

			/**
			 * 
			 * @param start
			 * @param end
			 * @param callback
			 */
			getRange: function(start, end, callback) {
				if(callback !== undefined) {
					callback();
				}			
			},

			/**
			 * 
			 * @returns {Deferred}
			 */
			close: function() {
				var r = new Deferred();
				r.callback(this);
				return r;
			},
			
			/**
			 * @overrides cavalion.org/data/Source.prototype.getSize
			 */
			getSize: function() {
				return this._objs.length;
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.getObject
			 */
			getObject: function(index) {
				this.getRange(index, index);
				return this._objs[index];
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.getObjects
			 */
			getObjects: function(start, end) {
				//this.getRange(start, end);
				return this._objs;
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.getMonitor
			 */
			getMonitor: function(start, end) {
				var monitor = {
					start: start,
					end: end,
					source: this,
					objs: [],

					__name: function() {
						return String.format("[monitor %d-%d]", this.start, this.end);
					},

					notifyEvent: function(that, args) {
						if(this.process !== undefined) {
							js.setTimeout(this.process.bind(this, that, args), 0);
						}
					}
				};
				this._monitors.push(monitor);

				var objs = this._objs;
				for(var i = start; i <= end; ++i) {
					var obj = objs[i];
					if(obj !== ResultList.NULL) {
						for(var k in obj) {
							if(obj[k] instanceof Instance) {
								monitor.objs.push(obj[k]);
								Function.connect(obj[k], "notifyEvent", monitor, "notifyEvent", "_after");
							}
						}
					}
				}
				return monitor;
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.releaseMonitor
			 */
			releaseMonitor: function(monitor) {
				var index = this._monitors.indexOf(monitor);
				if(index === -1) {
					throw new Error("Unknown monitor");
				}
				this._monitors.splice(index, 1);
				for(var i = 0, l = monitor.objs.length; i < l; ++i) {
					Function.disconnect(monitor.objs[i], "notifyEvent", monitor, "notifyEvent");
				}
			},

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
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.notifyEvent
			 */
			notifyEvent: function(event, data) {
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.getAttributeValue
			 */
			getAttributeValue: function(name, index) {
				var obj = this._objs[index];
				var r = null;
				
				if(obj === undefined) {
					throw new Error(String.format("Out of bounds (%d)", index));
				}
				
				if(obj !== ResultList.NULL) {
					if(obj[name] !== undefined) {
						return obj[name];
					}
					var path = name.split(".");
					if(path.length === 1) {
						obj = obj['.'];
					} else {
						name = path.pop();
						obj = obj[path.join(".")];
					}
					if(obj !== null) {
						if(obj !== undefined) {
							r = obj.getAttributeValue(name);
						} else {
							// must be via fetch_attributes
							this._objs[index]['.'].getAttributeValue(name);
						}
					}
				} else {
					r = cavalion.org/data/Source.PENDING_VALUE;
				}
				return r;
			},

			/**
			 * @overrides cavalion.org/data/Source.prototype.getAttributeValue
			 */
			setAttributeValue: function(name, value, index) {
				var obj = this._objs[index];
				if(obj === ResultList.NULL) {
					throw new Error(String.format("Object %d is not in range", index));
				}
				obj['.'].setAttributeValue(name, value);
				
			/*
				var obj = this._objs[index];
				var r = null;
				if(obj !== ResultList.NULL) {
					var path = name.split(".");
					if(path.length === 1) {
						obj = obj['.'];
					} else {
						name = path.pop();
						obj = obj[path.join(".")];
					}
					if(obj !== null) {
						r = obj.getAttributeValue(name);
					}
				}
				return r;
			*/
			}
		},
		
		Statics: {

			NULL: {
			
				/**
				 *
				 */
				toString: function() {
					return String.format("[object %s.ResultList.NULL]", ns.name);
				}
			}

		}	
		
	});
	
	return ResultList;
});