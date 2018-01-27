$([], {
	onToast: function(options) {

		var scope = this.getScope();
		var elem = new Element(this);

		var timeout = options.hasOwnProperty("timeout") ? options.timeout : 1500;
		var content = options.content || "No toast content";
		var classes = options.classes || "fade";

		if(options.title !== undefined) {
			content = String.format("<b>%s</b><div>%s</div>",
					options.title, content);
		}

		elem.setContent(content);
		elem.setParent(scope.toasts);
		elem.addClasses(classes);
		elem.update(function() {
			elem.addClass("appear");
		});

		var controller = {
			element: elem,

			remove: function(timeout_) {
				elem.setTimeout("disappear", function() {
					var h = elem.on("transitionend", function() {
						elem.un(h);
						elem.setParent(null);
					});
					elem.replaceClass("appear", "disappear");
				}, timeout_ !== undefined ? timeout_ : timeout);
			}
		};

		if(timeout) {
			controller.remove();
		}

		return controller;
	}
}, [
    /* TODO make a seperate component, pluggable stuff */
    $("vcl/ui/Panel", "toasts", {
    	parent: "window",
    	autoSize: "both",
    	autoPosition: "top-left-bottom-right",
    	css: {
	   		".right-half-size-switch": {
				height: "15px",
				width: "20px",
				display: "inline-block",
				float: "right",
    			transform: "scale3d(0.5, 0.5, 1) translate3d(0, -9px, 0)"
			},
			right: "0",
    		left: "0",
    		bottom: "40px",
    		"z-index": "20000",
    		font: "10pt arial",
    		"pointer-events": "none",
    		".{./Element}": {
    			"pointer-events": "all",
    			"a": {
    				"text-decoration": "underline",
    				cursor: "pointer"
    			},
    			//"background-color": "rgb(47, 150, 180)",
    			"background-color": "white",
    			opacity: "0.75",
    			color: "black",
    			padding: "8px",
    			"padding-bottom": "7px",
    			margin: "4px",
    			//"min-width": "300px",
    			"float": "right",
    			"clear": "both",
    			//"margin-left": "auto",
    			//"margin-right": "auto",
        		"&.box-shadow": {
        			"box-shadow": "0 1px 5px rgba(0,0,0,0.65)",
        			"border-radius": "4px"
        		},

        		"&.no-clear": "clear: none;",

    			"&.fade": {
    				opacity: "0",
    				transition: "opacity 1s ease",
    			},
    			"&.appear": {
    				opacity: "1"
    			},
    			"&.disappear": {

    			},
    			"&:hover": {
    				opacity: "1"
    			},
    			"&.loading-right": {
    				"background-image": "url(/shared/vcl/images/loading.gif)",
    				"background-position": "95% center",
    				"background-repeat": "no-repeat",
    				"padding-right": "32px"
    			},
        		"&.padding-right-20px": {
        			"padding-right": "20px"
        		},
    		}
    	}
    })
]);