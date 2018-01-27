define(function(require) {

	var Class = require("js/Class");
	var js = require("js");
	var DocumentHook = require("../../util/DocumentHook");
	var HtmlElement = require("../../util/HtmlElement");
	var Panel = require("./Panel");

	var Popup = {

		inherits: Panel,

		prototype: {

			/**
			 *
			 */
			constructor: function() {
				var popup = this;

				this._hook = new DocumentHook(null, true);
				js.mixIn(this._hook, {

					/**
					 *
					 */
					keydown: function(evt) {
						if(evt.keyCode === 27) {
							popup.close();
							evt.preventDefault();
						}
					},

					/**
					 *
					 */
					click: function(evt) {
						if(!HtmlElement.hasParent(evt.target, popup._node)) {
							popup.close();
							evt.bubbleUp = false;
							//evt.preventDefault();
						}
					}
				});
			},

			"@css": {
				"position": "absolute",
				"z-index": "1"
			},

			_visible: false,
			_autoSize: "both",

			_hook: null,

			_onPopup: null,
			_onClose: null,

			/**
			 *
			 * @param position
			 * @param relativeTo
			 * @param onClose
			 */
			popup: function(position, relativeTo, onClose) {
				if(!this._hook.isActive()) {
					var p = relativeTo.clientToDocument(0, 0);
					var cs = relativeTo.getComputedStyle();

					p = this._parent.documentToClient(p);

					this.setLeft(p.x + (position.dx || 0));
					this.setTop(p.y + parseInt(cs.height, 10) + (position.dy || 0));
					this.setVisible(true);

					this._hook.activate();

					this._hook.release = function() {
						// Don't you just LOVE JavaScript? :p
						delete this.release;
						this.release.apply(this, arguments);
						onClose();
					};

					this.onpopup();
				}
			},

			/**
			 *
			 */
			close: function() {
				if(this._hook.isActive()) {
					this._hook.release();
					this.setVisible(false);
					this.onclose();
				}
			},

			/**
			 *
			 */
			onpopup: function() {
				this.fire("onPopup", arguments);
			},

			/**
			 *
			 */
			onclose: function() {
				this.fire("onClose", arguments);
			},

			/**
			 *
			 */
			getOnPopup: function() {
				return this._onPopup;
			},

			/**
			 *
			 */
			setOnPopup: function(value) {
				this._onPopup = value;
			},

			/**
			 *
			 */
			getOnClose: function() {
				return this._onClose;
			},

			/**
			 *
			 */
			setOnClose: function(value) {
				this._onClose = value;
			}
		},

		properties: {

			"onPopup": {
				type: Class.Type.EVENT
			},

			"onClose": {
				type: Class.Type.EVENT
			}

		}
	};

	return (Popup = Class.define(require, Popup));
});
