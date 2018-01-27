/**
 * 
 */
js.lang.Class.require("org.cavalion.comp.ui.Panel");

js.lang.Class.declare("org.cavalion.comp.design.ui.Host", {
	
	Extends: org.cavalion.comp.ui.Panel,
	
	/**
	 * 
	 */
	Members: {
	
		_designer: null,
		
		_innerHtml: "<div></div>"
		//_innerHtml: "<div></div>"
		
	},
	
	Methods: {
		
        /**
         * @overrides org.cavalion.comp.Component.prototype.destroy 
         */
        destroy: function(evt) {
			this.setDesigner(null);
			return js.lang.Class.__inherited(this, arguments);
		},
		
		/**
		 * @overrides org.cavalion.comp.Control.prototype.getClientNode
		 */
		_applyBounds: function() {
			try {
				return js.lang.Class.__inherited(this, arguments);
			} finally {
				this._node.childNodes[0].style.width = this._node.style.width;
				this._node.childNodes[0].style.height = this._node.style.height;
			}
		},		
		
		/**
		 * @overrides org.cavalion.comp.Control.prototype.getClientNode
		 */
		getClientNode: function() {
			this._nodeNeeded();
			return this._node.childNodes[0];
		},
		
        /**
         * @overrides org.cavalion.comp.Control.prototype.click 
         */
        click: function(evt) {
			if(evt.target === this._node || this._designer === null || !this._designer.isActive()) {
				return js.lang.Class.__inherited(this, arguments);
			}
        	return false;
        },
        
        /**
         * @overrides org.cavalion.comp.Control.prototype.hint
         */
        hint: function(evt) {
			return js.lang.Class.__inherited(this, arguments);
/*			
			if(this._designer === null || !this._designer.isActive()) {
				return js.lang.Class.__inherited(this, arguments);
			}
            return this._designer.dispatchEvent(this._designer.getRootComponent(), "hint", evt);
*/
        },
        
        /**
         * @overrides org.cavalion.comp.Control.prototype.mousedown
         */
        mousedown: function(evt) {
			if(evt.target === this._node || this._designer === null || !this._designer.isActive()) {
				return js.lang.Class.__inherited(this, arguments);
			}
            return this._designer.dispatchEvent(this._designer.getRootComponent(), "mousedown", evt);
        },
        
        /**
         * @overrides org.cavalion.comp.Control.prototype.mouseleave 
         */
        mouseleave: function(evt) {
			if(this._designer === null || !this._designer.isActive()) {
				return js.lang.Class.__inherited(this, arguments);
			}
            return this._designer.dispatchEvent(this._designer.getRootComponent(), "mouseleave", evt);
        },
                        
		/**
		 * 
		 */
		getScrollbarsVisible: function() {
			return this.hasClass("scrollbars");
		},
		
		/**
		 * 
		 */
		setScrollbarsVisible: function(value) {
			if(value !== this.getScrollbarsVisible()) {
				if(value === true) {
					this.addClass("scrollbars");
				} else {
					this.removeClass("scrollbars");
				}
			}
		},
		
		/**
		 * 
		 */
		getDesigner: function() {
			return this._designer;
		},
		
		/**
		 * 
		 */
		setDesigner: function(value) {
			var thisObj = this;

			if(this._designer !== value) {
				if(this._designer !== null) {
					this._designer.unlisten(this._li);
				}				
				this._designer = value;
				if(this._designer !== null) {
					this._li = this._designer.listen({
						
						/**
						 * 
						 */
						destroy: function() {
							thisObj.setDesigner(null);
						}
					});
				}
			}
		}
		
	},

	/**
	 * 
	 */
	Properties: {
/*		
		"designer": {
			type: org.cavalion.comp.design.Designer,
			set: Function
		}
*/
	}
	
});