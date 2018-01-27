$("vcl/Application", {
	onLoad: function() {
    	var img = document.body.childNodes[0];
    	if(img.nodeName === "IMG") {
    		img.parentNode.removeChild(img);
    	}
    	
		var scope = this.scope(), delegate;
        scope.window.setParentNode(this.isDesigning() ?
    		scope.window.getDesigner().getParentNode() : 
    		document.body);
	}
}, [
    $("vcl/ui/Panel", "window", { align: "client" }, [])
]);