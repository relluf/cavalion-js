define(function() {

	return {
	    
        dms: function(v, s) {
            /*- degrees,minutes, seconds */
            if (v < 0) {
                s = s.charAt(1);
                v = -v;
            } else {
                s = s.charAt(0);
            }
            var deg = parseInt(v, 10); v -= deg; v *= 60;
            var min = parseInt(v, 10); v -= min; v *= 60;
            if (v < 0.001) {
                return String.format("%d&#xb0;%d'\" %s", deg, min, s);
            }
            return String.format("%d&#xb0;%d'%.3f\" %s", deg, min, v, s);
        },
        
        lat2dms: function(lat) {
            return this.dms(lat, "NS");
        },
        
        lng2dms: function(lng) {
            return this.dms(lng, "EW");
        },
	    
		pip: function (point, vs) {
		    // ray-casting algorithm based on
		    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

		    var x = point[0], y = point[1];

		    var inside = false;
		    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
		        var xi = vs[i][0], yi = vs[i][1];
		        var xj = vs[j][0], yj = vs[j][1];

		        var intersect = ((yi > y) != (yj > y))
		            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		        if (intersect) inside = !inside;
		    }

		    return inside;
		}
	};

});