"vcl/ui/LargeIcon, vcl/ui/Node, vcl/ui/FormContainer, vcl/ui/Node.closeable";

var Node = require("vcl/ui/Node");
var FormContainer = require("vcl/ui/FormContainer");

var Handlers = {
	"client.onDispatchChildEvent": function(component, name, evt, f, args) {
		if(component._parent !== this || name.indexOf("form") !== 0) {
			return this.inherited(arguments);
		}

		var form_scope, root_scope = this.getScope();
		var form;

		if(component instanceof FormContainer) {
    		if(name === "formloadstart") {
    			root_scope.description.setContent("<img src='/shared/vcl/images/loading.gif'>");
    		} else if((form = component.getForm()) !== null) {
    			form_scope = form.getScope();
    			if(name === "formload" && !form_scope.left) {
	    			root_scope.description.revertPropertyValue("content");
    			}
    			if(form_scope.left && form_scope.left._uri.endsWith("prototypes/ui/forms/View")) {
    	    		if(name === "formload") {
    	    			form_scope.left.setVisible(false);
    	    		} else if(name === "formactivate") {
    	    			root_scope.left_content.hide();

    	    			form_scope.left_content.setParent(root_scope.left);

    	    		// 	form_scope.menubar.setParent(null);
    	    		// 	form_scope.menubar.setAlign("none");
    	    		// 	form_scope.menubar.setParent(form_scope.left_content);

    	    		} else if(name ==="formdeactivate" || name === "formclose") {
    	    			form_scope.left_content.setParent(form_scope.left);

    	    		// 	form_scope.menubar.setParent(null);
    	    		// 	form_scope.menubar.setAlign("top");
    	    		// 	form_scope.menubar.setParent(form_scope['@owner']);

    	    			root_scope.left_content.show();
    	    		}
    			}
    			if(form_scope.tree && form_scope.tree._uri.endsWith("prototypes/ui/forms/Home")) {
    	    		if(name === "formload") {
	    				var parent = root_scope.tree.getSelection()[0];
	    				if(parent.isSelected()) {
	    					//parent.setCss(js.mixIn(form_scope.tree.getCss()));
    						form_scope.tree.fire("onSelectionChange", [[parent]]);
	    				}
    	    		}
    			}
    		}
		}
		return this.inherited(arguments);
	},
	"tree.onNodesNeeded": function(parent) {
		var control = parent.apply("vcl/ui/Node.getControl", [this.getScope()]);
		var tree = parent.apply("vcl/ui/Node.getEmbeddedTree", [control]);
		var r;

		if(tree instanceof require("vcl/ui/Tree")) {
			//FIXME parent.setCss(tree.getCss());
			r = tree.fire("onNodesNeeded", arguments);
		} else {
			r = this.inherited(arguments);
		}

		return r;
	},
	"tree.onSelectionChange": function(selection) {
		var prev = [].concat(this.getVar("previousSelection", false, []));
		var scope = this.getScope();
		var node = selection[0], control, caption = [];

		this.getApp().pushState();
		this._owner.getVar("caption", false, this._owner._caption);

		/*- Gather current path */
        while(node instanceof Node) {
            try {
                caption.unshift(node.getNode("text").childNodes[0].nodeValue);
            } catch(e) {}
            node = node._parent;
        }

        if(this._owner.getVar("caption")) {
        	//console.debug(this._owner.getVar("caption"))
            caption.unshift(this._owner.getVar("caption"));
        }

//    		if(caption.length > 0) {
			caption = [caption.join(" / ")]; // ▶
//    		} else {
//    			caption.push(this._owner.getVar("caption"));
//    		}

		if(selection.length === 1) {
			// this._owner.setCaption(caption.join(" - "));
		} else {
			// this._owner.setCaption(caption);
		}

		this.setVar("previousSelection", selection);

		if((node = prev[0])) {
			if((control = node.apply("vcl/ui/Node.getControl", [scope]))) {
				control.hide();
			}
		}

		scope.description.revertPropertyValue("content");

		// Is there a node selected?
		if(selection.length > 0) {
			var node = selection[0];
			var control = node.apply("vcl/ui/Node.getControl", [scope]);
			var tree = node.apply("vcl/ui/Node.getEmbeddedTree", [control]);

			if(control) {
				control.show();
			}

			tree && tree.fire("onSelectionChange", arguments);
		}

		prev = selection;

		return this.inherited(arguments);
	}
};

var Interfaces = {
	
};
    		
