"../util/HtmlElement, vcl/ui/ListRow, entities/EM, ../data/Source";

var EM = require("entities/EM");
var Source = require('../data/Source');

var Handlers = {
	/*- Handlers are a nice way/technique of ordering code. Not so much for the 
	event handlers of components like vcl/Action or vcl/entites/Query. It's more
	suited for event implementation for vcl/Control-descendants which are typically
	nested within each other. Get important code to the top. Find code faster 
	by making the nested structure flat. */
	"filters.onDispatchChildEvent": function(component, name, evt, f, args) {
		if(name === "realchange") {
			this.scope().query.setTimeout("refresh", 500);
		}
	},
	"tree.onSelectionChange": function(selection) {
		// var scope = this.getScope();
		// scope.list.setVisible(selection.length === 0 || selection[0]._uri !== this._uri);
		return this.inherited(arguments);
	},
	onActivate: function() {
	    this.setFocus();
	    return this.inherited(arguments);
	},
	onLoad: function() {
		/*- make sure filters is last */
		this.scope().filters.bringToFront();
		return this.inherited(arguments);
	},
	/* These kind of handlers are not far out (1-2 days) */
	">vcl/ui/Button.toggle click": function(evt) {
		
	}
};

$(["ui/forms/Home"], {
	activeControl: "list",
	css: {
		"#status": "padding: 2px; float: right;",
		"#menubar > .right": "float:right;",
    	"&.top-left-3d": {
    		".{./Panel}#client": {
//    			"border": "1px solid #f0f0f0",
    			"border-top": "1px solid gray",
    			"border-left": "1px solid gray",
                ">.{./List}": {
    				"border-top": "1px solid silver",
    				"border-left": "1px solid silver"
                }
    		}
    	}
	},
	onActivate: Handlers.onActivate,
	onLoad: Handlers.onLoad
}, [
	$("vcl/entities/Instance", "instance"), /*- TODO */
	$("vcl/entities/Query", "query", {
		onActiveChanged: function(active) {
			// console.log("onActiveChanged", active);
			var scope = this.getScope();
			scope.status.render();
			if(active === true) {
			    if(scope.search_toggle.isVisible()) {
			        this.setTimeout("setfocus", function() {
    			        scope.search_input.setFocus();
			        }, 20);
			    } else {
			        //scope.list.setFocus();
			    }
			}
		},
		onBusyChanged: function(busy) {
			// console.log("onBusyChanged", busy);
			var scope = this.getScope();
			scope.refresh.setEnabled(!busy);
			scope.status.render();
		},
		onGetRequestCriteria: function(criteria, page) {
			// debugger;
			/*- for each #input nested within #filters */
			var qf = "< #filters";
			var expressions = this._owner.qsa(qf + " < #input")
				.filter(function(input) { 
					var r = input.hasValue();
					if(input.getVar("required") === true && r === false) {
						criteria = null;
					}
					return r;
				})
				.map(function(input) {
					var value = input.getValue();
					var attribute = input.getVar("attribute");
					var operator = input.getVar("operator");
					var type = input.getVar("type");
					var onGetValue = input.getVar("onGetValue");
					
					if(typeof onGetValue === "function") {
						value = onGetValue.apply(input, [value]);
					}
					
					if(type === "string") {
						value = value.split(",");
						if(value.length === 1) {
							return EM.eb[operator || "eq"](attribute, value[0]);
						} else {
							return EM.eb.or.apply(EM.eb, value.map(function(s) {
								return EM.eb[operator || "eq"](attribute, s);
							}));
						}
					}
					
					return EM.eb[operator || "eq"](attribute, value);
				});

			if(criteria !== null) {
				if(expressions.length === 1) {
					criteria.where = expressions[0];
				} else if(expressions.length > 1) {
					criteria.where = EM.eb.and.apply(EM.eb, expressions);
				}
			}
			
			return criteria;
		}
	}),
	
	$("vcl/Action", "item_selected", {
		// parent for open, remove
		enabled: false
	}),
	$("vcl/Action", "item_open", {
		content: "Open",
		enabled: "parent",
		visible: false,
		parent: "item_selected",
		onExecute: function() {
			var scope = this.getScope();
			var uri = String.format(this.getVar("formUri"), this.getSpecializer());
			var selection = scope.list.getSelection(true);
			var me = this;
			selection.forEach(function(instance) {
				me.bubble("openform_modal", {
					uri: uri,
					params: {
						instance: instance
					},
//					activate: selection.length === 1,
			        callback: function(form) {
			        	form.on("close", function() {
			        		/*- TODO Might be possible to leave out arguments.callee
			        		 * and simply unregister the current listener */
		        			form.un("close", arguments.callee);
		        			if(instance.getAttributeValue("revision") > 0) {
		        				scope.refresh.execute();
		        			}
			        	});
			        }
				});
			});
		},
		vars: {
		    formUri: "ui/entities/Edit<%s>.modal"
		}
	}),
	$("vcl/Action", "item_new", {
		content: "New",
		vars: {
		    formUri: "ui/entities/Edit<%s>.modal.new"
		},
		onExecute: function() {
			var EM = require("entities/EM");
			var scope = this.getScope();
		    var specializer = this._owner.getSpecializer();
			var uri = String.format(this.getVar("formUri"), specializer);
		    this.bubble("openform_modal", {
		        uri: uri,
		        params: {
		        	instance: this.applyVar("newInstance", [EM, specializer])
		        },
		        callback: function(form) {
		        	form.on("close", function() {
		        		/*- TODO Might be possible to leave out arguments.callee
		        		 * and simply unregister the current listener */
	        			form.un("close", arguments.callee);
	        			scope.refresh.execute();
		        	});
		        }
		    });
		}
	}),
	$("vcl/Action", "item_remove", {
		enabled: "parent",
		content: "Delete",
		parent: "item_selected",

		vars: {
			getMessage: function() {
				return "Are you sure you want to delete the selected items?";
			}
		},

		onExecute: function() {
		    var EM = require("entities/EM");

		    var scope = this.getScope();
		    var app = this.getApp();
		    app.confirm(this.applyVar("getMessage"), function(res) {
		    	if(res === true) {
		    		var instances = scope.list.getSelection(true);
		    		var indices = scope.list.getSelection().sort(function(i1, i2) {
		    			return i1 < i2 ? 1 : -1;
		    		});

		    		indices.forEach(function(i) {
		    			scope.query.splice(i, 1);
		    		});
		    		scope.query.arrayChanged();

    				scope.item_remove.setEnabled(false);
		    		EM.commit([], instances).
		    			addCallback(function(res) {
		    				scope.item_remove.setEnabled("parent");
		    			}).
		    			addErrback(function(err) {
		    				scope.item_remove.setEnabled("parent");
		    				app.alert("Could not delete items");
		    				scope.item_remove.log(err);
		    				scope.refresh.execute();
		    			});
			    	}
		    	}
		    );
		}
	}),
	$("vcl/Action", "export", {
		enabled: "parent",
		parent: "item_selected",
		content: "Export"
	}),
	$("vcl/Action", "refresh", {
		content: "Refresh",
		onExecute: function() {
			this.scope().query.refresh();
		}
	}),
	$("vcl/Action", "search_toggle", {
		content: "Search",
		visible: false,
		onExecute: function() {
		    this.setVisible(!this.getVisible());
		    if(this.getVisible()) {
		        this.getScope().search_input.setFocus();
		    }
		}
	}),
	$("vcl/Action", "toggle_options", {
		content: "Options"
	}),
	$("vcl/Action", "toggle_filters", {
		content: "Selection",
		state: false,
		selected: "state",
		visible: "state",
		onExecute: function() {
			this.setState(!this.getState());
		}
	}),
	$("vcl/Action", "toggle_info", {
		content: "Info",
		state: false,
		selected: "state",
		visible: "state",
		onExecute: function() {
			this.setState(!this.getState());
		}
	}),
	$("vcl/Action", "toggle_new", {
		content: "New",
		state: false,
		selected: "state",
		visible: "state",
		onExecute: function() {
			this.setState(!this.getState());
		}
	}),
	
	$i("menubar", [
		$("vcl/ui/Button", {
			action: "refresh",
			content: "<i class='fa fa-refresh'></i>",
			// classes: "right"
		}),
        $("vcl/ui/Element", "status", {
            onRender: function() {
            	var scope = this.getScope();
            	var active = scope.query.isActive();
            	var content = [];
            	var selection = scope.list.getSelection();
            	if(active) {
	            	var size = scope.query.getSize();
	            	var arr = scope.query.getArray(), loaded = 0;
	            	for(var i = 0; i < arr.length; 
	            		++i, loaded += (arr[i] !== Source.Pending ? 1 : 0)) {
	            	}

	            	if(selection.length) {
	            	    content.push(String.format("%d / ", selection.length));
	            	}
	            	content.push(String.format("%s item%s (%d%%)",
							size === 0 ? "No" : size, size === 1 ? "" : "s",
							parseInt(loaded / size * 100, 10)));
            	}
				this.setContent("&nbsp;" + content.join(""));
            }
        }),
        // $("vcl/ui/Button", "button_new", {
        //     action: "item_new"
        // }),
		// $("vcl/ui/Button", {
		// 	action: "toggle_info",
		// 	classes: "toggle",
		// 	visible: "always"
		// }),
		$("vcl/ui/Button", {
			action: "toggle_filters",
			classes: "toggle",
			visible: "always"
		}),
		// $("vcl/ui/Button", {
		// 	action: "toggle_new",
		// 	classes: "toggle",
		// 	visible: "always"
		// }),
        $("vcl/ui/Button", "button_open", {
        	action: "item_open",
            css: "font-weight: bold;"
        }),
        // $("vcl/ui/Button", "button_delete", {
        //     action: "item_remove"
        // }),
        // $("vcl/ui/Button", "button_refresh", {
        //     action: "refresh"
        // }),
        // $("vcl/ui/Button", "button_search", {
        //     action: "search_toggle",
        //     visible: "always"
        // }),
        // $("vcl/ui/Button", "button_options", {
        //     action: "toggle_options",
        //     visible: "always"
        // }),
		$(["ui/entities/QueryFilters"], "filters", { 
			action: "toggle_filters", executesAction: false,
			onDispatchChildEvent: Handlers['filters.onDispatchChildEvent']
		})
    ]),
    $i("tree", {
    	onSelectionChange: Handlers['tree.onSelectionChange']
    }),
    $i("left_content", [
                $("vcl/ui/Group", {
                    visible: false,
                   css: {
                       "padding-right": "8px",
                       ".{Input}": {
                           width: "100%"
                       },
                       ".{Select}": {
                           "-webkit-appearance": "textfield",
                           width: "100%",
                           display: "block"
                       }
                   }
	       	    }, [
    	       	    $("vcl/ui/CheckGroup", {
    	       	        text: "Name",
    	       	        visible: true
    	       	    }, [
    	       	        $("vcl/ui/Input")
    	       	    ]),
    	       	    $("vcl/ui/CheckGroup", {
    	       	        css: {
    	       	            "padding-right": "8px",
    	       	            ".{./Input}": {
    	       	                width: "100%"
    	       	            }
    	       	        },
    	       	        text: "Type",
    	       	        visible: true
    	       	    }, [
    	       	        $("vcl/ui/Select")
    	       	    ])

	       	    ])
    ]),
	$("vcl/ui/List", "list", {
		action: "item_open",
		enabled: "always", // not affected by action
		visible: "always", // not affected by action
		//action_properties: "execute: true; visible: false;", // ?
		align: "client",
		source: "query",
		parent: "client",
		css: {
		    "&.busy > #search_panel": {
		        visibility: "hidden"
		    }
		},
		onKeyPress: function(evt) {
		    var scope = this.getScope();
		    if(evt.keyCode === 47) {
		        scope.search_toggle.setVisible(true);
		        scope.search_input.setFocus();
		        evt.preventDefault();
		    }
		},
		onSelectionChange: function(evt) {
			var scope = this.getScope();
			var enabled = evt.newValue.length > 0;
			scope.item_selected.setEnabled(enabled);
    		scope.status.render();
		}
	}, [
	    $("vcl/ui/Panel", "search_panel", {
	        autoSize: "height",
	        align: "top",
	        action: "search_toggle",
	        css: {
	            padding: "4px",
	            "background-color": "white"
	        }
	    }, [
	        $("vcl/ui/Input", "search_input", {
	            placeholder: "search",
	            css: {
	                width: "100%",
	                "padding": "4px 8px",
	                "font-size": "16px"
	            },

	            onKeyUp: function(evt) {
	                if(evt.keyCode === 27) {
	                    var scope = this.getScope();
	                    scope.search_toggle.execute();
	                    scope.list.setFocus();
	                }
	            }
	        })
	    ])
	])
]);
