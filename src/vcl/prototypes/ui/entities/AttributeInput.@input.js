$([], {}, [

    $("vcl/ui/Element", "label", {
    	content: "label"
    }),

    $("vcl/ui/Input", "input", {
    	onDblTap: function () { 
    		/* FIXME clear() */
    		this.setInputValue(""); 
    	}
    })

]);