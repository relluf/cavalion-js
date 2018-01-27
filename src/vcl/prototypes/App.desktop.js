"util/HtmlElement";

var HE = require("util/HtmlElement");

$([], {
    // onLoad: function() {
    //     var Ace = require("vcl/ui/Ace");
    //     var Method = require("js/Method");

    //     /*- disable Ctrl+Shift+D */
    //     Method.override(Ace.prototype, "onnodecreated", function() {
    //         var r = this.inherited(arguments);
    //         this._editor.commands.removeCommand("duplicateSelection");
    //         return r;
    //     });

    //     return this.inherited(arguments);
    // }

}, [

    $i("client", {
        formUri: "ui/forms/Portal<>",
        onFormLoad: function() {
            if(window.navigator.platform === "MacIntel") {
                HE.addClass(document.body, window.navigator.platform);
            }
        }
    })
]);