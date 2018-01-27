$(["ui/Form"], {
	align: "top", 
	height: 350,
    css: {
        "&.loading #host": {
        	"background": "url(/shared/vcl/images/loading.gif) no-repeat 5px 5px"
        }
    }
}, [
	$("vcl/ui/Panel", "host", { 
		align: "client",
		css: "overflow: hidden;"
	})
]);


	
	// $("vcl/ui/Panel", "chart", {
	// 	align: "top", css: "height: 50%;", autoSize: "height",
	// 	content: "<canvas width='400' height='400'></canvas>",
	// 	onResize: function() {
	// 		// var canvas = this.getChildNode(0), cs = this.getComputedStyle();
	// 		// canvas.width = parseInt(cs.width);
	// 		// canvas.height = parseInt(cs.height);
	// 		this.setState("invalidated", true);
	// 	},
	// 	// onRender: function() {
 // //          var Dygraph = require("dygraph");

 // //          var graph = this.getVar("graph");
 // //          if (graph !== undefined) {
 // //              graph.destroy();
 // //          }

 // //          if (data === undefined) {
 // //              data = this.getVar("data");
 // //              if (data === undefined) {
 // //                  return;
 // //              }
 // //          } else {
 // //              this.setVar("data", data);
 // //          }

 // //          if (options === undefined) {
 // //              options = this.getVar("options");
 // //          } else {
 // //              this.setVar("options", options);
 // //          }

 // //          var node = this.getScope().host.getNode();
 // //          this.setVar("graph", new Dygraph(node, data, js.mixIn({
 // //              rollPeriod: 7,
 // //              showRoller: true,
 // //              //legend: "always",
 // //              axisLabelFontSize: 12,
 // //              labelsDivStyles: {
 // //                  "textAlign": "right"
 // //              },
 // //              showRangeSelector: true
 // //          },
 // //          options || {})));
	// 	// },
	// 	// onRender_Chart: function() {
	// 	// 	var canvas = this._node.querySelector("canvas"), cs = this.getComputedStyle();
			
	// 	// 	if(!canvas) { return; }
	// 	// 	canvas.width = parseInt(cs.width);
	// 	// 	canvas.height = parseInt(cs.height);
	// 	// 	var chart = new Chart(canvas.getContext("2d"),  {
	// 	// 		type: 'bar',
	// 	// 		data: {
	// 	// 		    labels: ["Zoë", "Blue", "Yellow", "Green", "Purple", "Orange"],
	// 	// 		    datasets: [{
	// 	// 		        label: '# of Votes',
	// 	// 		        data: [12, 19, 3, 5, 2, 3],
	// 	// 		        backgroundColor: [
	// 	// 		            'rgba(255, 99, 132, 0.2)',
	// 	// 		            'rgba(54, 162, 235, 0.2)',
	// 	// 		            'rgba(255, 206, 86, 0.2)',
	// 	// 		            'rgba(75, 192, 192, 0.2)',
	// 	// 		            'rgba(153, 102, 255, 0.2)',
	// 	// 		            'rgba(255, 159, 64, 0.2)'
	// 	// 		        ],
	// 	// 		        borderColor: [
	// 	// 		            'rgba(255,99,132,1)',
	// 	// 		            'rgba(54, 162, 235, 1)',
	// 	// 		            'rgba(255, 206, 86, 1)',
	// 	// 		            'rgba(75, 192, 192, 1)',
	// 	// 		            'rgba(153, 102, 255, 1)',
	// 	// 		            'rgba(255, 159, 64, 1)'
	// 	// 		        ],
	// 	// 		        borderWidth: 1
	// 	// 		    }]
	// 	// 		},
	// 	// 		options: {
	// 	// 		    scales: {
	// 	// 		        yAxes: [{
	// 	// 		            ticks: {
	// 	// 		                beginAtZero:true
	// 	// 		            }
	// 	// 		        }]
	// 	// 		    }
	// 	// 		}
	// 	// 	});
			
	// 	// }
	// })
