/**
 * 
 */
js.lang.Class.require("org.cavalion.comp.ui.FormContainer");

js.lang.Class.declare("org.cavalion.comp.design.ui.ComponentDetail", {
	
	/**
	 * 
	 */
	Extends: org.cavalion.comp.ui.Panel,
	
	/**
	 * 
	 */
	Members: {
	
		_designer: null,
		_container: null,
		_containers: null
		
	},
	
	/**
	 * 
	 */
	Constructor: function(){
		this._containers = {};
	},
	
	/**
	 * 
	 */
	Methods: {
		
        /**
         * @overrides org.cavalion.comp.Component.prototype.destroy 
         */
        destroy: function(evt) {
			this.setDesigner(null);
			return js.lang.Class.__inherited(this, arguments);
		},
		
		/**
		 * 
		 */
		render: function() {
			var uri;
			if(this._designer !== null) {
				var root = this._designer._root;
				var selection = this._designer._selection;
				var component = selection[0];
				var di;
				
				if(selection.length === 1) {
					di = component.getClass().getMetaClass().getDesignerInfo();
					uri = di.wantsDetail(component, this._designer);
					if(uri === true) {
						uri = String.format("forms.design.ComponentDetail<%s>", selection[0].getClass().getName());
					} else if(uri === false) {
						uri = undefined;
					} else {
						uri = String.format("forms.design.ComponentDetail<%s>", uri);
					}
				}
				if(uri === undefined) {
					di = root.getClass().getMetaClass().getDesignerInfo();
					uri = di.wantsDetail(component, this._designer);
					if(uri === true) {
						uri = String.format("forms.design.ComponentDetail<%s>", root.getClass().getName());
					} else if(uri === false) {
						uri = undefined;
					} else {
						uri = String.format("forms.design.ComponentDetail<%s>", uri);
					}
				}
				
				this.setContainer(uri !== undefined ? this.getContainer(uri) : null);
			}
		},
		
		/**
		 * 
		 */
		getContainer: function(uri) {
			if(uri !== undefined) {
				var container = this._containers[uri];
				if(container === undefined) {
					container = this._containers[uri] = new org.cavalion.comp.ui.FormContainer(this);
					container.setVisible(false);
					container.setFormUri(uri);
					container.setParent(this);
					container.setOnGetFormParams(this.onGetFormParamsContainer);
				}
				
				return container;
			}
			return this._container;
		},
		
		/**
		 * 
		 */
		setContainer: function(value) {
			if(this._container !== value) {
				if(this._container !== null) {
					this._container.setVisible(false);
				}
				this._container = value;
				if(this._container !== null) {
					this._container.setVisible(true);
				}
			}
		},
		
		/**
		 * Called upon org.cavalion.comp.ui.FormContainer instance (as this context)
		 */
		onGetFormParamsContainer: function() {
			return {designer: this._owner._designer};
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
					this._designer.setDetail(null);
					this._designer.unlisten(this._li);
				}				
				this._designer = value;
				if(this._designer !== null) {
					if(this._designer.getHost() !== null) {
						this._designer = null;
						throw new Error("Only one detail per designer allowed");
					}
					
					this._designer.setDetail(this);
					this._li = this._designer.listen({
						
						/**
						 * 
						 */
						destroy: function() {
							thisObj.setDesigner(null);
						},
						
						/**
						 * 
						 */
						terminate: function() {
							thisObj.setContainer(null);
						},
						
						/**
						 * 
						 */
						selectionchanged: function() {
							thisObj.render();
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
		
		"designer": {
			type: "org.cavalion.comp.design.Designer",
			set: Function
		}
	}
});