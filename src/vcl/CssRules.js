define(function(require) {

	var js = require("js");
	var Class = require("js/Class");
	var Control = require("js/referenceClass!./Control");
	var Stylesheet = require("../util/Stylesheet");

	var CssRules = {

		prototype: {

			/**
			 *
			 */
			constructor: function() {
				this._rules = {};
				CssRules.instances.push(this);
			},

			_rules: null,
			_selector: "",

			/**
			 *
			 */
			apply: function(css) {
				var selector = this.getSelector();
				var set, get;

				js.keys(css).forEach(function(name, index) {
					var obj = Stylesheet.validateStyle(css[name]);
					var rule = this._rules[name];
					var priority;
					if(obj === undefined) {
						if(rule !== undefined) {
							Stylesheet.destroyCssRule(this._rules[name]);
							delete this._rules[name];
						}
					} else {
						if(rule === undefined) {
							if(name.indexOf("!") !== -1) {
								name = name.split("!");
								priority = parseInt(name[1], 10) || 0;
								name = name[0];
							} else {
								priority = 10;
							}
							this._rules[name] = Stylesheet.createCssRule(obj, priority,
									String.format("%s%s", selector, name));
						} else {
							//FIXME This block is a repetition of code in Stylesheet.styleToRule
							rule.style.cssText = "";
							if(set === undefined) {
								set = rule.style.setAttribute ?
									function(key, value) { this.style.setAttribute(key, value); } :
									function(key, value) { this.style[key] = value;	};
								get = rule.style.setAttribute ?
										function(key) { return this.style.getAttribute(key); } :
										function(key) { return this.style[key];	};
							}
							for(var key in obj) {
								try {
									var value = obj[key];
									if(typeof value === "string") {
										set.apply(rule, [key, value]);
									} else if(value instanceof Array) {
										if(get.apply(rule, [key]) !== "") {
											throw new Error(String.format("Can not safely do this (%s)", key));
										}
										for(var i = 0; i < value.length; ++i) {
											var val = String(value[i]);
											set.apply(rule, [key, val]);
											if(get.apply(rule, [key]).toLowerCase() === val.toLowerCase()) {
												console.log("!");
												break;
											}
											//console.log(get.apply(rule, [key]).toLowerCase(), "!==", val);
										}
									}
								} catch(e) {
									console.log(String.format("%s := %s -> %s", key, value, e.message));
								}
							}
						}
					}
				}, this);
			},

			/**
			 *
			 */
			getRule: function(name, create) {
				return this._rules[name] || null;
			},

			/**
			 *
			 */
			getRuleStyle: function(name) {
				return this.getRule(name).style;
			},

			/**
			 *
			 */
			getSelector: function() {
				if(this._selector === "") {
					this._selector = Stylesheet.generateSelector();
				}
				return this._selector;
			},

			/**
			 *
			 */
			setSelector: function(value) {
				if(js.keys(this._rules).length !== 0) {
					throw new Error("Can not change selector while rules are already created");
				}
				this._selector = value;
			},

			/**
			 *
			 */
			setRules: function(value) {
				var rules = {};

				function loop(value, key) {
					function adjust(name) {
						if(name.charAt(0) === " " || name.charAt(0) === ":") {
							return name;
						} else if(name.charAt(0) === "&") {
							return name.substring(1);
						}
						return " " + name;
					}

					if(key.indexOf(",") !== -1) {
						throw new Error(String.format("Comma operator not supported (yet?) - %s", key));
					}
					rules[key] = value;
					for(var k in value) {
						var v = value[k];
						if(typeof v === "string" && v.charAt(v.length - 1) === ";") {
							value[k] = (v = js.str2obj(v));
						}
						if(typeof v === "object") {
							if(v instanceof Array) {
								//v = js.str2obj(v.join(""));
							} else {
								delete value[k];
								loop(js.mixIn(v), String.format("%s%s", key, adjust(k)));
							}
						}
					}
					if(js.keys(rules[key]).length === 0) {
						//delete rules[key];
					}
				}
				
				/*- Make a copy of value */
				value = js.mixIn(value);

				(function split(obj) {
					js.keys(obj).forEach(function(key) {
						var val = obj[key];
						var keys = key.split(",");
						if(keys.length > 1) {
							delete obj[key];
							keys.forEach(function(key) {
								obj[key] = val;
							});
						}
						if(typeof val === "object") {
							split(val);
						}
					});
				}(value));

				loop(value, "");
				this.apply(rules);
			},

			/**
			 *
			 */
			getClassName: function() {
				if(this._selector === "") {
					this.apply();
				}
				if(this._selector.substring(0, 1) === ".") {
					return this._selector.substring(1);
				}
				throw new Error("CssRules is not class based");
			}
		},

		statics: {
			instances: [],

			normalize: function(relativeTo, obj, sender) {

				function normalize(base, name) {
					var r = base.split("/");
					r.pop();
					name.split("/").forEach(function(part) {
						if(part === "..") {
							r.pop();
						} else if(part === ".") {

						} else {
							r.push(part);
						}
					});
					return r.join("/");
				}

				function replace(relativeTo, value, k) {
					var v = value[k];
					delete value[k];
					
					/*- Replace all occurences of # without leading backslash
						with ".\#". this is used for match component names in the 
						class of a DOM node
						
							<div class="vcl-ui-Panel #panel-top"> ... </div>
							
							css: {
								"#panel-top": "color: red;"
							}
							
						TODO This method seems to be called twice after the keys
							 have been replaced...
							
						if(k.indexOf("#") !== -1) {
							debugger;
							console.log(k, "-->", k.replace(/([^\\]|^)#/g, "$1.\\#"))
						}
					*/
					k = k.replace(/([^\\]|^)#/g, "$1.\\#");
					
					if(k.indexOf("[id$=-") !== -1 || k.indexOf("[id$='-") !== -1) {
						// console.warn((sender && sender._uri) || "<unknown>", k, "[id$=-...] is better written as #...");
					}
					
					if(k.indexOf("{") !== -1) {
						var i;

						while((i = k.indexOf("{")) !== -1) {
							var before = k.substring(0, i);
							var between = k.substring(i + 1).split("}")[0];
							var after = k.substring(i + between.length + 2);
							between = normalize(relativeTo, between);
							try {
								between = require(between);
							} catch (e) {
								throw new Error(String
										.format("Referencing class %s via css: %s", between, e.message));
							}
							between = Control.getClassNameFor(between).split(" ")[0];
							k = String.format("%s%s%s", before, between, after);
						}
					}
					value[k] = v;
					if(typeof v === "object") {
						for(k in v) {
							replace(relativeTo, v, k);
						}
					}
				}

				// normalize classes' class names
				for(var key in obj) {
					replace(relativeTo, obj, key);
				}

				return obj;
			}
		}

	};

	return (CssRules = Class.define(require, CssRules));
});
