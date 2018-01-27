define(function(require) {

	var Class = require("js/Class");
	var Node = require("../Node");

	var Number = {

		inherits: Node,

		/**
		 *
		Number: function() {

		},
 		 */

		prototype: {

			_classes: ["number"],

			/**
			 * @overrides ../Node.prototype.initializeValue
			 */
			initializeValue: function(node) {
				node.innerHTML = String.format("%s", this._value);
			}
		}

	};

	return (Number = Class.define(require, Number));
});