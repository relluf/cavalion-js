define(function(require) {
	
   return {
        load: function (name, req, onLoad, config) {
        	if(typeof window === "undefined") {
        		// r.js: text must already be req'd
				var json = require("text!" + name + ".json");
        		onLoad(json);//JSON.parse(json));
        	} else {
	        	require(["text!" + name + ".json"], function(json) {
	        		onLoad(JSON.parse(json));
	        	});
        	}
        }
   };
    
});