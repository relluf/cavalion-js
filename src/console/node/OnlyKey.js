define(function(require) {

	var Class = require("js/Class");
	var ObjectNode = require("./Object");

	var OnlyKey = {

		inherits: ObjectNode,

		prototype: {

			/**
			 * @overrides ../Node.prototype.initializeContainer
			 */
			initializeKey: function(node) {
				node.innerHTML = String.format("%H", this._key);
			},

			/**
			 * @overrides ../Node.prototype.initializeContainer
			 */
			initializeValue: function(node) {
			}
		}
	};

	return (OnlyKey = Class.define(require, OnlyKey));
});
