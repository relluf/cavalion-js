define(["require", "js/defineClass", "../Node"], function(require, Array, Node) {

	return Array(require, {

		inherits: Node,

		prototype: {
			_classes: ["array"],

			/**
			 * @overrides ../Node.prototype.isExpandable
			 */
			isExpandable: function() {
				return this.getArray().length > 0;
			},

			/**
			 * @overrides ../Node.prototype.initializeMessage
			 */
			initializeValue: function(node) {
				var arr = this.getArray();
				node.innerHTML = arr.name || js.sf("Array[%d]", arr.length);
			},

			/**
			 * @overrides ../Node.prototype.initializeContainer
			 */
			initializeContainer: function(node) {
				var arr = this.getArray();
				var a, i, s;

				if(arr.length > 100) {
					a = [];//.concat(arr);
					arr.forEach(function(elem) { a.push(elem); });
					for(i = 0; a.length > 0; i += 100) {
						//arr.push(a.splice(0, 100));
						s = String.format("%d-%d", i, a.length > 100 ? i + 99 : i + a.length - 1);
						node.appendChild(Node.create(a.splice(0, 100), s).getNode());
					}
				} else {
					for(i = 0; i < arr.length; ++i) {
						node.appendChild(Node.create(arr[i], i).getNode());
					}
				}
			},

			/**
			 *
			 */
			getArray: function() {
				return this._value;
			}

		}
	});
});