define(function(require) {

	var Form = require("js/defineClass");
	var Type = require("js/Type");
	var Panel = require("./Panel");
	var Control = require("../Control");

	return (Form = Form(require, {
		inherits: Panel,
		prototype: {
			"@css": {
				//"div": "margin-top: 100px;"
			},

			_align: "client",
			_activeControl: null,
			_caption: "",
			_activated: false,

			_onShow: null,
			_onHide: null,
			_onCloseQuery: null,
			_onClose: null,
			_onActivate: null,
			_onDeactivate: null,
			_onSubmit: null,
			_onReflectHash: null,
			
			onshow: function() {
				/** s ../Control.prototype.onshow */
				if(this.fire("onShow", arguments) !== false) {
				    var me = this;
				    (function() {
    					if(me._activeControl !== null) {
    					    if(me._activeControl.isShowing()) {
    					        me._activeControl.setFocused(true);
    					    } else {
        						me.setTimeout("focus:activeControl",
        						        arguments.callee, 500);
    					    }
    					}
				    }());
				}
			},
			onhide: function() {
				/** s ../Control.prototype.onhide */
				if(this.fire("onHide", arguments) !== false) {
				}
			},
			visibleChanged: function() {
				/** s ../Control.prototype.visibleChanged */
				var r = this.inherited(arguments);

				if(this.isVisible()) {
					if(this._activated === false) {
						this._activated = true;
						this.dispatch("activate");
					}
				} else {
					if(this._activated === true) {
						this._activated = false;
						this.dispatch("deactivate");
					}
				}

				return r;
			},
	        setFocus: function () {
	            /** @overrides ../Control.prototype.setFocus */
                if(this._activeControl) {
                    this._activeControl.setFocus.apply(this._activeControl, arguments);
                }
            },
			close: function() {
				if(this.dispatch("closequery") !== false) {
					this.setVisible(false);
					this.dispatch("close");
				}
			},
			onactivate: function() {
				return this.fire("onActivate", arguments);
			},
			ondeactivate: function() {
				return this.fire("onDeactivate", arguments);
			},
			oncaptionchanged: function() {
				return this.fire("onCaptionChanged", arguments);
			},
			onclosequery: function() {
				return this.fire("onCloseQuery", arguments);
			},
			onclose: function() {
				return this.fire("onClose", arguments);
			},
			getActiveControl: function() {
				return this._activeControl;
			},
			setActiveControl: function(value) {
				this._activeControl = value;
			},
			getCaption: function() {
                return this._caption;
			},
			setCaption: function(value) {
                if(this._caption !== value) {
                    this._caption = value;
					this.dispatch("captionchanged", value);
                }
			}

		},
		properties: {
			"activeControl": {
				type: Control,
				set: Function
			},
			"caption": {
                type: Type.STRING,
                set: Function
			},
			"onReflectHash": {
				type: Type.EVENT
			},
			"onCaptionChanged": {
				type: Type.EVENT
			},
			"onShow": {
				type: Type.EVENT
			},
			"onHide": {
				type: Type.EVENT
			},
			"onClose": {
				type: Type.EVENT
			},
			"onCloseQuery": {
				type: Type.EVENT
			},
			"onActivate": {
				type: Type.EVENT
			},
			"onDeactivate": {
				type: Type.EVENT
			},
			"onSubmit": {
				type: Type.EVENT
			}
		},
		statics: {
			cache: function(form) {
				form.setParent(null);
				form.setOwner(null);
				form.setVisible(true);
				//org.cavalion.comp.Component.cache(form);
			}
		}
	}));
});