define(["js/defineClass"], function(HexaQuad) {

	return (HexaQuad = HexaQuad(require, {
		prototype: {
			uid: null,
			id: null,

			constructor: function(uid, id) {
				/**
				 *
				 * @param uid
				 * @param id
				 */
			    if (id === undefined && typeof uid === "string") {
			        this.fromString(uid);
			    } else {
			        this.uid = parseInt(uid, 10) || 0;
			        this.id = parseInt(id, 10) || 0;
				}
			},
			_i: function(c) {
				/**
				 *
				 * @param {Object} c
				 */
			    var idx = HexaQuad.characters.indexOf(c);
			    if (idx !== -1) {
			        return idx;
			    }
			    throw new Error(String.format("Illegal character '%s'", c));
			},
			_format: function(value, len) {
				/**
				 *
				 * @param {Object} value
				 * @param {Object} len
				 */
			    var r = "";
			    while (value > 0) {
			        r = HexaQuad.characters.charAt(value % 64) + r;
			        value = parseInt(value / 64, 10);
			    }
			    while (r.length < len) {
			        r = "0" + r;
			    }
			    return r;
			},
			_atoi: function(s) {
				/**
				 *
				 * @param {Object} s
				 */
			    var result = 0;
			    var length = s.length;
			    var c;
			    for (var i = 0; i < length; ++i) {
			        result *= 64;
			        c = this._i(s.charAt(i));
			        result += c;
			    }
			    return result;
			},

			fromString: function(hq) {
				/**
				 * @param {Object} hq
				 */
			    while (hq.length < 10) {
			        hq = "0" + hq;
			    }
			    this.uid = this._atoi(hq.substring(0, 6));
			    this.id = this._atoi(hq.substring(6, 10));
			},
			toString: function() {
			    return this._format(this.uid, 6) + this._format(this.id, 4);
			},
			inc: function(size) {
				/**
				 * Returns the current value and increments
				 *
				 * @param size
				 * @return
				 */
				size = size || 1;

				var s = this.toString();
				for (var i = 0; i < size; ++i) {
					if (this.id < HexaQuad.MAX_ID) {
						this.id++;
					}
					else {
						this.uid++;
						this.id = 0;
					}
				}
				return s;
			}
		},
		statics: {

			MAX_ID: 8388607,//Math.pow(2, 23) - 1

			characters: "0123456789" + "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[" + "abcdefghijklmnopqrstuvwxyz",

			format: function(id, fmt) {
				var hq = new HexaQuad(String.toJS(id));
				return String.format(fmt || "_%d_%d", hq.uid, hq.id);
			}
		}
	}));
});