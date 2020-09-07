define(function(require) {

	var ComponentNode = require("js/defineClass");
	var Component = require("vcl/Component");
	var ObjectNode = require("../Object");
	var Node = require("../../Node");
	var js = require("js");

	return (ComponentNode = ComponentNode(require, {
		inherits: ObjectNode,
		prototype: {
			_classes: ["object"],

			initializeValue: function(node) {
				/** @overrides ../Node.prototype.initializeValue */
				// node.innerHTML = String.format("%H<span class='uri'> - %H</span>",
				// 		js.nameOf(this._value), this._value.getUri());
				var root = this._value.isRootComponent() ? ":root" : "";
				var uri = this._value._uri;//this._value.isRootComponent() ? this._value._uri : this._value.getUri();
				if(uri !== this._value.getUri()) {
					uri = js.sf("%s - %s", uri, this._value.getUri());
				}
				
				var selected = this._value.isSelected && this._value.isSelected() ? ":selected" : "";
				node.innerHTML = String.format(
						"%H<span class='uri'> - %H%H%H</span>",
						js.nameOf(this._value), 
						uri, root, selected);
			}
		},
		statics: {
			initialize: function() {
				/*- FIXME Introduce some registration infra at Node */
				js.override(Node, "create", function(value, key, NodeClass) {
					if(NodeClass === undefined && value instanceof Component) {
						/*- Yee, use the specific Component impl */
						return new ComponentNode(value, key);
					}
					return js.inherited(this, arguments);
				});
			}
		}
	}));
});
