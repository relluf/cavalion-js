/**
 * Keyboard.js
 */
define(function () {

    var specialKeys = {
        8: 'KEY_BACKSPACE',
        9: 'KEY_TAB',
        12: 'KEY_NUM_PAD_CLEAR',
        // weird, for Safari and Mac FF only
        13: 'KEY_ENTER',
        16: 'KEY_SHIFT',
        17: 'KEY_CTRL',
        18: 'KEY_ALT',
        19: 'KEY_PAUSE',
        20: 'KEY_CAPSLOCK',
        27: 'KEY_ESCAPE',
        32: 'KEY_SPACEBAR',
        33: 'KEY_PAGEUP',
        34: 'KEY_PAGEDOWN',
        35: 'KEY_END',
        36: 'KEY_HOME',
        37: 'KEY_LEFT',
        38: 'KEY_UP',
        39: 'KEY_RIGHT',
        40: 'KEY_DOWN',
        44: 'KEY_PRINTSCREEN',
        45: 'KEY_INSERT',
        46: 'KEY_DELETE',
        59: 'KEY_SEMICOLON',
        // weird, for Safari and IE only
        91: 'KEY_WINDOWS_LEFT',
        92: 'KEY_WINDOWS_RIGHT',
        93: 'KEY_SELECT',
        106: 'KEY_NUM_PAD_ASTERISK',
        107: 'KEY_NUM_PAD_PLUS_SIGN',
        109: 'KEY_NUM_PAD_HYPHEN-MINUS',
        110: 'KEY_NUM_PAD_FULL_STOP',
        111: 'KEY_NUM_PAD_SOLIDUS',

        112: 'KEY_F1',
        113: 'KEY_F2',
        114: 'KEY_F3',
        115: 'KEY_F4',
        116: 'KEY_F5',
        117: 'KEY_F6',
        118: 'KEY_F7',
        119: 'KEY_F9',
        120: 'KEY_F10',
        121: 'KEY_F11',
        122: 'KEY_F12',

        144: 'KEY_NUM_LOCK',
        145: 'KEY_SCROLLLOCK',
        186: 'KEY_SEMICOLON',
        187: 'KEY_EQUALS_SIGN',
        188: 'KEY_COMMA',
        189: 'KEY_HYPHEN-MINUS',
        190: 'KEY_FULL_STOP',
        191: 'KEY_SOLIDUS',
        192: 'KEY_GRAVE_ACCENT',
        219: 'KEY_LEFT_SQUARE_BRACKET',
        220: 'KEY_REVERSE_SOLIDUS',
        221: 'KEY_RIGHT_SQUARE_BRACKET',
        222: 'KEY_APOSTROPHE'
        // undefined: 'KEY_UNKNOWN'
    };

    return {
    	// keys: specialKeys,
    	
        getKeyNames: function () {
            var r;
            r = [];
            for (var k in specialKeys) {
                r.push(specialKeys[k]);
            }
            return r;
        },
        getKeyCode: function (keyName) {
            for (var k in specialKeys) {
                if (specialKeys[k] === keyName) {
                    return parseInt(k, 10);
                }
            }
        }
    };

});