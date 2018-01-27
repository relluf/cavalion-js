define(function(require) {

	var Listeners = require("js/defineClass");
	var js = require("js");
	var Method = require("js/Method");

	return Listeners(require, {

		prototype: {

			/**
			 *
			 */
			constructor: function(owner, listeners) {
				this._owner = owner;
				this._listeners = {};

				if(owner.hasOwnProperty("destroy")) {
					Method.connect(owner, "destroy", this, "destroyed", "before");
				}

				for(var k in listeners) {
					this.add(k, listeners[k]);
				}
			},

			_owner: null,
			_listeners: null,

			/**
			 *
			 * @param cache
			 */
			destroyed: function(cache) {
				Method.disconnect(this._owner, "destroy", this, "destroyed");

				var names = js.keys(this._listeners);
				for(var n = 0; n < names.length; ++n) {
					var name = names[n];
					var lis = this._listeners[name];
					for(var l = 0; l < lis.length; ++l) {
						Method.disconnect(this._owner, name, lis[l], "callback");
					}
				}

				this._listeners = {};

				// In case the owner will be cached, remove this/these (listeners) from the owner
				// Cached/destroyed owners need to setup their listeners again when reinvoked from the cache
				if(cache !== false && this._owner._listeners === this) {
					delete this._owner._listeners;
				}
			},

			/**
			 *
			 */
			getListener: function(k, callback) {
				var lis = this._listeners[k];
				for(var i = 0, l = lis.length; i < l; ++i) {
					var obj = lis[i];
					if(obj.method === callback) {
						return lis[i];
					}
				}
				throw new Error("Unknown listener");
			},

			/**
			 *
			 */
			getListenerInfo: function(li) {
				for(var k in this._listeners) {
					var lis = this._listeners[k];
					var index = this._listeners[k].indexOf(li);
					if(index !== -1) {
						return {name: k, index: index};
					}
				}
				throw new Error("Unknown listener");
			},

			/**
			 *
			 */
			call: function(name, args) {
			    /*- Copy this._listeners since it might change during callbacks */
				[].concat(this._listeners[name] || []).forEach(function(li) {
					li.method.apply(li.context, args);
				});
			},

			/**
			 *
			 */
			add: function(name, li, type) {
				if(this._listeners[name] === undefined) {
					this._listeners[name] = [];
				}

				if(typeof li !== "object") {
					li = {
						context: this._owner,
						method: li,
						callback: function() {
							this.method.apply(this.context, arguments);
						}
					};
				}

				if(typeof this._owner[name] === "function") {
					if(name === "destroy") {
						if([undefined, "before", "_before"].indexOf(type) === -1) {
							throw new Error("Listen to destroy with type=[_before]");
						}

						// move destroyed to the end of the list, so that other
						// destroy hooks are being called first
						Method.disconnect(this._owner, "destroy", this, "destroyed");
						Method.connect(this._owner, name, li, "callback", type || "before");
						Method.connect(this._owner, "destroy", this, "destroyed", "before");

					} else {
						Method.connect(this._owner, name, li, "callback", type || "after");
					}
					li.connected = true;
				}

				this._listeners[name].push(li);
				return li;
			},

			/**
			 *
			 */
			remove: function(li) {
				var info = this.getListenerInfo(li);
				var lis = this._listeners[info.name];

				if(li.connected) {
					Method.disconnect(this._owner, info.name, li, "callback");
				}

				lis.splice(info.index, 1);
				if(lis.length === 0) {
					delete this._listeners[info.name];
				}
			},

			/**
			 *
			 */
			getOwner: function() {
				return this._owner;
			}
		}
	});
});