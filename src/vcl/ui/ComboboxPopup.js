/**
 * ComboboxPopup.js
 */
js.lang.Class.require("org.cavalion.comp.ui.Popup");
js.lang.Class.require("org.cavalion.comp.EventDispatcher");

js.lang.Class.declare("org.cavalion.comp.ui.ComboboxPopup", {

	/**
	 * Base class
	 */
	Extends: org.cavalion.comp.ui.Popup,

	/**
	 * Member definitions
	 */
	Members: {


		/**
		 * @overrides org.cavalion.comp.Control.prototype
		 */
		_innerHtml: "<div class=\"items\"></div>"
		
	},
	
	/**
	 * 
	 */
	Constructor: function(owner) {
		
		this._hook.__override({
			
			/**
			 * 
			 */
			mousedown: function(evt) {
				if(evt.target.className === "item") {
					owner.dispatch("itemclick", evt);
				} else {
					var control = org.cavalion.comp.Control.get(evt.target);
					if(control !== owner._popup) {
						owner._popup.close();
					}
				}
			}

		
		}, true);
			
	},

	/**
	 * Method definitions
	 */
	Methods: {

		/**
		 * @overrides org.cavalion.comp.Control.prototype._initializeNodes
		 */
		_initializeNodes: function() {
			var r = js.lang.Class.__inherited(this, arguments);
			this._nodes.items = this._node.childNodes[0];
			return r;
		},

		/**
		 * @overrides org.cavalion.comp.Control.prototype.getClientNode
		 */
		getClientNode: function() {
			this._nodeNeeded();
			return this._nodes.items;
		},
		
		/**
		 * @overrides org.cavalion.comp.ui.Popup.prototype.popup
		 */
		popup: function(position, control, maxHeight, minHeight, node) {
			// minHeight not implemented yet
			// maxHeight defaults to 250 (not used yet)

			if(this._hook.isActive() === false) {
				
				this.updateSizeAndPos(position, control, maxHeight, minHeight, node);
				
				// FIXME
				org.cavalion.comp.Component.setTimeout(this, "activate", this._hook.activate.bind(this._hook), 200);
			}
		},
		
		/**
		 * 
		 */
		updateSizeAndPos: function(position, control, maxHeight, minHeight, node) {
			var parentNode = this.getParentNode();
			if(parentNode === document.body) {
				// FIXME for IE and Firefox, maybe should be alignSelfNode?
				parentNode = parentNode.parentNode;
			}
			
			var rect = js.dom.Element.getClientRect(parentNode);
			var height = maxHeight || 250;
			var cssProps;
			var width;
			var xy;
			
			if(height === -1) {
				height = rect.height;
			}
			
			this._nodeNeeded();
		
			if(control instanceof org.cavalion.comp.Control) {
				cssProps = control._cachedCssProps;
				width = control.getWidth();
				xy = control.clientToDocument(0, control.getHeight() + 1);
				if(cssProps !== undefined) {
					xy.x += cssProps.margin.left;
					xy.y -= cssProps.margin.bottom;
				}
			} else {
				xy = {x: control.left, y:control.top + control.height};
				width = control.width;
			}

			if(xy.y + height > rect.height) {
				height = rect.height - xy.y;
				if(height < 30) {
					xy.y -= 250;
					height = 220;
				}
			}
			
			var sl = this._scrollLeft;
			var st = this._scrollTop;
			
			this.setAutoSize("width");
			this.setLeft(xy.x);
			this.setTop(xy.y);
			this.setHeight(height);

			this._node.style.overflow = "hidden";
			this.removeClass("scrollbar");
			this._visible = true;
			this._update();

			var cw1 = this._node.clientWidth;
			this._node.style.overflowY = "auto";
			var cw2 = this._node.clientWidth;

			if(!hostenv.browser.ie) {
				this._node.scrollLeft = 0;
				this._node.scrollTop = 0;
				this.restoreScroll();
			}
			
			if(cssProps !== undefined) {
				cw1 -= cssProps.margin.width;
				cw2 -= cssProps.margin.width;
				width -= cssProps.width;
				width -= cssProps.border.width;
			}

			if(cw1 !== cw2 || cw1 < width) {
				this.setAutoSize("none");
				cw1 += (cw1 - cw2);
				if(cw1 < width) {
					cw1 = width;
				}
				this.setWidth(cw1);
			}
			
			if(this._node.scrollHeight > this._node.clientHeight) {
				this.setWidth(cw1 + 10);
				if(node !== undefined) {
					this._node.scrollTop = 0;
					rect = js.dom.Element.getAbsoluteRect(node);
					rect.top -= xy.y;
					rect.top -= parseInt(height / 2);
					if(rect.top < 0) {
						rect.top = 0;
					}
					this._node.scrollTop = rect.top;
				}
			} else {
				this.setAutoSize("height");
			}
		}
		
	}

});