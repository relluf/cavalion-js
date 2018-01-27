define(function(require) {

	var Class = require("js/Class");
	var Method = require("js/Method");
//	var Component = require("../Component");
	var Panel = require("./Panel");
	var ListRow = require("./ListRow");
	var List = require("js/referenceClass!./List");

	var ListBody = {
		inherits: Panel,
		prototype: {

			constructor: function() {
				this._rowCache = [];
			},

			"@css": {
				overflow: "hidden"
			},

			_count: 0,
			_rowCache: null,
			_firstRow: -1,

			alignControls: function() {
			/**
			 * @overrides ./Panel.prototype.alignControls
			 */
			},
			setParent: function(value) {
			/**
			 * @overrides ../Control.prototype.setParent
			 */
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
						this.columnsChanged();
					}
				}
			},

			listNotifyEvent: function(event, data) {
				if(event === "columnsChanged") {
					this.columnsChanged(data);
				} else if(event === "updateRows") {
					this.updateRows(data);
				}
			},
			getList: function() {
				return this._parent !== null ? this._parent : null;
			},
			render: function() {
				var list = this.getList();
				if(list.getCount() === 0) {
					this._firstRow = 0;
					this.setCount(0);
				} else {
					// visual effect, a form will seem to render more quickly
					this.setTimeout("renderRows", 0);
					//this.renderRows();
				}
			},
			renderRows: function() {
				var list = this.getList();
				var firstRow = list.getTopRow();
				var visibleRows = list.getVisibleRowCount(true);
				var max = list.getCount();
				var rowBuffer = list._rowBuffer; //getRowBuffer() ?
				var row;

				var count = visibleRows + rowBuffer * 2;

				if(count > max) {
					count = max;
				}

				firstRow -= rowBuffer;
				if(firstRow < 0) {
					firstRow = 0;
				}

				if(firstRow + count > max) {
					firstRow = max - count;
				}

				var delta = Math.abs(this._firstRow - firstRow);
//console.log("delta", delta, "count", count, "firstRow", firstRow);
				this.setCount(count);

				if(this._firstRow === -1 || delta > rowBuffer) {
					for(var i = 0; i < count; ++i) {
						row = this._controls[i];
						row.setRowIndex(i + firstRow);
					}
					this._firstRow = firstRow;
				} else {

					if(delta > rowBuffer * 0.75 || firstRow === 0 || firstRow === max - count) {

						while(this._firstRow < firstRow) {
							row = this._controls.splice(0, 1)[0];
							this._controls.push(row);
							row.setRowIndex(this._firstRow + count);
							this._firstRow++;
						}

						while(this._firstRow > firstRow) {
							row = this._controls.pop();
							this._controls = [row].concat(this._controls);
							row.setRowIndex(--this._firstRow);
						}

					}
				}
			},
			updateRows: function(range) {
				if(this.hasOwnProperty("_controls")) {
					for(var i = 0; i < this._controls.length; ++i) {
						var c = this._controls[i];
						if(c._node !== null) {
							// Update row when the range is unknown or it's rowIndex is within the range
							if(range === undefined || (c._rowIndex >= range.start && c._rowIndex <= range.end)) {
								c.initializeNodes();
							}
						}
					}
				}
			},
			rowHeightChanged: function() {
				var rowHeight = this.getList().getRowHeight();
				if(this.hasOwnProperty("_controls")) {
					for(var i = 0; i < this._controls.length; ++i) {
						var row = this._controls[i];
						var index = row._rowIndex;
						if(index !== -1) {
							row._rowIndex = -1;
							row.setRowIndex(index);
							row.setHeight(rowHeight);
						}
					}
				}
			},
			columnsChanged: function() {

				function f() {
					var i;

					if(this.hasOwnProperty("_controls")) {
						for(i = 0; i < this._controls.length; ++i) {
							if(this._controls[i]._node !== null) {
								this._controls[i].initializeNodes(true);
							}
						}
					}
					for(i = 0; i < this._rowCache.length; ++i) {
						// FIXME
						if(this._rowCache[i]._node !== null) {
							this._rowCache[i]._node.innerHTML = "";
						}
					}
				}

				this.setTimeout("columnsChanged", f.bind(this), 50);
			},
			setCount: function(value) {
				if(this._count !== value) {
					this._count = value;

					var list = this.getList();
					var rowHeight = list.getRowHeight();
					var count = list.getCount();
					var index;

					if(!this.hasOwnProperty("_controls")) {
						this._controls = [];
					}

					while(this._controls.length < this._count) {
						var row;
						if(this._rowCache.length) {
							row = this._rowCache.splice(0, 1)[0];
						} else {
							row = new ListRow();
							row.setOwner(this);
						}
						row.setHeight(rowHeight);
						row._parent = this;
						this._controls.push(row);

						index = this._controls.length - 1 + this._firstRow;
						if(index < count) {
							row.setRowIndex(index);
						} else {
							row.setRowIndex(-1);
						}
						row._update();
					}

					if(this._controls.length > this._count) {
						var n = this._controls.length - this._count;
						var rows = this._controls.splice(this._controls.length - n, n);
						for(var i = 0; i < rows.length; ++i) {
							rows[i]._parent = null;
							rows[i]._rowIndex = -1;
							rows[i]._update();
						}
						this._rowCache = this._rowCache.concat(rows);
					}
				}
			}
		}
	};

	return (ListBody = Class.define(require, ListBody));
});