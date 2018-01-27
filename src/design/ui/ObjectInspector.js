/**
 * ObjectInspector.js
 */
js.lang.Class.require("org.cavalion.comp.ui.Panel");
js.lang.Class.require("org.cavalion.comp.ui.Popup");
js.lang.Class.require("org.cavalion.comp.design.Designer");

js.lang.Class.declare("org.cavalion.comp.design.ui.ObjectInspector", {

	/**
	 * Base class
	 */
	Extends: org.cavalion.comp.ui.Panel,

	/**
	 * Implemented interfaces
	 */
	Implements: [

	],

	/**
	 * Member definitions
	 */
	Members: {

		_designer: null,
		_properties: null,

		_defaultPropertyName: "name",
		_propertyNamePath: "",
		_selectedRow: null,

		_element: "div",
		_property: null,
		_editor: null,
		_editorValues: null,
		_popup: null,

		_nodes: null,
		_rules: null,
		
		_onPropertyChange: null

	},

	/**
	 * Constructor
	 */
	Constructor: function() {
		this._propertyNamePath = this._defaultPropertyName;

		this._rules = new org.cavalion.comp.CssRules();
		this._rules.setRules({
			" div.column1": "width: 100px;",
			" div.column2": "width: 100px;",
			" div.column2.selected": "width: 80px;"
		});

		this.addClass(this._rules.getClassName());
	},

	/**
	 * Method definitions
	 */
	Methods: {

		/**
		 * @overrides org.cavalion.comp.Component
		 */
		destroy: function() {
			this.setDesigner(null);
			js.lang.Class.__inherited(this, arguments);
		},

		/**
		 * @overrides org.cavalion.comp.Control.prototype._initializeNodes
		 */
		_initializeNodes: function() {
			var r = js.lang.Class.__inherited(this, arguments);

			this._nodes.editor = document.createElement("input");

			this._nodes.editor.className = "editor";
			this._nodes.editor.focused = false;
			this._nodes.editor.onfocus = function() {
				this.focused = true;
			};
			this._nodes.editor.onblur = function(evt) {
				this.focused = false;
			};

			if(this._designer !== null) {
				this._render();
			}
			
			return r;
		},

		/**
		 * @overrides org.cavalion.comp.Control.prototype._applyBounds
		 */
		_applyBounds: function() {
			js.lang.Class.__inherited(this, arguments);

			// FIXME exclude scrollbars?
			var w = this.getClientRect().width;

			var w1 = w * 0.5 - 24;
			var w2 = w - w1 - 30;
			var w3 = w - w1 - 50;

			if(this._node.scrollHeight > this._node.clientHeight) {
				w2 -= 17;
				w3 -= 17;
			}

			this._rules.getRule(" div.column1").style.width = String.format("%dpx", w1);
			this._rules.getRule(" div.column2").style.width = String.format("%dpx", w2);
			this._rules.getRule(" div.column2.selected").style.width = String.format("%dpx", w3);
		},

		/**
		 *
		 */
		keydown: function(evt) {
			switch(evt.keyCode) {

				case 27:
					var selection = this._designer.getSelection(true);
					if(selection.length > 0) {
						var root = this._designer.getRootComponent();
						if(selection[0] instanceof org.cavalion.comp.Control && selection[0] !== root) {
							var parent = selection[0].getParent();
							while(parent !== null && parent._owner !== root && parent !== root) {
								parent = parent._parent;
							}
							if(parent === null) {
								parent = root;
							}
							this._designer.setSelection(parent);
						} else {
							this._designer.setSelection(root);
						}
					}
					evt.preventDefault();
					break;

				case 13:
					if(evt.ctrlKey === false) {
						this._editor.setValue(this._nodes.editor.value);
						this.designer_modified();
					} else {
						this._editor.edit(evt);
					}
					this._render();
					break;

				case 38:
					this.selectPreviousRow();
					evt.preventDefault();
					break;

				case 40:
					if(evt.altKey === true && this.isEditorValueList()) {
						this.dropDown();
					} else {
						this.selectNextRow();
					}
					evt.preventDefault();
					break;

				case 33:
					//evt.preventDefault();
					break;

				case 34:
					//evt.preventDefault();
					break;

			}

			js.lang.Class.__inherited(this, arguments);
		},

		/**
		 *
		 */
		mousedown: function(evt) {
			js.lang.Class.__inherited(this, arguments);

			var tr = this.getSelectedRow();
			if(tr !== null) {
				var column2 = js.dom.Element.getChildNode(tr, 1, 0);
				if(evt.target === column2) {// || js.dom.Element.hasParent(evt.target, column2)) {
					js.dom.Element.addClass(column2, "down");
					if(js.dom.Element.hasClass(column2, "valuelist")) {
						this.dropDown();
					}
				}
			}
		},

		/**
		 *
		 */
		mouseup: function(evt) {
			js.lang.Class.__inherited(this, arguments);

			var tr = this.getSelectedRow();
			if(tr !== null) {
				var column2 = js.dom.Element.getChildNode(tr, 1, 0);
				if(js.dom.Element.hasClass(column2, "down")) {
					js.dom.Element.removeClass(column2, "down");
				}
			}
		},

		/**
		 * @overrides org.cavalion.comp.Control.prototype.click
		 */
		click: function(evt) {
			js.lang.Class.__inherited(this, arguments);
			
			var className = evt.target.className;			
			var tr = this.getSelectedRow();
			if(tr !== null) {
				var column2 = js.dom.Element.getChildNode(tr, 1, 0);
				if(evt.target === column2) {// || js.dom.Element.hasParent(evt.target, column2)) {
					if(className.indexOf("dialog") !== -1) {
						this._editor.edit(evt);
					}
				}
			}
			
			if(className.indexOf("column1") !== -1) {
				this.setSelectedRow(this.getRowByPropertyNamePath(evt.target.childNodes[0].nodeValue));
			} else if(className.indexOf("column2") !== -1) {
				this.setSelectedRow(this.getRowByPropertyNamePath(js.dom.Element.getChildNode(evt.target.parentNode.parentNode, 0, 0, 0).nodeValue));
			}
			
		},

		/**
		 * @overrides org.cavalion.comp.Control.prototype.dblclick
		 */
		dblclick: function(evt) {
			if(evt.target === this._nodes.editor) {
				this._editor.edit(evt);
			} else if(evt.ctrlKey === true) {
				var modified = false;
				if(this.getWindow().confirm(String.format("Revert to inherited value?"))) {
					var selection = this._designer._selection;
					for(var i = 0; i < selection.length; ++i) {
						var component = selection[i];
						var _undefined = {};
						var inh = org.cavalion.comp.Component.getInheritedPropertyValue(component, this._property.getName(), _undefined);
						var value = this._property.get(component);
						if(value !== inh) {
							if(inh === _undefined) {
								this._property.set(component, this._property.getDefaultValue(component));
								modified = true;
							} else {
								this._property.set(component, inh);
								modified = true;
							}
						}
					}
				}
				if(modified === true) {
					this._designer.modified();
				}
			}
		},

		/**
		 *
		 */
		_render: function() {
			var properties;
			var keys;
			var html;
			var selection;
			var property;
			var editor;

			if(this._node !== null) {

				selection = this._designer.getSelection(true);

				this.setSelectedRow(null);

				if(selection.length > 0) {
					if(selection.length === 1) {
						this._properties = selection[0].defineProperties();
					} else {
						this._properties = this._determineProperties(selection);
					}
					

					if(selection.length !== 1) {
						keys = js.keys(this._properties).sort();
					} else {
						properties = this._properties;
						keys = js.keys(this._properties).sort(function(p1, p2) {
							var s1 = !properties[p1].hasDefaultValue(selection[0]) || properties[p1].hasInheritedValue(selection[0]);
							var s2 = !properties[p2].hasDefaultValue(selection[0]) || properties[p2].hasInheritedValue(selection[0]);
							
							if(s1 !== s2) {
								return s1 === true ? -1 : 1;								
							}
							
							return p1 < p2 ? -1 : 1;
						});
						keys = keys.sort();
					}
					html = [];

					html.push("<table cellpadding=\"0\" cellspacing=\"0\"><tbody>");
					keys.forEach(function(key, i) {
						property = this._properties[key];
						editor = this._createEditor(property);

						if(editor.isVisible()) {
							var classes = [];
							var value = editor.getEditValue();
							
							if(value) {
								value = String.format("%H", value);
							} else {
								value = "&nbsp;";
							}

							if(editor.hasDefaultValue()) {
								classes.push("default");
							}
							if(editor.hasInheritedValue()) {
								classes.push("inherited");
							} else if(key.indexOf(" / ") !== -1) {
								(function() {
									var key2 = key.split("/").pop().substring(1);
									var property2 = this._properties[key2];
									var editor2 = this._createEditor(property2);
									if(editor2.hasInheritedValue()) {
										classes.push("inherited");
									}									
								}).apply(this, []);
							} else if(key !== "name" && !editor.isStored()) {
								classes.push("default");
							}
							
							if(!editor.isEnabled()) {
								classes.push("disabled");
							}
							
							classes = classes.join(" ");
							if(classes.length > 0) {
								classes = " " + classes;
							}
							
							html.push("<tr>");
							html.push(String.format("<td><div class=\"column1%s\">%H</div></td>", classes, key));
							html.push(String.format("<td><div class=\"column2%s\">%s</div></td>", classes, value));
							html.push("</tr>");
						}

					}, this);

					html.push("</tbody></table>");

					this.setInnerHtml(html.join(""));
					this._selectProperty();

				} else {
					this._properties = null;
					this.setInnerHtml("");
				}
			}
		},
		
		/**
		 * 
		 */
		_determineProperties: function(components) {
			var properties = components[0].defineProperties();
			var r = js.mixIn({}, properties);
			for(var k in properties) {
				if(1) {
					var property = properties[k];
					var type = property.getType();
					for(var i = 1; i < components.length; ++i) {
						var props = components[i].defineProperties();
						var prop = props[k];
						if(prop === undefined || prop.getType() !== type || !this._createEditor(prop).hasAttribute("multiSelect")) {
							delete r[k];							
						}
					}
				}
			}
			return r;
		},

		/**
		 *
		 */
		_selectProperty: function() {
			var property = this._properties[this._propertyNamePath];
			if(property === undefined || !property.isVisible(this._object)) {
				property = this._properties[this._defaultPropertyName];
				if(property === undefined || !property.isVisible(this._object)) {
					var keys = js.keys(this._properties);
					var l = keys.length;
					var i = 0;
					while((property === undefined || !property.isVisible(this._object)) && i < l) {
						property = this._properties[i++];
						//not visible? property = undefined;
					}
				}
				if(property !== undefined && property.isVisible(this._object)) {
					this._propertyNamePath = property.getName();
				} else {
//					this._propertyNamePath = "";
				}
			}

			if(property !== undefined) {
				var tr = this.getRowByProperty(property);
				if(tr !== null) {
					this.setSelectedRow(tr);
				} else {
					hostenv.printf("property %s not found", property.getName());
				}
			}
		},

		/**
		 *
		 */
		_initializeEditor: function() {
			/**
			 * 
			 */
			function addValue(display, value, allowHtmlMarkup) {
				if(this._editorValues === null) {
					this._editorValues = [];
				}
				this._editorValues.push({display: display, value: value, allowHtmlMarkup: allowHtmlMarkup});
			}

			this._editorValues = null;
			this._editor = this._createEditor(this._property);
			this._editor.activate();
			
			if(this._editor.hasAttribute("valueList")) {
				this._editor.getValues(addValue.closure(this));
				
				if(this._editorValues !== null) {
					if(this._editor.hasAttribute("sortList")) {
						this._editorValues = this._editorValues.sort(function(i1, i2) {
							return i1.display < i2.display ? -1 : 1;
						});
					}
				}
			}			

			this._updateEditor();
		},

		/**
		 *
		 */
		_createEditor: function(property) {
			var selection = this._designer.getSelection(true);
			return property.getEditorClass().newInstance(this._designer, property, selection.length);
		},

		/**
		 *
		 */
		_updateEditor: function() {
			this._nodes.editor.readOnly = this.isEditorReadOnly();
			this._nodes.editor.value = this._editor.getEditValue();
		},

		/**
		 *
		 */
		_finalizeEditor: function() {
			if(this._nodes.editor.parentNode !== null) {
				this._nodes.editor.parentNode.removeChild(this._nodes.editor);
			}
			this._editor.terminate();
			this._editor = null;
			
			if(this._popup !== null && this._popup.isShowing()) {
				this._popup.close();
			}
		},

		/**
		 *
		 */
		_selectRow: function(tr) {
			//var property = this._property;

			var column1 = js.dom.Element.getChildNode(tr, 0, 0);
			var column2 = js.dom.Element.getChildNode(tr, 1, 0);

			js.dom.Element.addClass(column1, "selected");
			js.dom.Element.addClass(column2, "selected");
			if(hostenv.browser.webkit) {
				js.dom.Element.addClass(column2, "webkit");
			}

			column2.innerHTML = "";
			column2.appendChild(this._nodes.editor);
			
			if(this.isEditorSubProperties()) {
				//js.dom.Element.addClass(column1, "valuelist");
			}

			if(this.isEditorValueList()) {
				js.dom.Element.addClass(column2, "valuelist");
			}

			if(this.isEditorDialog()) {
				js.dom.Element.addClass(column2, "dialog");
			}

			tr = tr.previousSibling;

			if(tr !== null) {

				column1 = js.dom.Element.getChildNode(tr, 0, 0);
				column2 = js.dom.Element.getChildNode(tr, 1, 0);

				js.dom.Element.addClass(column1, "next_selected");
				js.dom.Element.addClass(column2, "next_selected");
			}

//			if(this._nodes.editor.focused === true) {
				this._nodes.editor.focus();
				this._nodes.editor.select();
//			}
		},

		/**
		 *
		 */
		_unselectRow: function(tr) {
			var column1 = js.dom.Element.getChildNode(tr, 0, 0);
			var column2 = js.dom.Element.getChildNode(tr, 1, 0);

			js.dom.Element.removeClass(column1, "selected");
			js.dom.Element.removeClass(column2, "selected");
			if(hostenv.browser.webkit) {
				js.dom.Element.removeClass(column2, "webkit");
			}

			if(js.dom.Element.hasClass(column2, "dialog")) {
				js.dom.Element.removeClass(column2, "dialog");
			}

			if(js.dom.Element.hasClass(column2, "valuelist")) {
				js.dom.Element.removeClass(column2, "valuelist");
			}

			if(this._nodes.editor.parentNode === column2) {
				column2.removeChild(this._nodes.editor);
			}

			column2.innerHTML = String.format("%H", this._nodes.editor.value) || "&nbsp;";

			tr = tr.previousSibling;

			if(tr !== null) {

				column1 = js.dom.Element.getChildNode(tr, 0, 0);
				column2 = js.dom.Element.getChildNode(tr, 1, 0);

				js.dom.Element.removeClass(column1, "next_selected");
				js.dom.Element.removeClass(column2, "next_selected");
			}
		},

		/**
		 *
		 */
		dropDown: function() {
			if(this._editorValues === null) {
				return;
			}
			
			var thisObj = this;
			var node;
			var list = this._editorValues;
			var ar = js.dom.Element.getAbsoluteRect(this._nodes.editor);
			var text = this._nodes.editor.value;
			ar.left -= 2;
			ar.top += 2;
			ar.width += 20;
			
			if(this._popup === null) {
				
				this._popup = new org.cavalion.comp.ui.ComboboxPopup(this);
				this._popup._hook.__override({
					
					/**
					 * 
					 */
					mousedown: function(evt) {
						if(evt.target.className === "item") {
							thisObj._nodes.editor.value = evt.target._comp.display;
							thisObj._editor.setValue(evt.target._comp.value);
							thisObj.designer_modified();
						} else {
							var control = org.cavalion.comp.Control.get(evt.target);
							if(control !== thisObj._popup && control !== thisObj) {
								thisObj._popup.close();
							}
						}
					},
					
					/**
					 *
					 */
					click: function(evt) {
						if(evt.target !== thisObj._nodes.editor) {
							return js.lang.Class.__inherited(this, arguments);
						}
					},
		
					/**
					 *
					 */
					keydown: function(evt) {
						if(evt.keyCode === 13) {
							evt.bubbleUp = false;
						}
						return js.lang.Class.__inherited(this, arguments);
					},
					
					/**
					 * 
					 */
					keyup: function(evt) {
						var value = thisObj._nodes.editor.value;
						var node;
						var i, l, v;
						
						if(text !== value || evt.keyCode === 13 || evt.keyCode === 8) {
							text = value;
							node = thisObj._popup.getClientNode();
							for(i = 0, l = list.length; i < l; ++i) {
								v = node.childNodes[i].childNodes[0].nodeValue;
								if(text === "" || v.indexOf(text) !== -1) {
									node.childNodes[i].style.display = "";
									if(evt.keyCode === 13) {
										thisObj._nodes.editor.value = v;
										thisObj._editor.setValue(text !== "" ? node.childNodes[i]._comp.value : "");
										thisObj.designer_modified();
										i = l;
									}
								} else {
									node.childNodes[i].style.display = "none";
								}
							}
						}
					}
				}, true);
				this._popup.setClassName("org-cavalion-comp-design-ui-ObjectInspector-valueList");
				this._popup.setParentNode(document.body);
			}
			
			var html = [];
			for(var i = 0, l = list.length; i < l; ++i) {
				html.push("<div class=\"item\">&nbsp;</div>");
			}
			node = this._popup.getClientNode();
			node.innerHTML = html.join("");
			for(i = 0, l = list.length; i < l; ++i) {
				if(list[i].allowHtmlMarkup !== true) {
					node.childNodes[i].childNodes[0].nodeValue = list[i].display;
				} else {
					node.childNodes[i].childNodes[0].innerHTML = list[i].display;
				}
				node.childNodes[i]._comp = list[i];
			}

			node = this._popup.getClientNode();
			for(i = 0, l = list.length; i < l; ++i) {
				node.childNodes[i].style.display = "";
			}
			
			this._popup.popup("below-above", ar);
			this._nodes.editor.focus();
		},
		
		/**
		 *
		 */
		isEditorSubProperties: function() {
			return (this._editor.getAttributes() & js.lang.PropertyEditorAttribute.subProperties) !== 0;
		},

		/**
		 *
		 */
		isEditorReadOnly: function() {
			return !this._editor.isEnabled() || (this._editor.getAttributes() & js.lang.PropertyEditorAttribute.readOnly) !== 0;
		},

		/**
		 *
		 */
		isEditorValueList: function() {
			return (this._editor.getAttributes() & js.lang.PropertyEditorAttribute.valueList) !== 0;
		},

		/**
		 *
		 */
		isEditorDialog: function() {
			return (this._editor.getAttributes() & js.lang.PropertyEditorAttribute.dialog) !== 0;
		},

		/**
		 *
		 */
		getRowByProperty: function(property) {
			var name = property.getName();
			var rows = js.dom.Element.getChildNode(this._node, 0, 0).childNodes;
			for(var i = 0, l = rows.length; i < l; ++i) {
				if(js.dom.Element.getChildNode(rows[i], 0, 0, 0).nodeValue === name) {
					return rows[i];
				}
			}
			return null;
		},

		/**
		 *
		 */
		getPropertyByRow: function(tr) {
			return tr !== null ? this._properties[js.dom.Element.getChildNode(tr, 0, 0, 0).nodeValue] || null : null;
		},

		/**
		 *
		 */
		getPropertyNamePathByRow: function(tr) {
			return tr !== null ? js.dom.Element.getChildNode(tr, 0, 0, 0).nodeValue : "";
		},

		/**
		 *
		 */
		getRowByPropertyNamePath: function(namePath) {
			var rows = js.dom.Element.getChildNode(this._node, 0, 0).childNodes;
			for(var i = 0, l = rows.length; i < l; ++i) {
				if(js.dom.Element.getChildNode(rows[i], 0, 0, 0).nodeValue === namePath) {
					return rows[i];
				}
			}
			return null;
		},

		/**
		 *
		 */
		getSelectedProperty: function() {
			return this._property;
		},

		/**
		 *
		 */
		getSelectedRow: function() {
			return this._selectedRow;
		},

		/**
		 *
		 */
		setSelectedRow: function(value) {			
			if(this._selectedRow !== value) {
				if(this._property !== null) {
					this._previous_property = this._property;
				}
				if(this._selectedRow !== null) {
					this._finalizeEditor();
					this._unselectRow(this._selectedRow);
					this._property = null;
				}
				this._selectedRow = value;
				if(this._selectedRow !== null) {
					this._propertyNamePath = this.getPropertyNamePathByRow(value);
					this._property = this.getPropertyByRow(this._selectedRow);
					this._initializeEditor();
					this._selectRow(this._selectedRow);
				}
				if(this._previous_property !== this._property) {
					this.dispatch("propertychanged", {});
				}
			}
		},

		/**
		 *
		 */
		selectPreviousRow: function() {
			if(this._selectedRow !== null) {
				var tr = this._selectedRow.previousSibling;
				if(tr !== null) {
					this.setSelectedRow(tr);
				}
			}
		},

		/**
		 *
		 */
		selectNextRow: function() {
			if(this._selectedRow !== null) {
				var tr = this._selectedRow.nextSibling;
				if(tr !== null) {
					this.setSelectedRow(tr);
				}
			}
		},

		/**
		 *
		 */
		designer_selection_changed: function() {
			//org.cavalion.comp.Component.setTimeout(this, "_render", 200);
			this._render();
		},

		/**
		 *
		 */
		designer_modified: function() {
			org.cavalion.comp.Component.setTimeout(this, "_render", 200);
		},
		
		/**
		 * 
		 */
		propertychanged: function() {
			return org.cavalion.comp.Component.fire(this, "onPropertyChange", arguments);
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
			if(this._designer !== value) {
				if(this._designer !== null) {
					Function.disconnect(this._designer, "selectionchanged", this, "designer_selection_changed");
					Function.disconnect(this._designer, "modified", this, "designer_modified");
					Function.disconnect(this._designer, "refresh", this, "designer_modified");
				}
				this._designer = value;
				if(this._designer !== null) {
					Function.connect(this._designer, "selectionchanged", this, "designer_selection_changed");
					Function.connect(this._designer, "modified", this, "designer_modified");
					Function.connect(this._designer, "refresh", this, "designer_modified");
				}
			}
		}

	},

	/**
	 * Property definitions
	 */
	Properties: {

		"designer": {
			type: org.cavalion.comp.design.Designer,
			set: Function
		},
		
		"onPropertyChange": {
			type: js.lang.Type.FUNCTION
		}

	},

	/**
	 * Static members
	 */
	Statics: {

	}

});