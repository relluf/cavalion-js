"vcl/ui/LargeIcon, vcl/ui/Node, vcl/ui/FormContainer";

$([["ui/forms/Home"]], {

	vars: {
		"ui/forms/Home": {
			createIcons: function(parent) {
				var LargeIcon = require("vcl/ui/LargeIcon");
				var me = this;

				me.destroyControls();
				parent.whenChildNodesLoaded(function() {
					parent._controls.forEach(function(node) {
						var icon = new LargeIcon(parent);
						icon.setCaption(node.getVar("vcl/ui/LargeIcon.caption") || node.getText());
						icon.setImage(node.getVar("vcl/ui/LargeIcon.icon"));
						icon.setText(node.getVar("vcl/ui/LargeIcon.text"));
						icon.setVar("node", node);
						icon.setParent(me);
					});
				});
			}
		}
	},

	onLoad: function() {
		var Node = require("vcl/ui/Node");
		var scope = this.getScope();
		var parent = this;

		var r = this.inherited(arguments);
		while(parent._owner && !(parent instanceof Node)) {
			parent = parent._owner;
		}
		if(parent instanceof Node) {
			scope.icons.apply("ui/forms/Home.createIcons", [parent]);
		}
		return r;
	}

}, [
    $i("client", [
    	$("vcl/ui/Panel", "icons", {
    		align: "client",
//    		visible: false,
	    	css: {
	    		".{./LargeIcon}": {
	    			width: "260px",
	    			height: "110px"
	    		}
	    	},
	    	onDispatchChildEvent: function(component, name, evt, f, args) {
	    		if(name === "click" && component._parent === this) {
	    			var node = component.getVar("node");
	    			node._parent.setExpanded(true);
	    			node.getTree().setSelection([node]);
	    		}
	    		return true;
	    	}
    	})
    ])

]);