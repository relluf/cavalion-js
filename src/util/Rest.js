define(function(require) {

	var Ajax = require("./Ajax");
	var Command = require("./Command");

	var Rest = {

		call: function(method, url, options) {

			if(options.parameters !== undefined) {
				url += Command.getQueryString(options.parameters);
			}

			Ajax.request(method, url,
					options.callback, true, options.content);
		}
	};


	return Rest;

});
