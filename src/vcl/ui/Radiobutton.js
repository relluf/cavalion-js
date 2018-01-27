define(function(require) {

	var Radiobutton = require("js/defineClass");
	var Input = require("./Input");
	var Type = require("js/Type");

	return (Radiobutton = Radiobutton(require, {

		inherits: Input,

		prototype: {

			'@css': {
				display: "inline-block",
				label: "position: relative; top: -2px;"
			},

			_element: "div",
			_content: "<input type='radio'><label for=''></label>",
			_checked: false,

			_label: "",

			/**
			 *
			 */
			getLabel: function() {
				return this._label;
			},

			/**
			 *
			 */
			setLabel: function(value) {
				if(this._label !== value) {
					this._label = value;
					this.setState("invalidated");
				}
			},

			/**
			 *
			 */
			getChecked: function() {
				return this._checked;
			},

			/**
			 *
			 */
			setChecked: function(value) {
				if(this._checked !== value) {
					this._checked = value;
					this.setState("invalidated");
				}
			},

			/**
			 *
			 */
			isChecked: function() {
				return this.getInputValue();
			},

			/**
			 * @see ../Control.prototype.initializeNodes
			 */
			initializeNodes: function() {
				this.inherited(arguments);

				this._nodes.input = this._node.querySelector("input");
				this._nodes.label = this._node.querySelector("label");

				this._nodes.label.setAttribute("for",
					this.setNodeId(this._nodes.input, "input"));
			},

			/**
			 * @see ../Control.prototype.render
			 */
			render: function() {
				this._nodes.input.checked = this._checked;
				this._nodes.label.innerHTML = this._label;
			},

			/**
			 * @see ../Control.prototype.getInputValue
			 */
			getInputValue: function() {
				this.nodeNeeded();
				return this._nodes.input.checked;
			},

			/**
			 * @see ../Control.prototype.setInputValue
			 */
			setInputValue: function(value) {
				this.nodeNeeded();
				this._nodes.input.value = value === true;
			}

		},

		properties: {

			checked: {
				type: Type.BOOLEAN,
				set: Function
			},
			label: {
				type: Type.STRING,
				set: Function
			}
		}


	}));
});