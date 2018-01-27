"dygraphs/Dygraph, js";

var Dygraph = require("dygraphs/Dygraph");
var js = require("js");

function draw(data, options) {
/* TODO describe usage:
	-vars: { graph, data, options }
*/
    var graph = this.getVar("graph");
    if (graph !== undefined) {
    	try {
        	graph.destroy();
    	} catch(e) {
    		console.error(e);
    	}
    }
    
    this.clearTimeout("update-history");

    if (data === undefined) {
        data = this.getVar("data");
        if (data === undefined) {
            return;
        }
    } else {
        this.setVar("data", data);
    }

    if (options === undefined) {
        options = this.getVar("options");
    } else {
        this.setVar("options", options);
    }

    var node = this.scope().host.getNode(), me = this;
    try {
        this.setVar("graph", new Dygraph(node, data, js.mixIn({
            rollPeriod: 1,
            showRoller: true,
            // customBars: true,
            
	        highlightCircleSize: 2,
	        strokeWidth: 1,
	        // strokeBorderWidth: isStacked ? null : 1,
	        // labelsDivWidth: 0, ??
	        
			highlightSeriesOpts: {
				strokeWidth: 3,
				strokeBorderWidth: 1,
				highlightCircleSize: 5
			},
			
			drawCallback: function(g, is_initial) {
				var history = me.getVar("history"), scope = me.scope(), b;
				if(history.block) {
					if(--history.block === 0) {
						delete history.block;
					}
					scope.back.update();
					scope.forward.update();
				} else {
					me.setTimeout("update-history", function() {
						var item = {x: g.xAxisRange(), y: g.yAxisRange()};
						var current = history[history.index];
						if(item.x[0] === 0) return;
						if(!current || (current.x[0] !== item.x[0] || current.x[1] !== item.x[1] || current.y[0] !== item.y[0] || current.y[1] !== item.y[1])
						) {
							history.splice(history.index + 1);
							history.index = history.push(item) - 1;
							scope.back.update();
							scope.forward.update();
						}
					}, 450);
				}
			},

            // legend: "always",
            axisLabelFontSize: 10,
            // showRangeSelector: true
        }, options || {})));
    } catch(e) {
    	console.error(e);
    	/*- TODO prevent construction */
    	this.removeVar("graph");
    }
}

$(["./LineChart"], {
    vars: { 
    	clear: function() {
		    this.clearTimeout("update-history");
		    
		    var graph = this.removeVar("graph");
		    if (graph !== undefined) {
		    	try {
		        	graph.destroy();
		    	} catch(e) {
		    		console.error(e);
		    	}
		    }
		    var history = this.getVar("history");
		    history.splice(0);
		    
		    this.scope().back.update();
		    this.scope().forward.update();
    	},
    	draw: draw 
    },
    onLoad: function() {
    	// this.override({
    	// 	setVisible: function() {
    	// 		var r = this.inherited(arguments), me = this;
	    //         this.update(function() {
	    //         	me.applyVar("draw", []);
	    //         });
    	// 		return r;
    	// 	}
    	// });
    	this.setVar("resized", true);
    	this.setVar("history", []);
    	return this.inherited(arguments);
    },
    onActivate: function() {
    	if(this.removeVar("resized") === true) {
	    	var me = this;
	        this.update(function() {
	        	me.applyVar("draw", []);
	        });
    	}
    	return this.inherited(arguments);
    },
    onResize: function () {
        if (this.isVisible() === false) {
            this.setVar("resized", true);
        } else {
        	var me = this;
            this.update(function() {
            	me.applyVar("draw", []);
            });
        }
        return this.inherited(arguments);
    }
}, [

	$("vcl/Action", "back", {
		enabled: false,
		onExecute: function() {
			var g = this._owner.getVar("graph");
			var history = this._owner.getVar("history");
			var item = history[--history.index];
			history.block = (history.block || 0) + 1;
			g.updateOptions({dateWindow: item.x, valueRange: item.y});
		},
		onUpdate: function() {
			var history = this._owner.getVar("history");
			this.setEnabled(history.length > 0 && history.index > 0);
		}
	}),
	$("vcl/Action", "forward", {
		enabled: false,
		onExecute: function() {
			var g = this._owner.getVar("graph");
			var history = this._owner.getVar("history");
			var item = history[++history.index];
			history.block = (history.block || 0) + 1;
			g.updateOptions({dateWindow: item.x, valueRange: item.y});
		},
		onUpdate: function() {
			var history = this._owner.getVar("history");
			this.setEnabled(history.index < history.length - 1);
		}
	}),
	
	
]);