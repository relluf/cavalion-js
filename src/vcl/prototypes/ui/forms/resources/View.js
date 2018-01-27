"vcl/ui/Node, util/Command, js/Deferred";

$(["ui/forms/Home"], {
	caption: "Resources",
	onLoad: function() {
		var Node = require("vcl/ui/Node");
		var Command = require("util/Command");
//		var Deferred = require("js/Deferred");
//		var scope = this.getScope();

		var base = this.getVar("base", true) || "";
		debugger;
		var node = this._owner;
		while(node !== null && !(node instanceof Node)) {
			node = node._owner;
		}
		node.setVar("resources/Resource.path", "C:/Users/ralph/Source/veldapps.com");
		node.setExpandable(true);

		var lists = {};
		this.setVar("resources/Resource", {
			list: function(path) {
				if(lists[path] === undefined) {
					lists[path] = Command.execute(
							base + "rest/resources/Resource.list",
							path ? {path: path} : {});
				}
				return lists[path];
			},
			refresh: function(path) {
				delete lists[path];
			}
		});
		return this.inherited(arguments);
	}
}, [
    $("vcl/Action", "list_refresh", {
    	content: "Refresh",
    	hotkey: "F5",
    	onExecute: function(evt) {
			var scope = this.getScope();
    		var selection = this.apply("vcl/ui/Tree.getSelection", []);
    		var node;
			if(selection && (node = selection[0])) {
				var path = node.getVar("resources/Resource.path");
    			this.apply("resources/Resource.refresh", [path]);
    			scope.resources.setBusy(true);
    			node.reloadChildNodes(function() {
    				node.getTree().dispatch("selectionchange", selection);
    				scope.resources.setBusy(false);
    			});
			}
    	}
    }),
    $("vcl/Action", "item_open", {
    	content: "Open"
    }),
    $("vcl/Action", "item_remove", {
    	content: "Remove"
    }),
	$("vcl/data/Array", "resources", {}),
    $i("description", {
    	content: "Manage the resources which are available to the " +
    			"current user. Available resources include recources which are " +
    			"inherited through roles."
    }),
    $i("tree", {

    	css: {
    		"padding-left": undefined,
    		"overflow-x": undefined,
    		".{./Node}": {
    			">.icon": {
    				width: "30px",
	                "background-repeat": "no-repeat",
	                "background-position-x": "right",
	                "background-position-y": "2px",
    			},
    			"&.folder >.icon": {
    				"background-image": "url(images/folder16.png)",
    			},
    			"&.file >.icon": {
                    "background-image": "url(images/file16.png)",
                }
            }
    	},

    	onSelectionChange: function(selection) {
    		var scope = this.getScope();
    		if(selection.length === 1) {
				var node = selection[0];
				scope.resources.setBusy(true);
				node.childNodesNeeded();
    			this.apply("resources/Resource.list", [selection[0].getVar("resources/Resource.path")]).
    				addCallback(function(res) {
    					// Figure out whether selection has changed
    					var tree = node.getTree();
    					if(tree && tree.getSelection()[0] === node) {
    						scope.resources.setArray((res || []).filter(function(item) {
    							return true;//item.type.indexOf("Folder") === -1;
    						}).sort(function(i1, i2) {
    							var f1 = i1.type.indexOf("Folder") !== -1;
    							var f2 = i2.type.indexOf("Folder") !== -1;
    							if(f1 !== f2) {
    								return f1 ? -1 : 1;
    							}
    							return i1.name < i2.name ? -1 : 1;
    						}));
    						scope.resources.setBusy(false);
    					}
    					return res;
    				});
    		}
//    		this.log("ui/forms/persistence/View - onSelectionChange");
    		return this.inherited(arguments);
    	},

    	onNodesNeeded: function(parent) {
    		var Node = require("vcl/ui/Node");
    		var owner = this._owner;

    		var path = parent.getVar("resources/Resource.path");
    		var control = parent.getVar("control");
    		var r = this.apply("resources/Resource.list", [path]).
    			addCallback(function(res) {
    				parent.setExpandable(res.length > 0);
    				res.forEach(function(item) {
    					if(item.type.indexOf("Folder") !== -1) {
	    					var node = new Node(owner);
	    					node.setText(item.name);
	    					node.setVar("resources/Resource", item);
	    					node.setVar("control", control);
	    					node.addClass(item.type.indexOf("Folder") === -1 ? "file" : "folder");
	    					node.setExpandable(true);
	    					node.setParent(parent);
    					}
    				});
    				return res;
    			});
    		return r;
    	}
    }),
    $i("menubar", {}, [
        $("vcl/ui/Button", "button_open", {
        	action: "item_open",
            css: "font-weight: bold;",
            enabled: false
        }),
        $("vcl/ui/Button", "button_new", {
            action: "item_remove",
            enabled: false
        }),
        $("vcl/ui/Button", "button_refresh", {
            action: "list_refresh"
        }),
    ]),
    $i("client", {}, [
        $("vcl/ui/List", {
        	action: "item_open",
        	source: "resources",
        	css: {
        		".{./ListRow}": {
	        		"&.folder > .ListCell.name": {
	        			'padding-left': "20px",
	    				background: "url(images/folder16.png) no-repeat 2px,5px"
	        		},
	        		"&.file > .ListCell.name": {
	        			'padding-left': "20px",
	    				background: "url(images/file16.png) no-repeat 2px,5px"
	        		}
        		}
        	},

        	onDragEnter: function(evt) {
				evt.stopPropagation();
				evt.preventDefault();
        	},

        	onDragOver: function(evt) {
				evt.stopPropagation();
				evt.preventDefault();
        	},

        	onDragLeave: function(evt) {

        	},

        	onDrop: function(evt) {
        		console.log(evt.dataTransfer.files[0]);
				evt.stopPropagation();
				evt.preventDefault();
        	},

        	onGetRowClasses: function(row) {
        		if(row !== -1) {
	        		var v = this._source.getAttributeValue("type", row._rowIndex);
	        		return (v !== undefined && v.indexOf !== undefined &&
	        				v.indexOf("Folder") === -1) ? "file" : "folder";
        		}
        	},

    		onSelectionChange: function(evt) {
    			var scope = this.getScope();
    			var enabled = evt.newValue.length > 0;
    			scope.item_open.setEnabled(enabled);
    			scope.item_remove.setEnabled(enabled);
    		},

        }, [
            $("vcl/ui/ListColumn", {
            	attribute: "name",
            	content: "Name",
            	css: {
                	width: "300px"
            	}
            }),
            $("vcl/ui/ListColumn", {
            	attribute: "type",
            	content: "Type"
            }),
            $("vcl/ui/ListColumn", {
            	attribute: "created",
            	content: "Created"
            }),
            $("vcl/ui/ListColumn", {
            	attribute: "modified",
            	content: "Modified"
            }),
            $("vcl/ui/ListColumn", {
            	attribute: "size",
            	content: "Size"
            }),
            $("vcl/ui/ListColumn", {
            	attribute: "rules",
            	content: "Access"
            }),
            $("vcl/ui/ListColumn", {
            	attribute: "users",
            	content: "Shared With"
            })
        ])
    ])
]);
