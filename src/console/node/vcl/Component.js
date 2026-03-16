define(function(require) {

	var ComponentNode = require("js/defineClass");
	var Component = require("vcl/Component");
	var ObjectNode = require("../Object");
	var Node = require("../../Node");
	var js = require("js");
	var Method = require("js/Method");

	return (ComponentNode = ComponentNode(require, {
		inherits: ObjectNode,
		prototype: {
			_classes: ["object"],

			initializeValue: function(node) {
				/** @overrides ../Node.prototype.initializeValue */
				// node.innerHTML = String.format("%H<span class='uri'> - %H</span>",
				// 		js.nameOf(this._value), this._value.getUri());
				var isRoot = this._value.isRootComponent();
				var root = isRoot ? ":root" : "";
				var uri = this._value._uri;//this._value.isRootComponent() ? this._value._uri : this._value.getUri();
				if(uri !== this._value.getUri()) {
					uri = js.sf("%s - %s", uri, this._value.getUri());
				}

				var selected = this._value.isSelected && this._value.isSelected() ? ":selected" : "";
				if(isRoot) {
					node.innerHTML = String.format(
							"%H#%s<span class='uri'> - %H%H%H</span>",
							uri, this._value.hashCode(), js.nameOf(this._value), 
							root, selected);
				} else {
					node.innerHTML = String.format(
							"%H<span class='uri'> - %H%H%H</span>",
							js.nameOf(this._value), 
							uri, root, selected);
				}
			}
		},
		statics: {
			initialize: function() {
				/*- FIXME Introduce some registration infra at Node */
				Method.override(Node, "create", function(value, key, NodeClass) {
					if(NodeClass === undefined && value instanceof Component) {
						/*- Yee, use the specific Component impl */
						return new ComponentNode(value, key);
					}
					return Method.callInherited(this, arguments);
				});
			}
		}
	}));
});
