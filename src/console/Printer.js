define(function(require) {

	var Class = require("js/Class");
	var Deferred = require("js/Deferred");
	var Method = require("js/Method");
	var js = require("js");

	var Node = require("./Node");
	var ObjectNode = require("./node/Object");
	var ArrayNode = require("./node/Array");
	var MethodStackNode = require("./node/MethodStack");
	var NumberNode = require("./node/Number");
	var UndefinedNode = require("./node/Undefined");
	var NullNode = require("./node/Null");
	var BooleanNode = require("./node/Boolean");
	var StringNode = require("./node/String");
	var ErrorNode = require("./node/Error");
	var FunctionNode = require("./node/Function");
	var DeferredNode = require("./node/Deferred");
	var PromiseNode = require("./node/Promise");

	js.override(Node, {
		create: function(value, key, NodeClass) {
		var line;

		if(NodeClass !== undefined) {
			line = new NodeClass(value, key);
		} else if(value instanceof Error) {
			line = new ErrorNode(value, key);
//			} else if(value instanceof js.CallStack) {
//				line = new js.util.printerline.CallStack(value, key);
		} else if(value instanceof Promise) {
			line = new PromiseNode(value, key);
		// } else if(value && typeof value.then === "function") {
		// 	var promise = Promise.resolve(value);
		// 	if(promise !== value) {
		// 		line = new PromiseNode(value, key, "Thenable");
		// 	}
		} else if(value instanceof Method.CallStack) {
			line = new MethodStackNode(value, key);
		} else if(value instanceof Array) {
			line = new ArrayNode(value, key);
		} else if(value instanceof Deferred) {
			line = new DeferredNode(value, key);
		} else {
			var type = typeof value;
			if(type === "string") {
				line = new StringNode(value, key);
			} else if(type === "undefined") {
				line = new UndefinedNode(value, key);
			} else if(type === "number") {
				line = new NumberNode(value, key);
			} else if(type === "boolean") {
				line = new BooleanNode(value, key);
			} else if(type === "object") {
				if(value === null) {
					line = new NullNode(value, key);
				} else {
					line = new ObjectNode(value, key);
				}
			} else if(type === "function") {
				line = new FunctionNode(value, key);
			} else {
				line = new StringNode(js.nameOf(value), key);
			}
		}

		return line;
	}
	});

	var Printer = {

		prototype: {
			_node: null,

			constructor: function(node) {
				this.setNode(node);
			},
			setNode: function(value) {
				this._node = value;
			},
			print: function() {
				var line;

				if(arguments.length === 1) {
					line = Node.create(arguments[0]);
				} else {
					var args = js.copy_args(arguments);
					var type = typeof args[1];

					if(args.length === 1) {
						line = Node.create(args[0]);
					} else if(args.length > 2) {
						var msg = args.shift();
						line = Node.create(args, msg);
						line._showTime = true;
					} else if(type !== null && (type === "object" || type === "function")) {
						line = Node.create(args[1], args[0]);
						line._showTime = true;
					} else {
						line = Node.create(args[1], args[0]);
						line._showTime = true;
					}
				}
				this._node.appendChild(line.getNode());
				this._node.scrollTop = this._node.scrollHeight;
			}
		}
	};

	return (Printer = Class.define(require, Printer));
});