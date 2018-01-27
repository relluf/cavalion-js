define(function(require) {

	var Class = require("js/Class");
	var Deferred = require("js/Deferred");
	var js = require("js");
	var Printer = require("console/Printer");
	var Panel = require("./Panel");

	var Type = Class.Type;
	var images = {
			'collapsed': "data:image/png;base64,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",
			'expanded':  "data:image/png;base64,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"
		};

	var Console = {

		inherits: Panel,

		prototype: {

			"@css": {
				// "&.highlight-click": "background-color: yellow;",
				"font-family": "menlo, 'lucida console'",
				"font-size": "8pt",
				"cursor": "default",
				"div.node:before": {
					// content: ">"
				},
				".node": {
					"white-space": "nowrap",
					// "margin-top": "2px",
					// "margin-bottom": "2px",
					"padding": "1px",
					">.time":
							"vertical-align: top; text-align: right; color: silver; width: 60px; " +
							"padding-right: 12px; display: inline-block;",
					">.message": "padding-left: 15px; display: inline-block;",
					">.key": "padding-left: 15px; display: inline-block; padding-right: 5px; max-width: 75%; overflow: hidden; text-overflow: ellipsis;",
					">.value": "display: inline-block; vertical-align: top;",
					">.container": "padding-left: 85px; clear: both; display: none; margin-bottom: 4px;",
					"&.border-bottom": {
						"padding-bottom": "2px",
						"border-bottom": "1px solid silver",
						"margin-bottom": "2px"
					},
					"&:hover>.key": "background-color: #f0f0f0;",
					"&.expandable": {
						">.value": "cursor: pointer;",
						">.message": {
							"background-image": String.format("url(%s)", images.collapsed),
							"background-repeat": "no-repeat",
							"background-position": "4px 2px",
							"cursor": "pointer"
						},
						">.key": {
							"background-image": String.format("url(%s)", images.collapsed),
							"background-repeat": "no-repeat",
							"background-position": "4px 2px",
							"cursor": "pointer"
						},
						"&.expanded": {
							"background-position": "4px 3px",
							">.message": {
								"background-image": String.format("url(%s)", images.expanded)
							},
							">.key": {
								"background-image": String.format("url(%s)", images.expanded)
							}
						}
					},
					"&.key>.container": "padding-left: 15px;",
					"&.expanded>.container": "display: block;",
					"&.error.error>.message": "color: red;",
					"&.error.error>.value": "color: red;",
					"&.string>.value": "color: green;",
					"&.number>.value": "color: red;",
					"&.undefined>.value": "color: silver;",
					"&.null>.value": "color: purple;",
					"&.boolean>.value": "color: purple;",
					"&.function>.value": "color: purple;",
					"&.function>.value>.proto": "color: silver;",
					"&.function>.container>.code":
						"margin: 8px; padding: 8px; background-color: #f0f0f0; overflow: auto;",
					"&.array>.value": "color: purple;",
					"&.object>.value": "color: blue;",
					"&.object>.value>.uri": "color: silver;"
				},
				"&.no-time.no-time.no-time": {
					".node .time": "display: none;",
					".node > .container": "padding-left: 15px;",
					"div.cmdline": "margin-left: 4px;"
				},
				"div.console": {
					"padding-top": "2px"
				},
				"div.cmdline": {
					margin: "2px 10px 0 64px",
					'border-top': "1px solid rgba(192, 192, 192, 0.2)",
					">input": {
						//position: "relative",
						margin: "4px 0 3px 0",
						//"padding-left": "12px",
						//top: "-20px",
						"background-color": "transparent",
						width: "100%",
						border: "none",
						outline: "none",
						font: "inherit"
					}
				}
			},
			
			_align: "client",
			_content: "<div class='console'></div><div class='cmdline'><input></div>",
			_history: null,
			_onEvaluate: null,

			constructor: function() {
			},
			loaded: function() {
				this.loadHistory();
				return this.inherited(arguments);
			},
			initializeNodes: function() {
				/** @overrides ../../Control.prototype.initializeNodes */
				this.inherited(arguments);

				this._nodes.console = this.getChildNode(0);
				this._nodes.input = this.getChildNode(1, 0);

				this._printer = new Printer(this._nodes.console);
			},
/*
			onmousedown: function(evt) {
		        if(evt.target === this._node) {
		        	this.addClass("highlight-click");
		        }
			},
			onmouseup: function() {
				if(this.hasClass("highlight-click")) {
					this.removeClass("highlight-click");
				}
			},
*/
			onclick: function(evt) {
				/** @overrides ../../Control.prototype.onclick */
				this.setTimeout("focus", function() {
			        //if(evt.target === this._node) {
	    				this.storeScroll();
	    				this._nodes.input.focus();
	    				this.restoreScroll();
			        //}
				}.bind(this), 200);
				
				return this.inherited(arguments);
			},
			ondblclick: function(evt) {
				this.clearTimeout("focus");
				return this.inherited(arguments);	
			},
			onkeypress: function(evt) {
				/** @overrides ../../Control.prototype.onkeydown */
				var r = this.inherited(arguments);
				if(r !== false) {
					if(evt.keyCode === 13) {
						var text = this._nodes.input.value;
						if(text !== "") {
							var value;

							this._nodes.input.value = "";
							this.pushHistory(text);

							try {
								value = this.evaluate(text);
							} catch(e) {
								value = e;
							}
							this.print(text, value);
						}
					}
				}
				//this.print("press", evt.keyCode);
				return r;
			},
			onkeydown: function(evt) {
				/** @overrides ../../Control.prototype.onkeyup */
				var r = this.inherited(arguments);

				if(evt.ctrlKey === true) {
					if(evt.keyCode === 76) {
						this._nodes.console.innerHTML = "";
						evt.preventDefault();
					}
				} else if(evt.keyCode === 38) {
					if(this._history.index > 0) {
						this._history.index--;
						this._nodes.input.value = this._history[this._history.index];
					}
					evt.preventDefault();
				} else if(evt.keyCode === 40) {
					if(this._history.index < this._history.length - 1) {
						this._history.index++;
						this._nodes.input.value = this._history[this._history.index];
					}
					evt.preventDefault();
				}

				return r;
			},
			setFocus: function(evt) {
				/** @overrides ../../Control.prototype.setFocus */
				this.nodeNeeded();
				this._nodes.input.focus();
			},
			clear: function() {
				if(this.hasOwnProperty("_node")) {
					this._node.childNodes[0].innerHTML = "";
				}
			},
			evaluate: function(expr) {
				if(expr === "#") {
					expr = "require('js/JsObject').$";
				} else if (expr.charAt(0) !== " ") {
                    expr = expr.replace(/#(\d+)/g, "require('js/JsObject').$['$1']");
                }

				if(this._onEvaluate !== null) {
					return this.fire("onEvaluate", [expr]);
				}
				
				function req() {
				    var d = new Deferred();
				    require.apply(this, [js.copy_args(arguments),
				        function () {
				            d.callback.apply(d, js.copy_args(arguments));
				        },
				        function (err) {
				            d.errback(err);
				        }
				    ]);
				    return d;
				}				

                /* jshint evil: true */
				return eval(expr);
			},
			loadHistory: function() {
				var key = this.getStorageKey("history");
				this._history = JSON.parse(localStorage.getItem(key)) || [];
				this._history.index = this._history.length;
			},
			saveHistory: function(text) {
				var key = this.getStorageKey("history");
		        try {
		            var history = JSON.parse(localStorage.getItem(key)) || [];
		            if (history[history.length - 1] !== text) {
		                history.push(text);
		                if (history.length > 100) {
		                    history.splice(0, history.length - 100);
		                }
		                localStorage.setItem(key, JSON.stringify(history));
		            }
		        } catch(e) {
		        	this.print(e);
		        }
			},
			pushHistory: function(text) {
			    this.saveHistory(text);

		        if(this._history[this._history.length - 1] !== text) {
		        	this._history.index = this._history.push(text);
		        } else {
		        	this._history.index = this._history.length;
		        }
			},
			print: function() {
				this.nodeNeeded();
				try {
					return this._printer.print.apply(this._printer, arguments);
				} finally {
					this._node.scrollTop = this._node.scrollHeight;
				}
			},
			log: function() {
				return this.print.apply(this, arguments);
			},
			getPrinter: function() {
				return this._printer;
			},
			getOnEvaluate: function() {
				return this._onEvaluate;
			},
			setOnEvaluate: function(value) {
				this._onEvaluate = value;
			}
		},

		properties: {
			"onEvaluate": {
				type: Type.EVENT
			}
		}
	};

	return (Console = Class.define(require, Console));
});