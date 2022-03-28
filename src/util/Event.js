define(function(require) {
	/**
	 * Event.js - Taken from dojo
	 * 
	 * @see Event.getKeyModifiers that ["shift", "alt", "metactrl", "ctrl"] is the way to specify modifiers
	 *	they will automatically sorted.
	 */

	var js = require("js");
	var Browser = require("./Browser");

	var Event = {

		currentEvent: undefined,
		keys: {
			KEY_BACKSPACE: 8,
			KEY_TAB: 9,
			KEY_ENTER: 13,
			KEY_SHIFT: 16,
			KEY_CTRL: 17,
			KEY_ALT: 18,
			KEY_PAUSE: 19,
			KEY_CAPS_LOCK: 20,
			KEY_ESCAPE: 27,
			KEY_SPACE: 32,
			KEY_PAGE_UP: 33,
			KEY_PAGE_DOWN: 34,
			KEY_END: 35,
			KEY_HOME: 36,
			KEY_LEFT_ARROW: 37,
			KEY_UP_ARROW: 38,
			KEY_RIGHT_ARROW: 39,
			KEY_DOWN_ARROW: 40,
			KEY_INSERT: 45,
			KEY_DELETE: 46,
			KEY_LEFT_WINDOW: 91,
			KEY_RIGHT_WINDOW: 92,
			KEY_SELECT: 93,
			KEY_F1: 112,
			KEY_F2: 113,
			KEY_F3: 114,
			KEY_F4: 115,
			KEY_F5: 116,
			KEY_F6: 117,
			KEY_F7: 118,
			KEY_F8: 119,
			KEY_F9: 120,
			KEY_F10: 121,
			KEY_F11: 122,
			KEY_F12: 123,
			KEY_NUM_LOCK: 144,
			KEY_SCROLL_LOCK: 145
		},
		window_Event: window.Event,

		callListener: function(listener, curTarget) {
			/**
			 *
			 * @param {Object} listener
			 * @param {Object} curTarget
			 */
			if (typeof listener !== "function") {
				throw new Error("listener not a function: " + listener);
			}
			Event.currentEvent.currentTarget = curTarget;
			return listener.call(curTarget, Event.currentEvent);
		},
		stopPropagation: function() {
			/**
			 *
			 */
			Event.currentEvent.cancelBubble = true;
		},
		preventDefault: function() {
			/**
			 *
			 */
			Event.currentEvent.returnValue = false;
		},
		fix: function(evt, sender) {
			/**
			 * Creates a cross browser event object
			 *
			 * @param {Object} evt
			 * @param {Object} sender
			 */
			if (!evt && window.event) {
				evt = js.mixIn({}, window.event);
			}

			if (evt.type && (evt.type.indexOf("key") === 0)) {
				evt.keys = this.revKeys;
				for (var key in this.keys) {
					evt[key] = this.keys[key];
				}
				if (Browser.ie && (evt.type === "keypress")) {
					evt.charCode = evt.keyCode;
				}
			}
			if (Browser.ie) {
				if (!evt.target) {
					evt.target = evt.srcElement;
				}
				if (!evt.currentTarget) {
					evt.currentTarget = sender ? sender : evt.srcElement;
				}
				if (!evt.layerX) {
					evt.layerX = evt.offsetX;
				}
				if (!evt.layerY) {
					evt.layerY = evt.offsetY;
				}
				if (!evt.pageX) {
					evt.pageX = evt.clientX + (window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0);
				}
				if (!evt.pageY) {
					evt.pageY = evt.clientY + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0);
				}
				if (evt.type === "mouseover") {
					evt.relatedTarget = evt.fromElement;
				}
				if (evt.type === "mouseout") {
					evt.relatedTarget = evt.toElement;
				}
				if(evt.which === undefined) {
					evt.which = evt.button === 1 ? 1 : 3;
				}
				this.currentEvent = window.event;
				evt.callListener = this.callListener;
				evt.stopPropagation = this.stopPropagation;
				evt.preventDefault = this.preventDefault;

			}

			evt.keyModifiers = this.getKeyModifiers(evt, true);
			return evt;
		},
		getKeyModifiers: function(evt, metactrl) {
			/**
			 *
			 * @param evt
			 */
			var modifiers = [];
			if(evt.shiftKey) {
				modifiers.push("shift");
			}
			if(evt.altKey) {
				modifiers.push("alt");
			}
			if(!metactrl) {
				if(evt.metaKey) {
					modifiers.push("meta");
				}
				if(evt.ctrlKey) {
					modifiers.push("ctrl");
				}
			} else if(navigator.platform === "MacIntel") {
				if((evt.metactrlKey = (evt.metaKey === true))) {
					modifiers.push("metactrl");
				}
			} else if((evt.metactrlKey = (evt.ctrlKey === true))) {
				modifiers.push("metactrl");
			}
			//console.log(modifiers, evt.ctrlKey, evt.shiftKey, evt.altKey, evt.metaKey);
			return modifiers;
		},
		eventModifiersMatch: function(evt, modifiers) {
			console.warn("Event.eventModifiersMatch has been deprecated, " + 
				"use Event.modifiersMatch instead.");
		    return this.modifiersMatch(this.getKeyModifiers(evt, 
		    		modifiers.indexOf("metactrl") !== -1), modifiers);
		},
		modifiersMatch: function(evt, modifiers) {
			if(!(evt instanceof this.window_Event)) {
				console.warn("This particular usage has been deprecated");
				return this.modifiersMatchDeprecated(evt, modifiers);
			}
			var metactrl = modifiers.indexOf("metactrl") !== -1;
			var keymods = this.getKeyModifiers(evt, metactrl);
			return keymods.sort().join(",") === modifiers.sort().join(",");
		},
		modifiersMatchDeprecated: function(i1, i2) {
			if((i1.indexOf("ctrl") !== -1 || i1.indexOf("meta") !== -1) && (i = i2.indexOf("metactrl")) !== -1) {
				i2[i] = navigator.platform === "MacIntel" ? "meta" : "ctrl";
			} else if((i2.indexOf("ctrl") !== -1 || i2.indexOf("meta") !== -1) && (i = i1.indexOf("metactrl")) !== -1) {
				i1[i] = navigator.platform === "MacIntel" ? "meta" : "ctrl";
			}
			return i1.sort().join(",") === i2.sort().join(",");
		}
	};

	Event.revKeys = [];

	for (var key in Event.keys) {
		Event.revKeys[Event.keys[key]] = key;
	}

	return Event;
});