/***
 * Designer.js
 */
js.lang.Class.require("org.cavalion.comp.Component");
js.lang.Class.require("org.cavalion.comp.design.SelectionHandler");
js.lang.Class.require("org.cavalion.comp.design.ui.ComponentHandle");
js.lang.Class.require("org.cavalion.comp.design.ui.ComponentDetail");
js.lang.Class.require("org.cavalion.comp.design.ui.Host");
js.lang.Class.require("js.util.Clipboard");

js.lang.Class.require("js.lang.propertyeditor.JsLangObject");
js.lang.Class.require("org.cavalion.comp.propertyeditor.Component");

js.lang.PropertyEditor.registerClass(js.lang.Object, js.lang.propertyeditor.JsLangObject.__class);
js.lang.PropertyEditor.registerClass(org.cavalion.comp.Component, org.cavalion.comp.propertyeditor.Component.__class);

js.lang.Class.declare("org.cavalion.comp.design.Designer", {

	/***
	 * Base class
	 */
	Extends: org.cavalion.comp.Component,

	/***
	 * Implemented interfaces
	 */
	Implements: [

	],

	/***
	 * Member definitions
	 */
	Members: {

		_root: null,
		_selection: null,
		_rootListenersImpls: null,
		_rootListeners: null,
		_host: null,
		_detail: null,
		
		_active: false,
		
		_nameNewComponents: true,
		
		_onActivate: null,
		_onTerminate: null,
		_onDispatchEvent: null,
		_onIsControlVisible: null,
		_onIsComponentVisible: null,
		_onEditPropertyValue: null,
		_onSelectionChange: null,
		_onModified: null,
		_onRefresh: null,
		
		_selectionHandler: null,
		_componentHandles: null

	},

	/***
	 * Constructor
	 */
	Constructor: function() {
		var thisObj = this;

		this._selectionHandler = new org.cavalion.comp.design.SelectionHandler(this);
		this._componentHandles = {};
		this._selection = [];
		this._rootListenersImpls = {
						
			/**
			 * 
			 */
			destroy: function() {
				this._onDestroy = null; // otherwise onDestroy will be called
				thisObj.setRootComponent(null);
			},
			
			/**
			 * 
			 */
			_insertComponent: function(component) {
				if(thisObj._nameNewComponents === true && component._name === "") {
					org.cavalion.comp.Component.nameComponent(component);
				}
				if(!(component instanceof org.cavalion.comp.Control)) {
					
/*					
					if(component.getClass().getMetaClass().getDesignerInfo().wantsComponentHandle(component, this)) {
						var handle = new org.cavalion.comp.design.ui.ComponentHandle(thisObj);
						js.print(this, String.format("%n; %d, %d", component, component._left, component._top));
						handle.setComponent(component);
						handle.setParent(thisObj._host);
						thisObj._componentHandles[component.hashCode()] = handle;
					} else {
						js.print(this, String.format("no handle for %s", component));
					}
*/
					org.cavalion.comp.Component.setTimeout(thisObj, "updateComponentHandles", 200);
				} else if(!(thisObj._root instanceof org.cavalion.comp.Control) && component._parent === null) {
					component.setParent(thisObj._host);
				}
			},

			/**
			 * 
			 */
			_removeComponent: function(component) {
				org.cavalion.comp.Component.clearTimeout(thisObj, "_positionCaptionsTimeout");
				
				var selection = [].concat(thisObj._selection);
				var idx = selection.indexOf(component);
				if(idx !== -1) {
					selection.splice(idx, 1);
					thisObj.setSelection(selection);
				}
				var handle = thisObj._componentHandles[component.hashCode()];
				if(handle !== undefined) {
					handle.destroy();
					delete thisObj._componentHandles[component.hashCode()];
				}
			}
			
		};
	},

	/***
	 * Method definitions
	 */
	Methods: {

		/**
		 *
		 */
		destroy: function() {
			if(this.isActive()) {
				this.terminate();
			}
		},

		/**
		 *
		 */
		beginUpdate: function() {
		},

		/**
		 *
		 */
		endUpdate: function() {
		},


		/**
		 * Creates a specified component.
		 *
		 * Call -createComponent- to create an instance of -componentClass- at the position
		 * specified by the -left- and -top- parameters and with the size specified by the
		 * -width- and -height- parameters. The new component will be a child of the component
		 * specified by the -parentComponent- parameter. If the -componentClass- is not a
		 * -org.cavalion.comp.Control- or descendant class, the -width- and -height- parameters will be ignored.
		 * When the -width- and -height- parameters are not specified, the component will have to
		 * its default size as specified by its constructor or behaviour.
		 */
		createComponent: function(componentClass, parentComponent, left, top, width, height) {
			if(typeof(componentClass) === "string") {
				componentClass = js.lang.Class.require(componentClass);
			}
			var component = componentClass.newInstance();

			try {
				if(!(component instanceof org.cavalion.comp.Control)) {
					component._left = left || 0;
					component._top = top || 0;
				}
/*				
				var name = componentClass.getName();
				var base = name.split(".").pop().toLowerCase();
				var i = 0;
				name = String.format("%s%d", base, ++i);
				while(this._root.findComponent(name)) {
					name = String.format("%s%d", base, ++i);
				}
				component.setName(name);
*/
				if(width !== undefined && component instanceof org.cavalion.comp.Control) {
					component.setBounds(left, top, width, height);
				}
				if(parentComponent !== undefined) {
					component.setParentComponent(parentComponent);
				}
				component.setOwner(this._root);
			} catch(e) {
				component.destroy();
				throw e;
			}
			return component;
		},
		
		/**
		 * 	Indicates whether the designer is activated.
		 */
		isActive: function() {
			return this._active;
//			return this._root ? this._root.getDesignerHook() === this : false;
		},

		/**
		 *
		 */
		activate: function() {
			if(this._active === true) {
				throw new Error("Already activated");
			}
			if(this._root === null) {
				throw new Error("No root component");
			}
			
			this._active = true;
			if(this._host !== null) {
				if(this._root instanceof org.cavalion.comp.Control) {
					this._root.setParent(this._host);
				}
				for(var i = 0; i < this._root._components.length; ++i) {
					var component = this._root._components[i];
					if(component instanceof org.cavalion.comp.Control) {
						if(component._parent === null) {
							component.setParent(this._host);
						}
					}
				}
			}
			this.updateComponentHandles();
			this.dispatch("activated");
		},

		/**
		 *
		 */
		clearSelection: function() {
			if(this._selection.length > 0) {
				this._selection = [];
				this.dispatch("selectionchanged");
			}
		},
		
		/**
		 * 
		 */
		getSelectionSource: function() {
    		var selection = this.getSelection(true);
    		var root = this._root;
    		var writer;
    		var source = [];
    		
    		for(var i = 0; i < selection.length; ++i) {
    			writer = new org.cavalion.comp.Writer(root, undefined, false, true);
    			source.push(writer.write(selection[i], false));
    		}

    		return source.join(",");
		},
		
		/**
		 * 
		 */
		deleteSelection: function() {
			var selection = this.getSelection();
			var i;
			
			if(selection.length === 0) {
				throw new Error("Nothing selected");				
			}
			
			for(i = 0; i < selection.length; ++i) {
				if(selection[i].getUri() !== this._root._uri) {
					throw new Error(String.format("Can not delete inherited component %s", selection[i].getName()));
				}
			}

			this.setSelection([selection[0].getParentComponent() || this._root]);
			
			for(i = 0; i < selection.length; ++i) {
				selection[i].destroy();
			}
			
			this.modified();
		},
		
		/**
		 *
		 */
		dispatchEvent: function(component, name, evt, f, args) {
			var r;
			if(!this.isDesigning() && this._onDispatchEvent !== null) {
				r = org.cavalion.comp.Component.fire(this, "onDispatchEvent", arguments);
			}
			
			if(r === undefined) {
				if(name === "hint") {
					this._selectionHandler.hint(component, evt);
				} else if(name === "mousemove") {
					this._selectionHandler.mousemove(component, evt);
				} else if(name === "mouseleave") {
					this._selectionHandler.mouseleave(component, evt);
				} else if(name === "mousedown") {
					if(evt.altKey === true) {
						//js.print(this, component);
					}
					
					var selected = this.isComponentSelected(component);
					if(evt.shiftKey === true) {
						if(selected === true) {
							this.unselectComponent(component);
						} else {
							this.selectComponent(component);
						}
					} else {
						if(selected === false) {
							this.setSelection([component]);
						}
						this.normalizeSelection();
						this._selectionHandler.update();
						this._selectionHandler.mousedown(component, evt);
					}
				}
				r = false;
			}
			
			return r !== false;
		},
		
		/**
		 * 
		 */
		isSelecting: function() {
			return this._selectionHandler.isSelecting();
		},
		
		/**
		 * 
		 */
		isControlVisible: function(control) {
			if(!this.isDesigning()) {
				return org.cavalion.comp.Component.fire(this, "onIsControlVisible", arguments) !== false;
			}
			return true;
		},

		/**
		 * 
		 */
		isComponentVisible: function(component) {
			if(!this.isDesigning()) {
				return org.cavalion.comp.Component.fire(this, "onIsComponentVisible", arguments) !== false;
			}
			return true;
		},
		
		/**
		 * 
		 */
		updateComponentHandles: function() {
			for(var k in this._componentHandles) {
				this._componentHandles[k].update();
			}
			
			var i, j = 0, di, handle, handles = [];
			var component;
			var nodes = [];
			var captions = [];
			var props = {
					margin: {left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }, 
					border: {left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0}, 
					padding: {left: 4, right: 5, top: 4, bottom: 3, width: 9, height: 7}, 
					position: "absolute", width: 9, height: 7,
					caption: {width: 0}
			};
			var node;
			var index;
			var caption;
			var inh;
			var thisObj = this;
			
			/**
			 * 
			 */
			function positionCaptions() {
				var i = 0;
				while(handles.length > 0 && ++i < 50) {
					handles.splice(0, 1)[0].positionCaption();
				}
				if(handles.length > 0) {
					org.cavalion.comp.Component.setTimeout(thisObj, "positionCaptions", positionCaptions, 200);
				}
			}
			
			if(this._host !== null) {
				var offset = this._host.getClientOffset();
				
				for(i = 0; i < this._root._components.length; ++i) {
					component = this._root._components[i];
					if(!(component instanceof org.cavalion.comp.Control) && this.getComponentHandle(component) === null) {
						di = component.getClass().getMetaClass().getDesignerInfo();
						if(di.wantsComponentHandle(component, this) && this.isComponentVisible(component)) {
							if(component._left === 0 && component._top === 0) {
								component._left = j * 96;
								component._top = 96 + parseInt((j * 96) / 960, 10) * 96; 
								component._left %= (96 * 10);
								component._left += 96;
								j++;
							}
							
							handle = new org.cavalion.comp.design.ui.ComponentHandle(this);
							handle._loading = true;
							handle.setState(org.cavalion.comp.ControlState.showing, false);
							handle.setComponent(component, false);
							handle.setParent(this._host);							
							handles.push(handle);
							
							this._componentHandles[component.hashCode()] = handle;
							nodes.push(handle.getHtml());
	
							handle._width = 25;
							handle._height = 25;
							handle._cachedCssProps = js.mixIn({}, props);
							handle._cachedCssProps.caption.width = component.getName().length * 3.5;
							
							inh = component._isRoot === false && component._uri !== "" && component._uri !== component._owner._uri;
							inh = inh === true ? " inherited" : "";
							
							captions.push(String.format("<div style='left: %dpx; top: %dpx;' " +
									"class='org-cavalion-comp-design-ui-ComponentHandle-caption%s'>%H</div>", 
									component._left + 12 - handle._cachedCssProps.caption.width / 2 + offset.x, 
									component._top + 26 + offset.y, inh, component.getName()));
						}
					}
				}
				
				node = this._host.getClientNode();
				index = node.childNodes.length;
				
				var tmp = document.createElement("div");
				tmp.innerHTML = nodes.join("") + captions.join("");
				for(i = 0, j = tmp.childNodes.length; i < j; ++i) {
					node.appendChild(tmp.removeChild(tmp.childNodes[0]));
				}
				
				for(i = 0; i < handles.length; ++i, ++index) {
					handle = handles[i];
					
					handle._node = node.childNodes[index];
					handle._node._comp = {
						component: handle
					};
					caption = node.childNodes[index + handles.length];
					handle._nodes = {
						caption: caption
					};
					handle._loading = false;
					delete handle._cachedCssProps;
				}
				
				org.cavalion.comp.Component.setTimeout(this, "positionCaptions", positionCaptions, 200);
				
			}
		},
		
		/**
		 * 
		 */
		getComponentHandles: function() {
			var r = [];
			for(var k in this._componentHandles) {
				r.push(this._componentHandles[k]);
			}
			return r;
		},

		/**
		 *
		 */
		edit: function(component, evt) {
		},
		
		/**
		 * 
		 */
		editPropertyValue: function(propertyEditor, evt) {
			return org.cavalion.comp.Component.fire(this, "onEditPropertyValue", arguments);
		},

		/**
		 *
		 */
		finalize: function() {
		},

		/**
		 *	Returns a reference to or copy of the current selection.
		 *
		 *	The selection is returned by reference when -reference- true, or as a copy when
		 *	-reference- is not true.
		*/
		getSelection: function(reference) {
			return reference === true ? this._selection : [].concat(this._selection);
		},

		/**
		 * 
		 */
		initialize: function() {
		},

		/**
		 *
		 */
		modified: function(why) {
			org.cavalion.comp.Component.fire(this, "onModified", arguments);
		},

		/**
		 * 
		 */
		refresh: function() {
			org.cavalion.comp.Component.fire(this, "onRefresh", arguments);
		},

		/**
		 *
		 */
		rootNotification: function(component, remove) {
			if(this.isActive()) {
				if(remove) {
					var i = Array.indexOf(this._selection, component);
					if(i !== -1) {
						this._selection.splice(i, 1);
						this.dispatch("selectionchanged");
					}
				}
				this.modified("rootNotification", component, remove);
			}
		},

		/**
		 * Normalizes the current selection.  The resulting selection only contains components which
		 * getParentComponent() returns the same value as the reference component does.  This results in a
		 * selection of components on the 'same level' of owner hierarchy and no nesting.
		 */
		normalizeSelection: function(reference) {
			if(this._selection.length > 1) {
				reference = reference || this._selection[0];

				var changed = false;
				if(this._selection.length > 1) {
					var index = this._selection.indexOf(this._root);
					if(index !== -1) {
						this._selection.splice(index, 1);
						changed = true;
					}
				}

				var parent = reference.getParentComponent();
				var i = 0;
				while(i < this._selection.length) {
					var component = this._selection[i];
					var p = component.getParentComponent();
					if(component !== reference && (p && parent && (p !== parent))) {
						this._selection.splice(i, 1);
						changed = true;
					} else {
						i++;
					}
				}
				if(changed) {
					this.dispatch("selectionchanged");
				}
			}
			return this._selection;
		},

		/**
		 * Adds a component to the current selection.
		 */
		selectComponent: function(component) {
			if(component === this._root || component.getOwner() === this._root) {
				if(this._selection.indexOf(component) === -1) {
					this._selection.push(component);
					this.dispatch("selectionchanged");
				}
			}
		},

		/**
		 * Removes a component from to the current selection.
		 */
		unselectComponent: function(component) {
			var idx = this._selection.indexOf(component);
			if(idx !== -1) {
				this._selection.splice(idx, 1);
				this.dispatch("selectionchanged");
			}
		},

		/**
		 *
		 */
		isComponentSelected: function(component) {
			return this._selection.indexOf(component) !== -1;
		},

		/**
		 * 
		 */
		getSelectionCount: function() {
			return this._selection.length;
		},

		/**
		 *
		 */
		setSelection: function(value) {
			if(!js.equals(this._selection, value)) {
				this._selection = [].concat(value);
				this.dispatch("selectionchanged");
			}
		},
		/**
		 *
		 */
		getRootComponent: function() {
			return this._root;
		},

		/**
		 *
		 */
		setRootComponent: function(value) {
			if(this._root !== value) {
				if(this._root !== null) {
					this._root.unlisten(this._rootListeners);
					this._root.setDesignerHook(null);					
					this.terminate();
				}
				this._root = value;
				if(this._root !== null) {
					this._rootListeners = this._root.listen(this._rootListenersImpls);
//					this.activate();
					this._root.setDesignerHook(this);

				}
			}
		},

		/**
		 *
		 */
		terminate: function() {
			this.clearSelection();
			
			if(this._host !== null) {
				if(this._root instanceof org.cavalion.comp.Control) {
					this._root.setParent(null);
				}
				//this._host.destroyControls();
				this._host._controls = [];
				if(this._host.getClientNode() !== null) {
					this._host.getClientNode().innerHTML = "";
				}
				this._componentHandles = {};
			}
			
			this._active = false;
			this.dispatch("terminated");
		},

		/**
		 *
		 */
		activated: function() {
			org.cavalion.comp.Component.fire(this, "onActivate", arguments);
		},

		/**
		 *
		 */
		selectionchanged: function() {
			if(this.isActive()) {
				this._selectionHandler.update();
				return org.cavalion.comp.Component.fire(this, "onSelectionChange", arguments);
			}
			return false;
		},

		/**
		 *
		 */
		terminated: function() {
			return org.cavalion.comp.Component.fire(this, "onTerminate", arguments);
		},
		
		/**
		 * 
		 */
		getComponentHandle: function(component) {
			return this._componentHandles[component.hashCode()] || null;//this._host;
		},

		/**
		 *
		 */
		getOnActivate: function() {
			return this._onActivate;
		},

		/**
		 * 
		 */
		getHost: function() {
			return this._host;
		},
		
		/**
		 * 
		 */
		setHost: function(value) {
			if(this._host !== value) {
				if(value !== null && !(value instanceof org.cavalion.comp.design.ui.Host)) {
					throw new Error("Need a org.cavalion.comp.design.ui.Host");
				}
				this._host = value;
				this._host.setDesigner(this);
				this._selectionHandler.hostChanged();
			}
		},
		
		/**
		 * 
		 */
		getDetail: function() {
			return this._detail;
		},
		
		/**
		 * 
		 */
		setDetail: function(value) {
			if(this._detail !== value) {
				if(value !== null && !(value instanceof org.cavalion.comp.design.ui.ComponentDetail)) {
					throw new Error("Need a org.cavalion.comp.design.ui.ComponentDetail");
				}
				this._detail = value;
			}
		},
		
		/**
		 *
		 */
		setOnActivate: function(value) {
			this._onActivate = value;
		},

		/**
		 *
		 */
		getOnTerminate: function() {
			return this._onTerminate;
		},

		/**
		 *
		 */
		setOnTerminate: function(value) {
			this._onTerminate = value;
		},

		/**
		 *
		 */
		getOnDispatchEvent: function() {
			return this._onDispatchEvent;
		},

		/**
		 *
		 */
		setOnDispatchEvent: function(value) {
			this._onDispatchEvent = value;
		},

		/**
		 *
		 */
		getOnIsControlVisible: function() {
			return this._onIsControlVisible;
		},

		/**
		 *
		 */
		setOnIsControlVisible: function(value) {
			this._onIsControlVisible = value;
		},

		/**
		 *
		 */
		getOnIsComponentVisible: function() {
			return this._onIsComponentVisible;
		},

		/**
		 *
		 */
		setOnIsComponentVisible: function(value) {
			this._onIsComponentVisible = value;
		},

		/**
		 *
		 */
		getOnEditPropertyValue: function() {
			return this._onEditPropertyValue;
		},

		/**
		 *
		 */
		setOnEditPropertyValue: function(value) {
			this._onEditPropertyValue = value;
		},

		/**
		 *
		 */
		getOnSelectionChange: function() {
			return this._onSelectionChange;
		},

		/**
		 *
		 */
		setOnSelectionChange: function(value) {
			this._onSelectionChange = value;
		},

		/**
		 *
		 */
		getOnModified: function() {
			return this._onModified;
		},

		/**
		 *
		 */
		setOnModified: function(value) {
			this._onModified = value;
		},
		
		/**
		 *
		 */
		getOnRefresh: function() {
			return this._onRefresh;
		},

		/**
		 *
		 */
		setOnRefresh: function(value) {
			this._onRefresh = value;
		}
		
	},

	/***
	 * Property definitions
	 */
	Properties: {
		
		"detail": {
			type: org.cavalion.comp.design.ui.ComponentDetail,
			set: Function
		},

		"host": {
			type: org.cavalion.comp.design.ui.Host,
			set: Function
		},

		"onActivate": {
			type: js.lang.Type.FUNCTION
		},

		"onTerminate": {
			type: js.lang.Type.FUNCTION
		},

		"onDispatchEvent": {
			type: js.lang.Type.FUNCTION
		},

		"onIsControlVisible": {
			type: js.lang.Type.FUNCTION
		},

		"onIsComponentVisible": {
			type: js.lang.Type.FUNCTION
		},

		"onEditPropertyValue": {
			type: js.lang.Type.FUNCTION
		},

		"onSelectionChange": {
			type: js.lang.Type.FUNCTION
		},

		"onModified": {
			type: js.lang.Type.FUNCTION
		},
		
		"onRefresh": {
			type: js.lang.Type.FUNCTION
		}
		
	},

	/***
	 * Static members
	 */
	Statics: {

	}

});