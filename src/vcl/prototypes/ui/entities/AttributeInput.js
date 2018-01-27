$("vcl/ui/Group", {

    onLoad: function() {
    	var scope = this.getScope();
        var owner_scope = this._owner.getScope();

        /*- FIXME input and owner_scope.instance are required, 
        	how to define an interface/documentation for it? 
        */
        scope.input.setSource(owner_scope.instance);

		return this.inherited(arguments);
    },

	onDispatchChildEvent: function(component, name, evt, f, args) {

		var owner = this._owner;

		function render() {
		    var scope = owner.getScope();
		    var control = owner.getVar("activeControl");
		    var element = scope.description;
		    if(control !== undefined) {
		        element.setContent(control.getVar("description"));
		        element.setVisible(true);
		    } else {
		    	element.setContent(element.getPropertyValue("content"));
		    }
		}

	    if(name === "blur") {
	        owner.removeVar("activeControl");
	        owner.setTimeout("render", render, 200);
	    } else if(name === "focus") {
	        owner.setVar("activeControl", component);
	        owner.setTimeout("render", render, 200);
	    }

		return this.inherited(arguments);
	}

}, []);