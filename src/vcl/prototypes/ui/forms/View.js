$(["ui/Form"], {
    css: {
    	"#menubar": {
	    	"padding": "4px",
	    	"overflow": "hidden",
			"border-bottom": "1px solid #f0f0f0",
			".right": "float: right;",
			".{Button}": {
				outline: "none",
				"&:not(.right)":  "margin-right: 16px;",
				"background": "none",
				"background-color": "transparent",
				"border": "none",
				"text-shadow": "none",
				"&.link": {
					"color": "blue",
					"text-decoration": "underline"
				},
				"box-shadow": "none",
				cursor: "pointer",
				padding: "2px 4px 2px 4px",
				"&.disabled": {
					color: "silver",
					cursor: "default"
				},
				"&:hover": "background-color: #f0f0f0;",
				"&:not(.disabled):active": {
				    color: "red",
				    "background-color": "#f0f0f0"
				},
				"&.selected": "background-color: rgb(56, 121, 217); color: white;"
			},
			".{Tab}": {
				cursor: "pointer",
				padding: "2px 4px 2px 4px",
				display: "inline-block", "margin-right": "16px",
				"border-radius": "3px",
				"&.selected": "background-color: rgb(56, 121, 217); color: white;"
			}
    	},
    	"#left": {
        	"#left_content": {
            	"padding": "8px",
            	"padding-left": "16px",
            	"min-height": "96px",
            	">#description": "margin-left: 16px; margin-right:16px;"
        	},
			"#menubar": {
		        // "box-shadow": "0px 3px 5px 0px rgba(0,0,0,0.5)", "z-index": "100000",
				"position": "static",
				"padding": "8px 0 10px 0",
				".{./Button}": {
					cursor: "pointer",
					outline: "none",
					"background": "none",
					"background-color": "transparent",
					"border": "none",
					"color": "blue",
					"text-shadow": "none",
					"text-decoration": "underline",
					"box-shadow": "none",
					padding: "2px", "margin-top": "2px",
					"&.disabled": {
						color: "silver",
						cursor: "default"
					},
					"&:not(.disabled):active": {
					    color: "red",
					    "background-color": "#f0f0f0"
					}
				}
			}
    	},
    	"#description": "color: gray;"
    }
}, [
    $("vcl/ui/Panel", "left", {
        align: "left",
        width: 325
    }, [
        $("vcl/ui/Panel", "left_content", {
        	align: "top",
        	autoSize: "height"
        }, [
	        $("vcl/ui/Element", "description", {
	            content: "A view form consists of a panel aligned to the left " +
	            		"and one aligned client. The client panel usually shows a menubar " +
	            		"aligned to the top."
	        })
        ])
    ]),
    $("vcl/ui/Panel", "menubar", {
        align: "top", autoSize: "both",
    }),
    $("vcl/ui/Panel", "client", { align: "client" }, [])
]);