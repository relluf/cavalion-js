define(["require", "js/defineClass", "ace/ace", "./Panel", "js/Type"], function(require, Ace, ace, Panel, Type) {
    
    // Automatically scrolling cursor into view after selection change this will be disabled in the next version set editor.$blockScrolling = Infinity to disable this message

	return (Ace = Ace(require, {

		inherits: Panel,

		prototype: {

			"@css": {
				"background-color": "white",
				"z-index": "200",
				">div": "position: absolute; top: 0; left: 0; bottom: 0; right: 0;"
			},

			_align: "client",
			_editor: null,
			_content: "<div></div>",

			_cursorPos: null,

			applyBounds: function() {
				/**
				 * @overrides ./Panel.prototype.applyBounds
				 */
				this.inherited(arguments);
				this._editor.resize();
			},
			onnodecreated: function() {
				/**
				 * @overrides ../Control.prototype.onnodecreated
				 */
				var me = this;
				
				this._editor = ace.edit(this._node.childNodes[0]);
				this._editor.$blockScrolling = Infinity;
				
				this._editor.setOption("useSoftTabs", false);
				
				this._editor.on("change", function(e) {
				    me.dispatch("change", e);    
			    });
				
				return this.inherited(arguments);
			},
			setFocus: function() {
				/**
				 * @overrides ../Control.prototype.setFocus
				 */
				this.nodeNeeded();
				this._editor.focus();
			},
			onchange: function() {
				/**
				 *
				 */
				return this.fire("onChange", arguments);
			},
			getEditor: function() {
				/**
				 *
				 * @returns
				 */
				this.nodeNeeded();
				return this._editor;
			},
			getValue: function() {
				this.nodeNeeded();
				return this._editor.session.getValue();
			},
			setValue: function(value) {
				this.nodeNeeded();
				return this._editor.session.setValue(value);
			},
			setMode: function (mode) {
				this.getEditor().session.setMode("ace/mode/" + mode);
			}
		}, 
		properties: {

// 			/** @overrides ../Element.properties.executesAction */
// 			"executesAction": {
// 				type: ["No", "onClick", "onEnterPressed"]
// 			},

// 			"detectChangeTimeout": {
// 				type: Type.INTEGER
// 			},
// 			"type": {
// 				type: InputTypes,
// 				set: Function
// 			},
// 			"placeholder": {
// 				type: Type.STRING,
// 				set: Function
// 			},
			"onChange": {
				type: Type.EVENT
			},

// 			"value": {
// 				type: Type.STRING,
// 				set: Function
// 			},

// 			"source": {
// 				set: Function,
// 				type: Component
// 			},

// 			"sourceAttribute": {
// 				type: Type.STRING,
// 				set: Function
// 			},

			"mode": {
				type: Type.STRING,
				set: Function
			}

		}
	}));
});