define(function(require) {

	var Class = require("js/Class");
	var Panel = require("./Panel");

	var ListFooter = {

		inherits: Panel,

		prototype: {

			"@css": {

			},

			/**
			 *
			constructor: function() {
			},
			 */

			/**
			 * @overrides ../Control.prototype
			 */
			_align: "bottom",
			_autoSize: "height",
			_content: "<div class=\"customize\">...</div><div></div>",

			/**
			 *
			 */
			getList: function() {
				return this._parent !== null ? this._parent : null;
			}
		},

		properties: {

			"align": {
				set: Function,
				type: Panel.ALIGN
			},
			"autoSize": {
				set: Function,
				type: Panel.AUTOSIZE
			}
		}
	};

	return (ListFooter = Class.define(require, ListFooter));
});