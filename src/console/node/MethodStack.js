define(function(require) {

	var Class = require("js/Class");

	var Node = require("../Node");
	var OnlyKey = require("./OnlyKey");

	var MethodStackNode = {

		inherits: Node,

		prototype: {

			_classes: ["array"],

			/**
			 * @overrides ../Node.prototype.isExpandable
			 */
			isExpandable: function() {
				return this._value.length > 0;
			},

			/**
			 * @overrides ../Node.prototype.initializeMessage
			 */
			initializeValue: function(node) {
				node.innerHTML = String.format("%n", this._value);
			},

			/**
			 * @overrides ../Node.prototype.initializeContainer
			 */
			initializeContainer: function(node) {
				var arr = this._value;
				for(var i = arr.length - 1; i >= 0; --i) {
					node.appendChild(Node.create(arr[i], String.format("at %n", arr[i]), OnlyKey).getNode());
				}
			}
		}
	};

	return (MethodStackNode = Class.define(require, MethodStackNode));
});