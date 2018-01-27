$([], {

	css: {
		"input.{./Input}": {
			"background-color": "#ffffe",
			"font-size": "16pt"
		}
	},

	onLoad: function() {
		var scope = this.getScope();
		//this.query("menubar/[action=commit]")
		scope.menubar._controls[0].setIndex(scope.menubar._controls.length - 2);
		return this.inherited(arguments);
	},

	onCaptionChanged: function() {
		var scope = this.getScope();
		var caption = this.getCaption();
		scope.caption.setContent(String.format("<b>%H</b>", caption));
		return this.inherited(arguments);
	},

	onDispatchChildEvent: function(component, name, evt, f, args) {
		if(name === "keyup") {
			var scope = this.getScope();
			if(evt.keyCode === 13 && scope.commit.isEnabled()) {
				scope.commit.execute();
			} else if(evt.keyCode === 27) {
				scope['@owner'].close();
			}
		}
	}


}, [

    $i("left", {
    	css: {
    		width: "175px"
    	}
    }),

    $i("description", {content: ""}),

    $i("remove", {
    	visible: false
    }),

    $i("revert", {
    	visible: false
    }),

    $("vcl/ui/Panel", "top", {
    	align: "top",
    	autoSize: "height",
    	css: {
    	    padding: "0 8px 0 8px",
    	    "border-bottom": "1px solid silver"

    	},
    	onLoad: function() {
    		this.setIndex(0);
    	}
    }, [
        $("vcl/ui/Element", "caption_busy", {
        	action: "busy",
        	css: "display: inline-block",
        	content: "<img src='/shared/vcl/images/loading.gif'>&nbsp;"
        }),
        $("vcl/ui/Element", "caption", {
        	css: {
        		padding: "8px",
        		display: "inline-block"
        	}
        }),
	    $i("menubar", {
	        align: "right",
	        onLoad: function() {
	            var scope = this.getScope();
	            this.setParent(scope.top);
	        }
	    })
    ])

]);