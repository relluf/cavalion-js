define(function(require) {

	var js = require("js");
	var Browser = require("./Browser");
	var Ajax = require("./Ajax");
	var module = require("module");

	var cssRuleCount = 0;
	var namePath = module.id.replace(/\//g, "-");
	var selectors = [];
	var loaded = [];

	var Stylesheet = {

		/**
		 *
		 */
		require: function(uri, version, insert, callback) {
			if(loaded.indexOf(uri) === -1) {
				if(insert === true) {
					var head = document.getElementsByTagName("head")[0];
					var link = document.createElement("link");

					if(callback) {
						link.onload = function() {
							callback();
						};
					}

					link.setAttribute("rel", "stylesheet");
					link.setAttribute("href", uri);
					head.insertBefore(link, head.childNodes[loaded.length]);
				} else {
					var css = Ajax.get(uri);
					var head = document.getElementsByTagName("head")[0];
					var style = document.createElement("style");
					style.setAttribute("type", "text/css");
					if (style.styleSheet) {
						style.styleSheet.cssText = css;
					} else {
						var cssText = document.createTextNode(css);
						style.appendChild(cssText);
					}
					head.appendChild(style);
				}
				loaded.push(uri);
			}
		},

		/**
		 *
		 */
		generateSelector: function(prefix) {

			// FIXME String.format("%x/X", i);
			function intToHex(i) {
				var r = i ? "" : "0";
				for(; i > 0; i >>= 4) {
					var d = i & 15;
					if(d >= 10) {
						d = "ABCDEF".charAt(d - 10);
					}
					r = d + r;
				}
				return r;
			}

			if(prefix === undefined) {
				return ".z" + intToHex(cssRuleCount++);
			}

			if(selectors.indexOf(prefix) !== -1) {
				var i = 1;
				while(selectors.indexOf(prefix + intToHex(++i)) !== -1);
				prefix += intToHex(i);
			}

			return "." + prefix;
		},

		/**
		 *
		 */
		validateStyle: function(style) {
			if(Browser.webkit) {
				return style;
			}
			if(style && style['float'] !== undefined) {
				style.cssFloat = style.styleFloat = style['float'];
				delete style['float'];
			}
			var r = {};
			for(var key in style) {
				var value = style[key];
				if(key.indexOf("-") !== -1) {
					key = key.split("-");
					for(var i = 1, l = key.length; i < l; ++i) {
						key[i] = key[i].charAt(0).toUpperCase() + key[i].substring(1);
					}
					key = key.join("");
				}
				r[key] = value;
			}
			return r;
		},

		/**
		 *
		 */
		getStylesheet: function(priority) {
			var id = namePath + "_" + priority;
			var el = document.getElementById(id);

			if(el === null) {
				if(priority > 0) {
					this.getStylesheet(priority - 1);
				}
				el = document.createElement("style");
			    el.setAttribute("type", "text/css");
				el.id = id;
				document.getElementsByTagName("head")[0].appendChild(el);
			}

			return el.sheet || el.styleSheet;
		},

		/**
		 *
		 */
		createCssRule: function(style, priority, selector) {
			// TODO more of these bugs?

			if(typeof style === "string") {
				style = js.str2obj(style);
			}

			style = this.validateStyle(style);

			var sheet = this.getStylesheet(priority);

			var index;
			if(sheet.cssRules !== undefined) { // W3
				index = sheet.cssRules.length;
			} else if(sheet.rules !== undefined) { // IE
				index = sheet.rules.length;
			} else {
				// fail
				console.log(this, String.format("Could not create cssRule with priority %d", priority));
				return null;
			}

			if(selector === undefined) {
				selector = this.generateSelector();
			}

			if(sheet.insertRule) { // W3
				try {
					sheet.insertRule(selector + "{}", index);
				} catch(e) {
					//console.error(selector);
					//throw e;
				}
			} else if(sheet.addRule) { // IE
				sheet.addRule(selector, null, index);
			} else {
				// fail
				throw new Error(String.format("Could not add or insert rule with priority %d", priority));
			}

			var rules = sheet.rules || sheet.cssRules;
			var rule = rules[rules.length - 1];
			Stylesheet.styleToRule(style, rule);
			return rule;
		},

		/**
		 *
		 *
		 * @param style
		 * @param rule
		 */
		styleToRule: function(style, rule) {
			var set = rule.style.setAttribute ?
				function(key, value) {
					this.style.setAttribute(key, value);
				}
			:
				function(key, value) {
					this.style[key] = value;
				};

			var get = rule.style.setAttribute ?
					function(key) {
						return this.style.getAttribute(key);
					}
				:
					function(key) {
						return this.style[key];
					};

			for(var key in style) {
				try {
					var value = style[key];
					if(typeof value !== "object") {
						set.apply(rule, [key, value]);
					} else {
						if(get.apply(rule, [key]) !== "") {
							throw new Error("Can not safely do this");
						}
						for(var i = 0; i < value.length; ++i) {
							var val = String(value[i]);
							set.apply(rule, [key, val]);
							if(get.apply(rule, [key]) !== "") {
								break;
							}
							console.log(get.apply(rule, [key]).toLowerCase(), "!==", val);
						}
					}
				} catch(e) {
					console.log(String.format("%s := %s -> %s", key, value, e.message));
				}
			}
		},

		/**
		 *
		 */
		destroyCssRule: function(rule) {
			rule.style.cssText = "";
			//TODO js.print(this, "not implemented yet");
		}

	};

	return Stylesheet;
});