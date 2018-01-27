define(function(require) {

	var ComponentNode = require("js/defineClass");
	var Component = require("vcl/Component");
	var ObjectNode = require("../Object");
	var Node = require("../../Node");
	var js = require("js");

	/*- FIXME Introduce some registration infra at Node */
	js.override(Node, "create", function(value, key, NodeClass) {
		if(NodeClass === undefined && value instanceof Component) {
			/*- Yee, use the specific Component impl */
			return new ComponentNode(value, key);
		}
		return js.inherited(this, arguments);
	});

	return (ComponentNode = ComponentNode(require, {

		inherits: ObjectNode,

		prototype: {
			_classes: ["object"],

			/**
			 * @overrides ../Node.prototype.initializeValue
			 */
			initializeValue: function(node) {
				// node.innerHTML = String.format("%H<span class='uri'> - %H</span>",
				// 		js.nameOf(this._value), this._value.getUri());
				node.innerHTML = String.format(
						"%H<span class='uri'> - %H</span>",
						js.nameOf(this._value), 
						this._value._uri);
			}
		}
	}));
});
