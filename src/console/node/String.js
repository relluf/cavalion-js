define(function(require) {

	var Class = require("js/Class");
	var Node = require("../Node");

	var StringNode = {

		inherits: Node,

		prototype: {

			/**
			 *
	 		 */
			constructor: function() {
				var str = String.format("%H", this.getString()).replace(/\t/g, "    ").replace(/ /g, "&nbsp;");

				this._strings = [];
				str.split("\n").forEach(function(s) {
					if(s.length > 500) {
						while(s.length > 500) {
							this._strings.push(s.substring(0, 500));
							s = s.substring(500);
						}
					}
					this._strings.push(s);
				}, this);
			},

			_classes: ["string"],
			_strings: null,

			/**
			 * @overrides ../Node.prototype.isExpandable
			 */
			isExpandable: function() {
				return this._strings.length > 1;
			},

			/**
			 * @overrides ../Node.prototype.initializeValue
			 */
			initializeValue: function(node) {
				node.innerHTML = this._strings[0];
			},

			/**
			 * @overrides ../Node.prototype.initializeContainer
			 */
			initializeContainer: function(node) {
				var html = [];
				for(var i = 1; i < this._strings.length; ++i) {
					html.push(String.format("<div class='string'>%s</div>", this._strings[i]));
				}
				node.innerHTML = html.join("");
			},

			/**
			 *
			 */
			getString: function() {
				return this._value;//js.nameOf(this._value);
			}
		}
	};

	return (StringNode = Class.define(require, StringNode));
});