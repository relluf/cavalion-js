define(function(require) {

	var NodeCloseable = require("js/defineClass");
	var Type = require("js/Type");
	var Node = require("./Node");

	return (NodeCloseable = NodeCloseable(require, {

		inherits: Node,

		prototype: {

			'@css' : {
				">div.close": {
					"z-index": "2",
					position: "absolute",
					right: "8px",
					cursor: "pointer"
				}
			},

			_closeable: true,
			_onClose: null,

			loaded: function() {
					var has = this.hasClass("closeable");
					var value = this._closeable;
					if(value && !has) {
						this.addClass("closeable");
					} else if(!value && has) {
						this.removeClass("closeable");
					}
					this.setState("invalidated");
				return this.inherited(arguments);
			},
			render: function() {
			/** @overrides ../Control.prototype.render */
				this.inherited(arguments);
				if(this._nodes) {
					if(!this._closeable && this._nodes.close) {
						this._node.removeChild(this._nodes.close);
						delete this._nodes.close;
					} else if(this._closeable && !this._nodes.close) {
						this._nodes.close = document.createElement("div");
						this._nodes.close.className = "close";
						this._nodes.close.innerHTML = "<a class='close'>" + String.fromCharCode(215) + "</a>";
						this._node.insertBefore(this._nodes.close, this._nodes.icon);
					}
				}
			},
			setCloseable: function(value) {
				if(this._closeable !== value) {
					var has = this.hasClass("closeable");
					this._closeable = value;
					if(value && !has) {
						this.addClass("closeable");
					} else if(!value && has) {
						this.removeClass("closeable");
					}
					this.setState("invalidated");
				}
			}

		},

		properties: {

			"closeable": {
				set: Function,
				type: Type.BOOLEAN
			},
			"onClose": {
				type: Type.EVENT
			}

		}


	}));

});