$([], {
	vars: {
    	"App": {
    		getState: function() {
				var scope = this.getScope();
				var selection = scope.tree.getSelection();
				var form, nestedState;

				if(selection.length === 1 && (form = selection[0].apply("vcl/ui/Node.getForm"))) {
					nestedState = form.applyVar("App.getState", [], "silent");
				}
				return {
					nestedState: nestedState,
					restore: function(state) {
						scope.tree.setSelection(selection);
						this.nestedState && this.nestedState.restore(state);
					}
				};
    		}
    	},
		"vcl/ui/Tree": {

			getSelection: function() {
				var re = /ui\/forms\/Home\<.*\>\.tree/;
				return this.query("@owner", re).getScope().tree.getSelection();
			}
		},
		"vcl/ui/Node": {
			getControl: function(scope) {
				/**
				 * @return This method returns the control is associated with the calling
				 * vcl/ui/Node. The control is created if it doesn't exist yet.
				 */
				var Control = require("vcl/Control");
	    		var control = this.getVar("control");

        		// If there isn't a control associated with the calling node...
				if(!(control instanceof Control)) {
					// ... check to see if a form should be instantiated
					if((value = this.getVar("formUri"))) {
						// Create a new control
						control = new (require("vcl/ui/FormContainer"))(this);
						control.setVisible(false);
						control.setFormUri(value);
						if((value = this.getVar("formParams"))) {
						    if(typeof value === "function") {
						        value = value.apply(this, []);
						    }
							control.setFormParams(value);
						}
					} else if(typeof (value = this.getVar("control")) === "string") {
						// ... or just find a control
						if(scope && !((control = scope[value]) instanceof Control)) {
							throw new Error(String.format("Can not find a control named %s", value));
						}
					}
					// If a new control was found or created...
					if(control) {
						// ...set the parent and store the reference
						scope && control.setParent(scope.client);
						this.setVar("control", control);
					}
				}

	    		return control;
			},
			getForm: function() {
				return this._control instanceof require("vcl/ui/FormContainer") ? this._control.getForm() : null;
			},
			getEmbeddedTree: function(control) {
				control = control || this.apply("vcl/ui/Node.getControl");
	    		if(control && control instanceof require("vcl/ui/FormContainer") && (control = control.getForm())) {
					control = control.query("tree")[0];
	    		}
	    		return control;
			}
		}
	},
	onMessage: function(name, params, sender) {
		var scope = this.getScope();

		if(name === "openform") {
			var Node = require("vcl/ui/Node.closeable");
			var FormContainer = require("vcl/ui/FormContainer");

			// TODO Merge with Portal

			var parent = scope.tree.getSelection()[0];

			// TODO find the correct parent based upon the sender
//			while(parent && parent.getVar("control")._form !== sender._owner) {
//				parent = parent._parent;
//			}

			var node = new Node(this);
			node.override({
				onclick: function(evt) {
					var r = this.inherited(arguments);
					if(r !== false && evt.target.className === "close") {
						this.getVar("control").getForm().close();
					}
					return r;
				}
			});
			node.addClass("closeable");
			node.setExpanded(true);

			var container = new FormContainer(node);
			container.setFormUri(params.uri);
			if(params.params) {
				container.setFormParams(params.params);
			}

			// @overrides ui/forms/Home<>
			container.setVisible(false);
			container.setParent(scope.client);

			node.setText(params.title || "&nbsp;");
			node.setVar("control", container);
			node.setParent(parent || scope.tree);

			container.on({
				"formclose": function() {
					node.destroy();
				},
				"formloadstart": function() {
					node.addClass("loading");
					node.setText(params.title || "&nbsp;");
				},
				"formloadend": function() {
					node.removeClass("loading");
					if(params.callback) {
						params.callback(this._form);
					}
				},
				"formload": function() {
					var form = this._form;
					function f(evt) {
                        var text = form.getCaption();

                        if (text instanceof Array) {
                            node.setText(text.join(""));
                        } else {
                            node.setText(String.format("%H", text || params.title));
                        }
					}
					form.on("captionchanged", f);
					f();
				}
			});

			if(parent) {
				parent.setExpanded(true);
			}

			if(params.activate !== false) {
				scope.tree.setSelection([node]);
			} else if(params.lazyLoad !== true) {
				container.forceLoad();
			}

			return true;
		}
	}
}, [
    $i("client", {
		onDispatchChildEvent: Handlers["client.onDispatchChildEvent"]
    }),
    $i("tree", {
    	css: {
    	    "margin": "8px",
    		"padding-left": "16px",
    		".{./Node}": {
		        "&.loading": {
		        	"background-image": "url(/shared/vcl/images/loading.gif)",
		        	"background-repeat": "no-repeat",
		        	"background-position": "-8px 4px",
		        	">.selection": {
		        		"opacity": "0.5"
		        	},
		        	"&.selected >.text": {
		        		"font-weight": "normal"
		        	}
		        },
    			">.text": {
                	"&:focus": {
                		outline: "none"
                	},
    				// "padding-top": "2px"
    			},
    			">.selection": {
    				//height: "20px"
    				color: "red"
    			},
    			"&.disabled": {
    		        cursor: "default",
    				color: "silver"
    			},
    			"&.selected": {
    				">.selection": {
//    	    			    "background-color": "#f0f0f0"
//    	    			    "background-color": "silver"
    				},
    				">.icon": {
//        					color: "inherit"
    				},
                    ">.text": {
	    				"font-weight": "bold",
//    	    			    "background-color": "#f0f0f0",
//    	    			    color: "inherit"
    					"&:hover": {
    						">.close": {
            					visibility: "inherit",
    						}
    					}
                    }
    			}
			}
    	},
    	onNodesNeeded: Handlers["tree.onNodesNeeded"],
    	onSelectionChange: Handlers["tree.onSelectionChange"]
    })
]);