define(function(require) {

	var module = require("module");

	return {
		define: function() {
			console.log(module.id + ".define() not implemented");
		}
	};

});