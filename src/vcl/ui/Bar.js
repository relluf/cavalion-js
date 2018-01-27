define(["require", "js/defineClass", "./Panel"], function(require, Bar, Panel) {
	
	return (Bar = Bar(require, {

		inherits: Panel,

		prototype: {
			"@css": {
				padding: "4px 6px",
	            overflow: "hidden", 			// that's the whole point of this control
				">div.overflow_handler": {
					display: "none",
                    top: "4px",
					right: "2px",
					width: "18px",
					"text-align": "center",
                    position: "absolute",
                    //border: "1px solid black",
                    "&:active": {
                    	//"padding-top": "4px"
                    	border: "1px inset",
                    	"background-color": "white"
                    }
				},
	            "&.overflowing": {
					"padding-right": "20px", 	// width of the overflow_handler
					">div.overflow_handler": {
						display: "block"
		            }
				}
			},

			_autoSize: "height",
			_align: "top",
			_content: "<div class=\"overflow_handler\">&#187;</div>",

			/**
			 *
			 * @returns
			 */
            checkOverflow: function () {
            	if(this.hasOwnProperty("_node")) {
                    var overflowing = this._node.scrollHeight/* - this._node.offsetHeight*/ > this._node.offsetHeight;
                    var has = this.hasClass("overflowing");
                    if(overflowing === true && has === false) {
                    	this.addClass("overflowing");
                    } else if(overflowing === false && has === true) {
                    	this.removeClass("overflowing");
                    }

                    if (this.hasOwnProperty("_controls") && this._controls.length > 1 && overflowing === true) {
                        var selected = this.getSelectedControl(1);
                        while(selected) {
                            var ar0 = this._controls[0].getAbsoluteRect();
                            var arS = selected.getAbsoluteRect();
                            if (arS.top > ar0.top) {
                            	var index = selected.getIndex() - 1;
                            	if(index >= 0) {
                            		this._controls[index].setIndex(this._controls.length - 1);
                            	}
                            } else {
                            	selected = null;
                            }
                        }
                        // if(selected) {
                        //     var ar0 = this._controls[0].getAbsoluteRect();
                        //     var arS = selected.getAbsoluteRect();
                        //     if (arS.top > ar0.top) {
                        //         /*- the selected control appears below the first control, therefore it is not visible find the last control to appear on the first line */
                        //         var index = 1;
                        //         var tops = [ar0.top];
                        //         while (index < this._controls.length && this._controls[index].getAbsoluteRect().top === ar0.top) {
                        //             tops.push(this._controls[index].getAbsoluteRect().top);
                        //             index++;
                        //         }
                        //         // console.log("selected is overflowing on the next line, setting new index to: " + (index - 1) + " " + tops.join(","));
                        //         selected.setIndex(index - 1);
                        //         if (index !== 0) {
                        //             /*- check again because text might be too long to fit */
                        //             this.checkOverflow();
                        //         }
                        //     }
                        // }
                    }
            	}
            },
            
            /**
             * @overrides ../../Control.prototype.intializeNodes
             */
            initializeNodes: function() {
            	this._nodes.overflow_handler = this._node
            		.querySelector(".overflow_handler");
            	return this.inherited(arguments);
            },

            /**
             * @overrides ../../Control.prototype.insertControl
             */
            insertControl: function (control, index) {
                var r = this.inherited(arguments);
                this.setTimeout("checkOverflow", 200);
                return r;
            },

            /**
             * @overrides ../../Control.prototype.removeControl
             */
            removeControl: function (control, index) {
                var r = this.inherited(arguments);
                this.setTimeout("checkOverflow", 200);
                return r;
            },

            /**
             * @overrides ../../Control.prototype.onresize
             */
            onresize: function () {
                this.setTimeout("checkOverflow", 0);
                return this.inherited(arguments);
            },
            
            onclick: function(evt) {
            	var r = this.inherited(arguments);
            	if(r !== false) {
	            	if(evt.target === this._nodes.overflow_handler) {
	            		alert(1);
	            	}
            	}
            	return r;
            }

		},

		properties: {

		},

		statics: {


		}
	}));
});