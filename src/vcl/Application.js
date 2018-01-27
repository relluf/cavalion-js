define(function(require) {

	var Application = 		require("js/defineClass");
	var Type =				require("js/Type");
	var EventDispatcher = 	require("./EventDispatcher");
	var Component = 		require("./Component");
	var query =				require("./Component.query");
	var CssRules = 			require("./CssRules");

	var instances = [];

	return (Application = Application(require, {
		inherits: Component,
		statics: {
			instances: instances,
			get: function() {
				if(instances.length !== 1) {
					throw new Error("Unexpected: Multiple instances");
				}
				return instances[0];
			},
			readStorage: function(key, callback, errback) {
				var app = this.get();
				return app.readStorage.apply(app, arguments);
			},
			writeStorage: function(key, value, callback, errback) {
				var app = this.get();
				return app.writeStorage.apply(app, arguments);
			}
		},
		prototype: {
			_dispatcher: null,
			_css: null,
			_cssRules: null,
			_icon: "",
			_title: "",
			_namespace: "",
			_states: null,
			_stateIndex: -1,
			_onGetStorageKey: null,
			_onGetState: null,
			_onSetState: null,
			_onStateChange: null,
			_onToast: null,

			constructor: function() {
				instances.push(this);
			},
			destroy: function() {
				instances.splice(instances.indexOf(this), 1);
			},
			loaded: function() {
				/**
				 * @overrides ./Component.prototype.loaded
				 */
			    if(!this.isDesigning()) {
    				this._dispatcher = new EventDispatcher();
    				this._dispatcher.activate();

    				window.onpopstate = function(evt) {
    					this.popState(evt);
    				}.bind(this);
			    }

				return this.inherited(arguments);
			},
			getSpecializer: function() {
				/** @overrides ./Component.prototype.getSpecializer */
			    var r = this.inherited(arguments);
			    if(r === "") {
			        r = this._name;
			    }
			    return r;
			},
            qsa: function(selector, context) {
				/** @overrides: ./Component.prototype.qsa */
				var me = this;
                return query(selector, context || this, 
                    Component.all.reduce(function(arr, comp) {
                        if(me.isOwnerOf(comp)) {
                            arr.push(comp);
                        }
                        return arr;
                    }, [])
                );
            },

			log: function() {
				/** */
				//console.log()
			},
			toast: function(options) {
				/** */
				return this.fire("onToast", [options || {}]);
			},
			getStorageKey: function(forKey) {
				/** */
				if(!(forKey instanceof Array)) {
					return this.inherited(arguments);
				}
				
				/*- When called by an owned component forKey is an array, where the first element holds a reference to the owned component. The second element contains the original forKey */
				var r = this.fire("onGetStorageKey", arguments);
				if(r === undefined) {
					r = forKey[0].getUri() + "$" + forKey[1];
				}
				
				if(this._namespace !== "") {
					r = this._namespace + " " + r;
				}
				
				return r;
			},
			alert: function(message, callback) {
				window.console.log(message);
				window.alert(message);
				if(typeof callback === "function") {
					callback();
				}
			},
			error: function(message, err, callback) {
				window.console.error(message, err);
				window.alert(message);
				if(typeof callback === "function") {
					callback();
				}
			},
			prompt: function(message, value, callback) {
				value = window.prompt(message, value);
				if(typeof callback === "function") {
					callback(value);
				}
			},
			confirm: function(message, callback) {
				var value = window.confirm(message);
				if(typeof callback === "function") {
					callback(value);
				}
			},
			onstatechange: function() {
				return this.fire("onStateChange", arguments);
			},
			getNamespace: function() {
				return this._namespace;
			},
			setNamespace: function(value) {
				this._namespace = value;
			},
			getTitle: function() {
				return this._title;
			},
			setTitle: function(value) {
				this._title = value;
				if(!this.isDesigning()) {
					document.title = value;
				}
			},
			finalize: function() {
				this._dispatcher.release();
				delete Application.instance;
			},
			getState: function() {
				return this.fire("onGetState") || {};
			},
			setState: function(state) {
				return this.fire("onSetState", [state]);
			},
			canBack: function() {
				return this._stateIndex > 0;
			},
			canForward: function() {
				return this._states ? this._stateIndex < this._states.length - 1 : false;
			},
			pushState: function() {
				if(!this._poppingState) {
					if(!this.hasOwnProperty("_states")) {
						this._states = [];
					}

					var state = this.getState();
					this._states.push(state);
					this._stateIndex = this._states.length - 1;
					
//console.log("pushState", state);
					state.url = state.url || window.location.toString();
					
					window.history.pushState({index: this._states.length - 1}, 
						state.title, state.url);

					this.dispatch("statechange", state);
				}
			},
			replaceState: function() {
				if(!this._poppingState) {
					if(!this.hasOwnProperty("_states")) {
						this._states = [this.getState()];
						this._stateIndex = 0;
					}

					var oldState = this._states[this._stateIndex];
					var newState = this.getState();

					this._states[this._stateIndex] = newState;
					
					newState.url = newState.url || window.location.toString();
					
// console.log("replaceState", newState);
//					this.log("replace: " + this._stateIndex, newState);

					if(this._stateIndex === 0 || oldState.title !== newState.title || oldState.url !== newState.url) {
						window.history.replaceState({index: this._stateIndex}, newState.title, newState.url);
					}

					this.dispatch("statechange", newState);
				}
			},
			popState: function(evt) {
				if(evt.state && this._states) {
					var has = this.hasOwnProperty("_poppingState");
					this._poppingState = true;
					try {
						var index = evt.state.index;
						var state = this._states[index];
						this._stateIndex = index;
						this.setState(state);
//						this.log(String.format("pop: %d", index), state);
						this.dispatch("statechange", state);
					} finally {
						if(!has) {
							delete this._poppingState;
						}
					}
				}
			},
			getIcon: function() {
				return this._icon;
			},
			setIcon: function(value) {
                if(this._icon !== value) {
                    var link = document.querySelectorAll("html head link[rel='icon shortcut']")[0];
                    if(link === undefined) {
                        link = document.createElement("link");
                        link.setAttribute("rel", "icon shortcut");
                        link.setAttribute("type", "image/x-icon");
                        document.querySelector("html head").appendChild(link);
                    }
                    link.setAttribute("href", value);
                    this._icon = value;
                }
			},
			getCssRules: function() {
				/**
				 *
				 * @returns {CssRules}
				 */
				return this._cssRules;
			},
			getCss: function() {
				return this._css;
			},
			setCss: function(value) {
				if(value === null || (typeof value === "object" && js.keys(value).length === 0)) {
					this._cssRules = null;
				} else {
					if(typeof value === "string") {
						value = js.str2obj(value);
					} else if(value instanceof Array) {
						value = js.str2obj(value.join(""));
					}

                    // resolve references to other classes
					CssRules.normalize(String.of(this.constructor), value);

					if(this._cssRules === null) {
						this._cssRules = new CssRules();
						this._cssRules.setSelector("html");
					}
					this._cssRules.setRules(value);
				}
				this._css = value;
			}
		},
		properties: {
			"css": {
				Set: Function,
				set: function(value) {
					if(typeof value === "string") {
						value = js.str2obj(value);
					} else if(value instanceof Array) {
						value = js.str2obj(value.join(""));
					}

					function superMixIn(dest, src) {
						for( var k in src) {
							if(src.hasOwnProperty(k)) {
								var v = src[k];
								if(v !== null && Object.prototype.toString.apply(v, []) === "[object Object]") {
									dest[k] = dest[k] || {};
									superMixIn(dest[k], v);
								} else {
									dest[k] = v;
								}
							}
						}
						return dest;
					}

					if(this.hasOwnProperty("_css")) {
						value = superMixIn(js.mixIn(this._css), value);
					}

					this.setCss(value, true);
				},
				type: Type.OBJECT,
				def: null
			},
			"namespace": {
				type: Type.STRING,
				set: Function
			},
			"title": {
				type: Type.STRING,
				set: Function
			},
			"icon": {
                type: Type.STRING,
                set: Function
			},
			"onToast": {
				type: Type.EVENT
			},
			"onGetStorageKey": {
				type: Type.EVENT
			},
			"onGetState": {
				type: Type.EVENT
			},
			"onSetState": {
				type: Type.EVENT
			}
		}
	}));

});