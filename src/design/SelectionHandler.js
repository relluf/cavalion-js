/**
 * js/comp/design/SelectionHandler.js 
 */
js.lang.Class.require("org.cavalion.comp.Component");
js.lang.Class.require("org.cavalion.comp.util.ui.Sizer");
js.lang.Class.require("org.cavalion.comp.design.SelectionHandlerMover");
js.lang.Class.require("org.cavalion.comp.design.SelectionHandlerSelector");

/**
 * 
 */
js.lang.Class.declare("org.cavalion.comp.design.SelectionHandler", {
	
	Extends: org.cavalion.comp.Component,

	/**
	 * 
	 */
	Members: {
		_sizers: null,
		_mover: null,
		_selector: null,
		
		_hint: null,
		_hintComponent: null,
		_hintMode: 0,
		_spaceListener: null
	},

	/**
	 * 
	 */
	Constructor: function() {
		this._mover = new org.cavalion.comp.design.SelectionHandlerMover(this);
		this._selector = new org.cavalion.comp.design.SelectionHandlerSelector(this);
		
		this._sizers = [new org.cavalion.comp.util.ui.Sizer(this)];
		this._sizers[0].setHost(this._owner._host);
		this._sizers[0].setOnSizing(this._sizerSizing.closure(this));
		this._sizers[0].setOnSized(this._sizerSized.closure(this));
		
		this._hint = new org.cavalion.comp.ui.Label(this);
		this._hint.setPositioning("absolute");
		this._hint.setCss({
			"": "background-color: infobackground; " +
					"padding: 2px; " +
					"border: 1px solid black;" +
					"font: 8pt tahoma;" +
					"z-index: 100;" +
					"-webkit-box-shadow: 2px 2px 2px rgba(0,0,0,0.5);" +
					"cursor: default;",
			">div.table": "max-height: 300px;" +
					"overflow-y: auto; overflow-x: hidden;" +
					"padding-right: 20px;",
			" td": "white-space: nowrap;",
			" td.col1": "color: navy;",
			" td.col2": "color: navy;",
			" td.col1.def": "color: black;",
			" td.col2.def": "color: gray;",
			" td.col1.inh": "color: maroon;",
			" td.col2.inh": "color: maroon;",
			" td.col1.dis": "color: black;",
			" td.col2.dis": "color: gray;"
		});
		
		this._hint.setVisible(false);
		this._hint.setParentNode(document.body);
		this._hint.setOnMouseEnter(function() {
			org.cavalion.comp.Component.clearTimeout(this._owner, "hintRemove");
		});
		this._hint.setOnMouseLeave(function() {
			this.setVisible(false);
		});
		this._hint.setOnDragStart(function(evt) {
			if(evt.shiftKey === false) {
				return new org.cavalion.comp.ControlDragger(this);
			}
		});
		
		var thisObj = this;
		this._spaceListener = {
				keyCode: 32,
				callback: function(evt) {
					if(evt.type === "keydown" && thisObj._hint.isVisible()) {
						thisObj._hintMode++;
						thisObj._hintMode = thisObj._hintMode % 3;
						thisObj.hint();
					}
				}
		};
		js.util.HotkeyManager.register(this._spaceListener);
	},
	
	/**
	 * 
	 */
	Methods: {

		/**
		 * @overrides org.cavalion.comp.Component.prototype.destroy
		 */
		destroy: function() {
			this._hint.destroy();
			this._mover.destroy();
			js.util.HotkeyManager.unregister(this._spaceListener);
			return js.lang.Class.__inherited(this, arguments);
		},
		
		/**
		 * 
		 */
		_sizerSized: function(evt, newBounds) {
			var control = this._sizers[0]._control;
			var oldBounds = control.getBounds();
			control.setBounds(newBounds);
			if(!js.equals(oldBounds, newBounds)) {
				this._owner.modified();
			}
		},
		
		/**
		 * 
		 */
		_sizerSizing: function() {
		},
		
		/**
		 * 
		 */
		hostChanged: function() {
			for(var i = 0; i < this._sizers.length; ++i) {
				this._sizers[i].setHost(this._owner._host);
			}
		},
		
		/**
		 * 
		 */
		update: function() {
			var i;
			var selection = this._owner._selection;
			
			this._sizers[0].setType(selection.length > 1 ? "four-inside" : "eight-outside");
		
			while(this._sizers.length < selection.length) {
				var sizer = new org.cavalion.comp.util.ui.Sizer(this);
				sizer.setHost(this._owner._host);
				sizer.setType("four-inside");
				this._sizers.push(sizer);				
			}
		
			for(i = selection.length; i < this._sizers.length; ++i) {
				this._sizers[i].setControl(null);
			}
			
			for(i = 0; i < selection.length; ++i) {
				var component = selection[i];
				if(component instanceof org.cavalion.comp.Control) {
					var control = component;
					this._sizers[i].setControl(control);
					this._sizers[i].setVisible(true);
				} else {
					this._sizers[i].setControl(this._owner.getComponentHandle(selection[i]));
				}
			}
			
			if(this._hint.isVisible() && selection.length === 1 && selection[0] !== this._hintComponent) {
				this._hint.setVisible(false);
			}
		},
		
		/**
		 * 
		 */
		isSelecting: function() {
			return this._selector.isActive() || this._mover.isActive();
		},

		/**
		 * 
		 */
		mousedown: function(component, evt) {
			
			window.e = evt;
			
			var root = this._owner._root;
			if((component === root && !(root instanceof org.cavalion.comp.Control)) || evt.ctrlKey === true) {
				this._selector.activate(evt, component);
			} else {
				this._mover.activate(evt);
			}
		},
		
		/**
		 * 
		 */
		mousemove: function(component, evt) {
			if(component !== this._hintComponent) {
				org.cavalion.comp.Component.setTimeout(this, "hintRemove", this._hint.setVisible.bind(this._hint, false), 50);
			}
		},
		
		/**
		 * 
		 */
		mouseleave: function(component, evt) {
			if(component === this._hintComponent) {
				org.cavalion.comp.Component.setTimeout(this, "hintRemove", this._hint.setVisible.bind(this._hint, false), 50);
			}
		},
		
		/**
		 * 
		 */
		hint: function(component, evt) {
			component = component || this._hintComponent;
			this._hintComponent = component;
			
			var name = component.getName();
			var html = [];
			if(name !== "") {
				html.push(String.format("<b>%H</b>: %H#%d", name, component.getClass().getName(), component.hashCode()));
			} else {
				html.push(String.format("%H#%d", component.getClass().getName(), component.hashCode()));
			}
			
			if(this._hintMode > 0) {
				var properties = component.defineProperties();
				var keys = js.keys(properties).sort();
				html.push("<div class=\"table\"><table>");
				for(var i = 0; i < keys.length; ++i) {
					var k = keys[i];
					var prop = properties[k];
					var def = prop.hasDefaultValue(component);
					var inh = prop.hasInheritedValue(component);
					var dis = !prop.isEnabled(component);
					var classes = [];
					
					if(def === true) {
						classes.push("def");
					}
					
					if(inh === true) {
						classes.push("inh");
					}

					if(dis === true) {
						classes.push("dis");
					}
					
					classes = classes.join(" ");
					
					if(prop.isVisible() && (this._hintMode === 2 || !def)) {
						html.push(String.format("<tr><td class=\"col1 %s\">%H</td><td class=\"col2 %s\">%H</td></tr>", 
								classes, k, classes, String.format("%n", prop.get(component))));							
					}						                      
				}
				html.push("</div></table>");
			}
			
			this._hint.setCaption(html.join(""));
			
			if(evt !== undefined) {
				this._hint.setBounds(evt.clientX, evt.clientY + 20);
				this._hint.setVisible(true);
			}
			org.cavalion.comp.Component.clearTimeout(this, "hintRemove");
		}
	}
});