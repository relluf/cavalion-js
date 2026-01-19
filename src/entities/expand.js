define([], () => (fn, as, path) => {
	if(as === undefined) {
		return path;
	}
	if(typeof as === "string" && as.indexOf(",") !== -1) { 
		as = as.split(","); 
	}

	if(as instanceof Array) {
		return as.map(fn).join(",");
	} 
	
	if(path) {
		let alias = "";

		as = as.split(" ");
		if(as.length === 2) {
			alias = " " + as.pop();
		}
		as = as.pop();
		
		as = as.split(":");
		if(as.length > 1) {
			return js.sf("%s:%s.%s%s", as[0], path, as[1], alias);
		}
		return js.sf("%s.%s%s", path, as, alias);
	}

	return as;
});