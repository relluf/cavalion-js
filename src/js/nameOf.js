define(function() {

	var methods = [];

	/**
	 *
	 * @param obj
	 * @returns
	 */
	function nameOf(obj) {
		for(var i = methods.length - 1, r; i >= 0; --i) {
			if((r = methods[i].apply(this, arguments)) !== undefined) {
				return r;
			}
		}
		
		if(obj && obj.hasOwnProperty("toString") && obj.constructor !== Object) {
            return obj.toString();
		}
		
		if(obj && obj.constructor && obj.constructor.prototype.toString === Object.prototype.toString) {
			return obj.constructor.name;
		}

		return obj ? obj.toString() || obj.constructor.prototype.toString.apply(obj, []) : String(obj);
	}

	String.of = function(obj) {
		return nameOf(obj);
	};

	nameOf.methods = methods;

	return nameOf;
});