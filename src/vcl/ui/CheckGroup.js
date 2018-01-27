define(function(require) {

	var CheckGroup = require("js/defineClass");
	var Type = require("js/Type");
	var Group = require("./Group");
	var EventDispatcher = require("../EventDispatcher");

	return (CheckGroup = CheckGroup(require, {

		inherits: Group,

		prototype: {

			'@css': {
                "list-style-type": "none",
                "white-space": "nowrap",
				">input": {
					display: "inline-block"
				},
				">.text": {
					display: "inline-block",
					position: "relative",
					// top: "-3px"
				},
				">.container": {
					display: "none",
					"padding-left": "16px"
				},
				"&.expanded": {
					">.container": {
						display: "block"
					}
				}
			},

			/**
			 * @overrides ../Control.prototype
			 */
			_content:
						"<input type='checkbox'>" +
						"<label class='text'></label>" +
						"<div class='container'></div>" +
						"",

//			_element: "li",

			_text: "",
			_expanded: false,

			_onCollapse: null,
			_onCollapsed: null,
			_onExpand: null,
			_onExpanded: null,

			/**
			 * @overrides ../Control.prototype.initializeNodes
			 */
			initializeNodes: function() {
				this.inherited(arguments);

				this._nodes.checkbox = this.getChildNode(0);
				this._nodes.checkbox.onchange = EventDispatcher.handleEvent;

				this._nodes.text = this.getChildNode(1);
				this._nodes.text.setAttribute("for",
						this.setNodeId(this._nodes.checkbox, "checkbox"));

				this._nodes.container = this.getChildNode(2);

				if(!this._nodes.text) {
					throw new Error("No text node");
				}

				if(!this._nodes.container) {
					throw new Error("No container node");
				}

				if(!this._nodes.checkbox) {
					throw new Error("No checkbox node");
				}
			},

			/**
			 * @overrides ../Control.prototype.update
			 */
			update: function() {
				var r = this.inherited(arguments);
				if(this.hasOwnProperty("_node")) {
					this._nodes.checkbox.checked = this._expanded;
				}
				return r;
			},

			/**
			 * @overrides ../Control.prototype.render
			 */
			render: function() {
				this._nodes.text.innerHTML = this._text;
				this._nodes.checkbox.checked = this._expanded;
			},

			/**
			 * @overrides ../Control.prototype.isExpanded
			 */
			isExpanded: function() {
				return this._expanded;
			},

			/**
			 * @overrides ../Control.prototype.isControlVisible
			 */
			isControlVisible: function(control) {
				return this._expanded === true && this.inherited(arguments);
			},

			/**
			 * @overrides ../Control.prototype.isContainerShowing
			 */
			isContainerShowing: function() {
				return this.isExpanded();
			},

			/**
			 * @overrides ../Control.prototype.getClientNode
			 */
			getClientNode: function() {
				if(this._node === null) {
					this._nodeNeeded();
				}
				return this._nodes.container;
			},

			/**
			 *
			 */
			textChanged: function(newValue, oldValue) {
				if(this.hasOwnProperty("_node")) {
					this.render();
				}
			},

			/**
			 *
			 */
			onchange: function(evt) {
				if(this._expanded !== this.getNode("checkbox").checked) {
					if(this._expanded === true) {
						this.dispatch("collapse", evt);
					} else {
						this.dispatch("expand", evt);
					}
					this.update();
				}
			},

			/**
			 *
			 */
			onexpand: function(evt) {
				if(this._onExpand !== null) {
					this._expanded = this._onExpand.apply(this, [evt]) !== false;
				} else {
					this._expanded = true;
				}

				if(this._expanded === true) {
					var me = this;
					this.update(function() {
						if(me._controls && me._controls[0] && me._controls[0].setFocus) {
							me._controls[0].setFocus();
						}
					});
				}

				return this._expanded;
			},

			/**
			 *
			 */
			oncollapse: function(evt) {
				if(this._onCollapse !== null) {
					this._expanded = !(this._onCollapse.apply(this, [evt]) !== false);
				} else {
					this._expanded = false;
				}

				if(this._expanded === false) {
					this.update();
				}
				return this._expanded;
			},

			/**
			 *
			 */
			getText: function() {
				if(this.isDesigning()) {
					return this._text || this._name;
				}
				return this._text;
			},

			/**
			 *
			 */
			setText: function(value) {
				if(this._text !== value) {
					value = [value, this._text];
					this._text = value[0];
					this.textChanged(this._text, value[1]);
				}
			},

			/**
			 *
			 */
			getExpanded: function() {
				return this._expanded;
			},

			/**
			 *
			 */
			setExpanded: function(value) {
				if(this._expanded !== value) {
					if(this.isExpandable() && this._node !== null && this.isLoading() === false) {
						if(this._expanded === true) {
							this.dispatch("collapse");
						} else if(this._expanded == false) {
							this.dispatch("expand");
						}
					} else {//if(value === true && this.isExpandable()) {
						this._expanded = value;
					}
				}
			},

			/**
			 *
			 */
			isExpandable: function() {
				return this._expandable === "auto" ?
						this.hasOwnProperty("_controls") && this._controls.length > 0 : this._expandable;
			},

			/**
			 *
			 */
			getOnCollapse: function() {
				return this._onCollapse;
			},

			/**
			 *
			 */
			setOnCollapse: function(value) {
				this._onCollapse = value;
			},

			/**
			 *
			 */
			getOnExpand: function() {
				return this._onExpand;
			},

			/**
			 *
			 */
			setOnExpand: function(value) {
				this._onExpand = value;
			},

			/**
			 *
			 */
			getOnCollapsed: function() {
				return this._onCollapsed;
			},

			/**
			 *
			 */
			setOnCollapsed: function(value) {
				this._onCollapsed = value;
			},

			/**
			 *
			 */
			getOnExpanded: function() {
				return this._onExpanded;
			},

			/**
			 *
			 */
			setOnExpanded: function(value) {
				this._onExpanded = value;
			}
		},

		properties: {
			"text": {
				set: Function,
				type: Type.STRING
			},
			"caption": {
				set: "setText",
				get: "getText",
				type: Type.STRING
			},
			"expanded": {
				set: Function,
				type: Type.BOOLEAN
			},
			"onCollapse": {
				set: Function,
				type: Type.EVENT
			},
			"onCollapsed": {
				set: Function,
				type: Type.EVENT
			},
			"onExpand": {
				set: Function,
				type: Type.EVENT
			},
			"onExpanded": {
				set: Function,
				type: Type.EVENT
			}
		}

	}));

});
