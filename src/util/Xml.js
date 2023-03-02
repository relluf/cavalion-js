define(function() {

	var prettifyXml = function(sourceXml) {
	    var xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml');
	    var xsltDoc = new DOMParser().parseFromString([
	        // describes how we want to modify the XML - indent everything
	        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
	        '  <xsl:strip-space elements="*"/>',
	        '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
	        '    <xsl:value-of select="normalize-space(.)"/>',
	        '  </xsl:template>',
	        '  <xsl:template match="node()|@*">',
	        '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
	        '  </xsl:template>',
	        '  <xsl:output indent="yes"/>',
	        '</xsl:stylesheet>',
	    ].join('\n'), 'application/xml');
	
	    var xsltProcessor = new XSLTProcessor();    
	    xsltProcessor.importStylesheet(xsltDoc);
	    var resultDoc = xsltProcessor.transformToDocument(xmlDoc);
	    var resultXml = new XMLSerializer().serializeToString(resultDoc);
	    return resultXml;
	};

    var Xml = {
        beautify: prettifyXml,
        beautify_(xml) {
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