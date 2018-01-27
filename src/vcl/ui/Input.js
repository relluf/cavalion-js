define(function(require) {

	var Input = require("js/defineClass");
	var Type = require("js/Type");
	var Method = require("js/Method");

	var SourceEvent = require("../../data/SourceEvent");

	var Element = require("./Element");
	var EventDispatcher = require("../EventDispatcher");
	var Component = require("../Component");

	var InputTypes = ["text", "password", "tel", "search", "url", "email", "datetime", "date",
	                 "month", "year", "week", "time", "datetime-local", "number",
	                 "range", "color"];

	return (Input = Input(require, {
		inherits: Element,
		prototype: {

			'@css': {},

			_element: "input",
			_type: "",
			_placeholder: "",
			_value: "",

			_detectChangeTimeout: 50,
			_onChange: null,

			_source: null,
			_sourceAttribute: "",

			initializeNodes: function() {
				/**
				 * @overrides ../Control.prototype.initializeNodes
				 */
				this.inherited(arguments);

				var input = this._nodes.input;
				if(input === undefined) {
					input = (this._nodes.input = this._node);
				}

				if(this.hasOwnProperty("_placeholder")) {
					input.placeholder = this._placeholder;
				}

				if(this.hasOwnProperty("_type")) {
					try {
						input.type = this._type;
					} catch(e) {
						console.error("Input.type = " + this._type, e);
					}
				}

				if(this._name !== "") {
					input.name = this._name;
				}

				["cut", "paste", "change"].forEach(function(e) {
					var k = "on" + e;
					if(input[k] === null) {
						input[k] = EventDispatcher.handleEvent;
					}
				}, this);
			},
			onnodecreated: function() {
				/**
				 * @overrides ../Control.prototype.onnodecreated
				 */
				this.inherited(arguments);
			},
			setFocus: function(select) {
				/**
				 * @overrides ../Control.prototype.setFocus
				 */
				this.nodeNeeded();
				if(this.isShowing()) {
					this._node.select(select);
				} else {
					var me = this;
					this.update(function() {
						me._node && me._node.select(select);
					});
				}
			},
			oncut: function() {
				this.checkChange();
			},
			oncopy: function() {
				this.checkChange();
			},
			onchange: function() {
				this.checkChange();
			},
			onrealchange: function() {
				return this.fire("onChange", arguments);
			},
			onkeydown: function(evt) {
				/**
				 * @overrides ../Control.prototype.onkeydown
				 */
				if([9, 13, 27].indexOf(evt.keyCode) === -1) {
					this.checkChange();
				}
				return this.inherited(arguments);
			},
			onkeyup: function(evt) {
				/**
				 * @overrides ../Control.prototype.onkeyup
				 */
				if([9, 13, 27].indexOf(evt.keyCode) === -1) {
					this.checkChange();
				}
				return this.inherited(arguments);
			},
			onkeypress: function(evt) {
				/**
				 * @overrides ../Control.prototype.onkeypress
				 */
				this.checkChange();

				if(evt.keyCode === 13 && this._executesAction === "onEnterPressed") {
					this._action.execute.apply(this._action,
							[this].concat(js.copy_args(arguments)));
				}
				return this.inherited(arguments);
			},
			checkChange: function() {
				if(this._nodes.input.readOnly === true) {
					return;
				}
				var me = this, source = this._source, 
					attribute = this._sourceAttribute;
					
				this.setTimeout("checkChange", function() {
					var currentValue = me.toInputValue(me._value);
					var value = me.getInputValue();
					
					if(source !== null && attribute !== "") {
						source.setAttributeValue(attribute, me.fromInputValue(value));
					} else if(currentValue !== value) { /* comparing strings */
						me.dispatch("realchange", {oldValue: me._value, newValue: value});
						me._value = me.fromInputValue(value);
					}
				}, this._detectChangeTimeout);
			},
			// equalsValue: function(value) {
			// 	if(this._value === null && value !== null) {
			// 		return false;
			// 	}
			// 	if(value === null && this._value !== null) {
			// 		return false;
			// 	}
			// 	if(this._type === "date") {
			// 		return this._value.getTime() === value.getTime();
			// 	}
				
			// 	return this._value === value;
			// },
			render: function() {
				var value;
				if(this._source === null || this._sourceAttribute === "") {
					value = this._value;
				} else {
					value = this._source.getAttributeValue(this._sourceAttribute);
				}
				this.setInputValue(this.toInputValue(value));
			},
			sourceNotifyEvent: function(event, data) {
				switch(event) {

					case SourceEvent.activeChanged:
						this.setState("invalidated", true);
						//this.setReadonly(this._source.getSize() === 0);
						break;

					case SourceEvent.changed:
						this.setState("invalidated", true);
						break;

					case SourceEvent.busyChanged:
						break;

					case SourceEvent.updated:
						this.setState("invalidated", true);
						break;

					case SourceEvent.layoutChanged:
						break;

					case SourceEvent.attributesChanged:
						if(data.hasOwnProperty(this._sourceAttribute)) {
							this.setState("invalidated", true);
						}
						break;
				}
			},
			sourceDestroyed: function() {
				this.setSource(null);
			},
			getSource: function() {
				return this._source;
			},
			setSource: function(value) {
				if(this._source !== value) {
					if(this._source !== null) {
						Method.disconnect(this._source, "notifyEvent", this, "sourceNotifyEvent");
						Method.disconnect(this._source, "destroy", this, "sourceDestroyed");
					}
					this._source = value;
					if(this._source !== null) {
						Method.connect(this._source, "notifyEvent", this, "sourceNotifyEvent");
						Method.connect(this._source, "destroy", this, "sourceDestroyed", "before");
					}
					this.setState("invalidated", true);
				}
			},
			getSourceAttribute: function() {
				return this._sourceAttribute;
			},
			setSourceAttribute: function(value) {
				if(this._sourceAttribute !== value) {
					this._sourceAttribute = value;
					this.setState("invalidated", true);
				}
			},
			getType: function() {
				/**
				 *
				 * @returns {String}
				 */
				return this._type;
			},
			setType: function(value) {
				/**
				 *
				 * @param value {String} InputType
				 */
				if(this._type !== value) {
					this._type = value;
					this._value = this.fromInputValue(this.toInputValue(this._value));
					this.recreateNode();
				}
			},
			toInputValue: function(value) {
				if(value === null || value === undefined) {
					return "";
				} else if(this._type === "date" && value instanceof Date) {
					return String.format("%4d-%02d-%02d", 
						value.getFullYear(), value.getMonth() + 1, 
						value.getDate());
				}
				return value.toString();
			},
			fromInputValue: function(value) {
				if(this._type === "date" && typeof value === "string") {
					if((value = value.split("-")).length === 3) {
						return new Date(parseInt(value[0], 10), 
							parseInt(value[1], 10) - 1, 
							parseInt(value[2], 10));
					}
					return null;
				}
				return value;
			},
			getInputValue: function() {
				// console.debug("is this method really needed?");
				this.nodeNeeded();
				return this._nodes.input.value;
			},
			setInputValue: function(value) {
				// console.debug("is this method really needed?");
				this.nodeNeeded();
				this._nodes.input.value = value;
				this.checkChange();
			},
			hasValue: function() {
				return !!this._value;	
			},
			getValue: function() {
				return this._value;
			},
			setValue: function(value, oldValue) {
				value = this.toInputValue(value);
				if((oldValue = this.toInputValue(this._value)) !== value) {
					this._value = this.fromInputValue(value);
					this.setState("invalidated", true);
					this.dispatch("realchange", {oldValue: oldValue, newValue: value});
				}
			},
			getPlaceholder: function() {
				return this._placeholder;
			},
			setPlaceholder: function(value) {
				if(this._placeholder !== value) {
					this._placeholder = value;
					if(this._node) {
						this._node.placeholder = value;
					}
				}
			}

		},
		properties: {
			"executesAction": {
				/** @overrides ../Element.properties.executesAction */
				type: ["No", "onClick", "onEnterPressed"]
			},
			"detectChangeTimeout": {
				type: Type.INTEGER
			},
			"type": {
				type: InputTypes,
				set: Function
			},
			"placeholder": {
				type: Type.STRING,
				set: Function
			},
			"onChange": {
				type: Type.EVENT
			},
			"value": {
				type: Type.STRING,
				set: Function
			},
			"source": {
				set: Function,
				type: Component
			},
			"sourceAttribute": {
				type: Type.STRING,
				set: Function
			}
		}
	}));
});
