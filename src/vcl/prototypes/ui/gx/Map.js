$(["ui/forms/View"], {
	css: {
//		padding: "10px",
		"padding-left": "0"
	}
}, [
    $i("menubar", {
    	visible: false
    }),
    $("vcl/ui/Panel", "map", {
    	align: "client",
    	css: "overflow: hidden;"
    })
]);