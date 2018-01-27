define(function(require) {

	var Control = require("js/defineClass");
	var Type = require("js/Type");
	var Class = require("js/Class");
	var js = require("js");

	var HtmlElement = require("../util/HtmlElement");
	var Stylesheet = require("../util/Stylesheet");
	var DocumentHook = require("../util/DocumentHook");

	var Component = require("./Component");
	var Action = require("./Action");
	var EventDispatcher = require("./EventDispatcher");
	var CssRules = require("./CssRules");
	var ControlUpdater = require("./ControlUpdater");
	var Dragger = require("./Dragger");

	// FIXME
	var MustBeEnabledEvents = [].concat(DocumentHook.prototype._events);
	MustBeEnabledEvents.splice(0, 1); //ontransitionend

	var ControlState = {
		enabled: 0x0001,
		readonly: 0x0002,
		showing: 0x0004,
		selected: 0x0008,
		focused: 0x0010,
		hovered: 0x0020,
		expanded: 0x0040,
		designing: 0x0080,
		dragging: 0x0100,
		classesInvalidated: 0x0400,
		invalidated: 0x0800,
		//draggable: 0x1000,
		//0x1200,
		notVisibleDesigning: 0x4000,
		acceptChildNodes: 0x8000
	};

	return (Control = Control(require, {
		inherits: Component,
		prototype: {

			_node: null,
			_nodes: null,
			_element: "div",
			_content: "",
			_parentNode: null,

			_controls: null,
			_parent: null,
			_parentComponent: null,

			_draggable: false,
			_dragger: null,

			// position
			_align: "none",

			// styling
			_className: null,
			_classes: "",
			_cssRules: null,
			_classes_rt: null,
			_computedStyle: null,

			// state
			_action: null,
			_visible: true,
			_enabled: true,
			_selected: false,
			_hovered: false,
			_focused: false,
			_readonly: false,
			_state: ControlState.enabled | ControlState.acceptChildNodes,
			_executesAction: "No",
			_groupIndex: -1,
			_tabIndex: -1,

			_removeNodeWhenHidden: false,

			// mouse events
			_onClick: null,
			_onDblClick: null,
			// _onNodeNeeded: null,
			_onNodeCreated: null,
			_onNodeInserted: null,
			_onMouseDown: null,
			_onMouseUp: null,
			_onMouseWheel: null,
			_onMouseMove: null,
			_onMouseEnter: null,
			_onMouseLeave: null,
			_onDraggerNeeded: null,
			_onDragStart: null,
			_onDragEvent: null,
			_onDragCancel: null,
			_onDragEnd: null,

			// keyboard event
			_onKeyDown: null,
			_onKeyUp: null,
			_onKeyPress: null,

			_onFocus: null,
			_onBlur: null,
			_onHint: null,

			_onShow: null,
			_onHide: null,

			_onScroll: null,
			_onResize: null,
			_onTransitionEnd: null,

			_onRender: null,

			// touch events
			_onTap: null,
			_onDblTap: null,
			_onTouchStart: null,
			_onTouchEnd: null,
			_onTouchCancel: null,
			_onTouchMove: null,
			_onGesture: null,


/**-- ./Component.prototype overrides */
			destroy: function() {
			/** @overrides ./Component.prototype.destroy */
				// make sure no more updates are handled
				ControlUpdater.dequeue(this);

				this.destroyControls();
				this.setAction(null, true);
				this.setParent(null, true);
				this.destroyNode();
				return this.inherited(arguments);
			},
			getParentComponent: function() {
			/** @overrides ./Component.prototype.getParentComponent */
				// TODO This doesn't seem right...
				if(this._parent !== null && (this._parent === this._owner || this._parent._owner === this._owner)) {
					return this._parent;
				}
				return this._parentComponent || this._owner || null;
			},
			setParentComponent: function(value) {
			/** @overrides ./Component.prototype.setParentComponent */
				if(value instanceof Control) {
					this.setParent(value);
					delete this._parentComponent;
				} else {
					this._parentComponent = value;
				}
			},
			getChildren: function(func, root) {
			/** @overrides ./Component.prototype.getChildren */
				if(root === this) {
					this.inherited(arguments);
				} else {
					if(this.hasOwnProperty("_controls")) {
						this._controls.forEach(function getChildren$forEach(control) {
							if(control.getOwner() === root) {
								func(control);
							}
						}, this);
					}
				}
			},
			isEventEnabled: function(name, evt, f, args) {
			/** @overrides ./Component.prototype.isEventEnabled */
				var r = this.inherited(arguments) &&
					(this.isEnabled() || MustBeEnabledEvents.indexOf(
					    "on" + name) === -1);

				if(r === true && this._parent !== null) {
					r = this._parent.dispatchChildEvent(this, name, evt, f, args);
				}
				return r;
			},
			dispatchChildEvent: function(component, name, evt, f, args) {
			/** @overrides ./Component.prototype.dispatchChildEvent */
				// FIXME Pure non-Control instances do not fwd to owner
				return this.inherited(arguments) &&
					this._parent !== null ?	this._parent.dispatchChildEvent(
							component, name, evt, f, args) :
						this._owner !== null ? this._owner.dispatchChildEvent(
									component, name, evt, f, args) : true;
			},
			isContainer: function() {
				return false;
			},
			assertContainer: function() {
				if(this.isContainer() === false) {
					throw new Error("Not a container");
				}
			},


/**-- controls */
			insertControl: function(control, index) {
				if(!this.hasOwnProperty("_controls")) {
					this._controls = [];
				}

				this.assertContainer();

				this._controls.push(control);
				control._parent = this;

				if(index !== undefined) {
					var begin = this._controls.splice(0, index);
					var end = this._controls.splice(0, this._controls.length - 1);
					this._controls = begin.concat(this._controls).concat(end);
				}
			},
			removeControl: function(control) {
				this.assertContainer();

				this._controls.splice(this._controls.indexOf(control), 1);
				delete control._parent;
			},
			destroyControls: function() {
				// this.disableAlign();
				if(this.hasOwnProperty("_controls")) {
					this.beginLoading();
					try {
						var controls = [].concat(this._controls || []);
						var control;
						while(controls.length > 0) {
							control = controls.splice(0, 1)[0];
							if(control._owner === null || control._owner === this /*|| control._owner === this._owner*/) {
								control.destroy();
							} else {
								control.setParent(null);
							}
						}
					} finally {
						// this.enableAlign();
						this.endLoading();
					}
				}
			},
			getControlCount: function() {
				this.assertContainer();
				if(this.hasOwnProperty("_controls")) {
					return this._controls.length;
				}
				return 0;
			},
			getControl: function(i) {
				this.assertContainer();
				if(this.hasOwnProperty("_controls")) {
					return this._controls[i];
				}
			},
			getControls: function(groupIndex) {
                if(groupIndex === undefined || !this.hasOwnProperty("_controls")) {
                    return this._controls || [];
                }
                return this._controls.reduce(function(arr, current) {
                    if(current.getGroupIndex() === groupIndex) {
                        arr.push(current);
                    }
                    return arr;
                }, []);
			},
			selectControl: function(control) {
				this.assertContainer();

				if(this.hasOwnProperty("_controls")) {
					this._controls.forEach(function(c) {
						if(c !== control && c._groupIndex === control._groupIndex) {
							c.setSelected(false);
						}
					});
					control._selected = true;
					control.update();
				}
			},
			getSelectedControl: function(groupIndex) {
				this.assertContainer();

				if(this.hasOwnProperty("_controls")) {
					for( var i = 0; i < this._controls.length; ++i) {
						var c = this._controls[i];
						if(c._groupIndex === groupIndex && c.isSelected() === true) {
							return c;
						}
					}
				}
				return null;
			},


/**-- index */
			getIndex: function() {
			/**
			 * Returns the index of the calling in the parents control array.
			 */
				return this._parent !== null && this._parent.hasOwnProperty("_controls") ?
						this._parent._controls.indexOf(this) : -1;
			},
			setIndex: function(control, value) {
			/**
			 * Sets the index of the calling control in the parents control
			 * array (hopefully making it visible)
			 */
				if(value === undefined) {
					if(this._parent !== null) {
						this._parent.setIndex(this, control);
					}
				} else {
					// this.assertContainer(); actually this should only be
					// called through if-statement above
					if(this.hasOwnProperty("_controls")) {
						if(control.getIndex() !== value && value >= 0 && value < this._controls.length) {
							this._controls = Array.move(this._controls, control.getIndex(), value);
							if(this.hasState(ControlState.acceptChildNodes) === true) {
								if(control.isShowing()) {
									control.hideNode(true);
									control.showNode();
								}
							}
						}
					}
				}
			},
			bringToFront: function() {
				this.setIndex(this._parent.getControlCount() - 1);
			},
			sendToBack: function() {
				this.setIndex(0);
			},

			
/**-- parent */
			hasParent: function(parent) {
			/**
			 * Indicates whether -parent- is a (in)direct parent of the calling
			 * control.
			 */
				if(this._parent === parent) {
					return true;
				} else if(this._parent) {
					return this._parent.hasParent(parent);
				}
				return false;
			},
			getParent: function() {
				return this._parent;
			},
			setParent: function(value, destroying) {
				var parent = this._parent;
				if(parent !== value) {
					var loading = this.isLoading();
					var visible = loading || this.isVisible();
					if(parent !== null) {
						parent.removeControl(this);
						if((this._state & ControlState.showing) !== 0) {
							this.hideNode();
						} else if(this._node !== null && this._node.parentNode !== null) {
							// TODO there must be a better way than hacking into
							// _node here
							this._node.parentNode.removeChild(this._node);
							this._node.style.display = "";
						}
					}
					if(value !== null) {
						value.insertControl(this);
					}
					if(destroying !== true && loading === false) {
						this.update();
						if(visible !== this.isVisible()) {
							this.visibleChanged();
						}
					}
				}
			},
			isParentOf: function(kid) {
				return kid instanceof Control && kid.hasParent(this) === true;
			},


/**-- node/element */
			getInsertReference: function(parentNode) {
			/**
			 * @return {HtmlElement}
			 */
				var index, lastIndex;
				var reference;

				if(this._parent !== null
						&& (index = this.getIndex()) !== (lastIndex = this._parent.getControlCount() - 1)) {
					parentNode = parentNode || this.getParentNode();
					for(reference = null; reference === null && ++index <= lastIndex;) {
						reference = this._parent.getControl(index)._node;
						if(reference !== null && reference.parentNode !== parentNode) {
							reference = null;
						}
					}
				} else {
					reference = null;
				}
				return reference;
			},
			getParentNode: function() {
			/**
			 * @return {HtmlElement}
			 */
				if(this._parentNode !== null) {
					return this._parentNode;
				} else if(this._parent !== null) {
					return this._parent.getClientNode(this);
				}
				return null;
			},
			setParentNode: function(value) {
				if(this._parentNode !== value) {
					if(value !== null) {
						this._parentNode = value;
					} else {
						delete this._parentNode;
					}
					this.update();
				}
			},
			getNode: function(recursive) {
				if(typeof recursive === "string") {
					// treat recursive as string to id a key of _nodes
					this.getNode();
					return this._nodes[recursive];
				}

				var node = this.nodeNeeded();
				if(recursive === true) {
					if(node.parentNode === null) {
						var reference = this.getInsertReference();
						if(reference !== null) {
							this.getParentNode().insertBefore(this._node, reference);
						} else {
							this.getParentNode().appendChild(this._node);
						}
						this.dispatch("nodeinserted")
					}
					if(this.hasOwnProperty("_controls")) {
						this._controls.forEach(function(control) {
							control.getNode(true);
						});
					}
				} else if(typeof recursive === "string") {
					node = (recursive !== "" ? this._nodes[recursive] : node);
				}
				return node;
			},
			getNodeId: function() {
                return String.format("vcl-%d%s%s", this.hashCode(), this._name !== "" ? "-" : "", this._name);
			},
			setNodeId: function(node, suffix) {
				return (node.id = String.format("%s--%s", this.getNodeId(), suffix));
			},
			createNode: function(documentNode) {
				this._node = documentNode.createElement(this.getElement());
				this._node.id = this.getNodeId();
				this._node.innerHTML = this.getInnerHtml();
				if(this._tabIndex !== -1) {
					this._node.tabIndex = this._tabIndex;
				}
				this._nodes = {};
				this.initializeNodes();
				this.dispatch("nodecreated", this._node, this._nodes);
				this.render();
			},
			recreateNode: function() {
				if(this._node !== null) {
					var accept = this.hasState("acceptChildNodes");
					var showing = this.hasState("showing");
					if(showing === true) {
						this.hideNode();
					}
					if(accept === true) {
						this.clearState("acceptChildNodes", true, true);
					}
					this.destroyNode();
					if(accept === true) {
						this.setState("acceptChildNodes", true, true);
					} else {
						this.update();
					}
				}
			},
			destroyNode: function() {
				this.finalizeNodes();
				if(this._node !== null && this._node.parentNode !== null) {
					this._node.parentNode.removeChild(this._node);
				}
				delete this._node;
				delete this._nodes;
			},
			nodeNeeded: function() {
				if(this._node === null) {
					this.createNode(document);
					this._node[EventDispatcher.elementKey] = this;
					this.applyClasses();
				}
				return this._node;
			},
			onnodecreated: function() {
				this.fire("onNodeCreated", arguments, !this.isDesigning());
			},
			onnodeinserted: function() {
				this.fire("onNodeInserted", arguments, !this.isDesigning());
			},
			getClientNode: function(control) {
				return this._node || this.nodeNeeded();
			},
			getChildNode: function() {
				var node = this.nodeNeeded();
				for( var i = 0, l = arguments.length; i < l && node !== null; ++i) {
					node = node.childNodes[arguments[i]] || null;
				}
				return node;
			},
			getNodes: function() {
				this.nodeNeeded();
				return this._nodes;
			},
			initializeNodes: function() {
				this._node.onscroll = EventDispatcher.handleEvent;
				// FIXME there are more events that might need to be hooked (oncopy,oncut,onsearch, etc)
			},
			finalizeNodes: function() {},

			createDragger: function() {
				return new Dragger(this);
			},
			getInnerHtml: function() {
				return this._content || (this._action ?
				        this._action.getContent(this) : "");
			},
			render: function() {
			    this.fire("onRender", arguments);
			},
			layoutChanged: function() {
				if(this._parent !== null) {
					this._parent.contentChanged();
				}
			},
			contentChanged: function() {
				// As far as know the same applies...
				this.layoutChanged();
			},
			scrollIntoView: function() {
			/**
			 * Makes sure that the calling node is visible by scrolling it into view when necessary.
			 */
				this.nodeNeeded().scrollIntoView();
			},

			documentToClient: function(x, y) {
				var ar = this.getAbsoluteRect();
				if(x.y !== undefined) {
					y = x.y;
					x = x.x;
				}

				return {
					x: x - ar.left,
					y: y - ar.top
				};
			},
			clientToDocument: function(x, y, includeScroll) {
				var ar = this.getAbsoluteRect();
				if(x.y !== undefined) {
					y = x.y;
					x = x.x;
				}

				if(includeScroll === true && this._node !== null) {
					x -= this._node.scrollLeft;
					y -= this._node.scrollTop;
				}

				return {
					x: ar.left + x,
					y: ar.top + y
				};
			},
			getAbsoluteRect: function(includeScroll) {
				return HtmlElement.getAbsoluteRect(this.nodeNeeded(), includeScroll);
			},


/**-- style/css/classes */
			getComputedStyle: function() {
				if(this._computedStyle === null) {
					this._computedStyle = HtmlElement.getComputedStyle(this.nodeNeeded());
				}
				return this._computedStyle;
			},
			getComputedStylePropValue: function(name) {
				if(this._computedStyle === null) {
					this.getComputedStyle();
				}
				return this._computedStyle.getPropertyValue(name);
			},
			setStyleProp: function(name, value, unit) {
				var style = this._node.style;
				if(value !== undefined) {
					if(unit !== undefined) {
						value = value + unit;
					}
				} else {
					value = "";
				}
				try {
					if(style[name] !== value) {
						style[name] = value;
						return true;
					}
				} catch(e) {
					// squeech.. for Android
					// TODO optimize this exception handler
				}
				return false;
			},
			determineClasses: function() {
				/**
				 * Determines the classes that should be applied on the DOM node.
				 * Override this method when dynamic custom classes are needed. In
				 * order to refresh the classes programmatically use:
				 *
				 * control.setState("classesInvalidated"[, true]);
				 */
				var classes = [];
				var designing = this.isDesigning();
				var stateObj = {
					disabled: !this.isEnabled(),
					readonly: this.isReadonly(),
					selected: this.isSelected(),
					hovered: this._hovered,// isHovered(),
					focused: this._focused,// isFocused()
					expanded: this.isExpanded(),
					designing: designing,
					invisible: !this.getVisible() && designing
				};
				
				classes.push(this.getClassName());
				classes.push(String.format("#%d", this.hashCode()));
				
				if(this._name !== "") {
					classes.push("#" + this._name);
				}
				if(this._classes) {
					classes = classes.concat(this._classes.split(" "));
				}
				if(this._classes_rt !== null) {
					classes = classes.concat(this._classes_rt);
				}
				if(this._cssRules !== null) {
					//classes.push(this._cssRules.getSelector().split(".").pop());
				}

				if(stateObj.disabled) {
					classes.push("disabled");
				}
				if(stateObj.readonly) {
					classes.push("readonly");
				}
				if(stateObj.selected) {
					classes.push("selected");
				}
				if(stateObj.hovered) {
					classes.push("hovered");
				}
				if(stateObj.focused) {
					classes.push("focused");
				}
				if(stateObj.expanded) {
					classes.push("expanded");
				}
				if(stateObj.dragging) {
					classes.push("dragging");
				}
				if(stateObj.readonly) {
					classes.push("readonly");
				}
				if(stateObj.designing) {
					classes.push("designing");
				}
				if(stateObj.invisible) {
					classes.push("invisible");
				}

				return classes;
			},
			applyClasses: function() {
				var classes = this.determineClasses();
				delete this._computedStyle;
				classes = String.trim(classes.join(" "));
				//if(classes !== this._node.className) {
				    this._node.className = classes;
    				if(this.inDocument()) {
    					this.layoutChanged();
    				}
				// } else {
				//     console.trace("Control.applyClasses-blocked", 
				//          this.hashCode(), this);
				// }
			},
			toggleClass: function(classes) {
				if(this._classes_rt === null) {
					this.addClasses(classes);
				} else {
					var changed = false;
					if(!(classes instanceof Array)) {
						classes = classes.split(" ");
					}
					classes.forEach(function(cls, index) {
						if((index = this._classes_rt.indexOf(cls)) === -1) {
							this._classes_rt.push(cls);
							changed = true;
						} else {
							this._classes_rt.splice(index, 1);
							changed = true;
						}
					}, this);
					if(changed) {
						this.setState(ControlState.classesInvalidated, true);
					}
				}
			},
			replaceClass: function(find, replace) {
				if(this._classes_rt !== null) {
					var changed = false;
					this._classes_rt.forEach(function(cls, i) {
						if(cls === find) {
							this._classes_rt[i] = replace;
							changed = true;
						}
					}, this);
					if(changed) {
						this.setState(ControlState.classesInvalidated, true);
					}
				}
			},
			addClass: function(value, directly) {

				//directly && console.warn("addClass directly can be replaced with a call to _update");

				if(this._classes_rt === null) {
					this._classes_rt = [value];
				} else {
					this._classes_rt.push(value);
				}
				if(directly === true) {
					if(this._node !== null) {
						this.applyClasses();
					} else {
						this.setState(ControlState.classesInvalidated, true);
					}
				} else if(directly !== "none") {
					this.setState(ControlState.classesInvalidated, true);
				}
			},
			addClasses: function(classes, directly) {
				if(typeof classes === "string") {
					classes = classes.split(" ");
				}
				classes.forEach(function(className) {
					this.addClass(className, "none");
				}, this);
				if(directly === true) {
					if(this._node !== null) {
						this.applyClasses();
					}
				}
			},
			removeClass: function(value, directly, dontCheckClasses) {
			/**
			 * @param value
			 * @param directly When true the changes reflected immediately
			 * @param dontCheckClasses
			 *            Determines whether the classes property should be
			 *            considered, default=true {Boolean}
			 */
				var i;
				var changed = false;

				// It turned out to be very confusing that removeClass would not
				// seem to work when classes are set by means of a component
				// resource (property). So remove the class also from classes if
				// dontCheckClasses is not explicitly set to false.
				if(!this.isDesigning() && dontCheckClasses !== false && this._classes !== "") {
					var classes = this._classes.split(" ");
					if((i = classes.indexOf(value)) !== -1) {
						classes.splice(i, 1);
						this._classes = classes.join(" ");
						changed = true;
					}
				}
				if(this._classes_rt !== null) {
					i = this._classes_rt.indexOf(value);
					if(i !== -1 && this._classes_rt.splice(i, 1)[0] === value) {
						changed = true;
					}
				}
				if(changed === true) {
					if(directly === true) {
						if(this._node !== null) {
							this.applyClasses();
						}
					} else if(directly !== "none") {
						this.setState(ControlState.classesInvalidated, true);
					}
				}
			},
			removeClasses: function(classes, directly) {
				if(typeof classes === "string") {
					classes = classes.split(" ");
				}
				classes.forEach(function(className) {
					this.removeClass(className, "none");
				}, this);
				if(directly === true) {
					if(this._node !== null) {
						this.applyClasses();
					}
				}
			},
			hasClass: function(value, dontCheckClasses) {
				if(dontCheckClasses !== false && this._classes !== "") {
					var classes = this._classes.split(" ");
					var i = classes.indexOf(value);
					if(i !== -1) {
						return true;
					}
				}
				return this._classes_rt !== null ? this._classes_rt.indexOf(value) !== -1 : false;
			},

			hasState: function(state) {
			/**
			 *
			 * @param state
			 *            {String} ControlState
			 * @returns
			 */
				if(typeof state === "string") {
					state = ControlState[state];
				}
				return (this._state & state) !== 0;
			},
			getStateNames: function() {
				var r; r = [];
				for( var k in ControlState) {
					if(this.hasState(ControlState[k])) {
						r.push(k);
					}
				}
				return r;
			},
			setState: function(state, update, updateChildren) {
			/**
			 * @param state {String} ControlState
			 * @param update {Boolean} (optional, default = false}
			 */
				if(typeof state === "string") {
					state = ControlState[state];
				}

				this._state = this._state | state;

				// Propogate this to all children since nested nodes (maintained
				// by children) may be affected as well
				if(this.hasOwnProperty("_controls") && updateChildren !== false
						&& state === ControlState.classesInvalidated) {
					this._controls.forEach(function(c) {
						c.setState(state, false);
					});
				}

				if(update === true && this._node !== null) {
					this.update();
					if(state === ControlState.acceptChildNodes || state === ControlState.classesInvalidated) {
						this.updateChildren();
					}
				}
			},
			clearState: function(state, update, directly) {
			/**
			 *
			 * @param state
			 *            {String} ControlState
			 * @param update
			 *            {Boolean} optional, default = true
			 */
				if(typeof state === "string") {
					state = ControlState[state];
				}

				if(this.hasState(state)) {
					this._state = this._state ^ state;
					if(update === true && this._node !== null) {
						this.update();
						if(state === ControlState.acceptChildNodes) {
							this.updateChildren(false, directly);
						}
					}
				}
			},

			inDocument: function() {
				var node = this._node;
				while(node !== null && node !== document) {
					node = node.parentNode;
				}
				return node === document;
			},
			isShowing: function() {
				var r = (this._state & ControlState.showing) !== 0;

				if(r && this._parent) {
					r = r && this._parent.isShowing();
				}
				return r;
			},
			isContainerShowing: function() {
				return this.isShowing();
			},
			isVisible: function() {
				var r, designer = this.getDesignerHook();
				if(designer !== null) {
					r = designer.isControlVisible(this);
				} else {
					r = this._visible === true || this._visible === "always";
				}

				if(r === true) {
					if(this._parent === null) {
						r = this._parentNode !== null ? this._visible : false;
					} else if(this._parent.isControlVisible(this)) {
						r = designer === null ? this._visible : !this.hasState(
							ControlState.notVisibleDesigning)
					} else {
						r = false;
					}

					if(r === true && designer === null && this._action !== null) {
						var v = this._action.isVisible();
						if(v !== "leave") {
							r = v;
						}
					}
				}

				return r === true ? r : r === "always";
			},
			isControlVisible: function(control) {
				return this.hasState(ControlState.acceptChildNodes) && this.isVisible();
			},
			isDraggable: function() {
			/**
			 * Returns whether the calling control is draggable based upon the
			 * -dragMode- property.
			 */
				switch(this._draggable) {
					case true:
						return true;

					case "parent":
						if(this._parent !== null) {
							return this._parent.isDraggable();
                        }

					case false:
						return false;
				}
			},
			isEnabled: function() {
				if(this.isDesigning()) {
					return true;
				}

				var r = this._enabled;
				if(r === true && this._parent !== null) {
					r = r && this._parent.isEnabled() === true;
				}
				if(r === true && this._action !== null) {
					var e = this._action.isEnabled();
					if(e !== "leave") {
						r = r && e === true;
					}
				}
				return r === true ? r : r === "always";
			},
			isReadonly: function() {
				var r = this._readonly;
				if(r === false && this._parent !== null) {
					r = this._parent.isReadonly();
				}
				return r;
			},
			isSelected: function() {
				if(this._selected === true || this._selected === false) {
					if(this._action !== null) {
						var s = this._action.isSelected();
						return s === "leave" ? this._selected : s;
					}
				}
				return this._selected === true || this._selected === "always";
			},
			isFocused: function() {
				return this._focused;
			},
			isHovered: function() {
				return this._hovered;
			},
			isExpanded: function() {
				return false;
			},
			show: function(callback) {
				this.setVisible(true);
			},
			hide: function() {
				this.setVisible(false);
			},

			allowsUpdateChildren: function() {
				return this.isShowing();
			},
			update: function(f) {
				if(this.isLoading() || (this._parent !== null && this._parent.allowsUpdateChildren() === false)) {
					if(f !== undefined) {
						setTimeout(f, 0);
					}
					return "nothing-to-do";
				} else {
					f && this.postUpdate(f);
					ControlUpdater.queue(this);
					return "queued";
				}
			},
			postUpdate: function(f) {
				this._post_update = this._post_update || [];
				if(f !== undefined) {
					this._post_update.push(f);
				}
			},
			updateChildren: function(recursive, directly) {
				// this.assertContainer();
				if(this.hasOwnProperty("_controls")) {
					if(recursive !== true) {
						this._controls.forEach(function(control) {
							if(directly !== true) {
								control.update();
							} else if(control._node !== null) {
								control._update();
							}
						}, this);
					} else {
						this._controls.forEach(function(control) {
							if(directly !== true) {
								control.update();
							} else if(control._node !== null) {
								control._update();
							}
							control.updateChildren(recursive, directly);
						}, this);
					}
				}
			},
			visibleChanged: function() {
				var isVisible = this.isVisible();
				if (isVisible === false && this.isFocused() === true) {
					if (this._nodes !== null) {
						for (var k in this._nodes) {
							if (typeof this._nodes[k].blur === "function") {
								this._nodes[k].blur();
							}
						}
					} else {
						this.setFocused(false);
					}
				}
				
				if(this._node !== null && isVisible && this.hasState(ControlState.invalidated)) {
					// console.log("extra render", this);
					this.update(this.render.bind(this));
				}

				if(this._controls !== null) {
					this._controls.forEach(function(item) {
						if (isVisible === true && item.isVisible() === false) {
							item.update(item.visibleChanged.bind(item));
						} else {
							item.visibleChanged();
						}
					});
				}
			},

			_update: function() {
				if(this._parent && this._parent.allowsUpdateChildren() === false) {
				// if(this._parent && this._parent.inDocument() === false) {
					//console.warn(this, "_update not allowed, move to ControlUpdater");
					return false;
				}

				var calls = [];
				var isVisible = this.isVisible();
				var isEnabled = this.isEnabled();
				var isHovered = this.isHovered();
				var isSelected = this.isSelected();
				var isFocused = this.isFocused();
				var isExpanded = this.isExpanded();
				var isReadonly = this.isReadonly();
				var isDesigning = this.isDesigning();

				var showing = this._state & ControlState.showing;
				var enabled = this._state & ControlState.enabled;
				var hovered = this._state & ControlState.hovered;
				var selected = this._state & ControlState.selected;
				var focused = this._state & ControlState.focused;
				var expanded = this._state & ControlState.expanded;
				var readonly = this._state & ControlState.readonly;
				// var designing = this._state & ControlState.designing;

				var updateChildren = false;
				var visibleChanged = false;
				var classesInvalidated = false;

				if(hovered && isEnabled === false) {
					this.clearState(ControlState.hovered);
					this._hovered = false;
					isHovered = false;
				}

				if(isEnabled === true && !enabled) {
					calls.push(this.enable);
					this._state = this._state | ControlState.enabled;
					classesInvalidated = true;
					updateChildren = true;
				} else if(isEnabled === false && enabled) {
					calls.push(this.disable);
					this._state = this._state ^ ControlState.enabled;
					classesInvalidated = true;
					updateChildren = true;
				}

				if(isSelected === true && !selected) {
					calls.push(this.select);
					this._state = this._state | ControlState.selected;
					classesInvalidated = true;
				} else if(isSelected === false && selected) {
					calls.push(this.unselect);
					this._state = this._state ^ ControlState.selected;
					classesInvalidated = true;
				}

				if(isReadonly === true && !readonly) {
					calls.push(this.activateReadonly);
					this._state = this._state | ControlState.readonly;
					classesInvalidated = true;
				} else if(isReadonly === false && readonly) {
					calls.push(this.deactivateReadonly);
					this._state = this._state ^ ControlState.readonly;
					classesInvalidated = true;
				}

				if(isFocused === true && !focused) {
					calls.push(this.focus);
					this._state = this._state | ControlState.focused;
					classesInvalidated = true;
				} else if(isFocused === false && focused) {
					calls.push(this.blur);
					this._state = this._state ^ ControlState.focused;
					classesInvalidated = true;
				}

				if(isHovered === true && !hovered) {
					calls.push(this.hover);
					this._state = this._state | ControlState.hovered;
					classesInvalidated = true;
				} else if(isHovered === false && hovered) {
					calls.push(this.unhover);
					this._state = this._state ^ ControlState.hovered;
					classesInvalidated = true;
				}

				if(isExpanded === true && !expanded) {
					this._state = this._state | ControlState.expanded;
					classesInvalidated = true;
					updateChildren = true;
				} else if(isExpanded === false && expanded) {
					this._state = this._state ^ ControlState.expanded;
					classesInvalidated = true;
					updateChildren = true;
				}

				if(classesInvalidated === true) {
					this.setState(ControlState.classesInvalidated, false);
				}

				if(isVisible === true && !showing) {
					this.nodeNeeded();
					this.showNode();
					updateChildren = true;
					visibleChanged = true;
				} else if(isVisible === false && showing) {
					this.hideNode();
					visibleChanged = true;
				}

				if(this._node !== null) {
					if(this.hasState(ControlState.invalidated)) {
						this.render();
						this.clearState(ControlState.invalidated);
					}
					if(this.hasState(ControlState.classesInvalidated)) {
						this.applyClasses();
						this.clearState(ControlState.classesInvalidated);
					}
				}

				for( var i = 0, l = calls.length; i < l; ++i) {
					calls[i].apply(this, []);
				}

				if(updateChildren === true && this.hasOwnProperty("_controls") && this._controls.length) {
					if(this._aligning !== true) {
						this.updateChildren();
					}
				}

				if(visibleChanged === true) {
					this.visibleChanged();
				}

				if(this._post_update !== undefined) {
					while(this._post_update.length > 0) {
						this._post_update.shift()();
					}
					if(this._post_update.length === 0) {
						delete this._post_update;
					}
				}
			},

			showNode: function() {
				if(this._node.style.display === "none") {
					this._node.style.display = "";
					if(this._parent !== null) {
						this._parent.contentChanged();
					}
				} else {
					var pn = this.getParentNode();
					if(this._node.parentNode !== pn) {
						pn.insertBefore(this._node || this.nodeNeeded(), this.getInsertReference(pn));
						this.dispatch("nodeinserted");
					}
					if(this.hasState(ControlState.classesInvalidated)) {
						this.applyClasses();
						this.clearState(ControlState.classesInvalidated);
					} else {
						this.layoutChanged();
					}
				}
				this._state = this._state | ControlState.showing;
				this.shown();
				this.restoreScroll();
				this.dispatch("show");
			},
			shown: function() {

			},
			hideNode: function(remove) {
				this.storeScroll();
				if(remove === undefined) {
				    remove = this._removeNodeWhenHidden; // FIXME this speed up is/was? necessary for listviews
				}
				if(remove !== true && this._parent !== null) {
					if(this._parent.hasState(ControlState.acceptChildNodes) === false) {
						if(this._node.parentNode !== null) {
							this._node.parentNode.removeChild(this._node);
						}
					} else if(this._parent.isContainerShowing()) {
						this._node.style.display = "none";
					}
					this._parent.contentChanged();
				} else {
					if(this._node.parentNode !== null) {
						this._node.parentNode.removeChild(this._node);
					}
					if(this._parent !== null) {
						this._parent.contentChanged();
					}
				}
				this.hidden();
				this._state = this._state ^ ControlState.showing;
				this.dispatch("hide");
			},
			hidden: function() {},
			setFocus: function() {
				this.nodeNeeded().focus();
			},
			enable: function() {},
			disable: function() {},
			focus: function() {
				Control.setFocused(this);
			},
			blur: function() {
				if(Control.focused === this) {
					Control.setFocused(null);
				}
			},
			expand: function() {},
			collapse: function() {},
			activateReadonly: function() {},
			deactivateReadonly: function() {},
			hover: function() {},
			unhover: function() {},
			select: function() {
				this.dispatch("selected", arguments);
			},
			unselect: function() {
				this.dispatch("unselected", arguments);
			},
			storeScroll: function() {
				if(this._node !== null) {
					this._scrollLeft = this._node.scrollLeft;
					this._scrollTop = this._node.scrollTop;
				}
			},
			restoreScroll: function() {
				// leave as is for IE
				if(this._node !== null
						&& (this._scrollLeft !== this._node.scrollLeft || this._scrollTop !== this._node.scrollTop)) {
					this._node.scrollLeft = this._scrollLeft;
					this._node.scrollTop = this._scrollTop;
				}
			},
			onkeydown: function() {
				return this.fire("onKeyDown", arguments);
			},
			onkeypress: function() {
				return this.fire("onKeyPress", arguments);
			},
			onkeyup: function() {
				return this.fire("onKeyUp", arguments);
			},
			ondraggerneeded: function() {
				if(this.hasOwnProperty("_onDraggerNeeded")) {
					if(!((this._dragger = this.fire("onDraggerNeeded", arguments)) instanceof Dragger)) {
						if(this._dragger === undefined) {
							this._dragger = this.createDragger();
						} else {
							delete this._dragger;
						}
					}
				} else {
					this._dragger = this.createDragger();
				}
			},
			ondragstart: function() {
				if(this.isDraggable() && this.fire("onDragStart", arguments) !== false) {
					this.dispatch("draggerneeded", {});
					if(this.hasOwnProperty("_dragger")) {
						this._dragging = true;
						this._dragger.start.apply(this._dragger, arguments);
						this.update();
					}
				}
			},
			ondragevent: function() {},
			ondragcancel: function() {},
			ondragend: function() {},
			ondragenter: function(evt) {
				this.fire("onDragEnter", arguments);
			},
			ondragover: function(evt) {
				this.fire("onDragOver", arguments);
			},
			ondragleave: function(evt) {
				this.fire("onDragLeave", arguments);
			},
			ondrop: function(evt) {
				this.fire("onDrop", arguments);
			},
			onclick: function(evt) {
				if(this.fire("onClick", arguments) !== false) {
					if(this._executesAction === "onClick" && this._action) {
						this._action.execute(evt, this);
					}
				}

				// FIXME
				this.dispatch("tap", evt);
			},
			ondblclick: function(evt) {
				this.fire("onDblClick", arguments);

				// FIXME
				this.dispatch("dbltap", evt);
			},
			onmousedown: function(evt) {
				if(evt.target === this._node && this.isDraggable()) {
					evt.preventDefault();
				}
				this.fire("onMouseDown", arguments);
			},
			onmousemove: function() {
				this.fire("onMouseMove", arguments);
			},
			onmouseup: function() {
				this.fire("onMouseUp", arguments);
			},
			onmouseenter: function() {},
			onmouseleave: function() {},
			ontap: function() {
				this.fire("onTap", arguments);
			},
			ondbltap: function() {
				this.fire("onDblTap", arguments);
			},
			ontaphold: function() {
				this.fire("onTapHold", arguments);
			},
			ontouchstart: function(evt) {
				this._touchstartInfo = {
					time: Date.now(),
					clientX: evt.touches[0].clientX,
					clientY: evt.touches[0].clientY
				};
				this.fire("onTouchStart", arguments);
			},
			ontouchmove: function(evt) {
				this._touchstartInfo.deltaX = Math.abs(
						evt.touches[0].clientX - this._touchstartInfo.clientX);
				this._touchstartInfo.deltaY = Math.abs(
						evt.touches[0].clientY - this._touchstartInfo.clientY);
				this.fire("onTouchMove", arguments);
			},
			ontouchend: function(evt) {
				// FIXME Is this the right way to simulate tap?
				var ms = Date.now() - this._touchstartInfo.time;
				if(this._touchstartInfo.deltaX === undefined)  {
					this.dispatch("tap", evt);
				}

				this.fire("onTouchEnd", arguments);
			},
			onshow: function() {
				this.fire("onShow", arguments);
			},
			onhide: function() {
				this.fire("onHide", arguments);
			},
			onfocus: function() {
				// this.setFocused(true);
				// Control.setFocusedControl(this);
				if(this.fire("onFocus", arguments) !== false) {
					this._focused = true;
					this.update();
					// Control.setFocusedControl(this);
				}
			},
			onblur: function() {
				// this.setFocused(false);
				// Control.setFocusedControl(null);
				if(this.fire("onBlur", arguments) !== false) {
					this._focused = false;
					this.update();
				}
			},
			onresize: function() {
				this.fire("onResize", arguments);
			},
			ontransitionend: function() {
			    this.fire("onTransitionEnd", arguments);
			},
			getAction: function() {
				return this._action;
			},
			setAction: function(value, destroying) {
				if(this._action !== value) {
					if(this._action !== null) {
						this._action.un(this._actionListeners);
						delete this._actionListeners;
					}

					this._action = value;

					var me = this;
					if(this._action !== null) {
						this._actionListeners = this._action.on({
							"change": function() {
								me.update();
							},
							"destroy": function() {
								me.setAction(null);
							}
						});
					}

					if(destroying !== true) {
						this.update();
					}
				}
			},


// PROPERTIES
			getElement: function() {
			/**
			 *
			 * @returns {String}
			 */
				return this._element;
			},
			setElement: function(value) {
			/**
			 *
			 * @param value
			 */
				if(this._element !== value) {
					this._element = value;
					this.recreateNode();
				}
			},
			getContent: function() {
				return this._content;
			},
			getTextContent: function() {
				return this.nodeNeeded().textContent;
			},
			setContent: function(value) {
				if(this._content !== value) {
					this._content = value;
					if(this._node !== null) {
						// TODO Can we be sure that all childNodes have
						// disappeared after following call to clearState?
						this.clearState("acceptChildNodes", true, true);
						this._node.innerHTML = this.getInnerHtml();
						this._nodes = {};
						this.initializeNodes();
						this.setState("acceptChildNodes", true);
						this.layoutChanged();
					}
				}
			},
			setFocused: function(value) {
				if(value) {
					this.setFocus();
				} else {
					this.blur();
				}
			},
			getDraggable: function() {
			/**
			 * Property accessor
			 */
				return this._draggable;
			},
			setDraggable: function(value) {
			/**
			 *
			 * @param value
			 *            {Boolean}
			 */
				if(this._draggable !== value) {
					this._draggable = value;
					this.update();
				}
			},
			getEnabled: function() {
			/**
			 * Property accessor
			 */
				return this._enabled;
			},
			setEnabled: function(value) {
			/**
			 *
			 * @param value
			 *            {Boolean}
			 */
				if(this._enabled !== value) {
					this._enabled = value;
					this.update();
				}
			},
			getReadonly: function() {
			/**
			 * Property accessor
			 */
				return this._readonly;
			},
			setReadonly: function(value) {
			/**
			 *
			 * @param value
			 *            {Boolean}
			 */
				if(this._readonly !== value) {
					this._readonly = value;
					this.update();
				}
			},
			setTabIndex: function(value) {
				if(this._tabIndex !== value) {
					this._tabIndex = value;
					if(this._node !== null) {
						this._node.tabIndex = value;
					}
				}
			},
			getVisible: function() {
			/**
			 * Property accessor
			 */
				return this._visible;
			},
			setVisible: function(value) {
			/**
			 *
			 * @param value
			 *            {Boolean}
			 */
				if(this._visible !== value) {
					this._visible = value;
					// FIXME is this too heavy?
					if(this.isDesigning() === true) {
						this.setState(ControlState.classesInvalidated, false);
					}
					this.update();
				}
			},
			getSelected: function() {
			/**
			 * Property accessor
			 */
				return this._selected;
			},
			setSelected: function(value) {
			/**
			 *
			 * @param value
			 *            {Boolean}
			 */
				if(this._selected !== value) {
					if(value === true && this._groupIndex !== -1 && this._parent !== null) {
						this._parent.selectControl(this);
					} else {
						this._selected = value;
						this.update();
					}
				}
			},
			getGroupIndex: function() {
			/**
			 * Property accessor
			 */
				return this._groupIndex;
			},
			setGroupIndex: function(value) {
			/**
			 *
			 * @param value
			 *            {Number}
			 */
				if(this._groupIndex !== value) {
					this._groupIndex = value;
				}
			},
			getClassName: function() {
				return this._className || Control.getClassNameFor(this.constructor);
			},
			setClassName: function(value) {
				if(this._className !== value) {
					if(value !== null) {
						this._className = value;
					} else {
						delete this._className;
					}
					this.setState(ControlState.classesInvalidated, !this.isLoading());
				}
			},
			getClasses: function() {
				return this._classes;
			},
			setClasses: function(value) {
				if(this._classes !== value) {
					if(value !== "") {
						this._classes = value;
					} else {
						delete this._classes;
					}
					this.setState(ControlState.classesInvalidated, !this.isLoading());
				}
			},
			getCssRules: function() {
			/**
			 *
			 * @returns {CssRules}
			 */
				return this._cssRules;
			},
			getCss: function() {
				return this._css;
			},
			setCss: function(value) {
				if(value === null || (typeof value === "object" && js.keys(value).length === 0)) {
					this._cssRules = null;
				} else {
					if(typeof value === "string") {
						value = js.str2obj(value);
					} else if(value instanceof Array) {
						value = js.str2obj(value.join(""));
					}

                    /*- Resolve references to other classes and apply other transformations */
					CssRules.normalize(String.of(this.constructor), value, this);

					if(this._cssRules === null) {
						//var element = this.getElement();
						var className = this.getClassName();
						var hashCode = this.hashCode();

						if(className !== "") {
							className = String.format(".%s", className.replace(/ /g, "."));
						}

						this._cssRules = new CssRules();
						//this._cssRules.setSelector(String.format("%s%s#x%d", element, className, hashCode));
						this._cssRules.setSelector(String.format("#%s", this.getNodeId()));
						this._cssRules.setRules(value);
					} else {
						this._cssRules.setRules(value);
					}
				}
				this._css = value;
				this.setState(ControlState.classesInvalidated, !this.isLoading());
			},
			isIndexStored: function() {
				return Component.getInheritedPropertyValue(this, "index") !== undefined;
			}
		},
		statics: {

			focused: null,

			findByNode: function(node) {
				while(node !== null && node[EventDispatcher.elementKey] === undefined) {
					node = node.parentNode || null; // IE
				}
				return node !== null ? node[EventDispatcher.elementKey] : null;
			},
			setFocused: function(control) {
				if(this.focused !== control) {
					this.focused = control;
				}
			},
			update: function(f) {
				if(this.isLoading() || (this._parent !== null && this._parent.allowsUpdateChildren() === false)) {
					if(f !== undefined) {
						setTimeout(f, 0);
						// f();
					}
					return "nothing-to-do";
				} else {
					this._post_update = this._post_update || [];
					if(f !== undefined) {
						this._post_update.push(f);
					}
					ControlUpdater.queue(this);
					return "queued";
				}
			},
			getClassNameFor: function(ctor) {
				var proto = ctor.prototype;
				var className = proto["@className"];
				var own = proto.hasOwnProperty("@className");

				// Once per prototype...
				if(own === false) {
					var superctor = Class.getSuperClass(ctor);
					own = proto.hasOwnProperty("@css");
					if(own === true) {
						var rules = (proto["@css-rules"] = new CssRules());
						var selector = Stylesheet.generateSelector(String.of(ctor).replace(/\//g, "-"));
						className = selector.substring(1);
						//rules.setSelector(".vcl" + selector);
						rules.setSelector(selector);// + "[id^='vcl-']");
						rules.setRules(CssRules.normalize(String.of(ctor), proto["@css"]));
					} else {
						className = "";// Stylesheet.generateSelector(cls.getName().split("/").pop()).substring(1);
					}

					if(superctor !== null && superctor !== Component) {
						var scn = Control.getClassNameFor(superctor);
						if(scn !== "") {
							if(className !== "") {
								className += " ";
							}
							className += scn;
						}
					}

					proto["@className"] = className;
				}
				return className;
			}
		},
		properties: {

			"parent": {
				type: Component,
				visible: false,
				stored: false,
				set: Function
			},
			"index": {
				set: Function,
				get: Function,
				stored: Function,
				type: Type.INTEGER,
				fixUp: true, /*- FIXME Does this work? */
				def: -1
			},
			// node
			"element": {
				set: Function,
				type: Type.STRING
			},
			"content": {
				type: Type.STRING,
				set: Function
			},
			"tabIndex": {
				type: Type.INTEGER,
				set: Function	
			},
			// css, classes, style
			"className": {
				get: Function,
				set: Function,
				type: Type.STRING,
				def: null
			},
			"classes": {
				set: Function,
				type: Type.STRING
			},
			"css": {
				Set: Function,
				set: function(value) {
					if(typeof value === "string") {
						value = js.str2obj(value);
					} else if(value instanceof Array) {
						value = js.str2obj(value.join(""));
					}

					function superMixIn(dest, src) {
						for(var k in src) {
							if(src.hasOwnProperty(k)) {
								var v = src[k];
								if(v !== null && Object.prototype.toString.apply(v, []) === "[object Object]") {
									dest[k] = dest[k] || {};
									superMixIn(dest[k], v);
								} else {
									dest[k] = v;
								}
							}
						}
						return dest;
					}

					if(this.hasOwnProperty("_css")) {
						value = superMixIn(js.mixIn(this._css), value);
					}

					this.setCss(value, true);
				},
				type: Type.OBJECT,
				def: null
			},
			// state
			"action": {
				set: Function,
				type: Action
			},
			"groupIndex": {
				set: Function,
				type: Type.INTEGER
			},
			"draggable": {
				set: Function,
				type: [true, false, "parent"]
			},
			"enabled": {
				set: Function,
				type: [true, false, "always", "never"]
			},
			"readonly": {
				set: Function,
				type: Type.BOOLEAN
			},
			"selected": {
				set: Function,
				type: [true, false, "always", "never"]
			},
			"visible": {
				set: Function,
				type: [true, false, "always", "never"]
			},
			"executesAction": {
				type: ["No", "onClick"]
			},
			// events
			"onClick": {
				type: Type.EVENT
			},
			"onDblClick": {
				type: Type.EVENT
			},
			"onMouseDown": {
				type: Type.EVENT
			},
			"onMouseUp": {
				type: Type.EVENT
			},
			"onMouseMove": {
				type: Type.EVENT
			},
			"onMouseEnter": {
				type: Type.EVENT
			},
			"onMouseLeave": {
				type: Type.EVENT
			},
			"onNodeCreated": {
				type: Type.EVENT
			},
			"onNodeInserted": {
				type: Type.EVENT
			},
			"onKeyPress": {
				type: Type.EVENT
			},
			"onKeyUp": {
				type: Type.EVENT
			},
			"onKeyDown": {
				type: Type.EVENT
			},
			"onDragStart": {
				type: Type.EVENT
			},
			"onDragEvent": {
				type: Type.EVENT
			},
			"onDragCancel": {
				type: Type.EVENT
			},
			"onDragEnd": {
				type: Type.EVENT
			},
			"onDraggerNeeded": {
				type: Type.EVENT
			},
			"onDragEnter": {
				type: Type.EVENT
			},
			"onDragOver": {
				type: Type.EVENT
			},
			"onDragLeave": {
				type: Type.EVENT
			},
			"onDrop": {
				type: Type.EVENT
			},
			"onResize": {
				type: Type.EVENT
			},
			"onScroll": {
				type: Type.EVENT
			},
			"onRender": {
				type: Type.EVENT
			},
			"onHint": {
				type: Type.EVENT
			},
			"onFocus": {
				type: Type.EVENT
			},
			"onBlur": {
				type: Type.EVENT
			},
			"onShow": {
				type: Type.EVENT
			},
			"onHide": {
				type: Type.EVENT
			},
			"onTap": {
				type: Type.EVENT
			},
			"onDblTap": {
				type: Type.EVENT
			},
			"onTouchStart": {
				type: Type.EVENT
			},
			"onTouchMove": {
				type: Type.EVENT
			},
			"onTouchEnd": {
				type: Type.EVENT
			},
			"onTouchCancel": {
				type: Type.EVENT
			},
			"onGesture": {
				type: Type.EVENT
			},
			"onTransitionEnd": {
				type: Type.EVENT
			}
		}
	}));
});
