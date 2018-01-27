define(function() {
    
    var Xml = {
        
        /**
         * 
         */
        beautify: function (xml) {
            var formatted = "";
            var reg = /(>)(<)(\/*)/g;
            xml = xml.replace(reg, "$1\n$2$3");
            var pad = 0;
            xml.split("\n").forEach(function (node, index) {
                var indent = 0;
                if (node.match(/.+<\/\w[^>]*>$/)) {
                    indent = 0;
                } else if (node.match(/^<\/\w/)) {
                    if (pad !== 0) {
                        pad -= 1;
                    }
                } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
                    indent = 1;
                } else {
                    indent = 0;
                }
        
                var padding = "";
                for (var i = 0; i < pad; i++) {
                    padding += "\t";
                }
        
                formatted += padding + node + "\n";
                pad += indent;
            });
        
            return formatted;
        }
    };
    
    return Xml;
});