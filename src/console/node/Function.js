var toString = Function.prototype.toString;
define(function(require) {

	var FunctionNode = require("js/defineClass");
	var js = require("js");
	var Method = require("js/Method");

	var Node = require("../Node");
	var OnlyKeyNode = require("./OnlyKey");

	return (FunctionNode = FunctionNode(require, {
		inherits: Node,
		prototype: {
			_classes: ["function"],
			_keys: null,
			isExpandable: function() {
				/** @overrides ../Node.prototype.isExpandable */
				return true;
			},
			initializeValue: function(node) {
				/** @overrides ../Node.prototype.initializeMessage */
				node.innerHTML = String.format("%H<span class='proto'> - %H</span>",
						this._value.toString().split("\n")[0],
						js.nameOf(this._value));
			},
			initializeContainer: function(parentNode) {
				/** @overrides ../Node.prototype.initializeContainer */
				var method = Method.getInherited(Function.prototype.toString) 
					|| Method.getInherited(toString);

				if(Object.keys(this._value).length > 0) {
					var node = Node.create(this._value, "detail", OnlyKeyNode).getNode();
					parentNode.appendChild(node);
				}
				
				var div = document.createElement("div");
				div.className = "code";
				div.innerHTML = String.format("%H", 
					js.b("" + method.apply(this._value, [])))
						.replace(/\t/g, "    ")
						.replace(/ /g, "&nbsp;")
						.replace(/\n/g, "<br>");
				parentNode.appendChild(div);
			}
		}
	}));
});