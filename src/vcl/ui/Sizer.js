define(function(require) {

	var Sizer = require("js/defineClass");
	var Type = require("js/Type");

	var Component = require("../Component");
	var Control = require("../Control");

	var DocumentHook = require("../../util/DocumentHook");
	var Event = require("../../util/Event");
	var HtmlElement = require("../../util/HtmlElement");

	var Method = require("js/Method");

	var SizerType = ["eight-outside", "four-inside"];

	// TODO Refactor this block
	(function() {
		var css =
			".org-cavalion-comp-util-ui-Sizer-handle.outside {\n" +
			"   background-color: black;\n" +
			"   position: absolute;\n" +
			"   width: 6px;\n" +
			"   height: 6px;\n" +
			"   line-height: 6px;\n" +
			"   z-index: 400;\n" +
			"}";

		var head = document.getElementsByTagName("head")[0];
		var style = document.createElement("style");
		style.type = "text/css";
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

		head.appendChild(style);
	}());

	return (Sizer = Sizer(require, {
		inherits: Component,
		prototype: {
			_control: null,
			_host: null,
			_parent: null,
			_nodes: null,
			_visible: true,
			_onChange: null,
			_type: "eight-outside",

			_onSizing: null,
			_onSized: null,

			destroy: function() {
				/**
				 *	@overrides Component.prototype.destroy
				 */
				this.setParent(null);
				this.setControl(null);
				this.destroyNodes();
				this.inherited(arguments);
			},
			nodesNeeded: function() {
				var i;
				if(this._control !== null) {
					if(this._nodes === null) {
						this._nodes = [];
						if(this._type === "eight-outside") {
							for(i = 0; i < 8; ++i) {
								this._nodes.push(this.createNode(document, i));
							}
						} else {
							for(i = 0; i < 4; ++i) {
								this._nodes.push(this.createNode(document, i));
							}
						}
					}
				} else {
					throw new Error("Can not render");
				}
			},
			createNode: function(documentNode, n) {
				var node = documentNode.createElement("div");
				var thisObj = this;
				var parentNode;

				if(this._host === null) {
					parentNode = documentNode.body;
				} else {
					parentNode = this._host.getClientNode();
				}

				node.style.display = "none";
				node.className = "org-cavalion-comp-util-ui-Sizer-handle " + (this._type === "eight-outside" ? "outside" : "inside");
				if(this._type === "eight-outside") {
					node.style.cursor = Sizer.cursors[n] + "-resize";
					node.onmousedown = function() {
						thisObj.mousedown.apply(thisObj, arguments);
					};
				}

				parentNode.appendChild(node);
				return node;
			},
			destroyNodes: function() {
				if(this._nodes !== null) {
					this._nodes.forEach(function(node) {
						// FIXME apparently this can happen when forms.design.Designer is closed
						if(node.parentNode !== null) {
							node.parentNode.removeChild(node);
						}
					});
					this._nodes = null;
				}
			},
			positionNode: function(node, xy, i) {
//				if(this._host !== null) {
//					this._host.getComputedStyle();
//				}
				if(this._type === "eight-outside") {
					if(document.all) { // FIXME Yyyyaaaak!
						node.style.left = String.format("%dpx", xy[0] - 1);
						node.style.top = String.format("%dpx", xy[1] - 1);
					} else {
						node.style.left = String.format("%dpx", xy[0] - 3);
						node.style.top = String.format("%dpx", xy[1] - 3);
					}
				} else {
					var x = (i === 1 || i === 2) ? 4 : 0;
					var y = i > 1 ? 4 : 0;
					node.style.left = String.format("%dpx", xy[0] - x);
					node.style.top = String.format("%dpx", xy[1] - y);
				}
				node.style.display = "";
				
				var control_align = js.get("_control._align", this);
				if(control_align === "client" || control_align === "none")  {
					node.style.backgroundColor = "black";
				} else {
					node.style.backgroundColor = "green";
				}
			},
			update: function() {
				/**
				 * 	Receives notifications when the hooked controls visibility changes
				 */
				if(!this.isLoading() && !this.isDesigning() && this._cancelUpdate !== true) {
					if(this._visible === true && this._control !== null && this._control.isVisible() && this._timeout === undefined) {
						var bounds = this.getControlBounds(this._control);
						this.setParent(this._control.getParent());
						this.nodesNeeded();
						for(var i = 0, l = this._nodes.length; i < l; ++i) {
							var xy;
							switch(i) {
								case 0: xy = [bounds.x, bounds.y];	break;
								case 1: xy = [bounds.x + bounds.width, bounds.y]; break;
								case 2: xy = [bounds.x + bounds.width, bounds.y + bounds.height]; break;
								case 3: xy = [bounds.x, bounds.y + bounds.height]; break;
								case 4: xy = [bounds.x + bounds.width / 2, bounds.y]; break;
								case 5: xy = [bounds.x, bounds.y + bounds.height / 2]; break;
								case 6: xy = [bounds.x + bounds.width, bounds.y + bounds.height / 2]; break;
								case 7: xy = [bounds.x + bounds.width / 2, bounds.y + bounds.height]; break;
							}
							this.positionNode(this._nodes[i], xy, i);
						}
					} else {
						this.destroyNodes();
					}
				}
			},
			
			
			mousedown: function(evt) {
				evt = Event.fix(evt);

				var x = evt.clientX;
				var y = evt.clientY;
				var pt = this._control.clientToDocument(0, 0);
				var node = document.createElement("div");
				var type = evt.target.style.cursor.split("-")[0];
				var style = node.style;
				var thisObj = this;
				var control = this._control;

				var bounds = this._control.getAbsoluteRect();
				bounds.left = pt.x;
				bounds.top = pt.y;

				style.position = "absolute";
				style.border = "2px solid black";
				style.left = String.format("%dpx", pt.x);
				style.top = String.format("%dpx", pt.y);
				style.width = String.format("%dpx", bounds.width - 2);
				style.height = String.format("%dpx", bounds.height - 2);
				style.zIndex = "9999999";

				var hook = new DocumentHook();
				hook.override({
					getBounds: function(evt) {
						var left = bounds.left;
						var top = bounds.top;
						var width = bounds.width;
						var height = bounds.height;

						var dx = evt.clientX - x;
						var dy = evt.clientY - y;

						if(evt.ctrlKey === false) {
							dx = parseInt(dx / 8, 10) * 8;
							dy = parseInt(dy / 8, 10) * 8;
						}

						if(type.indexOf("e") !== -1) {
							width += dx;
						}

						if(type.indexOf("n") !== -1) {
							if(height > dy) {
								top += dy;
								height -= dy;
							} else {
								top = 0;
								height = 0;
							}
						}

						if(type.indexOf("s") !== -1) {
							height += dy;
						}

						if(type.indexOf("w") !== -1) {
							if(width > dx) {
								left += dx;
								width -= dx;
							} else {
								left = 0;
								width = 0;
							}
						}

						if(isNaN(left)) {
							left = 0;
							dx = 0;
						}

						if(isNaN(top)) {
							top = 0;
							dy = 0;
						}

						if(width < 0 || isNaN(width)) {
							width = 0;
							dx = 0;
						}

						if(height < 0 || isNaN(height)) {
							height = 0;
							dy = 0;
						}

						return {left: left, top: top, width: width, height: height};
					},
					handle: function(evt) {
						// console.log(evt.type);
						return this.inherited(arguments);
					},
					activate: function() {
						HtmlElement.disableSelection();

						thisObj.destroyNodes();
						document.body.appendChild(node);

						return this.inherited(arguments);
					},
					release: function() {
						HtmlElement.enableSelection();

						document.body.removeChild(node);
						thisObj.update();

						return this.inherited(arguments);
					},
					mouseup: function(evt) {
						// console.log("mouseup", evt);
						try {
							var b = this.getBounds(evt);
							bounds = control.getAbsoluteRect();
							bounds.left += (b.left - pt.x);
							bounds.top += (b.top - pt.y);
							bounds.width = b.width;
							bounds.height = b.height;
							if(thisObj.dispatch("sized", evt, bounds) !== false) {
								control.setBounds && control.setBounds(
								    bounds.left, bounds.top,
								    bounds.right, bounds.bottom,
								    bounds.width, bounds.height);
							}
						} finally {
							this.release();
						}
					},
					mousemove: function(evt) {
						// console.log("mousemove", evt);
						if(thisObj.dispatch("sizing", evt) !== false) {
							var bounds = this.getBounds(evt);
							style.left = bounds.left + "px";
							style.top = bounds.top + "px";
							style.width = (bounds.width - 4) + "px";
							style.height = (bounds.height - 4) + "px";
						}
					},
					keyup: function(evt) {
						if(evt.keyCode === 27) {
							this.release();
							evt.preventDefault();
						}
					}

				}, true);

				hook.activate();
			},
			onsized: function(evt) {
				// TODO event stuff
			},
			onsizing: function(evt) {
				// TODO event stuff
				// console.log("onsizing", evt);
			},
			changed: function() {
				return this.fire("onChange", arguments);
			},
			sized: function() {
				return this.fire("onSized", arguments);
			},
			
			controlDestroy: function() {
				/**
				 *	Receives notification that hooked control was destroyed
				 */
				this.setControl(null);
			},
			hostDestroy: function() {
				/**
				 *	Receives notification that hooked host was destroyed
				 */
				this.setHost(null);
			},
			controlParentScrolled: function() {
				this.destroyNodes();
				this.setTimeout("update", 250);
			},
			controlVisibleChanged: function() {
				this.update();
			},
			getControlBounds: function(control) {
				var bounds = control.getAbsoluteRect();
				var offset = control.clientToDocument(0, 0);
				bounds.left = offset.x;
				bounds.top = offset.y;

				if(this._host !== null) {
					var pt = this._host.clientToDocument(0, 0, true);

					bounds.left -= pt.x;
					bounds.top -= pt.y;
				}


				if(control._node !== null) {
					control.nodeNeeded();
				}

				bounds.x = bounds.left;
				bounds.y = bounds.top;

				return bounds;
			},
			getControl: function() {
				return this._control;
			},
			setControl: function(value) {
				if(this._control !== value) {
					if(this._control !== null) {
						// FIXME listen
						//Method.disconnect(this._control, "applyBounds", this, "update");
						Method.disconnect(this._control, "applyClasses", this, "update");
						Method.disconnect(this._control, "visibleChanged", this, "update");
						//Method.disconnect(this._control, "parentScrolled", this, "controlParentScrolled");
						Method.disconnect(this._control, "destroy", this, "controlDestroy");
						this.setParent(null);
					}
					this._control = value;
					if(this._control !== null) {
						//Method.connect(this._control, "applyBounds", this, "update");
						Method.connect(this._control, "applyClasses", this, "update");
						Method.connect(this._control, "visibleChanged", this, "update");
						//Method.connect(this._control, "parentScrolled", this, "controlParentScrolled");
						Method.connect(this._control, "destroy", this, "controlDestroy", "before");
					}
					this.update();
				}
			},
			setParent: function(value) {
				if(this._parent !== value) {
					this._parent = value;
				}
			},
			getVisible: function() {
				return this._visible;
			},
			setVisible: function(value) {
				if(this._visible !== value) {
					this._visible = value;
					this.update();
				}
			},
			getHost: function() {
				return this._host;
			},
			setHost: function(value) {
				if(this._host !== value) {
					this._host = value;
					this.destroyNodes();
					this.update();
				}
			},
			getType: function() {
				return this._type;
			},
			setType: function(value) {
				if(this._type !== value) {
					this._type = value;
					this.destroyNodes();
					this.update();
				}
			}
	},
		statics: {
			cursors: [
			  		"nw",
			  		"ne",
			  		"se",
			  		"sw",
			  		"n",
			  		"w",
			  		"e",
			  		"s"
			  	]

		},
		properties: {

			"host": {
				type: Control,
				set: Function
			},

			"visible": {
				type: Type.BOOLEAN,
				set: Function
			},

			"type": {
				type: SizerType,
				set: Function
			},

			"onSizing": {
				type: Type.EVENT
			},

			"onSized": {
				type: Type.EVENT
			}

		}

	}));

});
