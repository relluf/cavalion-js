"util/HtmlElement, util/Fullscreen, vcl/ui/Element, vcl/ui/FormContainer";

var Fullscreen = require("util/Fullscreen");
var HtmlElement = require("util/HtmlElement");
var Element = require("vcl/ui/Element");
var FormContainer = require("vcl/ui/FormContainer");

$(["./App.openform.toast"], {
	onDispatchChildEvent: function(component, name, evt, f, args) {
		if(name === "touchstart") {
			if(!Fullscreen.hasRequested()) {
				Fullscreen.request(document.documentElement);
			}
		}
        return this.inherited(arguments);
	},
    onGetState: function() {
        var scope = this.getScope();
        var form = scope.client._form;
        if(form) {
            return form.applyVar("App.getState", [], "silent");
        }
        return {
            restore: function() {
                alert("?");
            }
        };
    },
    onSetState: function(state) {
        state && state.restore && state.restore(state);
    }

}, [
    $i("window", [
        $("vcl/ui/FormContainer", "client", {
        	formUri: "./ui/forms/Portal<>"
        }),
    ])
]);
