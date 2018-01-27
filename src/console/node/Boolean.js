define(["require", "js/defineClass", "../Node"], function(require, Boolean, Node) {

	return Boolean(require, {
		inherits: Node,
		prototype: {
			_classes: ["boolean"],

			/**
			 * @overrides ../Node.prototype.initializeValue
			 */
			initializeValue: function(node) {
				node.innerHTML = String.format("%s", this._value);
			}
		}
	});
});