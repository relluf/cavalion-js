define(function() {

	var methods = [
		(obj) => (obj.id || obj.Id || obj.ID),
		(obj) => (obj.naam || obj.omschrijving || obj.code || obj.name || obj.description),
		(obj) => (obj.Naam || obj.Omschrijving || obj.Code || obj.Name || obj.Description),
		(obj) => (obj.Titel || obj.titel || obj.Title || obj.title),
 // TODO xml-thingy		
		(obj) => (obj['#text']),
		(obj) => (obj['@_name'])
	];
	
	methods.after = [];

	function nameOf(obj) {
		if(obj === undefined || obj === null) return String(obj);
		
		for(var i = methods.length - 1, r; i >= 0; --i) {
			if((r = methods[i].apply(this, arguments)) !== undefined) {
				return r;
			}
		}
		
		for(var i = methods.after.length - 1, r; i >= 0; --i) {
			if((r = methods.after[i].apply(this, arguments)) !== undefined) {
				return r;
			}
		}

		if(obj.hasOwnProperty("toString") && obj.constructor !== Object) {
			if(obj === window) return "Window";
            return obj.toString();
		}
		if(obj.constructor && obj.constructor.prototype.toString === Object.prototype.toString) {
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