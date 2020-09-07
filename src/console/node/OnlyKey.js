define(function(require) {

	var Class = require("js/Class");
	var ObjectNode = require("./Object");

	var OnlyKey = {

		inherits: ObjectNode,

		prototype: {

			initializeKey: function(node) {
				/** @overrides ../Node.prototype.initializeContainer */
				node.innerHTML = String.format("<i class='fa fa-caret-down'></i><i class='fa fa-caret-right'></i>%H", this._key);
			},

			initializeValue: function(node) {
				/** @overrides ../Node.prototype.initializeContainer */
			}
		}
	};

	return (OnlyKey = Class.define(require, OnlyKey));
});
