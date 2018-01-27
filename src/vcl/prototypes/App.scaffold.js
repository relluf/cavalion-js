"vcl/ui/FormContainer";

console.warn("DEPRECATED");

$([], {
	onLoad: function() {
		var FormContainer = require("vcl/ui/FormContainer");

		js.override(FormContainer.prototype, "getSpecializedFormUri", function() {
			var uri = this.inherited(arguments);
			/*- TODO make this foolproof by making use of Component.getKeysByUri */
			if(uri.indexOf(".scaffold") === -1) {
				uri += ".scaffold";
			}
			return uri;
		});
	
		/*- FIXME After months of not working on this project, I find this 'bug',
		ie. inherited not being called, a little weird. Maybe scaffold resources
		had to be parsed last? */
		return this.inherited(arguments);
	}

}, []);