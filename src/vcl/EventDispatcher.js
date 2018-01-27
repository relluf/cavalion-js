define(function(require) {

	var EventDispatcher = require("js/defineClass");
	var js = require("js");
	var Panel = require("js/referenceClass!./ui/Panel");
	var DocumentHook = require("../util/DocumentHook");

	var elementKey = "@vcl";

	var timeout;
	window.addEventListener("resize", function() {
		if(timeout !== undefined) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(function(evt) {
			timeout = undefined;
			var nodes = document.body.childNodes;
			for(var i = 0; i < nodes.length; ++i) {
				var component = nodes[i][elementKey];
				if(component instanceof Panel) {
					if(component._align && component._align !== "none") {
						component.dispatch("resize", evt);
					}
				}
			}
		}, 30);

	}, false);

	return (EventDispatcher = EventDispatcher(require, {

		inherits: DocumentHook,

		prototype: {

			_component: null,
			_mousemove_evt: null,

			/**
			 *
			 */
			constructor: function() {
				this._events = ["*"].concat(this._events);
			},

			/**
			 *
			 */
			dispatch: function(component, name, evt) {
				var r;
				if(typeof this[name] === "function") {
					r = this[name](evt, component);
					// TODO can events be cancelled?
				}
				if(component !== null) {
					r = component.dispatch(name, evt);
				}
				if(r === undefined && this._bubbleUp === true) {
					r = DocumentHook.BUBBLE_UP;
				}

				return r;
			},

			/**
			 *
			 */
			handle: function(evt) {

				/**
				 *
				 */
                function dispatch_hint() {
					this.dispatch(this._component, "hint", this._mousemove_evt);
				}

				var type = this.getType(evt);
				var node = evt.target || null; // IE
				var r;

				while(node !== null && node[elementKey] === undefined) {
					node = node.parentNode || null; // IE
				}

				var component = node !== null ? node[elementKey] : null;
				evt.component = component;

				r = this.dispatch(component, type, evt);

				if(evt.type === "mousemove") {
					this._mousemove_evt = evt;
					if(this._component !== component) {
						if(this._component !== null) {
							this.dispatch(this._component, "mouseleave", evt);
							js.clearTimeout(this._timeout);
						}
						this._component = component;
						if(this._component !== null) {
							this.dispatch(this._component, "mouseenter", evt);
							this._timeout = js.setTimeout(dispatch_hint.bind(this), 250);
						}
					}
					if(this._mousedown_drag !== undefined && this._component === this._mousedown_drag.component) {
						var dt = new Date().getTime() - this._mousedown_drag.time;
						var dx = Math.abs(evt.clientX - this._mousedown_drag.evt.clientX);
						var dy = Math.abs(evt.clientY - this._mousedown_drag.evt.clientY);
						if(dt > this._startDragDelay || dx > this._startDragPixels || dy > this._startDragPixels) {
							this.dispatch(this._component, "dragstart", evt);
							delete this._mousedown_drag;
						}
					}
					//FIXME dragend?
				} else if(evt.type === "mousedown") {// && evt.which === 1) {
					this._mousedown_drag = {
						component: this._component,
						evt: evt,
						time: new Date().getTime()
					};
					this._mousedown_component = this._component;

				} else if(evt.type === "mouseup") {

					// When dragging, the mousebutton can be released while the mouse is no longer
					// positioned over the original component. If this is the case, fire a mouseup event
					// for the original component as well.
					if(this._mousedown_component !== undefined && this._mousedown_component !== component) {
						this.dispatch(this._mousedown_component, type, evt);
					}

					delete this._mousedown_drag;
					delete this._mousedown_component;
				}

				if(r === DocumentHook.BUBBLE_UP && evt.bubbleUp !== false) {
					r = this.bubbleUp.apply(this, arguments);
				}
				return r;
			}
		},

		statics: {

			elementKey: elementKey,

			/**
			 * @overrides DocumentHook.handleEvent
			 */
			handleEvent: DocumentHook.handleEvent

		}
	}));
});
