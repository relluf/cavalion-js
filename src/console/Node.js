define(function(require) {

	var Class = require("js/Class");
	var Browser = require("../util/Browser");
	var HtmlElement = require("../util/HtmlElement");
	var Event = require("../util/Event");
	var start = Date.now();

	var Node = {
		prototype: {
			_classes: null,
			_value: null,
			_key: null,
			_node: null,
			
			constructor: function(value, key) {
				this._value = value;
				this._key = key;
				this._time = Date.now() - start;
			},
			createNode: function() {
				var node = document.createElement("div");
				node.className = "node";
				this.initialize(node);

				if(this._key === undefined) {
					node.innerHTML = this.innerHtmlMessage();
					this.initializeTime(node.childNodes[0]);
					this.initializeMessage(node.childNodes[1]);
				} else {
					node.innerHTML = this.innerHtmlKey();
					this.initializeTime(node.childNodes[0]);
					this.initializeKey(node.childNodes[1]);
					this.initializeValue(node.childNodes[2]);
				}

				if(this._classes !== null) {
					HtmlElement.addClasses(node, this._classes);
				}

				node._line = this;

				return node;
			},
			recreateNode: function() {
				var parentNode = this._node.parentNode;
				var reference = this._node.nextSibling;
				this._node.parentNode.removeChild(this._node);
				this._node = this.createNode();
				parentNode.insertBefore(this._node, reference);
			},
			innerHtmlMessage: function() {
				return "<div class='time'></div><div class='message'></div><div class='container'></div>";
			},
			innerHtmlKey: function() {
				return "<div class='time'></div><div class='key'></div>" +
						"<div class='value'></div><div class='container'></div>";
			},
			getNode: function() {
				if(this._node === null) {
					this._node = this.createNode();
				}
				return this._node;
			},
			isExpandable: function() {
				return false;
			},
			initialize: function(node) {
				if(Browser.webkit) {
					HtmlElement.addClass(node, "webkit");
				}
				if(this._key !== undefined && this._showTime !== true) {
					HtmlElement.addClass(node, "key");
				}
				if(this.isExpandable()) {
					HtmlElement.addClass(node, "expandable");
					node.ontouchstart = node.onclick = Node.click_expand.bind(this);
				}
			},
			initializeTime: function(node) {
				if(this._key !== undefined && this._showTime !== true) {
					node.style.display = "none";
				}
				node.innerHTML = String.format("%d", this._time);
				delete this._time;
			},
			initializeKey: function(node) {
				node.innerHTML = String.format("%H: ", this._key);
			},
			initializeValue: function(node) {
			},
			initializeMessage: function(node) {
				return this.initializeValue(node);
			},
			initializeContainer: function(node) {
			}
		},
		statics: {
			create: function() { /* stub, implemented in ./Printer */ },
			click_expand: function(evt) {
				evt = Event.fix(evt);
				
				if(evt.keyModifiers.length > 0) return;

				var node = evt.target;
				while(node !== null && node.parentNode !== this._node) {
					node = node.parentNode;
				}

				if(node !== null && !HtmlElement.hasClass(node, "container")) {
					this.initializeContainer(this._node.childNodes[this._key === undefined ? 2 : 3]);
					HtmlElement.addClass(this._node, "expanded");
					this._node.ontouchstart = this._node.onclick = Node.click_toggle_expanded.bind(this);
				}
			},
			click_toggle_expanded: function(evt) {
				evt = Event.fix(evt);

				if(evt.keyModifiers.length > 0) return;
				
				var node = evt.target;
				while(node !== null && node.parentNode !== this._node) {
					node = node.parentNode;
				}

				if(node !== null && !HtmlElement.hasClass(node, "container")) {
					if(HtmlElement.hasClass(this._node, "expanded")) {
						HtmlElement.removeClass(this._node, "expanded");
					} else {
						if(evt.altKey === true) {
							this.recreateNode();
							this.initializeContainer(this._node.childNodes[this._key === undefined ? 2 : 3]);
							HtmlElement.addClass(this._node, "expanded");
							this._node.ontouchstart = this._node.onclick = Node.click_toggle_expanded.bind(this);
						} else {
							HtmlElement.addClass(this._node, "expanded");
						}
					}
				}
			}
		}
	};

	return (Node = Class.define(require, Node));
});