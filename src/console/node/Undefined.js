define(function(require) {

	var Class = require("js/Class");
	var Node = require("../Node");

	var Undefined = {

		inherits: Node,

		/**
		 *
		Undefined: function() {
		},
 		 */

		prototype: {
			_classes: ["undefined"],

			/**
			 * @overrides ../Node.prototype.initializeValue
			 */
			initializeValue: function(node) {
				node.innerHTML = "undefined";
			}
		}
	};

	return (Undefined = Class.define(require, Undefined));
});