define(function(require) {

	var Class = require("js/Class");
	var Panel = require("./Panel");

	var ListRow = {
		inherits: Panel,
		prototype: {
			"@css": {
				cursor: "default",
				overflow: "hidden",
				position: "absolute",
				"white-space": "nowrap",
				"&:nth-child(even)": {
					"background-color": "#f0f0f0"	
				},
				"&.selected": {
					color: "white",
					"background-color": "rgb(56, 121, 217)"
				},
				">.ListCell": {
					display: "inline-block",
					overflow: "hidden",
					"padding-left": "6px",
					"padding-top": "7px",
					"text-overflow": "ellipsis"
				}
			},
			_autoSize: "width",
			_rowIndex: -1,
			_list: null,

			getInnerHtml: function() {
			/**
			 * @overrides ../Control.prototype.getInnerHtml
			 */
				var list = this.getList();
				var className = "ListCell";
				var height = list.getRowHeight();
				var columns = list.getColumns();
				var html = [];

				for(var i = 0; i < columns.length; ++i) {
					html.push(String.format(
						"<div style=\"height: %dpx;\" class=\"%s %s\">" +
	//						"<div style='float: left; padding: 5px;'></div>" +
						"</div>",
						height, className, columns[i].getCellClassName(), this._rowIndex, i));
				}
				return html.join("");
			},
			initializeNodes: function(layoutChanged) {
			/**
			 * @overrides ../Control.prototype.initializeNodes
			 */
				this.inherited(arguments);
				if(this._rowIndex !== -1) {
					var list = this.getList();
					var columns = list.getColumnCount();

					if(layoutChanged === true || this._node.childNodes.length !== columns) {
						this._node.innerHTML = this.getInnerHtml();
					}

					this.setState("classesChanged", true);

					for(var i = 0; i < columns; ++i) {
						var column = list.getColumn(i);
						var cell = this._node.childNodes[i];
						list.renderCell(cell, this._rowIndex, column);
					}
				} else if(layoutChanged === true) {
					this._node.innerHTML = this.getInnerHtml();
				}
			},
			determineClasses: function() {
			/**
			 * @overrides ../Control.prototype.determineClasses
			 */
				var classes = this.inherited(arguments);
				if(this._rowIndex % 2 === 1) {
					classes.push("odd");
				}
				return classes.concat(this.getList().getRowClasses(this));
			},
			// applyBounds: function() {
			// /**
			//  * @overrides ./Panel.prototype.applyBounds
			//  */
			// 	var bu = "px";
			// 	this.setStyleProp("top", this._top, bu);
			// 	this.setStyleProp("left", this._left, bu);
			// 	this.setStyleProp("bottom", bounds.bottom, bu);
			// 	this.setStyleProp("right", bounds.right, bu);
			// 	this.setStyleProp("width", bounds.width, bu);
			// 	this.setStyleProp("height", this._height, bu);
			// },
			layoutChanged: function() {
			/**
			 * @overrides ../Control.prototype.layoutChanged
			 */
				delete this._computedStyle;
				// blocked, no need to notify parent, the dimensions of a Row are fixed slash already known
			},
			isSelected: function() {
			/**
			 * @overrides ../Control.prototype.isSelected
			 */
				var list = this.getList();
				if(list !== null) {
					return list.isRowSelected(this._rowIndex);
				}
				return false;
			},
			ondblclick: function(evt) {
			/**
			 * @overrides ../Control.prototype.ondblclick
			 */
				var r = this.inherited(arguments);
				if(r !== false) {
					var list = this.getList();
					if(list._executesAction === "onRowDblClick" && list._action !== null && list._action.isEnabled()) {
						r = list._action.execute(evt, list);
					}
				}
				return r;
			},

			getList: function() {
				if(this._list === null) {
					// FIXME Should be reset when parent (or parents parent) changes
					this._list = (this._parent !== null ? this._parent.getList() : null);
				}
				return this._list;
			},
			getRowIndex: function() {
				return this._rowIndex;
			},
			setRowIndex: function(value) {
				if(this._rowIndex !== value) {
					this._rowIndex = value;
					if(this._rowIndex >= this.getList().getCount()) {
						console.error("Out of bounds", this._rowIndex, this);
						this._rowIndex = -1;
					}
					if(this._node === null) {
						this.setTop(this._rowIndex * this.getList().getRowHeight());
					} else {
						this._top = this._rowIndex * this.getList().getRowHeight();
						this._node.style.top = String.format("%dpx", this._top);
						//this._node.style.top = "";
						//this._node.style.webkitTransform = String.format("translate3d(0, %dpx, 0)", this._top);
					}

					this.setState("classesInvalidated");

					if(this._node !== null) {
						this.initializeNodes();
						this.update();
					}
				}
			}
		}
	};

	return (ListRow = Class.define(require, ListRow));
});