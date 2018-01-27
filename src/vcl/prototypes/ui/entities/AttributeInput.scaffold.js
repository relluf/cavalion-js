$([], {

	onMessage: function(name, message, sender) {
		var scope = this.getScope();

        if(name === "scaffold") {
		    var scaffold = message.scaffold;

			scope.label.setContent(String.format("%s:", scaffold.get(
					"%entity.attributes.%name.display_label.%type")));
			scope.input.setVar("description", scaffold.get(
			        "%entity.attributes.%name.hint"));
			scope.input.setSourceAttribute(scaffold._context.name);

		    this.setVar("scaffold", scaffold);
		}

		return this.inherited(arguments);
	},

}, []);