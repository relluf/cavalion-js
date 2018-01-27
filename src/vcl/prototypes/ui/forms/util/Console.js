"vcl/Component, vcl/Control, vcl/Dragger, util/Command, util/HotkeyManager, vcl/ui/Sizer, vcl/ui/FormContainer, entities/EM, entities/ExpressionBuilder, util/Rest, features/FM";

var Component = require("vcl/Component");
var Control = require("vcl/Control");
var FormContainer = require("vcl/ui/FormContainer");
var Sizer = require("vcl/ui/Sizer");
var Command = require("util/Command");
var Rest = require("util/Rest");
var EM = require("entities/EM");
var FM = require("features/FM");
var Deferred = require("js/Deferred");
var JsObject = require("js/JsObject");
var Dragger = require("vcl/Dragger");

$(["ui/Form"], {
    activeControl: "console",
    align: "bottom",
    height: 250,
    visible: true,
    css: "background-color: white border-top: 1px solid silver z-index: 10000",
    onMessage: function (name, params, sender) {
        var scope = this.getScope();
        if (name === "log") {
            
            console.warn("onMessage will be deprecated, migrate code to Component.prototype.emit and Component.prototype.query[All]");
            
            var args = js.copy_args(params);
            var source = params[0];
            if (typeof source !== "string") {
                source = "[source-unknown]";
            } else {
                args.shift();
            }
            scope.console.print.apply(scope.console, [String.format("%n - %s", sender, source)].concat(args));
            return true;
        }

        return this.inherited(arguments);
    },
    onActivate: function () {
        this._vars.sizer.setControl(null);
    },
    onLoad: function () {
        var me = this;
        var scope = this.getScope();
        var sizer = this.setVar("sizer", new Sizer(this));

        var app = this.getApp();
        app.on("print", function() {
            scope.console.print.apply(scope.console, arguments);
        });
        
        var parent = this.scope()[this.getVar("parent")];
        if(parent) { this.setParent(parent); }

        // FIXME
        document.body.style.overflow = "hidden";

        sizer.on("setControl", function (value) {
            var content = [];
            if (value !== null) {
                if (value.getUri()) {
                    content.push(value.getUri());
                }
                content.push(String.format("%n", value));
                scope.console.getNode("input").value = String.format("#%d // %s ", value.hashCode(), content.join(": "));
                if (value._owner) {
                    content.push(String.format("%n", value._owner));
                }
            }
            scope.sizer_selection.setContent(String.format("%H", content.join(" - ")));
        }, true);

        var down;
        // FIXME overriding dispatcher, Application.prototype.dispatchEvent(...)
        app._dispatcher.override({
            dispatch: function (component, name, evt) {
				// if(name.indexOf("key") === 0) {
				// 	console.log(evt.keyCode, name, {ctrl: evt.ctrlKey, alt: evt.altKey, shift: evt.shiftKey, meta: evt.metaKey});
				// }
                if (evt.keyCode === 27) {
                    if (sizer._control !== null) {
                        if (name === "keydown") {
                            down = Date.now();
                            sizer.setControl(sizer._control._parent);
                        }
                        if (name === "keyup") {
                            // if(down + 750 < Date.now()) {
                            //     sizer.setControl(null);
                            // }
                            return false;
                        }
                    }
                }
                if (name === "dblclick" && evt.altKey === true) {
                } else if (name === "click" && evt.altKey === true) {
                    if (evt.shiftKey === false) {
                    	if(evt.metaKey === true) {
                    		if(me.isVisible()) {
                    			me.hide();
                    		} else {
                    			me.show();
                    		}
                    	}
                        if (component instanceof Control) {
                            if (sizer._control === component) {
                                component = null;
                            	//me.getScope().console.setFocus();
                            }
                            sizer.setControl(component);
                            return false;
                        }
                    } else {
                        var fc = component;
                        while (fc instanceof Control) {
                            if (fc instanceof FormContainer) {
                                if(evt.metactrlKey === true) {
                                    var keys = Component.getKeysByUri(fc._formUri);

                                    if (confirm(String.format("Rescaffold %s?", fc.getForm().getUri())) === true) {
                                        fc.reloadForm();
                                        return false;
                                    }
                                } else {
                                    if (confirm(String.format("Reload %s?", fc.getForm().getUri())) === true) {
                                        fc.reloadForm();
                                        return false;
                                    }
                                }
                            }
                            fc = fc._parent;
                        }
                    }
                } else if(name ==="touchstart" || name === "touchmove") {
                	if(evt.touches.length > 3) {
                		app.getScope().toggle_console.execute(evt);
                	}
                }

                return this.inherited(arguments);
            }
        });

        return this.inherited(arguments);
    },
    onHide: function() {
    	var focused = Control.focused ;
    	var scope = this.getScope();
    	if(focused === scope.console) {
    		scope.console.getNode("input").blur();
    	}
    }

}, [
    $(["ui/controls/Toolbar"], "toolbar", {
        css: {
            cursor: "ns-resize"
        },
        draggable: true,
        onDraggerNeeded: function () {
            var control = this._owner;
            var dragger = new Dragger(this);

            dragger.setCursor("ns-resize");
            dragger.override({
                updateHandles: function (evt) {
                    control.setHeight(control.getHeight() - (evt.clientY - this._sy));
                    this._sy = evt.clientY;
                }
            });
            return dragger;
        }

    }, [
        $("vcl/ui/Element", "sizer_selection", {
            css: "padding: 4px; display: inline-block; cursor: default;"
        }),
        $([["ui/controls/SizeHandle"]], "size_handle", {
            classes: "vertical",
            vars: {
                control: "@owner"
            }
        })
    ]),
    $("vcl/ui/Console", "console", {
        onLoad: function () {
            this.print("loaded", this);
        },
        onEvaluate: function (expr) {
            var scope = this.getScope();
            var app = this._owner._owner;
            var pr = this.print.bind(this);

            function req() {
            	if(arguments.length == 1) {
	            	try {
	            		return require(arguments[0]);
	            	} catch(e) {}
            	}
                var d = new Deferred();
                require.apply(this, [js.copy_args(arguments),
                    function () {
                        d.callback.apply(d, js.copy_args(arguments));
                    },
                    function (err) {
                        d.errback(err);
                    }
                ]);
                return d;
            }

            function d(deferred) {
            	return deferred.addCallback(function(res) {
            		pr(res);
            		return res;
            	});
            }

            var me = this;
            function open(uri, opts) {
                me.bubble("openform", js.mixIn(js.mixIn(opts || {}),
                    {uri: uri}));
            }

            /**
             *
             */
            function runAtServer(c, params, content) {
                return Command.execute(c, params, content);
            }

            if (expr.charAt(scope || Documents || 0) === ":") {
                expr = expr.substring(1).split(" ");
                if (expr.length > 0) {
                    expr = String.format("Utils.%s(scope, %s)", expr.shift(), expr.join(" "));
                } else {
                    expr = String.format("Utils.%s(scope)", expr.shift());
                }
            }

            if(expr === "@!") {
                expr = "@ reset()";
            }

            if (expr.substring(0, 1) === "@") {
                if (expr.substring(0, 2) === "@(") {
                    expr = "runAtServer(" + expr.substring(2);
                } else {
                    expr = String.format("runAtServer(\"scaffold.js/lib/eval\", %s);", JSON.stringify({
                        text: expr.substring(1)
                    }));
                }
            }

            /* jshint evil: true; */
            return eval(expr);
        }
    })
]);
