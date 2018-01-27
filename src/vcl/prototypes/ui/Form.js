"vcl/ui/Button";

$("vcl/ui/Form", {
	tabIndex: 1, // make sure that it can receive keyboard events
	css: {
		// "background": "-webkit-linear-gradient(top, rgb(252, 252, 252) 0%, rgb(255, 255, 255) 50%, #fafafa 100%)",
		"font-family": "Lucida Grande, Arial, sans-serif",
		"font-size": "9pt",
		".{./Button}": {
			"font-family": "Lucida Grande, Arial, sans-serif",
			"font-size": "9pt"
		}
	},

    onReceiveParams: function(params) {
        var scope = this.getScope();
        if (params.canClose !== undefined) {
            scope.form_close.setEnabled(params.canClose === true);
            scope.form_close.setVisible(params.canClose === true);
        }
        return this.inherited(arguments);
    }
}, [
    $("vcl/Action", "form_close", {
        content: "Close",
        left: 96,
        top: 32
    }),
    $("vcl/Action", "url_state_push", {
        left: 96,
        top: 72
    }),
    $("vcl/Action", "url_state_pop", {
        left: 96,
        top: 112
    })
]);