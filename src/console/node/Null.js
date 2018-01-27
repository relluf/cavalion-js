define(function(require) {

	var Class = require("js/Class");
	var Node = require("../Node");

	var Null = {

		inherits: Node,

		prototype: {

			_classes: ["null"],

			/**
			 * @overrides ../Node.prototype.initializeValue
			 */
			initializeValue: function(node) {
				node.innerHTML = "null";
			}
		}

	};

	return (Null = Class.define(require, Null));
});