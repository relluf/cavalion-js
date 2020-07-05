define(function() {

	var ArrayFactory = {
		create: function(options, callback) {
			var r = [];
			var inc = options.inclusive === true;

//			if(options.inclusive === true && options.hasOwnProperty("end") && options.hasOwnProperty("step")) {
//				options.end += options.step;
//			}

			for(var i = options.start; inc ? i <= options.end : i < options.end; i += options.step) {
				if(typeof callback === "function") {
					var item = callback(i, options, arr);
					if(item !== undefined) {
						r.push(item);
					}
				} else {
					r.push(i);
				}
			}
			return r;
		}
	};

	return ArrayFactory;
});