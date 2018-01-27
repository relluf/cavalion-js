/**
 * js/comp/design/Scaffold
 */
js.lang.Class.require("org.cavalion.comp.Component");

js.lang.Class.declare("org.cavalion.comp.design.Scaffold", {
	
	/**
	 * 
	 */
	Extends: org.cavalion.comp.Component,
	
	/**
	 * 
	 */
	Members: {
		_onScaffold: null
	},

	/**
	 * 
	 */
	Methods: {

		/**
		 * @overrides org.cavalion.comp.Component.prototype.setOwner
		 */
		setOwner: function(value) {
			if(this._owner !== null) {
				Function.disconnect(this._owner, "loaded", this, "owner_loaded");
			}
			
			try {
				return js.lang.Class.__inherited(this, arguments);
			} finally {
				if(this._owner !== null) {
					Function.connect(this._owner, "loaded", this, "owner_loaded", "before");
				}
				
/*				
				if(value) {
					var index = value._components.indexOf(this);
					if(index !== -1) {
						value._components.splice(index, 1);
						value._components.splice(0, 0, this);
					}
				}
*/
			}
		},
	
		/**
		 * 
		 */
		owner_loaded: function() {
			if(this._owner !== null && this.getUri() !== this._owner._uri) {
				var loading = this._owner._loading;
				this._owner._loading = true;
				try {					
					var msgs = [];
					if(org.cavalion.comp.Component.fire(this, "onScaffold", [this.getScope(), this._owner, this._owner.getSpecializer(true), msgs], true) === true) {
						var dh = this.getDesignerHook(); 
						if(dh !== null) {
							//js.print(this, "designer modified");
							dh.modified();						
						}
						if(msgs.length > 0) {
							msgs.push(js.cs());
							msgs.push(String.format("dh := %n", dh));
							//hostenv.print(String.format("SCAFFOLD %s", this._owner._uri), msgs);
						}
					}
				} finally {
					this._owner._loading = loading;
				}
			}
		}
		
	},
	
	/**
	 * 
	 */
	Properties: {
/*		
		"onLoad": {
			stored: false,
			visible: false
		},
*/		
		"onScaffold": {
			type: js.lang.Type.FUNCTION
		}
	},
	
	/**
	 * 
	 */
	DesignerInfo: {
		
		/**
		 * 
		 */
		wantsComponentHandle: function(component, designer) {
			// only visible when root components uri equals components uri
			return component._owner !== null ? component._owner._uri === component.getUri() : false;
		}
		
	}
	
});