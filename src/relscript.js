define(function() {
    return {
        load: function (name, req, onLoad, config) {
            /*- require relative to current module */
            require([req("module").id + "/../" + name], onLoad);
        }
    };
});