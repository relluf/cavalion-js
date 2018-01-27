define(function(require) {

	var Element = require("js/defineClass");
	var Control = require("../Control");
	var Type = require("js/Type");
	var Method = require("js/Method");
	var SourceEvent = require("../../data/SourceEvent");

	return (Element = Element(require, {

		inherits: Control,

		prototype: {
			
			'@css': {
				"&.disabled": {
					"pointer-events": "none"
				}
			},

			/*- "dataawarity" */
			_source: null,

			/*- @overrides ../Control.prototype._executesAction */
			_executesAction: "onClick",

			/*- @overrides Control.prototype.getInnerHtml */
			getInnerHtml: function() {
				var tpl = this.inherited(arguments);
				if(this._source !== null) {
				    var escaping = false, open = false;
				    var fmt = "", value;
				    var values = [];

				    /**
				     *
				     */
				    function add(s) {
				        if (open === true) {
				            value += s;
				        } else {
				            fmt += s;
				        }
				    }

				    for (var i = 0, l = tpl.length; i < l; ++i) {
				        var ch = tpl.charAt(i);
				        if (escaping === true) {
				            add(ch);
				            escaping = false;
				        } else if (ch === "\\") {
				            escaping = true;
				        } else if (ch === "{" && open === false) {
				            open = true;
				            value = "";
				        } else if (ch === "}" && open === true) {
				            open = false;
				            value = value.split(":");
				            if (value[0].charAt(0) !== "%" || value.length !== 2) {
				                fmt += "%H";
				            } else {
				                fmt += value[0];
				            }
				            values.push(value.pop());
				        } else {
				            add(ch);
				        }
				    }

				    var designing = this.isDesigning();
				    var active = this._source !== null && this._source.isActive();
				    values.forEach(function(v, index) {
				    	if(designing === false) {
				    		if(active === true) {
				    			v = this._source.getAttributeValue(v);
					    		if(v === undefined || v === null) {
					    			v = "";
					    		}
				    		} else {
				    			v = "";
				    		}
				    		values[index] = v;
				    	} else {
				    		values[index] = String.format("{%H}", v);
				    	}
				    }, this);

				    tpl = String.format.apply(String, [fmt].concat(values));
				}
				return tpl;
			},

            /*- */
			setAttributes: function(value) {
				/*- Progressive: not holding on to attributes */
				var node = this.nodeNeeded();
				if(typeof value === "string") {
					value = js.str2obj(value);
				}
				for(var k in value) {
					node.setAttribute(k, value[k]);
				}
			},

			sourceNotifyEvent: function(event, data) {
				switch(event) {

					case SourceEvent.activeChanged:
					case SourceEvent.changed:
					case SourceEvent.updated:
						this.render();
						break;

					case SourceEvent.busyChanged:
						break;

					case SourceEvent.layoutChanged:
						break;
				}
			},

			sourceDestroyed: function() {
				this.setSource(null);
			},

			setSource: function(value) {
				if(this._source !== value) {
					if(this._source !== null) {
						Method.disconnect(this._source, "notifyEvent", this, "sourceNotifyEvent");
//						Method.disconnect(this._source, "destroy", this, "sourceDestroyed");
					}
					this._source = value;
					if(this._source !== null) {
						Method.connect(this._source, "notifyEvent", this, "sourceNotifyEvent");
//						Method.connect(this._source, "destroy", this, "sourceDestroyed", "before");
					}
					this.sourceNotifyEvent(SourceEvent.changed);
				}

			}
		},

		properties: {

            /*- */
			"attributes": {
				/*- This property is not stored (when not designing?) */
				stored: false,
				type: Type.OBJECT,
				get: null,
				set: Function
			}
		},

		statics: {
		}
	}));
});
