define(["./Class", "./JsObject"], function(Class) {
	return function(localRequire, classObj) {

		function f(what) {
			if(what !== "module") {
				return require.apply(this, arguments);
			}
			return {id: localRequire}; // NB typeof localRequire === "string"
		}

		return Class.define(typeof localRequire === "string" ? f : localRequire, classObj);
	};
});