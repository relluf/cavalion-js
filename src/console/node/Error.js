define(function(require) {

	var Class = require("js/Class");
	var js = require("js");

	var HtmlElement = require("../../util/HtmlElement");

	var Node = require("../Node");
	var OnlyKeyNode = require("./OnlyKey");
	var MethodStackNode = require("./MethodStack");

	var ErrorNode = {
		inherits: Node,
		prototype: {
			_classes: ["error"],

			isExpandable: function() {
				/**
				 * @overrides ../Node.prototype.isExpandable
				 */
				return true;
			},
			initializeValue: function(parentNode) {
				/**
				 * @overrides ../Node.prototype.initializeValue
				 */
				parentNode.innerHTML = String.format("%H", this._value.message).
					replace(/\n/g, "<br>").
					replace(/\t/g, "    ").
					replace(/ /g, "&nbsp;");
			},
			initializeContainer: function(parentNode) {
				/**
				 * @overrides ../Node.prototype.initializeContainer
				 */
				var e = this._value;
				var node;

				while(e !== undefined) {
					node = Node.create(js.mixIn({stack:e.stack}, e), "detail", OnlyKeyNode).getNode();
					node.style.marginLeft = "20px";
					parentNode.appendChild(node);
					HtmlElement.addClass(node, "border-bottom");
					if(e.methodStack !== undefined) {
						node = document.createElement("div");
						node.style.paddingLeft = "20px";
						new MethodStackNode(e.methodStack).initializeContainer(node);
						parentNode.appendChild(node);
					} else {
						node = Node.create(null, "no source available", OnlyKeyNode).getNode();
						node.style.marginLeft = "20px";
						node.style.color = "silver";
						parentNode.appendChild(node);
					}
					if((e = e.cause) !== undefined) {
						node = document.createElement("div");
						node.className = "string";
						node.innerHTML = String.format("Caused by: %s", String.format("%H", e.message));
						parentNode.appendChild(node);
					}
				}
			}		
		}
	};

	return (ErrorNode = Class.define(require, ErrorNode));
});
