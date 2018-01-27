define(function(require) {

	var Dragger = require("js/defineClass");
	var DocumentHook = require("../util/DocumentHook");
	var HtmlElement = require("../util/HtmlElement");

	return (Dragger = Dragger(require, {

		prototype: {

			_control: null,
			_hook: null,

			_sx: 0,
			_sy: 0,

			_cursor: null,

			/**
			 * Constructor
			 */
			constructor: function(control, overrides) {
				this._hook = new DocumentHook(undefined, false);
				this._control = control;

				var me = this;
				this._hook.handleEvent = function(evt, type) {
					return me.handleEvent(evt, type);
				};

				if(typeof overrides === "object") {
					this.override(overrides);
				}
			},

			/**
			 *
			 */
			handleEvent: function(evt, type) {
				var f = this[type];
				if(f !== undefined) {
					f.apply(this, arguments);
				}
			},

			/**
			 *
			 */
			swapDocCursor: function() {
				if(this.hasOwnProperty("_cursor")) {
					var style = document.body.style;
					var cursor = style.cursor;
					style.cursor = this._cursor;
					this._cursor = cursor;
				}
			},

			/**
			 *
			 */
			getCursor: function() {
				return this._cursor;
			},

			/**
			 *
			 */
			setCursor: function(value) {
				if( /* isdragging */ 0) {
					document.body.style.cursor = value;
				} else if(this._cursor !== value) {
					this._cursor = value;
				}
			},

			/**
			 *
			 */
			start: function(evt) {
				HtmlElement.disableSelection();
				this.swapDocCursor();
				this._sx = evt.clientX;
				this._sy = evt.clientY;
				this._hook.activate();
				this.createHandles(evt);
			},

			/**
			 *
			 */
			end: function(evt) {
				this.destroyHandles(evt);
				this._hook.release();
				this.swapDocCursor();
				HtmlElement.enableSelection();
			},

			/**
			 *
			 */
			drop: function(evt) {

			},

			/**
			 *
			 */
			keyup: function(evt) {
				if(evt.keyCode === 27) {
					evt.preventDefault();
					this._cancelled = true;
					this.end(evt);
				}
			},

			/**
			 *
			 */
			mouseup: function(evt) {
				if(this._cancelled !== true) {
					this.drop(evt);
					this.end(evt);
				}
			},

			/**
			 *
			 */
			mousemove: function(evt) {
				this.updateHandles(evt);
			},

			/**
			 *
			 */
			createHandles: function() {
			},

			/**
			 *
			 */
			destroyHandles: function() {
			},

			/**
			 * This will just move the control, override to change behaviour
			 */
			updateHandles: function(evt) {
				var x = this._sx;
				var y = this._sy;

				x = evt.clientX - x + this._control.getLeft();
				y = evt.clientY - y + this._control.getTop();

				this._control.setBounds(x, y);

				this._sx = evt.clientX;
				this._sy = evt.clientY;
			}

		}
	}));

});
