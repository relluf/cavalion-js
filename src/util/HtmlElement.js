define(function(require) {

	var Browser = require("./Browser");
	var singleSeperator = (str, sep) => str.split(sep).filter(_ => _).join(sep);

	var HtmlElement = {

		defaultComputedStyleObj : {
			getPropertyValue : function() {
			}
		},
		toSelectorCase : function(selector) {
			/**
			 * Taken from dojo
			 *
			 * @param {String}
			 *            selector
			 */
			return selector.replace(/([A-Z])/g, "-$1").toLowerCase();
		},
		toCamelCase : function(selector) {
			/**
			 * Taken from dojo
			 *
			 * @param {String}
			 *            selector
			 */
			var arr = selector.split("-"), cc = arr[0];
			for (var i = 1, l = arr.length; i < l; i++) {
				cc += arr[i].charAt(0).toUpperCase() + arr[i].substring(1);
			}
			return cc;
		},
		addClass : function(node, className) {
			if (node.className !== "") {
				node.className = singleSeperator(node.className + " " + className, " ");
			} else {
				node.className = singleSeperator(className);
			}
		},
		addClasses : function(node, classes) {
			if (classes instanceof Array) {
				classes = classes.join(" ");
			}
			node.className = node.className + " " + classes;
		},
		removeClass : function(node, className) {
			var classes = node.className.split(" ");
			while ((i = classes.indexOf(className)) !== -1) {
				classes.splice(i, 1);
			}
			node.className = classes.join(" ");
		},
		removeClasses : function(node, classes) {
			/**
			 *
			 * @param node
			 * @param classes
			 */
			var classes_ = node.className.split(" ");
			classes.split(" ").forEach(function(className) {
				var i = classes_.indexOf(className);
				if (i !== -1) {
					classes_.splice(i, 1);
				}
			});
			node.className = classes_.join(" ");
		},
		replaceClass: function(node, find, replace) {
			/**
			 * @param node
			 * @param find
			 * @param replace
			 */
			var classes = node.className.split(" ");
			classes.map(function(cls) {
				return cls === find ? replace : cls;
			});
			node.className = classes.join(" ");
		},
		hasClass : function(node, className) {
			var cn = " " + node.className + " ";
			return cn.indexOf(" " + className + " ") !== -1;
		},
		toggleClass: function(node, className) {
			if(HtmlElement.hasClass(node, className)) {
				HtmlElement.removeClass(node, className);
			} else {
				HtmlElement.addClass(node, className);
			}
		},
		hasParent : function(node, parentNode) {
			node = node.parentNode;
			while (node !== null && node !== parentNode) {
				node = node.parentNode;
			}
			return node === parentNode;
		},
		clearSelection : function(element) {
			try {
				if (window.getSelection) {
					if (Browser.safari) {
						window.getSelection().collapse();
					} else {
						window.getSelection().removeAllRanges();
					}
				} else if (document.selection) {
					if (document.selection.empty) {
						document.selection.empty();
					} else if (document.selection.clear) {
						document.selection.clear();
					}
				}
				return true;
			} catch (e) {
				console.log(new Error("HtmlElement.clearSelection broken", e));
			}
			return false;
		},
		disableSelection : function(element) {
			// FIXME Write a foolproof one! push/pop webkitUserSelect value
			element = element || document.body;

			if (element['HtmlElement.disableSelectionCount'] === undefined) {
				element['HtmlElement.disableSelectionCount'] = 0;
			} else {
				element['HtmlElement.disableSelectionCount']++;
			}

			this.clearSelection(element);

			var h = Browser;
			if (h.mozilla) {
				element.style.MozUserSelect = "none";
			} else if (h.webkit) {
				// element.style.KhtmlUserSelect = "none";
				element.style['-webkit-user-select'] = "none";
				element.style['user-select'] = "none";
			} else if (h.ie) {
				element.unselectable = "on";
			} else {
				return false;
			}
			return true;
		},
		enableSelection : function(element) {
			element = element || document.body;

			if (element['HtmlElement.disableSelectionCount'] !== undefined) {
				if (--element['HtmlElement.disableSelectionCount'] === 0) {
					delete element['HtmlElement.disableSelectionCount'];
				}
			} else {
				throw new Error(
						"Incorrect usage, HtmlElement.disableSelection not called");
			}
			// TODO Shouldn't we return in case the counter > 0?
			var h = Browser;
			if (h.mozilla) {
				element.style.MozUserSelect = "";
			} else if (h.webkit) {
				// element.style.KhtmlUserSelect = "";
				element.style['-webkit-user-select'] = "";
				element.style['user-select'] = "";
			} else if (h.ie) {
				element.unselectable = "off";
			} else {
				return false;
			}
			return true;
		},
		getChildNode : function(node, index1 /* , ... , indexN */) {
			for (var i = 1; i < arguments.length && node !== null; ++i) {
				node = node.childNodes[arguments[i]] || null;
			}
			return node;
		},
		getIndex: function(node) {
			return node.parentNode === null ? -1 : (function() {
				for(var i = 0; i < node.parentNode.childNodes.length; ++i) {
					if(node.parentNode.childNodes[i] === node) {
						return i;
					}
				}
			}());
		},
		isVisible : function(el) {
			/**
			 * Credit: http://stackoverflow.com/a/15203639
			 *
			 * @param el
			 * @returns {Boolean}
			 */
			var eap, rect = el.getBoundingClientRect(), docEl = document.documentElement, vWidth = window.innerWidth
					|| docEl.clientWidth, vHeight = window.innerHeight
					|| docEl.clientHeight, efp = function(x, y) {
				return document.elementFromPoint(x, y);
			}, contains = "contains" in el ? "contains"
					: "compareDocumentPosition", has = contains == "contains" ? 1
					: 0x10;

			// Return false if it's not in the viewport
			if (rect.right < 0 || rect.bottom < 0 || rect.left > vWidth
					|| rect.top > vHeight)
				return false;

			// Return true if any of its four corners are visible
			return ((eap = efp(rect.left, rect.top)) == el
					|| el[contains](eap) == has
					|| (eap = efp(rect.right, rect.top)) == el
					|| el[contains](eap) == has
					|| (eap = efp(rect.right, rect.bottom)) == el
					|| el[contains](eap) == has
					|| (eap = efp(rect.left, rect.bottom)) == el || el[contains]
					(eap) == has);
		},
		getComputedStyle : function(node) {
			/**
			 * Taken from dojo
			 *
			 * @param {HtmlElement}
			 *            node
			 */
			if (node.style) {
				if (!Browser.ie && document.defaultView) {
					// Safari, Opera, Firefox
					try {
						var cs = document.defaultView.getComputedStyle(node,
								null);
						if (cs) {
							return cs;
						}
					} catch (e) {
						if (node.style.getPropertyValue) {
							return node.style;
						}
					}
				} else if (node.currentStyle) {
					// IE
					return {
						cs : node.currentStyle,
						getPropertyValue : function(cssSelector) {
							var property = HtmlElement.toCamelCase(cssSelector);
							return this.cs[property];
						}
					};
				}
				if (node.style.getPropertyValue) {
					return node.style;
				}
			}
			return HtmlElement.defaultComputedStyleObj;
			// throw new Error("Could not determine style object");
		},
		sumAncestorproperties : function(node, prop) {
			/**
			 *
			 * @param {HtmlElement}
			 *            node
			 * @param {String}
			 *            prop
			 */
			var retVal = 0;
			while (node !== null) {
				var val = node[prop];
				if (val !== undefined && val !== null) {
					retVal += val - 0;
				}
				node = node.parentNode;
			}
			return retVal;
		},
		getAbsolutePosition : function(node, includeScroll, computedStyle) {
			/**
			 *
			 * @param {HtmlElement}
			 *            node
			 * @param {Boolean}
			 *            includeScroll
			 */
			var h = Browser;
			var doc = node.document || node.ownerDocument;
			var db = doc.body;
			var ap = {
				x : 0,
				y : 0
			};
			if (node.getBoundingClientRect) {
				var bcr = node.getBoundingClientRect();
				if (!db) {
					return ap;
				}
				if (node !== db.parentNode) {
					// huu?
					if (h.ie) {
						ap.x = bcr.left - 2;
						ap.y = bcr.top - 2;
					} else {
						ap.x = bcr.left;
						ap.y = bcr.top;
					}
				}
			} else {
				// console.log("!getBoundingClientRect")
				if (node.offsetParent) {
					var endelement;
					if (h.safari
							&& node.style.getPropertyValue("position") === "absolute"
							&& (node.parentelement === db)) {
						endelement = db;
					} else {
						endelement = db.parentelement;
					}
					if (node.parentelement !== db) {
						ap.x -= this.sumAncestorProperties(node.parentNode,
								"scrollLeft");
						ap.y -= this.sumAncestorProperties(node.parentNode,
								"scrollTop");
					}
					do {
						var n = node.offsetLeft;
						ap.x += isNaN(n) ? 0 : n;
						var m = node.offsetTop;
						ap.y += isNaN(m) ? 0 : m;

						node = node.offsetParent;

						if (!h.opera && node !== null) {
							var cs = computedStyle
									|| HtmlElement.getComputedStyle(node);
							var bl = parseInt(cs
									.getPropertyValue("border-left-width"), 10) || 0;
							var bt = parseInt(cs
									.getPropertyValue("border-top-width"), 10) || 0;

							// huu?
							if (h.mozilla
									&& cs.getPropertyValue("overflow") === "auto") {
								bl *= 2;
								bt *= 2;
							}

							// console.logf(">> %d %d %d %d", n, m, bl, bt);
							ap.x += bl;
							ap.y += bt;
						} else {
							// console.logf(">> %d %d - -", n, m);
						}
					} while (node !== endelement && (node !== null));
				} else if (node.x && node.y) {
					ap.x += isNaN(node.x) ? 0 : node.x;
					ap.y += isNaN(node.y) ? 0 : node.y;
				}
			}
			if (node !== db.parentNode) {
				ap.x += window.pageXOffset || doc.documentElement.scrollLeft
						|| doc.body.scrollLeft || 0;
				ap.y += window.pageYOffset || doc.documentElement.scrollTop
						|| doc.body.scrollTop || 0;
			}
			return ap;
		},
		getAbsoluteRect : function(node, includeScroll) {
			/**
			 *
			 * @param node
			 * @param includeScroll
			 */
			var cs = HtmlElement.getComputedStyle(node);
			var ap = this.getAbsolutePosition(node, includeScroll === true, cs);

			var ow = node.offsetWidth;
			var oh = node.offsetHeight;

			var bl = parseInt(cs.getPropertyValue("border-left-width"), 10) || 0;
			var br = parseInt(cs.getPropertyValue("border-right-width"), 10) || 0;
			var bt = parseInt(cs.getPropertyValue("border-top-width"), 10) || 0;
			var bb = parseInt(cs.getPropertyValue("border-bottom-width"), 10) || 0;

			var ml = parseInt(cs.getPropertyValue("margin-left"), 10) || 0;
			var mr = parseInt(cs.getPropertyValue("margin-right"), 10) || 0;
			var mt = parseInt(cs.getPropertyValue("margin-top"), 10) || 0;
			var mb = parseInt(cs.getPropertyValue("margin-bottom"), 10) || 0;

			var pl = parseInt(cs.getPropertyValue("padding-left"), 10) || 0;
			var pr = parseInt(cs.getPropertyValue("padding-right"), 10) || 0;
			var pt = parseInt(cs.getPropertyValue("padding-top"), 10) || 0;
			var pb = parseInt(cs.getPropertyValue("padding-bottom"), 10) || 0;

			var r = {
				left : ap.x - ml,
				top : ap.y - mt,
				width : ow + mr + ml,
				height : oh + mb + mt
			};

			return r;
		},
		getClientRect : function(node, includeScroll) {
			/**
			 *
			 * @param {HtmlElement}
			 *            node
			 */
			var cs = HtmlElement.getComputedStyle(node);

			var cw = node.clientWidth;
			var ch = node.clientHeight;
			var ow = node.offsetWidth;
			var oh = node.offsetHeight;
			var sw = node.scrollWidth;
			var sh = node.scrollHeight;

			var pl = parseInt(cs.getPropertyValue("padding-left"), 10);
			var pr = parseInt(cs.getPropertyValue("padding-right"), 10);

			var pt = parseInt(cs.getPropertyValue("padding-top"), 10);
			var pb = parseInt(cs.getPropertyValue("padding-bottom"), 10);

			cw = sw < cw ? cw : sw;
			ch = sh < ch ? ch : sh;

			return {
				left : pl,
				top : pt,
				width : cw - pr,
				height : ch - pb
			};
		},
		getWidth : function(node) {
			return node.offsetWidth;
		},
		getHeight : function(node) {
			return node.offsetHeight;
		},
		
		getData: function(node, key, defaultValue) {
			if(this.hasData(node, key) !== true) {
				return this.setData(node, key, defaultValue);
			}
			return node.dataset[key];
		},
		setData: function(node, key, value) {
			node.dataset[key] = value;
		},
		removeData: function(node, key) {
			var value = this.getData(node, key);
			delete node.dataset[key];
			return value;
		},
		hasData: function(node, key) {
			return node.dataset.hasOwnProperty(key);
		},
		
		fromSource: function(html) {
			var parent = document.createElement("div");
			parent.innerHTML = html;
			
			var element = parent.childNodes[0];
			parent.removeChild(element);
			return element;
		}
	};

	return HtmlElement;

}); 