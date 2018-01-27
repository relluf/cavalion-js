define(function(require) {

	var EM = require("entities/EM");

	return {
		
		/**
		 * @see http://requirejs.org/docs/plugins.html#apiload
		 */
		load: function(name, parentRequire, load, config) {
			if(name === "model") {
				EM.getModel().addCallback(load);
			}
		}
	};

});