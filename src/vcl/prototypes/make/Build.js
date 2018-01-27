"js/minify";

var Handlers = {
	merge_lib: function() {
        var vars = this._owner.getVars();
        vars.modules = vars.modules.concat(vars.extraModules);
        this._owner.render();
    },
    merge_app: function() {
        var vars = this._owner.getVars();
        vars.components = vars.components.concat(vars.extraComponents);
        this._owner.render();
	},
    make_app: function() {
        // FIXME This should be moved to Factory?

	    var Component = require("vcl/Component");
	    var Factory = require("vcl/Factory");
	    var Ajax = require("util/Ajax");
	    var minify = require("js/minify");

        var scope = this.getScope();
	    var ctx = requirejs.s.contexts._;
	    var source = [];
	    var count = 0;
	    var vars = this._owner.getVars();
	    
	    source.push("/*- Implicit Sources */");
	    for(var k in Factory.implicit_sources) {
	    	var v = Factory.implicit_sources[k];
	    	source.push(String.format("define(\"%s\", %s);", k, 
	    		JSON.stringify(v)));
	    }
	    
	    source.push("\n\n/*- Sources */");
	    
	    function callback(uri, text) {
	        text = text.replace(/\r/g, "");
	        if(uri.indexOf(".js") === uri.length - 3) {
	        	text = minify(text);
	        }
            source.push(String.format("define(\"%s\", %s);",
                    uri, JSON.stringify(text)));
            if(--count === 0) {
                scope['extra-components'].setValue(source.join("\n"));
            }
        }

	    vars.components.forEach(function(uri) {
	        count++;
			requirejs.undef(uri);
	    });

	    vars.components.forEach(function(uri) {
	        require([uri], function(text) {
                callback(uri, text);
	        }, function(err) {
                //callback(uri, Component.getImplicitSourceByUri(uri));
                throw err;
	        });
	    });
    }
};

$(["ui/Form"], {
    css: {
        padding: "8px",
        "textarea": {
            display: "inline-block",
            padding: "2px",
            "font-family": "lucida console, menlo, monaco",
            "font-size": "8pt",
            width: "50%",
            "max-width": "50%",
            height: "175px",
            "margin-bottom": "4px"
        },
        ".{CheckGroup}": "margin-bottom: 8px;"
    },
    caption: "Make",
    vars: {
        modules: [],
        components: [],
        implicit_components: {}
    },

    onActivate: function() {
    	this.render();
    },
    onRender: function() {
        var vars = this.getVars();
        var scope = this.getScope();
        var ctx = requirejs.s.contexts._;
        var uri;

        vars.extraModules = [];
        vars.extraComponents = [];

        ctx.modulesLoaded.forEach(function(module) {
	    	if(module.indexOf("pages/") === 0) { 
	    	} else if(vars.modules.indexOf(module) === -1) {
                vars.extraModules.push(module);
            }
        });

	    for(var k in ctx.defined) {
	    	
	    	if(k.indexOf("pages/") === 0) {
	    		
	    		// ignore, or require individual files for now
	    		
	    	} else if(k.indexOf("text!") === 0) {
	            uri = k;//k.substring("text!".length);
	            // FIXME Central rules for these things
	            if(uri.indexOf("text!make/") !== 0 && 
	            	uri.indexOf("text!vcl/prototypes/make/") !== 0) {
    	            if(vars.components.indexOf(uri) === -1) {
    	                vars.extraComponents.push(uri);
    	            }
	            }
	        // } else if(k.indexOf("!") === -1 && vars.modules.indexOf(k) === -1) {
         //       vars.extraModules.push(k);
	        }
	    }

        scope.modules.setValue(JSON.stringify(vars.modules));
        scope.components.setValue(JSON.stringify(vars.components));

        scope['extra-modules'].setValue(vars.extraModules.join("\n"));
        scope['extra-components'].setValue(vars.extraComponents.join("\n"));
    }
    
}, [
    $("vcl/ui/Group", {}, [
        $("vcl/ui/CheckGroup", "lib.js", {
            text: "lib.js",
            expanded: true
        }, [
            $("vcl/ui/Group", {}, [
                $("vcl/ui/Input", "modules", {
                    element: "textarea"
                }),
                $("vcl/ui/Input", "extra-modules", {
                    element: "textarea"
                }),
            ]),
            $("vcl/ui/Button", {
                content: "Merge",
                onClick: Handlers.merge_lib
            })
        ]),
        $("vcl/ui/CheckGroup", "app.js", {
            text: "app.js",
            expanded: true
        }, [
            $("vcl/ui/Group", {}, [
                $("vcl/ui/Input", "components", {
                    element: "textarea"
                }),
                $("vcl/ui/Input", "extra-components", {
                    element: "textarea"
                }),
                $("vcl/ui/Input", "implicit-components", {
                    element: "textarea"
                })
            ]),
            $("vcl/ui/Button", {
                content: "Merge",
                onClick: Handlers.merge_app
            }),
            $("vcl/ui/Button", {
                content: "Make",
                onClick: Handlers.make_app
            })
        ])
    ])
]);
