define(function(require) {

	var Class = require("js/Class"), Promise;

	var js = require("js");
	var HtmlElement = require("../../util/HtmlElement");
	var Node = require("../Node");
	var ObjectNode = require("./Object");
	var OnlyKeyNode = require("./OnlyKey");

	return (Promise = Class.define(require, {
		inherits: ObjectNode,
		prototype: {
			_settled: false,
			_errorneous: false,
			
			constructor: function(a, b, title) {
				this._title = title;
			},
			
			isExpandable: function() {
				/**
				 * @overrides ../Node.prototype.isExpandable
				 */
				return this.hasOwnProperty("_settled");
			},
			initializeValue: function(node) {
				/**
				 * @overrides ../Node.prototype.initializeValue
				 */
				var thisObj = this;

				node.innerHTML = String.format("%H", js.nameOf(this._value));

				function cb(res) {
					node.innerHTML = String.format("<div style='display: inline-block;'>%H</div>: " +
							"<div style='display: inline-block;'></div>", js.nameOf(thisObj._value));
					thisObj._line = Node.create(res);
					thisObj._line.initializeValue(node.childNodes[2]);
					HtmlElement.addClass(node.parentNode, "expandable");
					node.parentNode.ontouchstart = node.parentNode.onclick = Node.click_expand.bind(thisObj);
				}

				function suc(res) {
					thisObj._settled = res;
					cb.apply(thisObj, arguments);
					node.childNodes[0].style.color = "green";
					return res;
				}
				function err(res) {
					thisObj._settled = res;
					thisObj._errorneous = true;
					cb.apply(thisObj, arguments);
					HtmlElement.addClass(node.parentNode, "error");
					return res;
				}

				this._value.then(suc, err);
			},
			initializeContainer: function(node) {
				/**
				 * @overrides ../Node.prototype.initializeContainer
				 */
				var line = Node.create(this._value, String.format("%n", this._value), OnlyKeyNode);
				node.appendChild(line.getNode());

				this._line.initializeContainer(node);

				if(node.childNodes.length > 1) {
					HtmlElement.addClass(line.getNode(), "border-bottom");
				}
			},
			getObject: function() {
				/**
				 * @overrides js.util.printerline.Object.prototype.getObject
				 */
				return this._settled;
			}
		}
	}));
});

// traditional version below
// define(function(require) {

// 	var Class = require("js/Class");
// 	var js = require("js");

// 	var HtmlElement = require("../../util/HtmlElement");

// 	var Node = require("../Node");
// 	var ObjectNode = require("./Object");
// 	var OnlyKeyNode = require("./OnlyKey");

// 	var Promise = {
// 		inherits: ObjectNode,
// 		prototype: {
// 			_settled: false,
// 			_errorneous: false,
			
// 			constructor: function(a, b, title) {
// 				this._title = title;
// 			},
			
// 			isExpandable: function() {
// 				/**
// 				 * @overrides ../Node.prototype.isExpandable
// 				 */
// 				return this.hasOwnProperty("_settled");
// 			},
// 			initializeValue: function(node) {
// 				/**
// 				 * @overrides ../Node.prototype.initializeValue
// 				 */
// 				var thisObj = this;

// 				node.innerHTML = String.format("%H", js.nameOf(this._value));

// 				function cb(res) {
// 					node.innerHTML = String.format("<div style='display: inline-block;'>%H</div>: " +
// 							"<div style='display: inline-block;'></div>", js.nameOf(thisObj._value));
// 					thisObj._line = Node.create(res);
// 					thisObj._line.initializeValue(node.childNodes[2]);
// 					HtmlElement.addClass(node.parentNode, "expandable");
// 					node.parentNode.ontouchstart = node.parentNode.onclick = Node.click_expand.bind(thisObj);
// 				}

// 				function suc(res) {
// 					thisObj._settled = res;
// 					cb.apply(thisObj, arguments);
// 					node.childNodes[0].style.color = "green";
// 					return res;
// 				}
// 				function err(res) {
// 					thisObj._settled = res;
// 					thisObj._errorneous = true;
// 					cb.apply(thisObj, arguments);
// 					HtmlElement.addClass(node.parentNode, "error");
// 					return res;
// 				}

// 				this._value.then(suc, err);
// 			},
// 			initializeContainer: function(node) {
// 				/**
// 				 * @overrides ../Node.prototype.initializeContainer
// 				 */
// 				var line = Node.create(this._value, String.format("%n", this._value), OnlyKeyNode);
// 				node.appendChild(line.getNode());

// 				this._line.initializeContainer(node);

// 				if(node.childNodes.length > 1) {
// 					HtmlElement.addClass(line.getNode(), "border-bottom");
// 				}
// 			},
// 			getObject: function() {
// 				/**
// 				 * @overrides js.util.printerline.Object.prototype.getObject
// 				 */
// 				return this._settled;
// 			}
// 		}
// 	};

// 	return (Promise = Class.define(require, Promise));
// });
