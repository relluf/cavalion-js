define(function(require) {

	var Class = require("js/Class");
	var js = require("js");

	var HtmlElement = require("../../util/HtmlElement");

	var Node = require("../Node");

	var ObjectNode = {

		inherits: Node,

		prototype: {
			_classes: ["object"],

			/**
			 * @overrides ../Node.prototype.isExpandable
			 */
			isExpandable: function() {
			 	var keys = this.getKeys();
				return js.keys(keys.own).length + js.keys(keys.proto).length > 0;
			},

			/**
			 * @overrides ../Node.prototype.initializeValue
			 */
			initializeValue: function(node) {
/**
				if(this._value instanceof js.util.printerline.Obj) {
					node.innerHTML = String.format("(%H)", js.nameOf(this._value.$));
				} else {
*/
				node.innerHTML = String.format("%H", js.nameOf(this._value)) || this._value;
/**
				}
*/
			},

			/**
			 * @overrides ../Node.prototype.initializeContainer
			 */
			initializeContainer: function(node) {
				var obj = this.getObject();
				var keys = this.getKeys();

				function add(parentNode, keys, seperator) {
					var node;
					var i, n;
					var key;
					var range = 50;

					if(keys.length > range) {
						i = 0;
						obj = {};
						while(i < keys.length) {
							j = i + range;
							if(j > keys.length) {
								j = keys.length;
							}
							key = String.format("[%s...%s]", keys[i], keys[j - 1]);
							obj[key] = {};
							for(;i < j; ++i) {
								try {
									obj[key][keys[i]] = this._value[keys[i]];
								} catch(e) {
									obj[key][keys[i]] = e;
								}
							}
						}
						keys = js.keys(obj);
					}

					for(i = 0; i < keys.length; ++i) {
						try {
							key = keys[i];
							node = Node.create(obj[key], key).getNode();
							parentNode.appendChild(node);

							if(seperator === true && i === keys.length - 1) {
								HtmlElement.addClass(node, "border-bottom");
							}
						} catch(e) {
							console.error(key, obj[key], e.message, e);
						}
					}
				}

				var proto = js.keys(keys.proto).sort();

				add.apply(this, [node, js.keys(keys.own).sort(), proto.length > 0]);
				add.apply(this, [node, proto]);
			},

			/**
			 *
			 */
			getKeys: function() {
				var obj = this.getObject();
				var r = {
					own: {},
					proto: {}
				};

				var o = 0;
				var p = 0;

				for(var k in obj) {
					if(obj.hasOwnProperty === undefined || obj.hasOwnProperty(k)) {
						try {
							r.own[k] = obj[k];
//							r.proto[k] = obj[k];
							o++;
							p++;
						} catch(e) {
							r.own[k] = e;
						}
					} else {
						try {
							r.proto[k] = obj[k];
						} catch(e) {
							r.proto[k] = e;
						}
						p++;
					}
				}

				if(p === o) {
//					r.proto = {};
				}

				return r;
			},

			/**
			 *
			 */
			getObject: function() {
				return this._value;
			}
		}
	};

	return (ObjectNode = Class.define(require, ObjectNode));
});
