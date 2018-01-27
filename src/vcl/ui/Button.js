define(["require", "js/defineClass", "./Element"], function(require, Button, Element) {

	return (Button = Button(require, {

		inherits: Element,

		prototype: {

			/** @extends ../Control.prototype.@css */
			"@css": {
				"padding": "4px 8px 4px 8px",
				"border": "1px solid gray",
				"border-radius": "3px 3px",
				"background": "-webkit-linear-gradient(top, rgba(255, 255, 255, 1) 0%,rgba(227, 227, 227, 1) 100%)",
				"box-shadow": "inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 1px 1px rgba(0, 0, 0, 0.10)",
				"text-shadow": "0 1px 0 rgba(0, 0, 0, 0.1)",
				".dropdown": {
					"font-size": "0.85em"
				},
				"&.disabled": {
					"color": "gray"
				},
				"&:not(.disabled):hover": {
					"cursor": "pointer",
					"background": "-webkit-linear-gradient(top, rgba(255, 255, 255, 1) 0%,rgba(241, 241, 241, 1) 100%)"
				},
				"&:not(.disabled):active": {
					"box-shadow": "inset 0 1px 1px rgba(0, 0, 0, 0.2)",
					//"padding-top": "3px",
					//"padding-bottom": "5px",
					"padding-right": "7px",
					"padding-left": "9px",
					"background": "-webkit-linear-gradient(top, rgba(227, 227, 227, 1) 0%,rgba(255, 255, 255, 1) 100%)",
					"text-shadow": "0 0px 0 rgba(0, 0, 0, 0.2)"
				}
			},

			_element: "button",

			/**
			 *
			 */
			onmousedown: function() {
				return this.inherited(arguments);
			},

			/**
			 *
			 */
			onmouseup: function() {
				return this.inherited(arguments);
			},

			/**
			 *
			 */
			onmouseleave: function() {
				return this.inherited(arguments);
			}
		}
	}));
});