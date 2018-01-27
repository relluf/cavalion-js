define(function(require) {

	var Class = require("./Class");
	var inherited = require("./Method").callInherited;
	var override = require("./Method").override;
	
	/** Keeps track of the next hashCode */
	var hashCode = 0;
	var all = [];

	all.push = function() {
		hashCode += arguments.length;
		return Array.prototype.push.apply(this, arguments);
	};

	var JsObject = Class.define;

	return (JsObject = JsObject(require, {

		inherits: Object,

		prototype: {

			'@hashCode': null,

			toString: function() {
				/** @overrides Object.prototype.toString */
				return String.format("%n#%d", this.constructor, this.hashCode());
			},
			destroy: function() {
				/** */
				if(this.hasOwnProperty("@hashCode")) {
					delete JsObject.$[this['@hashCode']];
				}

				// some debugging handy-dandy: when a reference to an object is
				// found with a negative hashCode, destroy has been called for
				// that instance and caution is advised
				for( var k in this) {
					if(k !== "@hashCode") {
						delete this[k];
					} else {// if(this.hasOwnProperty("@hashCode")) {
						delete all[this['@hashCode']];
						this['_@hashCode'] = -this['@hashCode'];
					}
				}
			},
			hashCode: function() {
				/** * @returns {Boolean} */
				if(this instanceof JsObject) { // prototype stuff
					if(this.hasOwnProperty("@hashCode")) {
						return this['@hashCode'];
					}
					this['@hashCode'] = hashCode++;

					all[this['@hashCode']] = this;

					return this['@hashCode'];
				}
			},
			inherited: function(args, skip) {
				/** */
				return inherited(this, args, skip);
			},
			override: function(obj, allowNoImpl) {
				/** */
				return override(this, obj, allowNoImpl);
			},
			defineProperties: function() {
				/** */
				return Class.getProperties(this.constructor);
			},
			setProperties: function(values) {
				/**  */
			    var props = this.defineProperties();
			    for(var k in values) {
			        var prop = props[k];
			        if(k) {
			            prop.set(this, values[k]);
			        }
			    }
			    return this;
			}
		},

		statics: {

			$: all,
			all: all

		}
	}));
});