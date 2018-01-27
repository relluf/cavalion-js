define(["js/mixIn"], function(mixIn) {

	/**
	 * @param dest optional, defaults to {}
	 * @param src
	 * @param mustHaveOwnProperty optional, default is true
	 */
	return function mixInRecursive(dest, src, mustHaveOwnProperty) {
		return mixIn(dest, src, mustHaveOwnProperty, true);
	};
});
