"vcl/ui/Tab, vcl/ui/FormContainer, util/net/Url";

var FormContainer = require("vcl/ui/FormContainer");
var Tab = require("vcl/ui/Tab");

/*
	Portal: 
		- header/title/location/user/customer
		- navigation controls
		- tabbed sub forms
			- vars['ui/forms/Portal'].forms
				- wordt gedaan door open_form (Factory?)
*/	

$([["ui/Form"]], {
    css: {
		"#tabs": {
	        "padding-top": "2px",
	        "margin-left": "32px",
	        ".{./Tab}": {
	            display: "inline-block",
	            border: "1px solid transparent",
	            "border-top-left-radius": "3px",
	            "border-top-right-radius": "3px",
	            "border-bottom": "none",
	            padding: "3px 8px 2px 8px",
	            // "margin-left": "3px",
	            // "margin-right": "3px",
	            cursor: "pointer",
	            "background-color": "#f0f0f0",
	            "border-color": "gray",
	            color: "gray",
	            "vertical-align": "bottom",
	            "&:hover": {
	            	// "padding-top": "4px",
	            	color: "black",
	                padding: "3px 8px 3px 8px",
	            	"margin-top": "0"
	            },
	            "&.selected": {
	            	// "padding-top": "4px",
	                "background-color": "#fcfcfc",
	                "border-color": "gray",
	            	"margin-top": "0",
	                padding: "3px 8px 3px 8px",
	                color: "black"
	            },
	            "&.disabled": {
	                cursor: "default",
	                color: "silver"
	            },
	            ".hidden": {
	                display: "none"
	            }
	        },
	        "&.bottom": {
	            "background-color": "#dfdfdf",
	            "border-top": "1px solid #a3a3a3",
	            "padding-top": "0px",
	            "padding-bottom": "1px",
	            ".{./Tab}": {
	                border: "1px solid transparent",
	                "border-top": "none"
	            }
	        }
		},
		"#top": {
	        "padding-top": "10px",
	        "padding-right": "32px",
	        "&:not(.single)": {
	            "#title_location": {
	                visibility: "hidden"
	            }
	        },
	        "&.single": {
	            "padding-bottom": "8px",
	            "#tabs": {
	                display: "none"
	            }
	        },
	        "&.line": {
	            "padding-bottom": "8px",
	            "border-bottom": "1px solid gray"
	        },
	        "#title": "display: inline-block; font-size: 17pt;",
	        "#title_location": "display: inline-block; font-size: 12pt;",
	        "#title_right": {
	            float: "right",
	            "vertical-align": "bottom",
	            "padding-top": "7px",
	            "div": "display: inline-block;",
	            ">.link": {
	            	"&:not(.disabled)": {
	            		color: "blue",
	            		cursor: "pointer"
	            	},
	                "margin-left": "8px",
	                "color": "silver",
	                "text-decoration": "underline"
	            }
	        },
	        "#title_workspace": {
	            "float": "right",
	            "padding-bottom": "5px",
	            "font-size": "10pt",
	            "display": "inline-block"
	        },
	        "#title_browse": {
	            "padding-top": "2px",
	            color: "silver",
	            float: "left",
	            width: "32px",
	            "font-size": "20pt",
	            "font-family": "arial",
	            "text-align": "center",
	            "div": {
	                display: "inline-block",
	                cursor: "pointer",
	                "&:hover": {
	                    color: "black"
	                },
	                "&.disabled": {
	                    color: "#f0f0f0",
	                    visibility: "hidden"
	                }
	            }
	        }
		}
	},
    vars: {
        "App": {
            getState: function () {
                var scope = this.getScope();
                var tab = scope.tabs.getSelectedControl(1);
                var form = tab._control._form, nestedState;

                if (tab && form) {
                    nestedState = form.applyVar("App.getState", [], "silent");
                }

                return {
                    nestedState: nestedState,

                    restore: function (state) {
                        tab.setSelected(true);
                        this.nestedState && this.nestedState.restore(state);
                        scope.update_location.execute();
                    }
                };
            }
        },
        "ui/forms/Portal": {
            forms: [{
                uri: "ui/forms/Home<>.tree",
                closeable: false,
                selected: true
            }]
        }
    },
    onLoad: function () {
        var scope = this.getScope();
        var forms = this.getVar("ui/forms/Portal.forms") || [];

        for (var i = 0; i < forms.length; ++i) {
            var options = js.mixIn({}, forms[i]);
            if (options.selected === undefined) {
                options.selected = false;
            }
            scope.open_form.execute(forms[i].uri, options);
        }

        this.override({
            setCaption: function (value) {
            	this.setTimeout("updateCaption", function() {
	                document.title = String.format("%s", value);
            	}, 250);
                return this.inherited(arguments);
            }
        });

        var app = this.getApp();
        app.on("statechange", function (state) {
            scope.go_back.setEnabled(app.canBack());
            scope.go_forward.setEnabled(app.canForward());
        });
        
        return this.inherited(arguments);
    }
}, [
    $("vcl/Action", "go_back", {
        content: "&#9664;",
        enabled: false,
        onExecute: function () {
            window.history.back();
        }
    }),
    $("vcl/Action", "go_forward", {
        content: ">",
        enabled: false,
        onExecute: function () {
            window.history.forward();
        }
    }),
    $("vcl/Action", "go_next_tab", {
        hotkey: "keydown:MetaCtrl+32|keyup:MetaCtrl+32|keydown:Shift+MetaCtrl+32|keyup:Shift+MetaCtrl+32",
        onExecute: function (evt) {
            var scope = this.getScope();

            if (evt.type === "keyup" && evt.keyCode === 32) { // && evt.altKey === false) {
                var duration = Date.now() - this.removeVar("down");
                if (duration > 350) {
                    if (scope.top_gradient.hasClass("single")) {
                        scope.top_gradient.removeClass("single");
                    } else {
                        scope.top_gradient.addClass("single");
                    }
                } else {
                    var last = scope.tabs.getControlCount() - 1;
                    if (last > 0) {
                        var index = scope.tabs.getSelectedControl(1).getIndex();
                        var delta = evt.shiftKey === true ? -1 : 1;
                        do {
                            index += delta;
                            if (index > last) {
                                index = 0;
                            } else if (index < 0) {
                                index = last;
                            }
                        } while (scope.tabs.getControl(index).getGroupIndex() !== 1);
                        scope.tabs.getControl(index).setSelected(true);
                    }
                }
            } else if (evt.type === "keydown") {
                if (this.getVar("down") === undefined) {
                    this.setVar("down", Date.now());
                }
            }
        }
    }),
    $("vcl/Action", "update_location", {
        left: 96,
        onExecute: function (evt, sender) {
            var scope = this.getScope();
            var tab = scope.tabs.getSelectedControl(1);
            var portalCaption = this.getVar("caption", false, this._owner._caption); //this._owner.getPropertyValue("caption");

            if (tab !== null) {
                if ((form = tab._control._form) !== null) {
                    var caption = tab.getNode("text").textContent;
                    caption = String.trim(caption);
                    caption = caption ? [caption] : [];
                    caption = caption.join(" - ");
                    this._owner.setCaption(caption);
                    this.getApp().replaceState();
                } else {
                    this._owner.setCaption("");
                }
            }
            scope.title_location.setContent(tab !== null ? tab.getText() : "&nbsp;");
        },
        top: 272
    }),
    $i("form_close", {
        top: 112
    }),
    $i("url_state_push", {
        top: 152
    }),
    $i("url_state_pop", {
        top: 192
    }),
    $("vcl/Action", "open_form", {
        left: 96,
        onExecute: function onExecute(uri, options) {
        	/** options: 
        	 *		- caption
        	 *		- text
        	 *		- selected
        	 *		- closeable/canClose,
        	 *		- onGetFormParams
        	 *		- params
        	 *		- forceLoad
        	 */
            var scope = this.scope();
            var owner = this._owner;
            var selectedTab = scope.tabs.getSelectedControl(1);
            var container = new FormContainer(owner);
            var tab = new Tab(owner);
            tab.override({
                setText: function () {
                    var r = this.inherited(arguments);
                    if (this._node && this.hasState("invalidated")) {
                        this.render();
                        this.clearState("invalidated", true);
                    }
                    // scope.update_location.execute();
                    this.setTimeout("update_location", function () {
                        scope.update_location.execute();
                    }, 100);
                    return r;
                },
                update: function () {
                    var r = this.inherited(arguments);
                    this.setTimeout("update_location", function () {
                        scope.update_location.execute();
                    }, 100);
                    return r;
                }
            });
            
            if(options.hasOwnProperty("canClose")) {
            	console.warn("canClose - deprecated");
            	options.closeable = true;
            }
            
            if (options.closeable !== false) {
                tab.addClass("closeable");
            }

            // container.on("formload", function () {
            //     var form = this.getForm();
            //     if (options.updateCaption !== false) {
            //         form.on("captionchanged", function () {
            //             var caption = form.getCaption(true);
            //             if (caption instanceof Array) {
            //                 tab.setText(caption.join(""));
            //             } else {
            //                 tab.setText(String.format("%H", caption));
            //             }
            //         });
            //         var caption = form.getCaption();
            //         if (caption instanceof Array) {
            //             caption = caption.join("");
            //         } else {
            //             caption = String.format("%H", form.getCaption() || options.caption || form.getName() || form.getUri() || "New Tab");
            //         }
            //         tab.setText(caption);
            //     } else {
            //         tab.setText(options.caption || form.getCaption() || form.getName() || form.getUri() || "New Tab");
            //     }
            // });
            
            tab.setText("&nbsp;<img src='/shared/vcl/images/loading.gif' align='absmiddle'>" + (options.text || "&nbsp;"));
            container.on("formload", function() {
            	this.app().log(this.getForm());
                tab.setText(options.caption || this.getForm().getCaption());
            });
            
            tab.setControl(container);
            tab.setParent(scope.tabs);
            
            if (selectedTab !== null) {
                tab.setIndex(selectedTab.getIndex() + 1);
            }

            tab.setSelected(options.selected !== false);
            tab.setOnCloseClick(function () { container.getForm().close(); });
            
            container.setVisible(false);
            container.setFormUri(uri);
            container.setAlign("client");
            container.setParent(scope['@owner']);
            container.setOnFormLoadError(function () {
                alert("Could not load form " + container.getFormUri());
                tab.destroy();
                container.destroy();
                form = null;
                tab = null;
                container = null;
                return false;
            });
            container.setOnFormClose(function () {
                this.getForm().destroy();
                this.destroy();
                tab.destroy();
                form = null;
                tab = null;
                container = null;
            });
            container.setOnGetFormParams(options.onGetFormParams || null);
            container.setFormParams(options.params || null);
            container.setVisible(options.selected !== false);
            
            if (options.forceLoad !== false) {
                container.forceLoad();
            }
            
            tab._update();
            return tab;
        },
        top: 232
    }),
    $("vcl/ui/Panel", "top", {
        align: "top",
        classes: "single",
        autoSize: "height"
    }, [
        $("vcl/ui/Group", "top_inner", {}, [
            $("vcl/ui/Group", "title_outer", {}, [
                $("vcl/ui/Group", "title_inner", {}, [
                    $("vcl/ui/Group", "title_browse", {}, [
                        $("vcl/ui/Element", "title_back", {
                            action: "go_back"
                        }),
                        $("vcl/ui/Element", "title_forward", {
                            action: "go_forward",
                            visible: false
                        })
                    ]),
                    $("vcl/ui/Element", "title", {
                        content: "Application Title Here"
                    }),
                    $("vcl/ui/Group", "title_right", {}, [
                        $("vcl/ui/Element", "title_username", {
                            content: "user@domain.com"
                        }),
                        $("vcl/ui/Element", "title_signout", {
                            content: "Sign Out",
                            classes: "link"
                        })
                    ])
                ]),
                $("vcl/ui/Group", "title_sub", {}, [
                    $("vcl/ui/Element", "title_location", {
                        content: "Location"
                    }),
                    $("vcl/ui/Element", "title_workspace", {
                        content: "Customer",
                    })
                ])
            ]),
        ]),
        $("vcl/ui/Tabs", "tabs", {
        	align: "bottom",
            onChange: function (newTab, oldTab) {
                if (this.getVar("passed") === undefined) {
                    this.setVar("passed", true);
                } else {
                    this.getApp().pushState();
                }
            }
        })
    ])
]);