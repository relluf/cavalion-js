define(function (require) {

    var Tree = require("js/defineClass");
    var Node = require("./Node");
    var Panel = require("./Panel");
    var Type = require("js/Type");
    var Event = require("../../util/Event");
    var HtmlElement = require("../../util/HtmlElement");
    var jquery = require("jquery");

    var platform = window.navigator.platform;

    return (Tree = Tree(require, {

        inherits: Panel,

        prototype: {

            '@css': {
            	"padding-left": "0",
                "-webkit-user-select": "none",
                "margin": "0",
                "line-height": "15px",
                ".{./Node}": {
    		        display: "block",
                    "list-style-type": "none",
                    "white-space": "nowrap",
                    ">.close": {
                    	position: "absolute",
                    	right: "4px",
                    	"padding-top": "4px",
                    	cursor: "pointer",
                    	display: "none"
                    },
                    ">ol": {
                        "margin": "0",
                        "display": "none",
                        "padding-left": "18px",
                        "-webkit-padding-start": "18px"
                    },
                    "&.closeable>.close": {
                    	display: "block"
                    },
                    "&.expanded>ol": {
                    	"display": "block"
                    },
                    ">.selection": {
                        position: "absolute",
                        left: "0",
                        right: "0",
                        height: "20px",
                        "z-index": "0",
                        "border-radius": "3px",
                        "pointer-events": "none"//,display:"none"
                    },
                    ">.icon": {
                        display: "inline-block",
                        height: "20px",
                        width: "12px",
                        "padding-top": "3px",
                        "vertical-align": "top",
                        "&::before": {
                            content: "' '",
                            display: "inline-block",
                            "font-size": platform === "MacIntel" ? "1.4em" : "1.75em",
                            //"margin-top": platform === "MacIntel" ? "-2px" : "-8px",
                            "padding-left": platform === "MacIntel" ? "2px" : "0"
                        }
                    },
                    ">.text": {
                    	cursor: "pointer",
                        position: "relative",
//        				width: "100%",
                        display: 'inline-block',
                        "margin-left": "2px",
                        padding: "4px 4px 2px 4px"
                    },
                    "&.selected": {
                        ">.selection": {
                            "background-color": "rgb(56, 121, 217)"
                        },
                        ">.text": {
                            "background-color": "rgb(56, 121, 217)",
                        	"padding-bottom": "1px",
                        	"margin-bottom": "1px",
                            // "padding-left": "4px",
                            // "padding-right": "4px",
                            "border-radius": "3px",
                            color: "white"
                        },
                        ">.close": {
                            color: "white",
                            "background-color": "rgb(56, 121, 217)",
                            "font-weight": "bold"
                        },
                        ">.icon": {
                            opacity: "0.9",
                            color: "white"
                        }
                    },
					"&.expanding": {
						background: "url(/shared/vcl/images/loading.gif) no-repeat right",
                        ">.selection": {
							"background-image": "url(/shared/vcl/images/loading.gif)",
							"background-repeat": "no-repeat",
							"background-position": "right"
                        },
						">.text": {
						}
					},
                    "&.expandable:not(.expanding)": {
                        ">.icon::before": {
                            content: "'▸'" // http://www.alanwood.net/unicode/geometric_shapes.html
                        }
                    },
                    "&.expandable.expanded:not(.expanding)": {
                        ">.icon::before": {
                            content: "'▾'" // http://www.alanwood.net/unicode/geometric_shapes.html
                        }
                    },
                    ">.container": {
                        "padding-left": "12px"
                    }
                }
            },

            _align: "client",
            /** @overrides ./Panel.prototype._focusable */
            _focusable: true,
            _onSelectionChange: null,
            _onNodesNeeded: null,
            _selection: [],
            _element: "ol",
            
            constructor: function() {
                var tree = this;
                
                this._history = [];
                this._history.pointer = 0;
                this._history.back = function() {
                    if(this.pointer > 0) {
                        tree.setSelection(this[(--this.pointer) - 1] || [], false);
                    }
                };
                this._history.forward = function() {
                    if(this.pointer < this.length) {
                        tree.setSelection(this[this.pointer++], false);
                    }
                };
                this._history.push = function() {
                    this.splice(this.pointer);
                    this.pointer += arguments.length;
                    return Array.prototype.push.apply(this, arguments);
                };
            },
            insertControl: function (control) {
            /**
             * @overrides ../Control.prototype.insertControl
             */
                if (! (control instanceof Node)) {
                    throw new Error("Only Node instances can be nested in a Tree");
                }
                return this.inherited(arguments);
            },
            removeControl: function(control) {
            /**
             * @overrides ../Control.prototype.removeControl
             */
				var selection = this.getSelection(), index;
				if((index = selection.indexOf(control)) !== -1) {
					selection.splice(index, 1);
					this.setSelection(selection);
				}
                return this.inherited(arguments);
            },
            dispatchChildEvent: function (component, name, evt, f, args) {
            /**
             * @overrides ../Control.prototype.dispatchChildEvent
             */
                var r = this.inherited(arguments);
                if (r !== false && component instanceof Node && component.isEnabled()) {
                    if (name === "keyup") {
                        r = this.onnodekeyup(evt);
                    } else if (name === "click") {
                        var rect = HtmlElement.getAbsoluteRect(component._nodes.icon);
                        if(rect.left < evt.clientX && 
                            rect.left + rect.width > evt.clientX && 
                            rect.top < evt.clientY && 
                            rect.top + rect.height > evt.clientY) {
                        	// Node.prototype.onclick will handle event
                        } else {
                            this.setSelection([component]);
                        }
                    } else if(name === "dblclick") {
                        this.setSelection([component]);
                    }
                }
                return r;
            },
            loaded: function() {
            /** @overrides ../Component.prototype.loaded */
            	this.invalidateSelection();	
            	return this.inherited(arguments);	
            },
            invalidateSelection: function() {
            	var selection = [];
            	function loop(control) {
        			if(control.isSelected()) {
        				selection.push(control);
        			}
        			control._controls && control._controls.forEach(loop);
            	}
            	loop(this);
            	this.setSelection(selection);
            },
            refresh: function() {
                this.destroyControls();
                this.dispatch("nodesneeded", null);
            },
			makeVisible: function(childNode) {
			    var node = this.nodeNeeded();
			    var pos = jquery(childNode.nodeNeeded()).position();
			    var top = this.getAbsoluteRect().height / 3;
			    node.scrollTop -= (top - pos.top);
            },
            
            onnodekeyup: function(evt) {
                if(Event.eventModifiersMatch(evt, [])) {
                    if(evt.keyCode === evt.KEY_F5) {
                        this._selection.forEach(function(node) {
                            node.reloadChildNodes();
                        });
                    }
                } else if(Event.eventModifiersMatch(evt, ["alt"])) {
                    if(evt.keyCode === evt.KEY_LEFT_ARROW) {
                        console.log("alt <-");
                        this._history.back();
                    } else if(evt.keyCode === evt.KEY_RIGHT_ARROW) {
                        console.log("alt ->");
                        this._history.forward();
                    }
                }
            },
            onkeyup: function(evt) {
                if(evt.keyCode === evt.KEY_F5) {
                	this.refresh();
                }
                return this.inherited(arguments);
            },
            onclick: function (evt) {
            /**
             * @overrides ../Control.prototype.onclick
             */
                var r = this.inherited(arguments);
                if (r !== false) {
                    this.setSelection([]);
                }
                return r;
            },
            onselectionchange: function () {
                return this.fire("onSelectionChange", [this.getSelection()]);
            },
            onnodesneeded: function (parent) {
                return this.fire("onNodesNeeded", [parent]);
            },
            
            getSelection: function () {
                return [].concat(this._selection);
            },
            setSelection: function (value, allow_history) {
                // FIXME do some smart selection comparing, only (de)select what is needed...
                
            	if(value.length === this._selection.length) {
            		var same = true;
            		for(var i = 0; i < value.length && same; ++i) {
            			same = value[i] === this._selection[i];
            		}
            		if(same) {
            			return;
            		}
            	}

                this._selection.forEach(function (node) {
                    node.setSelected(false);
                });
                this._selection = value;
                this._selection.forEach(function (node) {
                    node.setSelected(true);
                });

                allow_history !== false && this._history.push(this._selection);

                // FIXME do dispatch if order of selected nodes was changed
                this.dispatch("selectionchange", this._selection);
            }

        },

        properties: {
        	"focusable": {
        		type: Type.BOOLEAN,
        		set: Function
        	},
            "onSelectionChange": {
                type: Type.EVENT
            },
            "onNodesNeeded": {
                type: Type.EVENT
            }
        }

    }));

});
