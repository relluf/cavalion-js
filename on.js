define(function() {

    function each(obj, f) {
        return Object.keys(obj).map(f);
    }

    function on(elem, name, f) {
        if(elem !== window && !(elem instanceof Element) && typeof elem.on === "function") {
            return elem.on(name, f);
        } else if (elem instanceof Array) {
            return elem.map(function(elem) {
                return on(elem, name, f);
            });
        } else if(typeof name === "object") {
            return each(name, function(k) {
                return on(elem, k, name[k]);
            });
        }
        return elem.addEventListener(name, f);
    }

    return on;
});
