"jquery, util/HotkeyManager, framework7/Pages, leaflet/plugins/wicket";

var Pages = require("framework7/Pages");
var ajax = require("jquery").ajax;
var this_app;

$([], {
	vars: {
		events: [
		],
		pageUrls: {
			left: "pages/Left.page/.html", 
			main: "pages/Main.page/.html"
		}
	},
	
	/*- TODO override means final */
	override: {
		Event: CustomEvent,
		
		f7a: null, /*- Framework7 app instance */

		waitWhile: function(config) {
			var ms = config.ms || 100;
			if(config.condition() !== true) {
				setTimeout((function() {  this.waitWhile(config); }).bind(this), ms);
			} else {
				config.then();
			}
			
		},
		isLeftPanelOpen: function() {
			return $$(".panel-left.active").length === 1;			
		},
		closeLeftPanel: function() {
			this_app.f7a.closePanel("left");
		},
		openLeftPanel: function() {
			this_app.f7a.openPanel("left");
		},
		toggleLeftPanel: function() {
			if(this_app.isLeftPanelOpen()) {
				this_app.closeLeftPanel();
			} else {
				this_app.openLeftPanel();
			}
		},
		isRightPanelOpen: function() {
			return $$(".panel-right.active").length === 1;			
		},
		closeRightPanel: function() {
			this_app.f7a.closePanel("right");
		},
		openRightPanel: function() {
			this_app.f7a.openPanel("right");
		},
		toggleRightPanel: function() {
			if(this_app.isRightPanelOpen()) {
				this_app.closeRightPanel();
			} else {
				this_app.openRightPanel();
			}
		},

		isFullscreen: function() {
            var container = $$(".page[data-page='Map']") || $$(document);
            return container.hasClass("fullscreen");
		},
		enterFullscreen: function() {
            var container = $$(".page[data-page='Map']") || $$(document);
            if(!container.hasClass("fullscreen")) {
	            this_app.f7a.hideToolbar($$(".view-main .toolbar"));
	            this_app.f7a.hideNavbar($$(".view-main .navbar"));
                container.addClass("fullscreen");
                return true;
            }
            return false;
		},
		exitFullscreen: function() {
            var container = $$(".page[data-page='Map']") || $$(document);
            if(container.hasClass("fullscreen")) {
	            this_app.f7a.showToolbar($$(".view-main .toolbar"));
	            this_app.f7a.showNavbar($$(".view-main .navbar"));
                container.removeClass("fullscreen");
                return true;
            }
            return false;
		},
		toggleFullscreen: function() {
			if(this_app.isFullscreen()) {
				this_app.exitFullscreen();
			} else {
				this_app.enterFullscreen();
			}
		},

		loadPage: function(view, page, queryParams, options) {
			if(typeof view === "string") {
				view = this.f7a.views[view === "main" ? 1 : 0];
			} else {
				view = this.f7a.views[view];
			}
			
			page = page.split("?");
			page[1] = page[1] ? page[1].split("&") : [];
			for(var k in queryParams) {
				page[1].push(String.format("%s=%s", k, window.escape(queryParams[k])));
			}
			
			options = js.mixIn(options || {}, {
				 url: String.format("pages/%s.page/.html%s", page[0], 
						page[1].length ? ("?" + page[1].join("&")) : ""),
			});
			
			if(!options.context) { 
				options.context = Pages.context; 
			}
			
			var me = this;
			Pages.require(page[0], function proceed(module) {
				view.router.loadPage(options);
			});
		},
		refreshPage: function(view) {
			view = this.f7a.views[view === "main" ? 1 : 0];
			view.router.refreshPage();
		},
		back: function(view) {
			view = this.f7a.views[view === "main" ? 1 : 0];
			view.router.back();
			
			return false;
		},
		
		isVcl: function() {
			var node = Dom7(".views")[0].parentNode;
			return node.style.display === "none";
		},
		goVcl: function() {
			var node = Dom7(".views")[0].parentNode;
			if(node.style.display !== "none") {
				var w = this.scope().window;
				w.postUpdate(function() {
					/*- First show, then hide -> avoids flickering */
					node.style.display = "none";
				});
				w.show();
				
			}
		},
		goFw7: function() {
			var node = Dom7(".views")[0].parentNode;
			if(node.style.display === "none") {
				node.style.display = "";
				this.scope().window.hide();
			}
		},
		make: function() {
			this.goVcl();
			
			var parent = this.down("#window");
			var build = this.down("make/Build<>");
			if(!build) {
				require(["vcl/Factory!make/Build"], function(factory) {
					var build = factory.newInstance(this_app, "make/Build");
					build.setParent(parent);
					build.getNode().style.backgroundColor = "white";
				});
			}
		}
	},
	onLoad: function() {
		var scope = this.scope();
		
		if(this_app) {
			throw new Error("There can be only one");
		}

		this_app = this;
		
		// window.App = this;
		// window.dispatchEvent(new this_app.Event("initialize"));

	    /*- Initialize Framework7 */
	    this_app.f7a = Pages.createApp({});

		/*- Control left panel with keyboard */
		var HKM = require("util/HotkeyManager");
		HKM.register({
			keyCode: 27, 
			callback: function(e) {
				if(e.altKey === true) {
					this_app.toggleRightPanel();
				} else if(e.shiftKey === true) {
					if(this_app.isVcl()) {
						this_app.goFw7();
					} else {
						this_app.goVcl();
					}
				} else {
					if(this_app.isLeftPanelOpen()) {
		        		this_app.closeLeftPanel();
		        	} else {
		        		this_app.openLeftPanel();
		        	}
				}
				e.preventDefault(); // cancel/prevent cancel
			},
			type: "keydown"
		});
		
		var version = document.head.dataset.version;
		js.override(this_app.f7a.router, {
			preprocess: function(view, content, url, proceed) {
				var me = this, args = js.copy_args(arguments); args.callee = arguments.callee;
				return Pages.preprocess(view, content, url, function() {
					return js.inherited(me, args);
				});
			},
			preroute: function(view, options) {
				console.log("app.router.preroute", view, options);
				
				/* If module is not loaded yet:
					- return false in order to block routing/loading page
					- app.showIndicator()
					- load module --> load page again (how?)
					- ...
					
				   If module is indeed loaded, but context is not loaded yet:
				    - return false in order to block routing/loading page
				    - app.showIndicator()
				    - load context --> load page again (how?)

				*/
				
				return js.inherited(arguments);	
			},
			load: function() { 
				var args = js.copy_args(arguments); args.callee = arguments.callee; 
				/* TODO When debugging version is probably bigger than 10000, however... */
				if(args[1].reload) {
					// A call to V7.refreshPage(), which leads to this function eventually, would not use the same context by default (only when using url_query it seems)
					args[1].context = args[0].activePage.context;
				} else if(args[1].url) {
					args[1].url += (args[1].url.indexOf("?") === -1 ? "?" : "&");
					args[1].url += ("v" + (version > 10000 ? Date.now() : version)); 
				}
				return js.inherited(this, args); 
			},
            template7Render: function (view, options) {
				var args = js.copy_args(arguments); args.callee = arguments.callee; 
            	if(options.context === undefined && options.contextName === undefined) {
            		options.context = Pages.context;
            	}
            	return js.inherited(this, args);
            }
		});

		// $$(document).on("ptr:refresh", function() {
		// 	console.log(arguments);
		// 	setTimeout(function() {
		// 		this_app.f7a.pullToRefreshDone()
		// 	}, 0);
		// });

		/*- At first loading pages should not be animated to prevent a 
			cluttering visual effect. Besides, those are the intial pages
			and should just be there */
	    this_app.f7a.views[0].router.loadPage({
	    	url: this.getVar("pageUrls.left"), animatePages: false});
	    this_app.f7a.views[1].router.loadPage({
	    	url: this.getVar("pageUrls.main"), animatePages: false});
	    	
	    /*- TODO shouldn't App7.loadPage be used here? */
	    // var vars = this.getVars();
	    // this_app.loadPage("left", "Left", {}, {animatePages: false});
	    // this_app.loadPage("main", "Map", {}, {animatePages: false});
	    
	    return this.inherited(arguments);
	}
}, [
	$i("window", { css: "background-color: white;", visible: false })
]);