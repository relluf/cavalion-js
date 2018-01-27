$("vcl/ui/Panel", { align: "client" }, [
	$("vcl/ui/List#list", { autoColumns: true,
		source: "source" }),
	
	// TODO vcl-pouch/data/Source
	$("vcl/data/Pouch#source", {
		dbName: "v7.7",
		onFilterObject: function(obj) {
			return (obj._id || "").indexOf("Meetpunt") !== 0;
		}
	}),
	
	$("vcl/ui/Console#console", { align: "bottom", height: 200,
		onEvaluate: function(expr) {
			var scope = this.scope();
			return eval(expr);
		}
	})
]);