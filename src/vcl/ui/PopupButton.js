define(function(require) {

	var Class = require("js/Class");
	var Button = require("./Button");
	var Popup = require("./Popup");

	var PopupButton = {

		inherits: Button,

		prototype: {

			/**
			 *
			constructor: function() {

			},
			 */

			"@css": {
				".pressed": {
					"text-shadow": "0 0px 0 rgba(0, 0, 0, 0.2)",
					"-webkit-box-shadow": "inset 0 1px 1px rgba(0, 0, 0, 0.2)",
					"padding": "4px 8px",
					"background": "-webkit-linear-gradient(top, rgba(217, 217, 217, 1) 0%,rgba(255, 255, 255, 1) 100%)"
				},
				".pressed:active": {
					"-webkit-box-shadow": "inset 0 1px 1px rgba(0, 0, 0, 0.4)"
				}
			},

			_pressed: false,
			_popup: null,

			/**
			 *
			 */
			determineClasses: function() {
				var classes = this.inherited(arguments);
				if(this._pressed === true) {
					classes.push("pressed");
				}
				return classes;
			},

			/**
			 * @overrides ../Control.prototype.onclick
			 */
			onclick: function() {
				this.setPressed(!this._pressed);
				if(this._popup !== null) {
					if(this._pressed === true) {
						var thisObj = this;
						this._popup.popup({origin: "bottom-left", dx: 0, dy: 4}, this, function() {
							thisObj.setPressed(false);
						});
					} else {
						this._popup.close();
					}
				}
				return this.inherited(arguments);
			},

			/**
			 *
			 * @param value
			 */
			setPressed: function(value) {
				if(this._pressed !== value) {
					this._pressed = value;
					this.setState("classesInvalidated", true);
				}
			}
		},

		properties: {

			"popup": {
				type: Popup
			}
		}

	};

	return (PopupButton = Class.define(require, PopupButton));
});