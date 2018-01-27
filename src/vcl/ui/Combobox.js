define(function(require) {

	var Combobox = require("js/defineClass");
	var Input = require("./Input");
	var Popup = require("./ComboboxPopup");

	return (Combobox = Combobox(require, {

		inherits: Input,

		prototype: {

			/**
			 * @overrides org.cavalion.comp.Control.prototype
			 */
			_innerHtml: "<div class=\"border\"><input/></div>",

			/**
			 *
			 */
			_listSource: null,
			_listAttribute: "",
			_listKey: "",

			_nullValue: null,

			_list: null,
			_listIndex: -1,

			_popup: null,
			_repopulatePopup: true,

			_onItemGetDisplayValue: null,
			_onItemClick: null,

			/**
			 * Constructor
			 */
			constructor: function() {

			},

			/**
			 * @overrides org.cavalion.comp.Control.prototype.mousedown
			 */
			mousedown: function() {
				var r = js.lang.Class.__inherited(this, arguments);
				if(r !== false) {
					this.addClass("down");
					if(this.isPopupActive() === false) {
						this.activatePopup(true);
					}
				}
				return r;
			},

			/**
			 * @overrides org.cavalion.comp.Control.prototype.mouseup
			 */
			mouseup: function() {
				this.removeClass("down");
				return js.lang.Class.__inherited(this, arguments);
			},

			/**
			 * @overrides org.cavalion.comp.Control.prototype.mouseleave
			 */
			mouseleave: function() {
				this.removeClass("down");
				return js.lang.Class.__inherited(this, arguments);
			},

			/**
			 * @overrides org.cavalion.comp.Control.prototype.keydown
			 */
			keydown: function(evt) {
				var r = js.lang.Class.__inherited(this, arguments);
				if(r !== false && this._list !== null) {
					if(evt.keyCode === 40 && evt.altKey === true) {
						this.activatePopup();
						if(this._listIndex === -1 && this._list.length > 0) {
							this.setListIndex(0);
						}
					} else if(evt.keyCode === 40) {
						this._navigateItem(1);
						evt.preventDefault();
					} else if(evt.keyCode === 38) {
						this._navigateItem(-1);
						evt.preventDefault();
					}
				}
				return r;
			},

			/**
			 * @overrides org.cavalion.comp.Control.prototype.keypress
			 */
			keypress: function(evt) {
				var r = js.lang.Class.__inherited(this, arguments);
				if(r !== false) {
					if(evt.keyCode !== 13) {
						org.cavalion.comp.Component.setTimeout(this, "_keypressed", 0, arguments);
					} else {
						// Close popup when ENTER key is pressed
						this.closePopup();
					}
					if(evt.keyCode === 40 || evt.keyCode === 38) {
						//evt.preventDefault();
					}
				}
				return r;
			},

			/**
			 *
			 */
			keyup: function(evt) {
				var r = js.lang.Class.__inherited(this, arguments);
				if(r !== false) {
					if(evt.keyCode === 8 || evt.keyCode === 46) {
						// Backspace and Delete updates the filtering of the list
						org.cavalion.comp.Component.setTimeout(this, "_keypressed", 0, arguments);
					}
				}



				return r;
			},

			/**
			 * @overrides org.cavalion.comp.ui.Edit.prototype.blurred
			 */
			_blur: function() {
				js.lang.Class.__inherited(this, arguments);

				var ac = org.cavalion.comp.Control.getActiveControl();
				if(ac !== this && ac !== null) {
					if(this.isPopupActive()) {
						this._popup.close();
					}
				}
			},

			/**
			 * @overrides org.cavalion.comp.ui.Edit.prototype.reflectSourceValue
			 */
			_reflectSourceValue: function() {
				if(this._list !== null) {
					this._listIndex = this._list.indexOf(this.getKeyValue());
					this.setText(this.getItemDisplayValue(), true);
				} else {
					return js.lang.Class.__inherited(this, arguments);
				}
			},

			/**
			 * @overrides org.cavalion.comp.ui.Edit.prototype._updateSourceValue
			 */
			_updateSourceValue: function() {
			},

			/**
			 *
			 */
			itemclick: function(evt) {
				evt.itemIndex = this._getItemIndex(evt.target);
				if(org.cavalion.comp.Component.fire(this, "onItemClick", [evt]) !== false) {
					this._selectItem(evt.target, evt);
					this._popup.close();
					// call setFocus on this after this callstack is finished
					org.cavalion.comp.Component.setTimeout(this, "setFocus", 0);
				}
			},

			/**
			 *
			 */
			_keypressed: function(evt) {
				if(this._list !== null) {

					// Make sure all the necessary objects are available.
					this._ensurePopup();

					// Split the inputted text by space and hide all items which do not contain all of
					// resulting strings in their display value.
					var text = this._nodes.input.value.split(" ");
					var node = this._popup.getClientNode();
					var i, j, l, v, display, visibleCount = 0;

					for(i = 0, l = this._list.length; i < l; ++i, ++visibleCount) {
						v = this.getItemDisplayValue(i);
						display = "";
						if(text.length !== 1 || text[0] !== "") {
							for(j = 0; j < text.length && display === ""; ++j) {
								if(text[j] !== "" && v.indexOf(text[j]) === -1) {
									display = "none";
									visibleCount--;
								}
							}
						}
						node.childNodes[i].style.display = display;
					}

					// Do we have matches?
					if(visibleCount > 0) {
						// We do have matches, either activatePopup or updateSizeAndPos of the popup control
						if(this.isPopupActive() === false) {
							this.activatePopup();
						} else {
							this._popup.updateSizeAndPos("below-above", this);
						}
					} else {
						// No matches, close the popup
						this._popup.close();
					}
				}
			},

			/**
			 *
			 */
			_reflectList: function() {
				this._list = [];

				// FIXME Most probably want to reindex here...
				this._listIndex = -1;

				if(this._listSource !== null) {
					var s = this._listSource.getSize();
					if(s !== 0) {
						this._listSource.getObjects(0, s - 1);
						for(var i = 0; i < s; ++i) {
							this._list.push(this._listSource.getAttributeValue(this._listKey, i));
						}
					}
				}

				if(this._source !== null) {
					this._reflectSourceValue();
				}

				if(this.isPopupActive()) {
					this._populatePopup();
				} else {
					this._repopulatePopup = true;
				}
			},

			/**
			 *
			 */
			_getItemIndex: function(node) {
				var i = 0;
				while((node = node.previousSibling) !== null) {
					i++;
				}

				this.setListIndex(i);
			},

			/**
			 *
			 */
			_selectItem: function(node) {
				var i = 0;
				while((node = node.previousSibling) !== null) {
					i++;
				}

				this.setListIndex(i);
			},

			/**
			 *
			 */
			_navigateItem: function(delta) {
				this._ensurePopup();

				if(this._list.length === 0) {
					return;
				}

				// Get a reference to the currently selected item or the first or last item
				var parentNode = this._popup.getClientNode();
				var current = parentNode.childNodes[this._listIndex];
				if(current === undefined || current.style.display === "none") {
					if(delta > 0) {
						current = parentNode.firstChild;
					} else {
						current = parentNode.lastChild;
					}
				}

				var previous;

				// In which direction are we moving?
				var move = (delta > 0 ? "next" : "previous") + "Sibling";

				// Make delta positive
				delta = delta < 0 ? -delta : delta;

				// Keep moving until delta hits 0
				for(;delta > 0; delta--) {

					// Store current node
					previous = current;

					// Move 1
					current = current[move];

					// Keep in case the node is not visible, stop when the end of the direction is reached
					while(current !== null && current.style.display === "none") {
						current = current[move];
					}

					if(current === null) {
						// The end of the list of available nodes was reached, restore to previous and break out
						current = previous;
						delta = 0;
					}
				}

				// Only select in case the item is visible
				if(current.style.display !== "none") {
					this._selectItem(current);
					this.setFocus();
				}
			},

			/**
			 *
			 */
			_ensurePopup: function() {
				if(this._popup === null) {
					this._popup = new org.cavalion.comp.ui.ComboboxPopup(this);
					this._popup.setParentNode(document.body);
				}

				if(this._repopulatePopup === true) {
					this._populatePopup();
					this._repopulatePopup = false;
				}
			},

			/**
			 *
			 */
			_populatePopup: function() {
				var node = this._popup.getClientNode();
				var html = [];
				if(this._list !== null) {
					for(var i = 0, l = this._list.length; i < l; ++i) {
						html.push("<div class=\"item\">&nbsp;</div>");
					}
					node.innerHTML = html.join("");
					for(i = 0, l = this._list.length; i < l; ++i) {
						node.childNodes[i].childNodes[0].nodeValue = this.getItemDisplayValue(i);
					}
					this._refreshPopup();
				} else {
					node.innerHTML = "";
				}
			},

			/**
			 *
			 */
			_refreshPopup: function(showAll) {
				var node, n;
				if(this._list !== null) {
					node = this._popup.getClientNode();
					for(i = 0, l = this._list.length; i < l; ++i) {
						n = node.childNodes[i];

						// Clear the display property of the item nodes, in case showAll is true. In other words this
						// neglects the filter that has been applied by typing in text in the input field.
						if(showAll === true) {
							n.style.display = "";
						}
						if(this.isIndexSelected(i)) {
							js.dom.Element.addClass(n, "selected");
						} else {
							js.dom.Element.removeClass(n, "selected");
						}
					}
					//n = node.childNodes[this._listIndex];
					// Last parameter indicates a DOM node to scroll into view of the popup.
				}
			},

			/**
			 *
			 */
			isIndexSelected: function(index) {
				return this._listIndex === index;
			},

			/**
			 *
			 */
			getListIndex: function() {
				return this._listIndex;
			},

			/**
			 *
			 */
			setListIndex: function(value) {
				if(this._listIndex !== value) {
					this._listIndex = value;
					this._ensurePopup();
					this._refreshPopup();
					if(this._listSource !== null) {
						if(this._source !== null) {
							if(this._listIndex === -1) {
								this._source.setAttributeValue(this._sourceAttribute, this._nullValue);
							} else {
								this._source.setAttributeValue(this._sourceAttribute, this._listSource.getAttributeValue(this._listKey, this._listIndex));
							}
						} else {
							//this.setText(this._listSource.getAttributeValue(this._listKey, this._listIndex));
							this.setText(this.getItemDisplayValue(this._listIndex));
						}
					} else {
						if(this._source !== null) {
							if(this._list !== null) {
								var value = this._list[this._listIndex];
								if(this._listKey !== "") {
									value = js.get(this._listKey, value);
								}

								this._source.setAttributeValue(this._sourceAttribute, value);
							}
						} else {
							this.setText(this.getItemDisplayValue(this._listIndex));
						}
					}
				}
			},

			/**
			 *
			 */
			getKeyValue: function(listIndex) {
				var r;
				if(listIndex === undefined) {
					listIndex = this._listIndex;
				}
				if(this._source !== null) {
					r = this._source.isActive() ? this._source.getAttributeValue(this._sourceAttribute) : this._nullValue;
				} else if(this._list !== null) {
					if(listIndex !== -1) {
						r = this._list[listIndex];
						if(this._listKey !== "." && this._listKey !== "") {
							r = js.get(this._listKey, r);
						}
					} else {
						r = this._nullValue;
					}
				} else {
					r = this._text;
				}
				return r;
			},

			/**
			 *
			 */
			setKeyValue: function(value) {
				if(this._list !== null) {
					this.setListIndex(this._list.indexOf(value));
				}
			},

			/**
			 *
			 */
			getItemDisplayValue: function(listIndex) {
				var r;

				if(listIndex === undefined) {
					listIndex = this._listIndex;
				}

				if(listIndex !== -1) {
					if(this._listSource !== null) {
						r = this._listSource.getAttributeValue(this._listAttribute, listIndex);
					} else if(this._list !== null) {
						r = this._list[listIndex];
						if(this._listAttribute !== "") {
							r = js.get(this._listAttribute, r);
						} else {
							r = this._list[listIndex];
						}
					} else {
						r = this._nullValue;
					}

				} else {
					r = this._nullValue;
				}

				if(this._onItemGetDisplayValue !== null) {
					r = org.cavalion.comp.Component.fire(this, "onItemGetDisplayValue", [r]);
				}

				return r;
			},

			/**
			 *
			 */
			listSourceNotifyEvent: function(event, data) {
				if(event === org.cavalion.data.SourceEvent.activeChanged || event === org.cavalion.data.SourceEvent.changed) {
					this._reflectList();
				}
			},

			/**
			 *
			 */
			activatePopup: function(showAll) {
				//var node, n;

				this._ensurePopup();
				this._refreshPopup(showAll);
				this._popup.popup("below-above", this, undefined, undefined);//, n);
			},

			/**
			 *
			 */
			closePopup: function() {
				if(this.isPopupActive()) {
					this._popup.close();
				}
			},

			/**
			 *
			 */
			isPopupActive: function() {
				return this._popup !== null ? this._popup.isShowing() : false;
			},

			/**
			 *
			 */
			getListSource: function() {
				return this._listSource;
			},

			/**
			 *
			 */
			setListSource: function(value) {
				if(this._listSource !== value) {
					if(this._listSource !== null) {
						Function.disconnect(this._listSource, "notifyEvent", this, "listSourceNotifyEvent");
					}
					this._listSource = value;
					if(this._listSource !== null) {
						Function.connect(this._listSource, "notifyEvent", this, "listSourceNotifyEvent");
					}
					this.listSourceNotifyEvent(org.cavalion.data.SourceEvent.changed, {});
				}
			},

			/**
			 *
			 */
			getList: function() {
				return this._list;
			},

			/**
			 *
			 */
			getListP: function() {
				if(this._listSource === null) {
					return this._list || [];
				}
				return [];
			},

			/**
			 *
			 */
			setList: function(value) {
				this._list = value;
				if(this.isPopupActive()) {
					this._populatePopup();
				} else {
					this._repopulatePopup = true;
				}
			},

			/**
			 *
			 */
			getListAttribute: function() {
				return this._listAttribute;
			},

			/**
			 *
			 */
			setListAttribute: function(value) {
				if(this._listAttribute !== value) {
					this._listAttribute = value;
				}
			},

			/**
			 *
			 */
			getListKey: function() {
				return this._listKey;
			},

			/**
			 *
			 */
			setListKey: function(value) {
				if(this._listKey !== value) {
					this._listKey = value;
				}
			},

			/**
			 *
			 */
			getOnItemGetDisplayValue: function() {
				return this._onItemGetDisplayValue;
			},

			/**
			 *
			 */
			setOnItemGetDisplayValue: function(value) {
				this._onItemGetDisplayValue = value;
			},

			/**
			 *
			 */
			getOnItemClick: function() {
				return this._onItemClick;
			},

			/**
			 *
			 */
			setOnItemClick: function(value) {
				this._onItemClick = value;
			}

		},

		properties: {

			"listSource": {
				set: Function,
				type: org.cavalion.comp.Component
				//type: org.cavalion.data.Source
			},

			"listAttribute": {
				set: Function,
				type: js.lang.Type.STRING
			},

			"listKey": {
				set: Function,
				type: js.lang.Type.STRING
			},

			"list": {
				get: "getListP",
				type: js.lang.Type.ARRAY,
				def: []
			},

			"onItemGetDisplayValue": {
				type: js.lang.Type.FUNCTION
			},

			"onItemClick": {
				type: js.lang.Type.FUNCTION
			}


		}
	}));

});