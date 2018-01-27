define(function() {

	var head;
	var request, queue = [];
	
	function iterate_with_require() {
		if(!request) {
			request = queue.shift();
			// console.log("dequeued", request.name);
			
			request.require([request.name], function(module) {
				try {
					console.log("received", request.name);
					request.onLoad(module);
				} finally {
					request = undefined;
					iterate();
				}
			});
		}
	}
    function iterate() {
		if(!request && queue.length) {
			request = queue.shift();
			// console.log("dequeued", request.name);
			
			var script = document.createElement("script");
			script.type = "text/javascript";
			script.src = request.require.toUrl(request.name);
			script.onload = function() {
				try {
					// console.log("received", request.name);
					request.onLoad(script);
				} finally {
					request = undefined;
					iterate();
				}
			};
    		(head || (head = document.getElementsByTagName("head")[0]))
				.appendChild(script);
		}
    }
    
	return {
		load: function (name, req, onLoad, config) {
        	if(typeof document !== "undefined") {
    			queue.push({name: name, require: req, 
    						onLoad: onLoad, config: config});
        		// console.log("queued", name);
    			iterate();
        	} else {
        		console.log(String.format("<script type=\"javascript\" charset=\"utf-8\" src=\"%s\">", name));
        		onLoad(name);
        	}
        }
   };
    
});