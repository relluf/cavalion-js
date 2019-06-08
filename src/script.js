define(function() {

	var head;
	var request, queue = [];

	function appendHead(elem) {
    	head = head || document.getElementsByTagName("head")[0];
    	head.appendChild(elem);
	}	
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
			var script = document.createElement("script");
			request = queue.shift();

			script.type = request.type || "text/javascript";
			if(!request.text) {
				script.src = request.require.toUrl(request.name);
				script.onload = function() {
					try {
						request.onLoad(script);
					} finally {
						request = undefined;
						iterate();
					}
				};
			} else {
				script.innerText = request.text;
				request = undefined;
				iterate();
			}
    		appendHead(script);
		}
    }
    
	return {
		add: function(what) {
			if(typeof what === "string") {
				queue.push({ type: "module", text: what });
			} else {
				what.type = "module";
				queue.push(what);
			}
			iterate();
		},
		load: function (name, req, onLoad, config) {
        	if(typeof document !== "undefined") {
        		if(name.indexOf("module:") === 0) {
	    			queue.push({name: name.substring("module:".length), require: req, type: "module", onLoad: onLoad, config: config});
        		} else {
	    			queue.push({name: name, require: req, onLoad: onLoad, config: config});
        		}
    			iterate();
        	} else {
        		console.log(String.format("<script type=\"javascript\" charset=\"utf-8\" src=\"%s\">", name));
        		onLoad(name);
        	}
        }
   };
    
});