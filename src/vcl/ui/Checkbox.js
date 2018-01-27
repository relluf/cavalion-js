define(function(require) {

	var Checkbox = require("js/defineClass");
	var Input = require("./Input");
	var Type = require("js/Type");

	return (Checkbox = Checkbox(require, {

		inherits: Input,

		prototype: {
			'@css': {
				display: "inline-block"
			},

			_element: "div",
			_content: "<input type='checkbox'><label for=''></label>",
			_checked: false,
			_label: "",
			
			getLabel: function() {
				return this._label;
			},
			setLabel: function(value) {
				if(this._label !== value) {
					this._label = value;
					this.setState("invalidated");
				}
			},
			getChecked: function() {
				return this._checked;
			},
			setChecked: function(value) {
				if(this._checked !== value) {
					this._checked = value;
					this.setState("invalidated");
				}
			},
			isChecked: function() {
				return this.getInputValue();
			},

            // dispatch: function (name, evt) {
            // 	/** @override ../Component.prototype.dispatch */
            // 	evt = evt || {};
            // 	console.log(name, evt.target === this._nodes.input, 
            // 			evt.target === this._nodes.input, this._nodes);
            // 	return this.inherited(arguments);
            // },
			initializeNodes: function() {
				/** @override ../Control.prototype.initializeNodes */
				this.inherited(arguments);

				this._nodes.input = this._node.querySelector("input");
				this._nodes.label = this._node.querySelector("label");

				this._nodes.label.setAttribute("for",
					this.setNodeId(this._nodes.input, "input"));
			},
			render: function() { /** @override ../Control.prototype.render */
				this._nodes.input.checked = this._checked;
				this._nodes.label.innerHTML = this._label;
			},

			getInputValue: function() {
				/** @override ./Input.prototype.getInputValue */
				this.nodeNeeded();
				return this._nodes.input.checked;
			},
			setInputValue: function(value) {
				/** @override ./Input.prototype.setInputValue */
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