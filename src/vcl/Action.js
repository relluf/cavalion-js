define(function (require) {

    var Action = require("js/defineClass");
    var Action_Referenced = require("js/referenceClass!./Action");
    var Component = require("./Component");
    var Type = require("js/Type");
    var Method = require("js/Method");
    var Control = require("js/referenceClass!./Control");

    var HotkeyManager = require("../util/HotkeyManager");

    var ActionProperty = [true, false, "state", "notState", "parent", "leave"];
    var ActionState = [true, false, "parent"];

    return (Action = Action(require, {

        inherits: Component,

        prototype: {
            _onExecute: null,
            _onUpdate: null,
            _onChange: null,
            _onGetContent: null,

            _content: "",
            _checked: "leave",
            _enabled: true,
            _hint: "",
            _visible: true,
            _state: true,
            _selected: "leave",
            _stateIndex: -1,

            _hotkey: "",
            _hotkeyListeners: null,

            _parent: null,
            _parentExecute: false,
            
            destroy: function () {
	            /**
	             * @overrides ./Component.prototype.destroy
	             */
                this.setParent(null);
                this.inherited(arguments);
            },
            getRunningState: function () {
                if (this._state === "parent") {
                    return this._parent !== null ? 
                    		this._parent.getRunningState() : false;
                }
                return this._state;
            },
            updateStates: function () {
                var components = this._owner._components;
                if (components !== undefined) {
                    for (var i = 0; i < components.length; ++i) {
                        var action = components[i];
                        if (action instanceof Action && action !== this && 
                        		action._stateIndex === this._stateIndex) {
                            action.setState(false);
                        }
                    }
                }
            },
            execute: function (evt, sender) {
            	return this.onexecute(evt, sender);
            },
            onexecute: function(evt, sender) { 
            	if(evt) evt.sender = evt.sender || sender;
                if (this._parent !== null && this._parentExecute === true) {
                    return this._parent.execute(evt, sender);
                } else if (this._onExecute !== null) {
                    return this.fire("onExecute", arguments);
                }
            },
            update: function() {
            	this.fire("onUpdate", js.copy_args(arguments));	
            },
            toggleState: function () {
                this.setState(!this.getState());
                return this._state;
            },
            onchange: function (evt) {
                if (!this.isDesigning()) {
                    this.fire("onChange", arguments);
                }
            },
            isChecked: function () {
                switch (this._checked) {
                case "state":
                    return this.getRunningState();

                case "notState":
                    return !this.getRunningState();

                case "parent":
                    return this._parent !== null ? this._parent.isChecked() : false;

                default:
                    return this._checked;
                }
            },
            isEnabled: function () {
                switch (this._enabled) {
                case "state":
                    return this.getRunningState();

                case "notState":
                    return !this.getRunningState();

                case "parent":
                    return this._parent !== null ? this._parent.isEnabled() : false;

                default:
                    return this._enabled;
                }
                return false;
            },
            isVisible: function () {
                switch (this._visible) {
                case "state":
                    return this.getRunningState();

                case "notState":
                    return !this.getRunningState();

                case "parent":
                    return this._parent !== null ? this._parent.isVisible() : false;

                default:
                    return this._visible;
                }
                return false;
            },
            isSelected: function () {
                switch (this._selected) {
                case "state":
                    return this.getRunningState();

                case "notState":
                    return !this.getRunningState();

                case "parent":
                    return this._parent !== null ? this._parent.isSelected() : false;

                default:
                    return this._selected;
                }
            },
            isHotkeyEnabled: function() {
                if(this._owner instanceof Control) {
                    if(this._owner.isEnabled() === false || this._owner.isVisible() === false) {
                    	// console.log(this, "hotkey not enabled/visible");
                        return false;
                    }
                } else if(this._owner === null) {
                    return false;
                }

                return true;
            },
            parentChanged: function () {
                this.dispatch("change", {what:["parent"]});
            },
            parentDestroyed: function () {
                this.setParent(null);
            },
            getParent: function () {
                return this._parent;
            },
            setParent: function (value) {
                if (this._parent !== value) {

                    // FIXME need a hasParent()
                    if (value === this) {
                        throw new Error("Circular reference");
                    }

                    if (this._parent !== null) {
                        Method.disconnect(this._parent, "onchange", this, "parentChanged");
                        Method.disconnect(this._parent, "destroy", this, "parentDestroyed");
                    }
                    this._parent = value;
                    if (this._parent !== null) {
                        Method.connect(this._parent, "onchange", this, "parentChanged");
                        Method.connect(this._parent, "destroy", this, "parentDestroyed", "before");
                    }
                    this.dispatch("change", {what:["parent"]});
                }
            },
            getOnExecute: function () {
	            /**
	             * Returns the -onExecute- property.
	             */
                return this._onExecute;
            },
            setOnExecute: function (value) {
	            /**
	             * Sets the -onExecute- property.
	             */
                if (this._onExecute !== value) {
                    this._onExecute = value;
                    this.dispatch("change", {what:["onExecute"]});
                }
            },
            getOnUpdate: function () {
	            /**
	             * Returns the -onUpdate- property.
	             */
                return this._onUpdate;
            },
            setOnUpdate: function (value) {
	            /**
	             * Sets the -onUpdate- property.
	             */
                if (this._onUpdate !== value) {
                    this._onUpdate = value;
                    this.dispatch("change", {what:["onUpdate"]});
                }
            },
            getOnGetContent: function () {
	            /**
	             * Returns the -onGetContent- property.
	             */
                return this._onGetContent;
            },
            setOnGetContent: function (value) {
	            /**
	             * Sets the -onGetContent- property.
	             */
                if (this._onGetContent !== value) {
                    this._onGetContent = value;
                    this.dispatch("change", {what:["onGetContent"]});
                }
            },
            getContent: function (control) {
	            /**
	             * Returns the -content- property.
	             */
                if (this._onGetContent !== null) {
                    if (!this.isDesigning()) {
                        return this.fire("onGetContent", arguments);
                    }
                    return String.format("*%s", this._name);
                }
                return this._content;
            },
            setContent: function (value) {
	            /**
	             * Sets the -content- property.
	             */
                if (this._content !== value) {
                    this._content = value;
                    this.dispatch("change", {what:["content"]});
                }
            },
            getChecked: function () {
	            /**
	             * Returns the -checked- property.
	             */
                return this._checked;
            },
            setChecked: function (value) {
	            /**
	             * Sets the -checked- property.
	             */
                if (this._checked !== value) {
                    this._checked = value;
                    this.dispatch("change", {what:["checked"]});
                }
            },
            getEnabled: function () {
	            /**
	             * Returns the -enabled- property.
	             */
                return this._enabled;
            },
            setEnabled: function (value) {
	            /**
	             * Sets the -enabled- property.
	             */
                if (this._enabled !== value) {
                    this._enabled = value;
                    this.dispatch("change", {what:["enabled"]});
                }
            },
            getHint: function () {
	            /**
	             * Returns the -hint- property.
	             */
                return this._hint;
            },
            setHint: function (value) {
	            /**
	             * Sets the -hint- property.
	             */
                if (this._hint !== value) {
                    this._hint = value;
                    this.dispatch("change", {what:["hint"]});
                }
            },
            getHotkey: function () {
	            /**
	             * Returns the -hotkey-property.
	             */
                return this._hotkey;
            },
            setHotkey: function (value) {
	            /**
	             * Sets the -hotkey-property.
	             */
                if (this._hotkey !== value) {
                    this._hotkey = value;

                    if (this.hasOwnProperty("_hotkeyListeners")) {
                        this._hotkeyListeners.forEach(function (listener) {
                            HotkeyManager.unregister(listener);
                        });
                    }

                    var me = this;
                    var arr = this._hotkey.split("|");

                    this._hotkeyListeners = [];

                    arr.forEach(function(hotkey, type) {
                        hotkey = String.trim(hotkey).split(":");
                        type = hotkey.length === 1 ? "keydown" : hotkey.shift();
                        hotkey = hotkey.shift();

                        this._hotkeyListeners.push(HotkeyManager.register(hotkey, {
                            type: type,
                            isEnabled: function() {
                                return me.isHotkeyEnabled();
                            },
                            callback: function (evt, type) {
                                if (this.type.indexOf(type) !== -1) {
                                    if (value !== "*") {
                                        evt.preventDefault(); // FIXME property?
                                    }
                                    me.execute(evt);
                                }
                            }
                        }));
                    }, this);
                }
            },
            getVisible: function () {
	            /**
	             * Returns the -visible- property.
	             */
                return this._visible;
            },
            setVisible: function (value) {
	            /**
	             * Sets the -visible- property.
	             */
                if (this._visible !== value) {
                    this._visible = value;
                    this.dispatch("change", {what:["visible"]});
                }
            },
            getSelected: function () {
	            /**
	             * Returns the -selected- property.
	             */
                return this._selected;
            },
            setSelected: function (value) {
	            /**
	             * Sets the -selected- property.
	             */
                if (this._selected !== value) {
                    this._selected = value;
                    this.dispatch("change", {what:["selected"]});
                }
            },
            getState: function () {
	            /**
	             * Returns the -state- property.
	             */
                return this._state;
            },
            setState: function (value) {
	            /**
	             * Sets the -state- property.
	             */
                if (this._state !== value) {
                    this._state = value;
                    this.dispatch("change", {what:["state"]});
                    if (this._state === true && this._stateIndex !== -1) {
                        this.updateStates();
                    }
                }
            },
            getStateIndex: function () {
	            /**
	             * Returns the -stateIndex- property.
	             */
                return this._stateIndex;
            },
            setStateIndex: function (value) {
	            /**
	             * Sets the -stateIndex- property.
	             */
                if (this._stateIndex !== value) {
                    this._stateIndex = value;
                    this.dispatch("change", {what:["stateIndex"]});
                    if (this._stateIndex !== -1 && !this.isLoading() && this._state === true && this._owner !== null) {
                        this.updateStates();
                    }
                }
            },
            getParentExecute: function () {
	            /**
	             * Returns the -parentParentExecute- property.
	             */
                return this._parentExecute;
            },
            setParentExecute: function (value) {
	            /**
	             * Sets the -parentParentExecute- property.
	             */
                if (this._parentExecute !== value) {
                    this._parentExecute = value;
                }
            },
            getOnChange: function () {
                return this._onChange;
            },
            setOnChange: function (value) {
                if (this._onChange !== value) {
                    this._onChange = value;
                }
            }
        },

        properties: {
            "content": {
                type: Type.STRING,
                set: Function
            },
            "checked": {
                type: ActionProperty,
                set: Function
            },
            "hint": {
                type: Type.STRING,
                set: Function
            },
            "enabled": {
                set: Function,
                type: ActionProperty
            },
            "visible": {
                set: Function,
                type: ActionProperty
            },
            "state": {
                set: Function,
                type: ActionState
            },
            "selected": {
                set: Function,
                type: ActionProperty
            },
            "parent": {
                set: Function,
                type: Action_Referenced
            },
            "parentExecute": {
                type: Type.BOOLEAN,
                set: Function
            },
            "hotkey": {
                type: Type.STRING,
                get: Function,
                set: Function
            },
            "onExecute": {
                type: Type.EVENT,
                set: Function
            },
            "onUpdate": {
                type: Type.EVENT,
                set: Function
            }
        }
    }));
});
