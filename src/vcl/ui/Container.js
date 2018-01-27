define(["require", "js/defineClass", "./Element", "js/Type"], function(require, Container, Element, Type) {

	return (Container = Container(require, {

		inherits: Element,

		prototype: {

			/**
			 * @overrides ../Control.prototype.getInnerHtml
			 */
			getInnerHtml: function() {
				return this._content || "";
			},

			/**
			 * @overrides ../Control.prototype.isContainer
			 */
			isContainer: function() {
				return true;
			},
			
            align: function (control, origin) {
            	// No hay nada de hacer yo creo
			},

			/**
			 * @overrides ../Control.prototype.storeScroll
			 */
			storeScroll: function() {
				this.hasOwnProperty("_controls") && this._controls.forEach(function(control) {
					control.storeScroll();
				});
				return this.inherited(arguments);
			},

			/**
			 * @overrides ../Control.prototype.restoreScroll
			 */
			restoreScroll: function() {
				this.hasOwnProperty("_controls") && this._controls.forEach(function(control) {
					control.restoreScroll();
				});
				return this.inherited(arguments);
			},

			/**
			 *
			 */
			parentScrolled: function(parent, evt) {
				if(this.hasOwnProperty("_controls")) {
					for (var i = 0, l = this._controls.length; i < l; ++i) {
						this._controls[i].parentScrolled(parent, evt);
					}
				}
			}
		},

		properties: {

			"controls": {
				type: Type.ARRAY,
				visible: false,
				stored: false
			},
			"onReceiveParams": {
				type: Type.EVENT
			}
		}
	}));
});