$(["ui/Form"], {
    activeControl: "console", // necessary for the initial state
	caption: "Debug",
	onActivate: function() {
	    this.getScope().console.setFocus();
	},
	onLoad: function() {
	    var Component = require("vcl/Component");
	    var Factory = require("vcl/Factory");
	    
	    var scope = this.getScope();
	    var ctx = requirejs.s.contexts._;
	    
	    var factories = {};
	    var texts = {};
	    var source = [];
	    
	    for(var k in ctx.defined) {
	        var uri;
	        if(k.indexOf("vcl/Factory!") === 0) {
	            factories[k] = ctx.defined[k];
	            uri = factories[k]._uri;
	            try {
	                texts[k] = require(Factory.makeTextUri(uri));
	            } catch(e) {
	                texts[k] = Component.getImplicitSourceByUri(uri);
	            }
	            source.push(String.format("define('%s', %s);", Factory.makeTextUri(uri), JSON.stringify(texts[k])));
	        }
	    }
	    
	    scope.console.print("requirejs.s.contexts._", ctx);
	    scope.console.print("factories", factories);
	    scope.console.print("texts", texts);
	    
	    scope.editor.setValue(source.join("\n"));
	}
}, [
    $("vcl/ui/Console", "console"),
    
    $("vcl/ui/Ace", "editor", {
        align: "right",
        width: 300,
        onLoad: function() {
            var ed = this.getEditor();
            ed.setTheme("ace/theme/eclipse");
            ed.renderer.setHScrollBarAlwaysVisible(false);
            ed.setScrollSpeed(2);
    
            var session = ed.getSession();
            session.setMode("ace/mode/javascript");
            session.setUseWrapMode(true);
            session.setWrapLimitRange(null, null);
        }
    })
]);