define(function() {
    
    var Xml = {
        
        beautify(xml) {
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
        },
		jsonfy(node, opts, r) {
			if(node.getAttributeNames) {
				var attributes = node.getAttributeNames().map(name => 
						[name, node.getAttribute(name)]);
				var nodes = Array.from(node.childNodes)
						.filter(node => !(node instanceof Text) || node.textContent.trim())
						.map(child => this.jsonfy(child))
						.filter(_ => _);
						
				r = { x: node.nodeName };
				if(attributes.length) r.a = attributes;
				if(nodes.length) r.n = nodes;
				
			} else if(node instanceof Text) {
				r = node.textContent;
			} else if(node instanceof Comment) {
			} else {
				r = js.sf("%s", node);
			}
			return r;
		}
    };
    
    return Xml;
});