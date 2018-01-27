/**
 * DocumentHook.js
 */
define(function(require) {

	var DocumentHook = require("js/defineClass");
	var Event = require("./Event");
	var Browser = require("./Browser");
	var module = require("module");

	var registry = module.id;

	DocumentHook = DocumentHook(require, {

		prototype: {

			// _saved: null,
			_events: [
			    "ontransitionend",
			    "ontouchstart", "ontouchend", "ontouchmove", "ontap", "ondbltap", "ongesture",
				"onclick", "ondblclick",
				"onmousemove", "onmousedown", "onmouseup", "onmousewheel", "onmouseenter", "onmouseleave",
				"onkeydown", "onkeyup", "onkeypress",
				"onfocus", "onblur",
				"ondragstart", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondrag", "ondrop"
			],

			_parent: null,
			_bubbleUp: true,
			_evt: null,
			_saved: null,

			_startDragDelay: 100,  // 16 is the resolution?  2 ticks?, let's try higher
			_startDragPixels: 3,  // have to move at least 3 pixels

			/**
			 *
			 * @param events
			 * @param bubbleUp
			 */
			constructor: function(events, bubbleUp, impl) {
				if(events !== undefined) {
					this._events = events;
				}
				if(bubbleUp !== undefined) {
					this._bubbleUp = bubbleUp;
				}

				impl && this.override(impl, true);
			},

			/**
			 *
			 */
			activate: function() {
				var saved;
				if(document[registry] === this) {
					throw new Error("Already active");
				}
				this._parent = document[registry] || null;
	//			if(this._parent === null) {
					saved = this._saved = {};
					this._events.forEach(function(name) {
						if(name === "onmousewheel") {
							name = "onwheel";
						}
						saved[name] = document[name] || DocumentHook.NULL;
						document[name] = DocumentHook.handleEvent;
					});
	//			}
				document[registry] = this;
			},

			/**
			 *
			 */
			release: function() {
				if(document[registry] !== this) {
					throw new Error("Not active");
				}
				if(this._parent !== null) {
					document[registry] = this._parent;
				} else {
					for(var k in this._saved) {
						document[k] = this._saved[k];
					}
					delete document[registry];
				}
			},

			/**
			 *
			 */
			isActive: function() {
				return document[registry] === this;
			},

			/**
			 *
			 */
			bubbleUp: function(evt, type) {
				var r;

				if(type === "mousewheel") {
					type = "wheel";
				}

				if(this._parent !== null) {
					r = this._parent.handle(evt);
				} else {
					var f = this._saved["on" + type];
					if(f === undefined) {
						// FIXME
						//f = document["on" + type];
					}
					if(typeof f === "function") {
						r = f.apply(document, arguments);
					} else {
						// console.log(String.format("%s can't be bubbled up", evt.type));
					}
				}

				return r;
			},

			/**
			 *
			 */
			getType: function(evt) {
				var type = evt.type;
				if(Browser.mozilla && type === "DOMMouseScroll") {
					type = "mousewheel";
				} else if(type === "webkitTransitionEnd") {
					type = "transitionend";
				}
				return type;
			},

			/**
			 *
			 */
			handle: function(evt) {
				var type = this.getType(evt);
				var r;

				if(this._events[0] === "*" || this._events.indexOf("on" + type) !== -1) {
					r = this.handleEvent(evt, type);
					if(r === DocumentHook.BUBBLE_UP || (this._bubbleUp === true && evt.bubbleUp !== false)) {
						r = this.bubbleUp(evt, type);
					}
				} else {
	//				console.log(this, String.format("ignoring event type: %s - bubbleUp", evt.type));
					r = this.bubbleUp(evt, type);
				}
				return r;
			},

			/**
			 *
			 */
			handleEvent: function(evt, type) {
				var f = this[type];
				if(typeof f === "function") {
					return f.apply(this, [evt]);
				}
			}
		},

		statics: {

			NULL: {},

			BUBBLE_UP: {},

			/**
			 *
			 */
			handleEvent: function(e) {
				var evt = Event.fix(e);
				var hook = document[registry];
evt.time = Date.now();
				if(hook) {
					hook.handle(evt);
				} else {
					console.log(String.format("received event type %s, but there is no handler active", evt.type));
				}
			}

		}
	});

	document.onwheel = function(evt) {};

	/**
	 *
	 */
	document.ondragstart = function() {
		return false;
	};

	document.ontransitionend = function(evt) {};

	/**
	 *
	 * @param e
	 * @return
	 */
	function wheelIE(e) {
		var delta = 0;
	    var evt = window.event;
        if(evt.wheelDelta) {
            delta = evt.wheelDelta / 120;
            if (window.opera) {
	            delta = -delta;
            }
        }
        evt.mouseWheelDelta = delta;
        document.onwheel(evt);
	}

	/**
	 *
	 * @param evt
	 * @return
	 */
	function wheelMozilla(evt) {
		var delta = 0;
        if (evt.detail) {
            delta = -evt.detail / 3;
        }
        evt.mouseWheelDelta = delta;
        document.onwheel(evt);
	}

	/**
	 *
	 * @param evt
	 * @return
	 */
	function wheelWebkit(evt) {
        evt.mouseWheelDelta = evt.wheelDelta / 120;
        document.onwheel(evt);
	}

	if(window.addEventListener) {
		if(Browser.webkit) {
			window.addEventListener('mousewheel', wheelWebkit, false);
		} else {
			window.addEventListener('DOMMouseScroll', wheelMozilla, false);
		}
	} else {
		window.onmousewheel = document.onmousewheel = wheelIE;
	}

	if(document.addEventListener) {
		//if(Browser.webkit) {
			document.addEventListener("webkitTransitionEnd", function(evt) {
				document.ontransitionend && document.ontransitionend(evt);
			}, false);

			document.addEventListener("focus", function(evt) {
				document.onfocus && document.onfocus(evt);
			}, true);

			document.addEventListener("blur", function(evt) {
				document.onblur && document.onblur(evt);
			}, true);

			document.addEventListener("dragstart", function(evt) {
				document.ondragstart && document.ondragstart(evt);
			}, false);

		//}
	}

	return DocumentHook;
});