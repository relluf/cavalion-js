/**
 * js/comp/design/SelectionHandlerMover.js 
 */
js.lang.Class.require("js.util.DocumentHook");

/**
 * 
 */
js.lang.Class.declare("org.cavalion.comp.design.SelectionHandlerMover", {
	
	Extends: js.util.DocumentHook, 
	
	/**
	 * 
	 */
	Members: {
		_owner: null,
		_nodes: null,
		_evt_mousemove: null,
		_bounds_mousemove: null
	},
	
	ImplicitConstructor: false,
	
	/**
	 * 
	 */
	Constructor: function(owner, superctor) {
		this._owner = owner;
		this._nodes = [];
		superctor.apply(this, []);
	},

	/**
	 * 
	 */
	Methods: {
		
		/**
		 * 
		 */
		destroy: function() {
			// FIXME shouldn't this be refactored to js.lang.Object ?
			for(var k in this) {
				if(1) {
					delete this[k];
				}
			}
		},
	
		/**
		 * @overrides js.util.DocumentHook.prototype.activate
		 */
		activate: function(evt) {
			var i;
			var pt;
			var node;
			var sizers = this._owner._sizers;
			var length = sizers.length;
			var control;
			var parentNode = document.body;
			
			for(i = 0; i < length; ++i) {
				sizers[i].setVisible(false);
			}

			while(this._nodes.length < length) {
				node = document.createElement("div");
				node.className = "org-cavalion-comp-design-SelectionHandlerMover";
				this._nodes.push(node);
			}

			for(i = 0; i < length; ++i) {
				control = sizers[i]._control;
				if(control !== null) {
					node = this._nodes[i];
					
					pt = control.clientToDocument(0, 0);
					
					node.style.left = String.format("%dpx", pt.x);
					node.style.top = String.format("%dpx", pt.y);
					node.style.width = String.format("%dpx", control.getWidth() - 4);
					node.style.height = String.format("%dpx", control.getHeight() - 4);
					node.pt = pt;
					
					parentNode.appendChild(node);
/*	
					if(i === 0) {
						if(control._parent !== null) {
							pt = control._parent.clientToDocument(0, 0);
							this._bounds_mousemove = {
								min: pt,
								max: {
									x: pt.x + control._parent.getWidth(),
									y: pt.y + control._parent.getHeight()
								}
							};
						} else {
							this._bounds_mousemove = null;
						}						
					}
*/	 
				} else {
					break; // other sizers will not have controls either
				}
			}
			
			this._evt_mousemove = evt;
			
			js.dom.Element.disableSelection();
			return js.lang.Class.__inherited(this, arguments);
		},

		/**
		 * @overrides js.util.DocumentHook.prototype.release
		 */
		release: function() {
			var sizers = this._owner._sizers;
			
			for(i = 0; i < this._nodes.length; ++i) {
				node = this._nodes[i];
				if(node.parentNode !== null) {
					node.parentNode.removeChild(node);
				}
			}
			
			for(i = 0; i < sizers.length; ++i) {
				sizers[i].setVisible(true);
			}
			
			this._evt_mousemove = null;
			
			js.dom.Element.enableSelection();
			return js.lang.Class.__inherited(this, arguments);
		},
		
		/**
		 * 
		 */
		getMouseMoveDelta: function(evt) {
			var x = evt.clientX;
			var y = evt.clientY;
			
			if(this._bounds_mousemove !== null) {
				if(x < this._bounds_mousemove.min.x) { 
					x = this._bounds_mousemove.min.x;				
				} else if(x > this._bounds_mousemove.max.x) {
					x = this._bounds_mousemove.max.x;		
				}

				if(y < this._bounds_mousemove.min.y) { 
					y = this._bounds_mousemove.min.y;				
				} else if(y > this._bounds_mousemove.max.y) {
					y = this._bounds_mousemove.max.y;		
				}
			}

			var dx = x - this._evt_mousemove.clientX;
			var dy = y - this._evt_mousemove.clientY;
				
			if(evt.ctrlKey === false) {
				dx = parseInt(dx / 8, 10) * 8;
				dy = parseInt(dy / 8, 10) * 8;
			}
			
			return {x: dx, y: dy};			
		},

		/**
		 * 
		 */
		keydown: function(evt) {
			if(evt.keyCode === 27) {
				this.mouseup(evt, true);
				evt.bubbleUp = false;
				evt.preventDefault();
			}
		},
		
		/**
		 * 
		 */
		mousemove: function(evt) {
			if(this._evt_mousemove !== null) {
				var delta = this.getMouseMoveDelta(evt);
				for(var i = 0; i < this._nodes.length; ++i) {
					var node = this._nodes[i];
					if(node.parentNode !== null) {
						node.style.left = String.format("%dpx", node.pt.x + delta.x);
						node.style.top = String.format("%dpx", node.pt.y + delta.y);
					}
				}
			}
		},
		
		/**
		 * 
		 */
		mouseup: function(evt, cancel) {
			var i;
			var node;
			var delta;
			var control;
			var bounds, newBounds;
			var sizers = this._owner._sizers;
			
			if(cancel !== true) {
				delta = this.getMouseMoveDelta(evt);
				for(i = 0; i < sizers.length; ++i) {
					control = sizers[i]._control;
					if(control !== null) {
						if(delta.x !== 0 || delta.y !== 0) {
							bounds = control.getBounds();
							newBounds = control.getBounds();
							newBounds.left += delta.x;
							newBounds.top += delta.y;
							control.setBounds(newBounds);
							newBounds = control.getBounds();
							
							if(!js.equals(bounds, newBounds)) {
								this._owner._owner.modified();
							}
						}
					}
				}				
			}
			
			this.release();
		}
	}
		
});