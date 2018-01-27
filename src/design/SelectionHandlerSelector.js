/**
 * js/comp/design/SelectionHandlerMover.js 
 */
js.lang.Class.require("js.util.DocumentHook");

/**
 * 
 */
js.lang.Class.declare("org.cavalion.comp.design.SelectionHandlerSelector", {
	
	Extends: js.util.DocumentHook, 
	
	/**
	 * 
	 */
	Members: {
		_owner: null,
		_node: null,
		_control: null,
		_savedSelection: null,
		_evt_mousemove: null,
		_bounds_mousemove: null
	},
	
	ImplicitConstructor: false,
	
	/**
	 * 
	 */
	Constructor: function(owner, superctor) {
		this._owner = owner;
		this._node = document.createElement("div");
		this._node.className = "org-cavalion-comp-design-SelectionHandlerSelector";
		// nasty hack this is not a component, but makes use org.cavalion.comp.Component.setTimeout
		this._timeouts = {};
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
		activate: function(evt, component) {
			this._evt_mousemove = evt;
			
			this._node.style.left = evt.clientX + "px";
			this._node.style.top = evt.clientY + "px";
			this._node.style.width = "0px";
			this._node.style.height = "0px";
			
			document.body.appendChild(this._node);

			this._savedSelection = this._owner._owner.getSelection();
			this._owner._owner.setSelection([]);
			
			var control = component instanceof org.cavalion.comp.Control ? component : this._owner._owner._host;
			var pt = control.clientToDocument(0, 0);
			this._bounds_mousemove = {
				min: pt,
				max: {
					x: pt.x + control.getWidth(),
					y: pt.y + control.getHeight()
				}
			};
			
			this._control = control;
			
			js.dom.Element.disableSelection();
			return js.lang.Class.__inherited(this, arguments);
		},

		/**
		 * @overrides js.util.DocumentHook.prototype.release
		 */
		release: function() {
			this._evt_mousemove = null;
			this._control = null;
			
			document.body.removeChild(this._node);
			
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
		updateSelection: function() {
			var selection = [];
			var controls = this._control._controls;
			
			var pt = this._control.clientToDocument(0, 0, true);
			var minx = parseInt(this._node.style.left, 10) - pt.x;
			var miny = parseInt(this._node.style.top, 10) - pt.y;
			var maxx = minx + parseInt(this._node.style.width, 10);
			var maxy = miny + parseInt(this._node.style.height, 10);
			
			for(var i = 0; i < controls.length; ++i) {
				var bounds = controls[i].getBounds();
				if(!(bounds.left > maxx || bounds.left + bounds.width < minx || bounds.top > maxy || bounds.top + bounds.height < miny)) {
					if(controls[i] instanceof org.cavalion.comp.design.ui.ComponentHandle && controls[i].isVisible()) {
						selection.push(controls[i]._component);
					} else {
						selection.push(controls[i]);
					}
				}
			}			
			
			this._owner._owner.setSelection(selection);
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
				var style = this._node.style;
				var left, top, width, height;
				
				if(delta.x < 0) {
					left = evt.clientX;
					width = -delta.x;
				} else {
					left = this._evt_mousemove.clientX;
					width = delta.x;
				}
				
				if(delta.y < 0) {
					top = evt.clientY;
					height = -delta.y;
				} else {
					top = this._evt_mousemove.clientY;
					height = delta.y;
				}
				
				style.left = left + "px";
				style.top = top + "px";
				style.width = (width - 2) + "px";
				style.height = (height - 2) + "px";
				
				org.cavalion.comp.Component.setTimeout(this, "updateSelection", 100);
			}
		},
		
		/**
		 * 
		 */
		mouseup: function(evt, cancel) {
			org.cavalion.comp.Component.clearTimeout(this, "updateSelection");
			if(cancel === true) {
				this._owner.setSelection(this._savedSelection);
			} else {
				this.updateSelection();
				if(this._owner._owner._selection.length === 0) {
					this._owner._owner.setSelection([this._owner._owner._root]);
				}
			}
			
			this.release();
		}
	}
		
});