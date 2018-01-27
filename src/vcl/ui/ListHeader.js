define(function(require) {

	var Class = require("js/Class");
	var Method = require("js/Method");

	var Dragger = require("../Dragger");
	var Panel = require("./Panel");
	var List = require("js/referenceClass!./List");
	var ListColumn = require("js/referenceClass!./List");

	var ListHeader = {

		inherits: Panel,

		prototype: {

			"@css": {
			    overflow: "hidden",
			    transition: "width 50ms",
				">div": {
//					background: "-webkit-linear-gradient(top,  rgba(240,240,240,1) 0%,rgba(227,227,227,1) 100%)", // Chrome10+,Safari5.1+
					// "background-image": "-webkit-gradient(linear, 0% 0%, 0% 100%, from(rgb(245, 245, 245)), to(rgb(229, 229, 229)))",
					
					"background-image": "-webkit-gradient(linear, 0% 0%, 0% 100%, from(rgba(245, 245, 245, 0.9)), to(rgba(229, 229, 229, 0.9)))",
					
					// background: "rgba(255, 255, 255, 0.9)",
/**
					background: [
						"rgb(240,240,240)", // Old browsers
						"-moz-linear-gradient(top,  rgba(240,240,240,1) 0%, rgba(227,227,227,1) 100%)", //FF3.6+
						"-webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(240,240,240,1)), color-stop(100%,rgba(227,227,227,1)))", /* Chrome,Safari4+
						"-webkit-linear-gradient(top,  rgba(240,240,240,1) 0%,rgba(227,227,227,1) 100%)", // Chrome10+,Safari5.1+
						"-o-linear-gradient(top,  rgba(240,240,240,1) 0%,rgba(227,227,227,1) 100%)", // Opera 11.10+
						"-ms-linear-gradient(top,  rgba(240,240,240,1) 0%,rgba(227,227,227,1) 100%)", // IE10+
						"linear-gradient(top, rgba(240,240,240,1) 0%,rgba(227,227,227,1) 100%)", // W3C
					],
					filter: "progid:DXImageTransform.Microsoft.gradient( startColorstr='#f0f0f0', endColorstr='#e3e3e3',GradientType=0 )", // IE6-9
*/
					"border-bottom": "1px solid silver",
					"overflow": "hidden",
					"white-space": "nowrap",
					cursor: "default",
					display: "inline-flex"
				}
			},

			/**
			 *
			constructor: function() {
			},
			 */

			/**
			 * @overrides ../Control.prototype
			 */
			_align: "top",
			_autoSize: "height",
			_content: "<div></div>",

			/**
			 * @overrides ../Control.prototype.getClientNode
			 */
			getClientNode: function() {
				return this._node.childNodes[0];
			},

			/**
			 * @overrides ../Control.prototype.setParent
			 */
			setParent: function(value) {
				if(this._parent !== value) {
					if(this._parent !== null) {
						Method.disconnect(this._parent, "notifyEvent", this, "listNotifyEvent");
					}
					if(value !== null && !(value instanceof List)) {
						throw new Error("Need a List as parent");
					}
					this.inherited(arguments);
					if(this._parent !== null) {
						Method.connect(this._parent, "notifyEvent", this, "listNotifyEvent");
					}
				}
			},

			/**
			 * @overrides ../Control.prototype.dispatchChildEvent
			 */
			dispatchChildEvent: function(component, name, evt, f) {
				if(component instanceof ListColumn && component._parent === this) {
					if(name === "dragstart" && component.hasClass("size") === false) {
						var listview = this.getList();
						if(this === listview._header) {
							var r = f.apply(component, [evt]);
							if(r !== false && !(r instanceof Dragger)) {
								//var index = this.getIndex();
								//var parent = this;
								var dragger = new Mover(component).__override({

									/**
									 *
									 */
									start: function() {
										this.inherited(arguments);
									},

									/**
									 *
									 */
									end: function() {
										this.inherited(arguments);
										if(this._target === null && this._cancelled !== true) {
											listview.columnDropped(component, null);
										}
									},

									_updateHandles: function() {
										this.inherited(arguments);
										if(this._target !== null) {
											//component.getDefinition().setIndex(this._target.getIndex());
											//component.getDefinition().setVisible(true);
										} else {
											//component.getDefinition().setVisible(false);
										}
									},

									/**
									 *
									 */
									dropped: function(target) {
										//component.setIndex(target.getIndex());
										listview.columnDropped(component, target);
									}
								});
								dragger.start(evt);
							}
							return false;
						}
					}
				}

				return this.inherited(arguments);
			},

			/**
			 *
			 */
			listNotifyEvent: function(event, data) {
				if(event === "setScrollLeft" && this._node !== null) {
					this._node/*.childNodes[0]*/.scrollLeft = data;
				}
			},

			/**
			 *
			 */
			getList: function() {
				return this._parent !== null ? this._parent : null;
			}
		},

		properties: {

			"align": {
				set: Method,
				type: Panel.ALIGN
			},
			"autoSize": {
				set: Method,
				type: Panel.AUTOSIZE
			}
		}
	};

	return (ListHeader = Class.define(require, ListHeader));
});
