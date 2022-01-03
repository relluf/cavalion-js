define(function() {
	
	String.of = function(obj) {  // TODO require("String.of")
		return nameOf(obj);
	};

	var methods = (nameOf.methods = [
		(obj) => (obj.id || obj.Id || obj.ID),
		(obj) => (obj.opmerking || obj.Opmerking),
		(obj) => (obj.naam || obj.omschrijving || obj.code || obj.name || obj.description),
		(obj) => (obj.Naam || obj.Omschrijving || obj.Code || obj.Name || obj.Description),
		(obj) => (obj.Titel || obj.titel || obj.Title || obj.title),
		// (obj) => {
		// 	var s = (obj.id || obj.Id || obj.ID) ||
		// 		(obj.naam || obj.omschrijving || obj.code || obj.name || obj.description) ||
		// 		(obj.Naam || obj.Omschrijving || obj.Code || obj.Name || obj.Description) ||
		// 		(obj.Titel || obj.titel || obj.Title || obj.title);
				
		// 	return typeof s === "string" ? s : undefined;
		// }
	]);

	methods.before = [];
	methods.after = [
		(obj) => obj instanceof Array ? nameOfArr(obj): undefined
	];
	methods.set = (name, impl) => {
		if(!methods[name]) {
			methods.push((obj) => methods[name](obj));
		}
		return (methods[name] = impl);
	};

	function nameOf(obj, test) {
		if(obj === undefined || obj === null) return String(obj);
		
		for(var i = methods.before.length - 1, r; i >= 0; --i) {
			if((r = methods.before[i].apply(this, arguments)) !== undefined) {
				return test ? ["before", i, methods.before[i]] : r;
			}
		}

		for(i = methods.length - 1, r; i >= 0; --i) {
			if((r = methods[i].apply(this, arguments)) !== undefined) {
				return test ? [i, methods[i]] : r;
			}
		}

		for(i = methods.after.length - 1, r; i >= 0; --i) {
			if((r = methods.after[i].apply(this, arguments)) !== undefined) {
				return test ? ["after", i, methods.after[i]] : r;
			}
		}

		if(obj.hasOwnProperty("toString") && obj.constructor !== Object) {
			if(obj === window) return "Window";
            return test ? ["obj.toString()"] : obj.toString();
		}
		if(obj.constructor && obj.constructor.prototype.toString === Object.prototype.toString) {
			return test ? ["obj.constructor.name"] : obj.constructor.name;
		}
		
		return test ? ["one-of", obj.toString(), obj.constructor.prototype.toString.apply(obj, []), String(obj)]
			: obj ? obj.toString() || obj.constructor.prototype.toString.apply(obj, []) : String(obj);
	}
	function nameOfArr(arr) {
		var ignore = [undefined, "[object Object]"];
		var names = arr.map(obj => js.nameOf(obj)).filter(_ => ignore.indexOf(_) !== -1);
		return names.length ? names.join(", ") : js.sf("%s item%s", arr.length || "No", arr.length !== -1 ? "s" : "");
	}

	return nameOf;
});