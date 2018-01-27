/**
 * js/comp/design/ctl/ComponentHandle.js
 */
js.lang.Class.require("org.cavalion.comp.Control");

js.lang.Class.declare("org.cavalion.comp.design.ui.ComponentHandle", {
	
	Extends: org.cavalion.comp.Control,
	
	/**
	 * 
	 */
	Members: {
		_autoSize: "both",
	
		_component: null,
		
		_innerHtml: String.format("<img src='%simg/org-cavalion-comp-design-ui-ComponentHandle/icon.gif'>", hostenv.basePath)
	},
	
	/**
	 * 
	 */
	Methods: {
		
		/**
		 * @overrides org.cavalion.comp.Component.prototype.destroy
		 */
		destroy: function() {
			this.setComponent(null);
			return js.lang.Class.__inherited(this, arguments);
		},
		
		/**
		 * @overrides org.cavalion.comp.Control.prototype._initializeNodes
		 */
		_initializeNodes: function() {
			var caption;
			caption = this._nodes.caption = document.createElement("div");
			caption.className = "org-cavalion-comp-design-ui-ComponentHandle-caption";
			if(this._component !== null) {
				if(this._component._name !== "") {
					caption.innerHTML = String.format("%H", this._component.getName());
				}
				if(this._component._isRoot === false && this._component._uri !== "" && 
						this._component._uri !== this._component._owner._uri) {
					js.dom.Element.addClass(caption, "inherited");
				}
			}
			
			if(this.hasState(org.cavalion.comp.ControlState.showing)) {
				this.getParentNode().appendChild(caption);
			}
			return js.lang.Class.__inherited(this, arguments);
		},
		
		/**
		 * @overrides org.cavalion.comp.Control.prototype._applyBounds
		 */
		_applyBounds: function() {
			try {
				return js.lang.Class.__inherited(this, arguments);
			} finally {
				this.positionCaption();
			}			
		},
		
		/**
		 * @overrides org.cavalion.comp.Control.prototype._cacheCssProps
		 */
		_cacheCssProps: function() {
			try {
				return js.lang.Class.__inherited(this, arguments);
			} finally {
				this._cachedCssProps.caption = js.dom.Element.getAbsoluteRect(this._nodes.caption);
			}
		},
		
		/**
		 * @overrides org.cavalion.comp.Control.prototype._show
		 */
		_show: function() {
			this._nodeNeeded();
			this.getParentNode().appendChild(this._nodes.caption);
			return js.lang.Class.__inherited(this, arguments);
		},
		
		/**
		 * @overrides org.cavalion.comp.Control.prototype._hide
		 */
		_hide: function() {
			if(this._nodes !== null && this._nodes.caption.parentNode !== null) {
				this._nodes.caption.parentNode.removeChild(this._nodes.caption);
			}
			return js.lang.Class.__inherited(this, arguments);
		},
		
		/**
		 * @overrides org.cavalion.comp.Control.prototype.mousedown
		 */
		mousedown: function(evt) {
			return this._owner.dispatchEvent(this._component, "mousedown", evt);
		},
		
		/**
		 * @overrides org.cavalion.comp.Control.prototype.mousedown
		 */
		mouseleave: function(evt) {
			return this._owner.dispatchEvent(this._component, "mouseleave", evt);
		},
		
		/**
		 * @overrides org.cavalion.comp.Control.prototype.hint
		 */
		hint: function(evt) {
			return this._owner.dispatchEvent(this._component, "hint", evt);
		},
		
		/**
		 * @overrides org.cavalion.comp.Control.prototype.setBounds
		 */
		setBounds: function() {
			try {
				return js.lang.Class.__inherited(this, arguments);
			} finally {
				if(this._component !== null) {
					this._component._left = this._left;
					this._component._top = this._top;
				}
			}
		},
		
		/**
		 * @overrides org.cavalion.comp.Control.prototype.isVisible
		 */
		isVisible: function() {
			if(this._component !== null && this._owner instanceof org.cavalion.comp.design.Designer) {
				r = this._owner.isComponentVisible(this._component);
			} else {
				r = true;
			}
			return r && js.lang.Class.__inherited(this, arguments);
		},

		/**
		 * 
		 */
		positionCaption: function() {
			if(this._node !== null) {
				this._cachedCssPropsNeeded();
				if(this._cachedCssProps.caption === undefined) {
					this._cachedCssProps.caption = js.dom.Element.getAbsoluteRect(this._nodes.caption);
				}
				
				var caption = this._nodes.caption;
				var pt = this.getParentOffset();
				var top = this._top + 26;
				var left = this._left + (this._width + this._cachedCssProps.width) / 2;
				left -= this._cachedCssProps.caption.width / 2;
				left -= 2; // why?
				
				caption.style.left = String.format("%dpx", left + pt.x);
				caption.style.top =  String.format("%dpx", top + pt.y);
			}
		},
		
		/**
		 * 
		 */
		_componentSetName: function() {
			if(this._nodes !== null) {
				this._nodes.caption.innerHTML = String.format("%H", this._component.getName());
				if(this._cachedCssProps !== undefined) {
					this._cachedCssProps.caption = js.dom.Element.getAbsoluteRect(this._nodes.caption);
				}
				this._applyBounds();
			}
		},
		
		/**
		 * 
		 */
		_componentDestroy: function() {
			this.setComponent(null);
		},
		
		/**
		 * 
		 */
		setComponent: function(value, update) {
			if(this._component !== value) {
				if(this._component !== null) {
					Function.disconnect(this._component, "setName", this, "_componentSetName");
					Function.disconnect(this._component, "destroy", this, "_componentDestroy", "before");
				}
				this._component = value;
				if(this._component !== null) {
					Function.connect(this._component, "setName", this, "_componentSetName");
					Function.connect(this._component, "destroy", this, "_componentDestroy", "before");
					this._setBounds(this._component._left, this._component._top);
				}
				if(update !== false) {
					this.update();
				}
			}
		}
		
	}
	
});