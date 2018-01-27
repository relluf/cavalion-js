$("vcl/ui/Group", {
	// autoSize: "height",
	// align: "top",
	css: {
//		padding: "8px"
		"padding-top": "8px",
		"input": {
			"border-radius": "3px",
			"border": "1px solid silver",
			// "padding": "1px 1px 2px 6px",
			// "background": "transparent",
			padding: "3px",
			"&[type='date']": {
				"padding-top": "2px", "padding-bottom": "0px",
				"font-family": "BlinkMacSystemFontuser, \"Apple Braille\", " + 
					"\"Segoe UI\", \"Lucida Grande\", sans-serif"
			}
		},
		".{Group}": {
			"vertical-align": "top",
			"padding-bottom": "5px",
			"padding-right": "20px",
			"&:not(.seperator)": {
				"display": "inline-block"
			}
		},
		".{Select}": {
			"&.disabled": {	opacity: "0.5" },
			"padding-top": "1px",
			"padding-bottom": "1px"
		},
		".header": {
			"font-weight": "bold"
		},
		".block": {
			"display": "block"
		},
		".disabled": {
			opacity: "0.5"
			//color: "silver"
		},
		
	}
}, []);