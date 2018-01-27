"js/defineClass, vcl/ui/Node, js/Type, entities/EM";

var Class = require("js/Class");
var NodeX = require("vcl/ui/Node"); // FIXME Node already defined?
var Type = require("js/Type");
var EventX = require("../../../../util/Event"); // Event Node already defined?
var EM = require("entities/EM");

function f(what) {
	if(what !== "module") {
		return require.apply(this, arguments);
	}
	return {id: "vcl-comps/ModelNavigator/ModelNode"};
}

var ModelNode = Class.define(f, {
    inherits: NodeX,
    
    prototype: {
        
        '@css': {
            ">.text>a": {
                color: "blue",
                'text-decoration': "underline"
            }
        },
        
        _type: "",
        _model: null,
        
        initializeNodes: function() {
            return this.inherited(arguments);
        },
        onclick: function(evt) {
            if(evt.target.nodeName === "A") {
                var entity = evt.target.textContent;
                evt.preventDefault();
                var node = this.getEntityNode(entity);
                if(node) {
                    this.getTree().setSelection([node]);
                    this.getTree().makeVisible(node);
                    node.setExpanded(true);
                }
            }
            return this.inherited(arguments);
        },
        onchildnodesneeded: function(evt) {
            var r = this.inherited(arguments);
            if(r !== false) {
                var f = this[this._type + "NodesNeeded"];
                r = f.apply(this, arguments);
            }
            return r;
        },
        modelNodesNeeded: function() {
            var keys = js.keys(this._model).sort();
            for(var k in keys) {
                var node = new ModelNode(this);
                node.setModel(this._model[keys[k]]);
                node.setType("entity");
                node.setText(keys[k]);
                node.setParent(this);
                node.setExpandable(true);
            }
        },
        entityNodesNeeded: function(model) {
            model = model || this._model;
            var keys = js.keys(model).sort();
            for(var k in keys) {
                var node = new ModelNode(this);
                var key = keys[k];
                var type = model[key].split(":")[0];
                var complex = "set,has,ref".indexOf(type) !== -1;
                node.setModel(model[key]);
                node.setType("attribute");
                if(complex) {
                    node.setText(String.format("%H: %H:<a class='entity'>%H</a>", key, type, model[key].split(":").pop()));
                } else {
                    node.setText(String.format("%H: %s", key, model[key]));
                }
                node.setParent(this);
                node.setExpandable(complex);
            }
        },
        attributeNodesNeeded: function() {
            var model = this.getRootModel();
            var entity = this._model.split(":").pop();
            return this.entityNodesNeeded(model[entity]);
        },
        getType: function(value) {
            return this._type;
        },
        setType: function(value) {
            if(this._type !== value) {
                this._type = value;
            }
        },
        getRootNode: function() {
            var node = this;
            while(node !== null && node._type !== "model") {
                node = node._parent;
            }
            return node;
        },
        getEntityNode: function(name) {
            var root = this.getRootNode();
            return root._controls.find(function(node) {
                return node.getText() === name;
            });
        },
        getRootModel: function() {
            var node = this;
            while(node !== null && node._type !== "model") {
                node = node._parent;
            }
            return node !== null ? node._model : null;
        },
        getModel: function(value) {
            return this._model;
        },
        setModel: function(value) {
            if(this._model !== value) {
                this._model = value;
            }
        }
    },
    
    properties: {}
}, true);

$(["ui/Form"], {
    align: "client",
    onLoad: function() {
        // FIXME this should be automatic?
        var scope = this.getScope();
        scope.tree.dispatch("nodesneeded", null);
        // scope.tree._controls[0].setExpanded(true);
        return this.inherited(arguments);
    },
    
}, [
    $("vcl/ui/Panel", "search-panel", {
        align: "top",
        autoSize: "height",
        css: "padding: 4px 5px;"
    }, [
        $("vcl/ui/Input", "search-input", {
            placeholder: "search",
            css: {
                width: "100%",
                border: "1px solid silver",
                padding: "2px",
                "&.searching": {
                    "background": "url(/shared/vcl/images/loading.gif) no-repeat 2px 2px",
                    "background-position": "right 4px top 5px"
                },
                "&.value": {
                    "background-color": "yellow"
                }
            },
            onDblClick: function() {
//                this.fire("onChange", [false]);
                var scope = this.getScope();
                // scope['search-list'].hide();
                this.setValue("");
            },
            onFocus: function () {
                this.fire("onChange", [!this.getInputValue()]);
            },
            onBlur: function () {
                this.fire("onChange", [false]);
            },
            onChange: function (evt) {
                var scope = this.getScope();
                var value = this.getInputValue();
                var hasChecking = scope.tree.hasClass("checking");
                var hasValue = scope.tree.hasClass("value");
                var should = typeof evt === "boolean" ? evt : (this.isFocused() && !value);

                // scope['search-list'].setVisible( !! value);

                if (should && !hasChecking) {
                    scope.tree.addClass("checking");
                    scope.tree.setTimeout("removeClass", function () {
                        scope.tree.removeClass("checking");
                    }, 2000);
                } else if (!should && hasChecking) {
                    scope.tree.setTimeout("removeClass", function () {
                        scope.tree.removeClass("checking");
                    }, 100);
                }
                if (typeof evt !== "boolean") {
                    scope.search.execute(evt);
                }
            }
        })
    ]),
    $("vcl/ui/Tree", "tree", {
        align: "client",
        onNodesNeeded: function(parent) {
            if(parent === null) {
            	var owner = this;
	        	return EM.getModel()
	        		.addCallback(function(res) {
		                var node = new ModelNode(owner);
		                node.setModel(res);
		                node.setType("model");
		                node.setText("wmbo");
		                node.setParent(owner);
		                node.setExpandable(true);
	        		});
            }
        }
    })
]);
