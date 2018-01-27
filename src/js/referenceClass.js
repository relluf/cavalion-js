define(["js/Class"], function(Class) {

	return {

		/**
		 * @overrides http://requirejs.org/docs/plugins.html#apiload
		 * @param name
		 * @param parentRequire
		 * @param load
		 * @param config
		 * @returns
		 */
		load: function(name, parentRequire, load, config) {
			load(Class.reference(name));
		},

		/**
		 * @overrides http://requirejs.org/docs/plugins.html#apinormalize
		 * @param name
		 * @param normalize
		 * @returns
		 */
		normalize: function(name, normalize) {
			return normalize(name);
		}
	};

});