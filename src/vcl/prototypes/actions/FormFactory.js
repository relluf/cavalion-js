$("vcl/Action", {
	'@require': ["vcl/ui/FormContainer", "vcl/ui/Tab"],
    vars: {
		type: "tabbed/...",
		closeable: "default for Tab.closeable if not specified in params",
		parents: {
			container: "reference to parent of to be created FormContainers",
			tab: ""
		}
    },
	onExecute: function(evt) {
		if(this.getVar("type") === "tabbed") {
			var Tab = require("vcl/ui/Tab");
			var FormContainer = require("vcl/ui/FormContainer");

			var scope = this.getScope();
			var tab = new Tab(this._owner);
			var fc = new FormContainer(tab);
			
			var params = evt ? evt.params || {} : {};

			tab.setCloseable(params.closeable || this.getVar("closeable") || true);
			tab.setControl(fc);
			tab.setParent(scope[this.getVar("parents.tab")]);
			tab.setText(params.name);

			tab.override({
				oncloseclick: function() {
					this._control._form.close();
				},
				setSelected: function() {
					var r = this.inherited(arguments);
					if(this.isSelected()) {
						this.getApp().pushState();
					}
					return r;
				}
			});

			fc.setVisible(false);
			fc.setParent(scope[this.getVar("parents.container")]);
			fc.setFormUri(evt.formUri || this.getVar("formUri"));
			fc.override({
				dispatchChildEvent: function(component, name, evt, f, args) {
					if(name.indexOf("form") === 0) {
						//this.log(name);
						if(name === "formclose") {
							component._owner.destroy();
						}
					}
					return this.inherited(arguments);
				}
			});
			if(evt.formParams) {
				fc.setFormParams(evt.formParams);
			}
			tab.setSelected(evt.selected !== false);

			return tab;
		}
	}
});