define(function(require) {

	var Class = require("js/Class");
	var DocumentHook = require("../../util/DocumentHook");
	var Stylesheet = require("../../util/Stylesheet");
	var Element = require("./Element");
	var List = require("js/referenceClass!./List");

	var ListColumn = {
		inherits: Element,
		prototype: {

			"@css": {
				display: "inline-block",
				overflow: "hidden",
				padding: "4px 6px 4px 6px",
				// "border-right": "1px solid silver",
				// "font-weight": "bold",
				"&.size": {
					"background-color": "#f0f0f0",
					cursor: "e-resize",
					"border-right": "5px solid silver",
					"padding-right": "12px"
				},
				"&.designing.invisible": {
					opacity: "0.35"
				},
				"&.sortable": {
					":active": {
						padding: "5px 5px 3px 7px",
						"background-position": "100% 60%"
					},
					"&.asc": {
						background: "url(/shared/vcl/images/sortarrowasc.png) no-repeat right"
					},
					"&.desc": {
						background: "url(/shared/vcl/images/sortarrowdesc.png) no-repeat right"
					}
				},
				".autowidth": {
					visibility: "hidden",
					height: "0px"
				}
			},

			_autoWidth: true,
			_autoWidthValue: "",
			_list: null,
			_attribute: "",
			_rule: null,
			_sizeable: true,
			_custom: false,

			_classNameCells: "",

			_displayFormat: "",

			_onGetValue: null,
			_onRenderCell: null,

			_sizer: null,

			constructor: function(owner) {
				this._rule = Stylesheet.createCssRule("width: 130px;", 5);
				this._rule.style.setProperty("display", "none", "important");
				//this._rule.style.setProperty("transition", "width 50ms");
			},
			destroy: function() {
			/**
			 * @overrides ../Component.prototype.destroy
			 */
				this.setList(null);
				Stylesheet.destroyCssRule(this._rule);
				this.inherited(arguments);
			},
			getParentComponent: function() {
			/**
			 * @overrides ../Component.prototype.getParentComponent
			 */
				return this._list;
			},
			setParentComponent: function(value) {
			/**
			 * @overrides ../Component.prototype.setParentComponent
			 */
				if(value instanceof List) {
					this.setList(value);
				} else {
					throw new Error("A %s-instance should be nested within List", this.getClass().getName());
				}
			},
			getInnerHtml: function() {
			/**
			 * @overrides ../Control.prototype.getInnerHtml
			 */
				if(this._autoWidth === true) {
					return String.format("<div class=\"autowidth%s\">%s</div>%s",
							this._attribute !== "" ? (" " + this.getAttributeClassName()) : "",
							this._autoWidthValue,
							this.getCaption()
					);
				}
				return this.inherited(arguments);
			},
			showNode: function() {
			/**
			 * @overrides ../Control.prototype.showNode
			 */
				var r = this.inherited(arguments);
				this._rule.style.setProperty("display", "", "important");
				this.autoWidth();
				return r;
			},
			hideNode: function() {
			/**
			 * @overrides ../Control.prototype.hideNode
			 */
				var r = this.inherited(arguments);
				this._rule.style.setProperty("display", "none", "important");
				return r;
			},
			setIndex: function() {
			/**
			 * @overrides ../Control.prototype.setIndex
			 */
				var oldValue = this.getIndex();
				var r = this.inherited(arguments);
				var newValue = this.getIndex();
				if(oldValue !== newValue) {
					this.propertyChanged("index", {oldValue: oldValue, newValue: newValue});
				}
				return r;
			},
			isVisible: function() {
			/**
			 * @overrides ../Control.prototype.isVisible
			 */
				return this._visible;
			},
			setVisible: function() {
			/**
			 * @overrides ../Control.prototype.setVisible
			 */
				var visible = this.isVisible();
				try {
					return this.inherited(arguments);
				} finally {
					if(visible !== this.isVisible()) {
						this.propertyChanged("visible", this.isVisible());
					}
				}
			},
			mousemove: function(evt) {
			/**
			 * @overrides ../Control.prototype.mousemove
			 */
				if(this._sizeable === true) {
					var xy = this.documentToClient(evt.clientX, evt.clientY);

					//var first = false; // and prev allowing sizing
					var last = false;

					if(/*(first === false && xy.x < 5) || */(last === false && xy.x > this._width - 8)) {
						this.addClass("size");
					} else {
						this.setTimeout("removeClass-size", this.removeClass.bind(this, "size"), 200);
					}
				}
				this.inherited(arguments);
			},
			mouseleave: function(evt) {
			/**
			 * @overrides ../Control.prototype.mousemove
			 */
				this.removeClass("size");
				this.inherited(arguments);
			},
			dragstart: function(evt) {
			/**
			 * @overrides ../Control.prototype.mousedown
			 */
				if(this.hasClass("size") === true) {
					var thisObj = this;
					var x = evt.clientX;

					if(this._sizer !== null && this._sizer.isActive()) {
						console.log("released sizer", this);
						this._sizer.release();
					} else {
						this._sizer = new DocumentHook(null, false).override({

							/**
							 *
							 */
							handle: function(evt) {
								if(evt.type === "mouseup" || (evt.type === "keyup" && evt.keyCode === 27)) {
	//								for(var i = 0; i < thisObj._parent._controls.length; ++i) {
	//									thisObj._parent._controls[i].layoutChanged();
	//								}
									thisObj._sizer.release();
									thisObj.dispatch("resized", evt);
									evt.preventDefault();
								}
								if(evt.type === "mousemove") {
									var d = (evt.clientX - x);
									var w = thisObj._width + d;

									if(w > 10) { // FIXME minWidth, maxWidth?
										thisObj.setWidth(w);
										x = evt.clientX;
									}

									thisObj.dispatch("sizing", evt);
								}
							}

						});
					}

					this.setAutoWidth(false);
					this.setWidth(parseInt(this._rule.style.width, 10));

					this._sizer.activate();
					evt.bubbleUp = false; // prevent global hook to register dragging info
				}
				this.inherited(arguments);
			},
			dblclick: function(evt) {
			/**
			 * @overrides ../Control.prototype.dblclick
			 */
				var r;
				if((r=this.inherited(arguments)) !== false) {
					if(this._sizer !== null && this._sizer.isActive()) {
						this._sizer.release();
					}
					if(this.hasClass("size") === true) {
						this.setAutoWidth(true);
					}
				}
				return r;
			},

			sizing: function(evt) {
			},
			setList: function(value) {
				if(this._list !== value) {
					if(this._list !== null) {
						this._list.removeColumn(this);
					}
					if(value !== null) {
						value.insertColumn(this);
					}
				}
			},
			propertyChanged: function(which, newValue) {
				if(this._list !== null) {
					this._list.columnPropertyChanged(this, which, newValue);
				}
			},
			autoWidth: function(value, cell) {
				if(arguments.length === 0) {
					value = this._autoWidthValue;
					this._autoWidthValue = "";
				}
				if(this._autoWidthValue.length < value.length) {
					this.setAutoWidthValue(value);
				}
			},
			getAttributeClassName: function() {
				return this._attribute.
					replace(/\#/g, "-").
					replace(/\./g, "-").
					replace(/\(/g, "-").
					replace(/\)/g, "-").
					replace(/ /g, "-").
					replace(/-$/g, "").
					replace(/^$/g, "dot");
			},
			getCellClassName: function() {
				var r = [this._rule.selectorText.substring(1)];
				if(this._classNameCells !== "") {
					r.push(this._classNameCells);
				}
				if(this._attribute !== "") {
					r.push(this.getAttributeClassName());
				}
				return r.join(" ");
			},
			getCaption: function() {
				// DEPRECATED should refactored to content or text
			    if(this._content instanceof Array) {
			        return String.format.apply(String, this._content);
			    }
				return this._content ||
					String.format("%s%s", this._attribute.charAt(0).toUpperCase(),
							this._attribute.substring(1));
			},
			setCaption: function(value) {
				if(this._caption !== value) {
					this._caption = value;
					if(this._node !== null) {
						this._node.innerHTML = this.getInnerHtml();
						this.layoutChanged();
					}
					this.propertyChanged("caption", value);
				}
			},
			getSizeable: function() {
				return this._sizeable;
			},
			setSizeable: function(value) {
				if(this._sizeable !== value) {
					this._sizeable = value;
					this.propertyChanged("sizeable", value);
				}
			},
			getCustom: function() {
				return this._custom;
			},
			setCustom: function(value) {
				if(this._custom !== value) {
					this._custom = value;
				}
			},
			getAutoWidth: function() {
				return this._autoWidth;
			},
			setAutoWidth: function(value) {
				if(this._autoWidth !== value) {
					this._autoWidth = value;
					if(this._node !== null) {
						this._node.innerHTML = this.getInnerHtml();
						this.layoutChanged();
					}
					this.propertyChanged("autoWidth", value);
				}
			},
			getAutoWidthValue: function() {
				return this._autoWidthValue;
			},
			setAutoWidthValue: function(value) {
				value = value.trim();
				if(this._autoWidthValue !== value) {
					this._autoWidthValue = value;
					if(this._node !== null) {
// console.debug(js.nameOf(this) + "->setTimeout", name, [this, arguments]);
						this.setTimeout("setAutoWidthValue", function() {
// var start = Date.now();
							this._node.innerHTML = this.getInnerHtml();
							var cs = this.getComputedStyle();
							var ph = parseInt(cs.paddingLeft, 10) + parseInt(cs.paddingRight, 10);
							var sw = parseInt(this._node.childNodes[0].scrollWidth, 10) + ph;
							var csw = parseInt(cs.width, 10);
							this._width = Math.max(sw, csw);
							this.layoutChanged();
							var w = parseInt(this._rule.style.width, 10);
							if(w !== this._width - ph) {
								this._rule.style.width = String.format("%dpx", this._width);
								this.propertyChanged("width", this._width);
							}
// console.debug(String.format("%n ran %d ms", this, Date.now() - start), name, [this, arguments]);
						}.bind(this), 250);

					}
					this.propertyChanged("autoWidthValue", value);
				}
			},
			getAttribute: function() {
				return this._attribute;
			},
			setAttribute: function(value) {
				if(this._attribute !== value) {
					this._attribute = value;
					this.setAutoWidthValue("");
					if(this._node !== null && this._caption === "") {
						this._node.innerHTML = this.getInnerHtml();
						this.layoutChanged();
					}
					this.propertyChanged("attribute", value);
				}
			},
			getClassNameCells: function() {
				return this._classNameCells;
			},
			setClassNameCells: function(value) {
				if(this._classNameCells !== value) {
					this._classNameCells = value;
					this.propertyChanged("classNameCells", value);
				}
			},
			getDisplayFormat: function() {
				return this._displayFormat;
			},
			setDisplayFormat: function(value) {
				if(this._displayFormat !== value) {
					this._displayFormat = value;
					this.propertyChanged("displayFormat", value);
				}
			},
			getOnGetValue: function() {
				return this._onGetValue;
			},
			setOnGetValue: function(value) {
				if(this._onGetValue !== value) {
					this._onGetValue = value;
					this.propertyChanged("onGetValue", value);
				}
			},
			getOnRenderCell: function() {
				return this._onRenderCell;
			},
			setOnRenderCell: function(value) {
				if(this._onRenderCell !== value) {
					this._onRenderCell = value;
					this.propertyChanged("onRenderCell", value);
				}
			}
		},
		properties: {
			"caption": {
				set: "setContent",
				type: Class.Type.STRING
			},
			"autoWidth": {
				set: Function,
				type: Class.Type.BOOLEAN
			},
			"attribute": {
				set: Function,
				type: Class.Type.STRING
			},
			"classNameCells": {
				set: Function,
				type: Class.Type.STRING
			},
			"displayFormat": {
				set: Function,
				type: Class.Type.STRING
			},
			"sizeable": {
				set: Function,
				type: Class.Type.BOOLEAN
			},
			"custom": {
				set: Function,
				type: Class.Type.BOOLEAN
			},
			// "width": {
			// 	get: Function,
			// 	set: Function,
			// 	type: Class.Type.INTEGER,
			// 	def: 130,
			// 	stored: function(component) {
			// 		return !component._autoWidth;
			// 	}
			// },
			"onGetValue": {
				set: Function,
				type: Class.Type.EVENT,
				editorInfo: {
					defaultValue: "(function(value, row, source) {})"
				}
			},
			"onRenderCell": {
				set: Function,
				type: Class.Type.EVENT,
				editorInfo: {
					defaultValue: "(function(cell, value, column, row, source, orgValue) {})"
				}
			}
		}
	};

	return (ListColumn = Class.define(require, ListColumn));
});
