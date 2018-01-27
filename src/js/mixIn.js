define(function() {

	/**
	 * @param dest optional, defaults to {}
	 * @param src
	 * @param mustHaveOwnProperty optional, default is true
	 * @param recursive optional default is false
	 */
	return function mixIn(dest, src, mustHaveOwnProperty, recursive) {
		if(typeof src === "undefined" || typeof src === "boolean") {
			recursive = false;
			mustHaveOwnProperty = src;
			src = dest;
			dest = {};
		}

		for(var k in src) {
			/*- if k is to be included */
			if(mustHaveOwnProperty === false || src.hasOwnProperty(k)) {
				if(recursive === true) {
					/*- if src[k] is object */
					if(src[k] !== null && typeof src[k] === "object" && src[k].constructor === Object) {
						if(dest[k] === null || typeof dest[k] !== "object") {
							/* dest[k] should be of type object */
							dest[k] = {};
						}
						mixIn(dest[k], src[k], mustHaveOwnProperty, recursive);
					} else {
						/* normal behaviour (see js/mixIn.js) */
						dest[k] = src[k];
					}
				} else {
					dest[k] = src[k];
				}
			}
		}
		return dest;
	};
});