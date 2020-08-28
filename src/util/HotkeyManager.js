define(function(require) {

	var HotkeyManager = require("js/defineClass");
	var DocumentHook = require("./DocumentHook");
	var Event = require("./Event");
    var Keyboard = require("./Keyboard");

	function checkAndCall(li, evt, type) {
		if((!li.hasOwnProperty("type") || li.type === "*" || li.type === type) 
		    && (!li.hasOwnProperty("modifiers") || Event.modifiersMatch(evt, 
		    li.modifiers)) && (typeof li.isEnabled !== "function" || 
		    li.isEnabled(evt, type))
        ) {
            return li.callback(evt, type);
		}
	}

	return (HotkeyManager = HotkeyManager(require, {
		inherits: DocumentHook,
		prototype: {
			_events: ["onkeydown", "onkeyup", "onkeypress"],
			_listeners: null,

			constructor: function() {
				this._listeners = {};
			},
			register: function(hotkey, li) {
				if(typeof li === "object") {
					if(typeof hotkey === "string") {					
						li.modifiers = hotkey.toLowerCase().split("+");
						if((li.keyCode = li.modifiers.pop()) !== "*") {
							if(li.keyCode < "0" || li.keyCode > "9") {
	                            if(li.keyCode.length === 1) {
	                                li.keyCode = li.keyCode.toUpperCase()
	                                	.charCodeAt(0);
	                            } else {
	                                li.keyCode = Keyboard.getKeyCode("KEY_" + 
	                                	li.keyCode.toUpperCase());
	                            }
							} else {
								li.keyCode = parseInt(li.keyCode, 10);
							}
						}
					} else {
						li.modifiers = [];
						li.keyCode = hotkey;
					}
					li = this.register(li);
				} else {
					li = hotkey;

					var arr = this._listeners[li.keyCode];
					if(arr === undefined) {
						arr = this._listeners[li.keyCode] = [];
					}
					arr.push(li);
				}
				return li;
			},
			unregister: function(li) {
				var arr = this._listeners[li.keyCode];
				if(arr === undefined) {
					throw new Error("Listener was not registered");
				}
				var index = arr.indexOf(li);
				if(index === -1) {
					throw new Error("Listener was not registered");
				}
				arr.splice(index, 1);
				if(arr.length === 0) {
					delete this._listeners[li.keyCode];
				}
			},
			handleEvent: function(evt, type) {
				var i, arr;
				if((arr = this._listeners[evt.keyCode]) !== undefined) {
					for(i = 0; i < arr.length; ++i) {
					    checkAndCall(arr[i], evt, type);
					}
				}
				if((arr = this._listeners["*"]) !== undefined) {
					for(i = 0; i < arr.length; ++i) {
                        checkAndCall(arr[i], evt, type);
					}
				}
			}
		},
		statics: {
			instance: null,
			getInstance: function() {
				if(this.instance === null) {
					this.instance = new HotkeyManager();
					this.instance.activate();
				}
				return this.instance;
			},
			initialize: function() {
				return this.getInstance();
			},
			register: function() {
				return HotkeyManager.prototype.register.apply(this.getInstance(), arguments);
			},
			unregister: function(li) {
				return HotkeyManager.prototype.unregister.apply(this.getInstance(), arguments);
				//return this.getInstance().unregister(li);
			}
		}
	}));
});