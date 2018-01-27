$(["ui/forms/Home"], {

	'@require': ["vcl/ui/Input"],

	vars: {
		getCaption: function(instance) {
			return instance.toString();
		}
	},

	css: {
	    "> .{./Panel} > [id$=-client_editors]": {
			"padding-top": "8px",
			"padding-left": "16px",
			">.{./Group}": {
				">:not(.header)": {
					"margin-left": "16px"
				},
				">.{./Element}": {
					"&.header": {
						"font-weight": "bold",
						"margin-bottom": "5px"
					}
				},
				">select": {
					"font-size": "10pt",
					"margin-bottom": "10px"
				},
				">.{./Input}": {
					"font-family": "arial, helvetica",
					"font-size": "12pt",
					"padding": "2px",
					"margin-bottom": "10px",
					"&:not(.readonly)": {
						//"background-color": "#fffffe"
					},
					"&.readonly": {
						"background-color": "#f0f0f0"
					}
				}
			}
	    }
	},

	onLoad: function() {
		if(this._activeControl === null) {
			var Control = require("vcl/Control");

			var scope = this.getScope();
			var editors = scope.client_editors;
			// FIXME need querySelector for Components
			var input = editors.getNode().querySelector("input");
			if(input && (input = Control.findByNode(input[0]))) {
				this.setActiveControl(input);
			}

		}
		return this.inherited(arguments);
	},

	onRender: function() {
		var scope = this.getScope();
		var instance = scope.instance.getInstance();
		if(instance) {
			var caption = this.applyVar("getCaption", [instance]);
			if(instance.isDirty()) {
				caption = String.format("⋆%s", caption);
			}
			this.setCaption(caption);
		}
	},

	onMessage: function(name, message, sender) {
		//alert(name);
	},

	onReceiveParams: function(params) {
		this.getScope().instance.setInstance(params.instance || null);
		return this.inherited(arguments);
	}

}, [

    $("vcl/entities/Instance", "instance", {
    	onNotifyEvent: function(event, data) {
    		var scope = this.getScope();

    		scope.refresh.setEnabled(this._instance.isManaged());

    		if(event === "busyChanged") {
    			scope.busy.setState(data);
    		} else if(event === "dirtyChanged") {
    			scope.dirty.setState(data);
    		}
			this._owner.render();
    	}
    }),

	$i("menubar", {
		visible: "always",
		action: "busy",
		state: false
	}, [
        $("vcl/ui/Button", {
            action: "commit"
        }),
        $("vcl/ui/Button", {
            action: "revert"
        }),
        $("vcl/ui/Button", "button_refresh", {
            action: "refresh"
        }),
        $("vcl/ui/Button", {
            action: "remove"
        })
	]),

	$i("client", {}, [
	    $("vcl/ui/Panel", "client_editors", {
	    	align: "client"
	    })
	]),

	$("vcl/Action", "busy", {
		enabled: "notState",
		visible: "state",
		state: false
	}),

	$("vcl/Action", "dirty", {
		enabled: "state",
		state: false
	}),

    $("vcl/Action", "commit", {
        content: "Save",
        enabled: "parent",
        parent: "dirty",
        left: 352,
        onExecute: function () {
            var scope = this.getScope();
            scope.instance.commit().addCallback(function(res) {
            	scope['@owner'].close();
            });
        },
        top: 192
    }),
    $("vcl/Action", "revert", {
        content: "Revert",
        enabled: "parent",
        parent: "dirty",
        left: 352,
        onExecute: function () {
            var scope = this.getScope();
            scope.instance.revert();
        },
        top: 232
    }),
    $("vcl/Action", "remove", {
        content: "Delete",
        enabled: true,
        left: 352,
        onExecute: function () {
            var scope = this.getScope();
            scope.instance.remove().addCallback(function () {
                scope.close_form.execute();
            });
        },
        top: 272
    }),
    $("vcl/Action", "refresh", {
        content: "Refresh",
        enabled: true,
        left: 352,
        onExecute: function () {
            var scope = this.getScope();

            function refresh() {
            	scope.instance.refresh();
            }

            if(scope.instance.isDirty()) {
            	this.getApp().confirm("Loose changes?", function(res) {
            		if(res === true) {
            			scope.instance.revert();
            		}
            		refresh();
            	});
            } else {
            	refresh();
            }

        },
        top: 312
    })


]);