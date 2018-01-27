define(function(require) {
	
	var Model = {
		
		parse: function(model) {
			var r = {};
			for(var entity in model) {
				r[entity] = {};
				for(var attribute in model[entity]) {
					var def = model[entity][attribute];
					if(typeof def === "string") {
						if(def.indexOf(";") !== -1) {
							def = js.str2obj(def);
						} else {
							if(def.indexOf(":") !== -1) {
								def = def.split(":");
								def = { model: def[1], type: def[0]};
							} else {
								def = { type: def };
							}
						}
					}
					// def.name = attribute;
					r[entity][attribute] = def;
				}
			}
			for(var e in r) {
				for(var a in r[e]) {
					var m = r[e][a].model;
					if(r[e][a].type === "enum") {
						r[e][a].model = m.split(",");
					} else if(typeof m === "string") {
						r[e][a].model_ = m;
						r[e][a].model = r[m];
					}
				}
			}
			return r;
		}
	};

	return Model;
});