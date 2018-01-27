"vcl/Dragger";
	
$("vcl/ui/Element", {
	draggable: true,
	css: {
		position: "absolute",
    	top: "0",
    	right: "0",
    	"background-repeat": "no-repeat",
    	"background-position": "center",
		"&.horizontal": {
	    	"background-image": "url(/shared/vcl/images/statusbarResizerHorizontal.png)",
	    	cursor: "ew-resize",
	    	height: "24px",
	    	width: "16px"
		},
		"&.vertical": {
    		"background-image": "url(/shared/vcl/images/statusbarResizerVertical.png)",
        	cursor: "ns-resize",
        	height: "8px",
        	"margin-top": "7px",
        	width: "20px"
		}
	},
	onLoad: function() {
		var control = this.getVar("control");
		if(!(control instanceof require("vcl/Control"))) {
			var scope = this.getScope();
			this.setVar("control", scope[control] || this);
		} else {
			// FIXME?
			console.log("skipped");
		}
		return this.inherited(arguments);
	},
	onDraggerNeeded: function() {
		var control = this.getVar("control");
		var dragger = new (require("vcl/Dragger"))(this);
		var horizontal = this.hasClass("horizontal");

		dragger.setCursor(horizontal ? "ew-resize" : "ns-resize");
		dragger.override({
			updateHandles: function(evt) {
				if(horizontal === true) {
    			    if(!control.getVisible()) {
    			        control.setVisible(true);
    			        control.setWidth(0);
    			    }
					control.setWidth(control.getWidth() + (evt.clientX - this._sx));
				} else {
    			    if(!control.getVisible()) {
    			        control.setVisible(true);
    			        control.setHeight(0);
    			    }
					control.setHeight(control.getHeight() - (evt.clientY - this._sy));
				}
				this._sx = evt.clientX;
				this._sy = evt.clientY;
			}
		});
		return dragger;
	}
});