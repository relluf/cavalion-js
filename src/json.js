define(function(require) {
	
   return {
        load: function (name, req, onLoad, config) {
        	require(["text!" + name + ".json"], function(json) {
        		onLoad(JSON.parse(json));
        	});
        }
   };
    
});