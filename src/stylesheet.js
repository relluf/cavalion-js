define(function() {

	var timeout;

   return {
        load: function (name, req, onLoad, config) {
        	if(typeof document !== "undefined") {
	    		var link = document.createElement("link");
	    		var lesscss = name.indexOf(".less") === name.length - 5;

	    		link.rel = "stylesheet" + (lesscss ? "/less" : "");
	    		link.href = req.toUrl(name);
    			if(!lesscss) {
	    			link.onload = function() { 
	    				onLoad(link); 
	    			};
	    		}
	        	var head = document.getElementsByTagName("head")[0];
	    		head.appendChild(link);
	    		if(lesscss) { 
	    			require(["less"], function(less) {
	    				if(less.sheets.indexOf(link) === -1) {
							less.sheets.push(link);
	    				}

	    				if(timeout) {
	    					window.clearTimeout(timeout);
	    				}

	    				timeout = window.setTimeout(() => {
							// TODO how to only refresh the current one?
							less.refresh(true)
	    				}, 2750);
	    				
	    				onLoad(link);
					});	
	    		}
        	} else {
        		console.log("<link rel=\"stylesheet\" href=\"" + name + "\">");
        		onLoad(name);
        	}
        }
   };
    
});
