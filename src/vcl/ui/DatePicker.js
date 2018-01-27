/**
 * js/comp/ctl/DatePicker.js
 */
js.lang.Class.require("org.cavalion.comp.ui.Edit");
js.lang.Class.require("org.cavalion.comp.ui.Popup");

js.lang.Class.declare("org.cavalion.comp.ui.DatePicker", {
	
	/**
	 * Base class
	 */
	Extends: org.cavalion.comp.ui.Edit,

	/**
	 * Implemented interfaces
	 */
	Implements: [
		// org.cavalion.comp.DataLink
	],

	/**
	 * Member definitions
	 */
	Members: {

		/**
		 * @overrides org.cavalion.comp.Control.prototype
		 */
		_innerHtml: "<div class=\"border\"><input/></div>",

		/**
		 *
		 */
		_droppedDown: false,

		_popup: null


	},

	/**
	 * Constructor
	 */
	Constructor: function() {

	},
	
	/**
	 * Method definitions
	 */
	Methods: {

		/**
		 * @overrides org.cavalion.comp.Control.prototype.mousedown
		 */
		mousedown: function() {
			this.addClass("down");
			return js.lang.Class.__inherited(this, arguments);
		},

		/**
		 * @overrides org.cavalion.comp.Control.prototype.mouseup
		 */
		mouseup: function() {
			this.removeClass("down");
			return js.lang.Class.__inherited(this, arguments);
		},

		/**
		 * @overrides org.cavalion.comp.Control.prototype.mouseleave
		 */
		mouseleave: function() {
			this.removeClass("down");
			return js.lang.Class.__inherited(this, arguments);
		}
		
	}

});