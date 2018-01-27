"../util/Fullscreen, vcl/ui/Element, vcl/ui/FormContainer";

// var Fullscreen = require("../../util/Fullscreen");
// var Element = require("vcl/ui/Element");
var FormContainer = require("vcl/ui/FormContainer");
// var HtmlElement = require("../util/HtmlElement");

$([], {
	onLoad: function() {
		var scope = this.scope(), delegate;
		this.on({
			"open:form": function(evt) {
				if(evt.modal === true) {
					scope.openform_modal.execute(evt);
				} else {
					if(delegate === undefined) {
						delegate = scope.client.getForm().scope().open_form;
					}
		            delegate.execute(evt.uri, evt);
				}
			}
		});

		return this.inherited(arguments);
	},
    onMessage: function(name, msg, sender) {
        var scope = this.getScope();
        // FIXME Make abstracter
        if(name === "openform" || name === "openform-tabbed") {
        	/*- Delegate to Portal-form */
            scope = scope.client.getForm().getScope();
            scope.open_form.execute(msg.uri, msg);
        } else if(name === "openform_modal") {
            scope.openform_modal.execute(msg, sender);
        } else if(name === "log") {
            scope.console.sendMessage(name, msg, sender);
        }
    },
}, [
    $("vcl/Action", "openform_modal", {
        onExecute: function(evt) {

            var app = this.getApp();
            var scope = this.getScope();
            var app_scope = app.getScope();
            var container = new FormContainer(app);
            var client = app_scope.modal_client;

            // var cs = HtmlElement.getComputedStyle(document.documentElement);
            var cs = scope.modal_client.getComputedStyle();

            var w = evt.width || 0.75;
            var h = evt.height || 0.75;

            // percentages?
            if(w < 1) {
            	w = parseInt(cs.width) * w;
            }
            if(h < 1) {
            	h = parseInt(cs.height) * h;
            }
            
            scope.modal_client.bringToFront();
            
            var width = parseInt(cs.width);
            container.setAlign("none");
            container.setAutoSize("both");
            // FIXME
            container._autoPosition = {left: true, top: true};//["left", "top"];
            //container.setBounds(width / 2 - w / 2, 70, undefined, undefined, w, h);
            container.setCss({
                "background-color": "white",
                "z-index": "201",
                "border-radius": "12px", "border": "1px solid transparent",
                "box-shadow": "4px 4px 15px 2px rgba(128, 128, 128, 0.7)",
                "left": String.format("%dpx", width / 2 - w / 2),
                "top": String.format("%dpx", evt.top || 70),
                "width": String.format("%dpx", w),
                "height": String.format("%dpx", h),
                "overflow": "hidden",
                "&.animate": {
                    "-webkit-transition-property": "-webkit-transform, opacity, all",
                    "-webkit-transition-duration": "0.2s, 0.3s, 0.3s",
                    "&.fadein-scale": {
                        "-webkit-transform": "scale(1)",
                        "opacity": "1",
                        "&.initial": {
                            "-webkit-transform": "scale(0.9)",
                            "opacity": "0"
                        }
                    }
                }
            });

            if(evt.uri) {
                container.setFormUri(evt.uri);
            } else if(evt.form) {
            	/*- Use form, but do not own it */
            	container.swapForm(evt.form, false);
            	evt.form.show();
            }
            	
            if(typeof evt.params === "function") {
                container.setFormParams(evt.params());
            } else if(evt.params) {
                container.setFormParams(evt.params);
            }

            client.addClasses("animate darken initial");
            container.addClasses("animate fadein-scale initial");
            container.setParentNode(document.body);
            container.setOnFormClose(function() {
            	client.applyVar("cancel");
            });
            container.setOnFormLoad(function() {
            	if(typeof evt.callback === "function") {
            		evt.callback(this._form);
            	}
            });

            container.setTimeout("x", function() {
                client.removeClass("initial", true);
                container.removeClass("initial", true);
            }, 100);

            var containers = client.getVar("containers", false, []);
            containers.push(container);
        }
    }),
    $i("window", [
        $("vcl/ui/Panel", "modal_client", {
            css: {
                "pointer-events": "none",
                "visibility": "hidden",
                "&.animate": {
                    "-webkit-transition": "background-color 0.2s",
                    "visibility": "inherit",
                    "pointer-events": "all",
                    "background-color": "white",

                    "&.darken": {
                        opacity: "0.6",
                        "&.initial": {
                            opacity: "0"
                        }
                    }
                }
            },
            align: "client",
        	onTap: function() {
        		var containers = this.getVar("containers");
        		var scope = this.getScope();

        		if(containers.length > 0) {
        			var form =  containers[containers.length - 1]._form;
        			if(form) {
        				form.close();
	        		} else {
	        			// in case no form is available we should clean up
	        			scope.modal_client.applyVar("cancel");
	        		}
        		}
        	},
        	onResize: function() {
        	    var containers = this.getVar("containers");
        	    if(containers) {
        	        var scope = this.getScope();
                    var cw = parseInt(scope.modal_client.getComputedStyle().width);

        	        containers.forEach(function(container) {
                        var width = container.getWidth();
                        container.setBounds(cw / 2 - width / 2,
                            undefined, undefined, undefined, undefined, undefined);
        	        });
        	    }
        	},
	        vars: {
	        	cancel: function() {
	        		var containers = this.getVar("containers");
	                var container = containers.pop();
	                var modal_client = this;

	                container.addClass("initial", true);
	                this.addClass("initial", true);

	                container.on({
	                    "transitionend": function() {
	                        modal_client.removeClasses("animate darken initial", true);
	                        /*- container should only destroy form when it actually owns it */
	                        container._form.setParent(null);
	                        delete container._form;
	                        container.destroy();
	                    }
	                });
	        	}
	        }
        })
    ])
]);
