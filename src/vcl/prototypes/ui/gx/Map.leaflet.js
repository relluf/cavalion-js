$([], {
	'@require': ["leaflet", "proj4leaflet", "epsg/28992"]
}, [
    $i("description", {
        content: "<b>Maps</b>"
    }),
    $i("map", {
    	onShow: function() {
    		var map = L.map(this.getNode()).setView([52.05, 5.27], 8);
    		var tile = "http://tile.openstreetmap.org/{z}/{x}/{y}.png";
    		var osm = new L.TileLayer(tile, {
    			maxZoom: 28,
    			attribution: "Map data &copy; 2012 OpenStreetMap contributors"
    		});

    		map.addLayer(osm);

	    		function denmark() {
		            map.setView([55.67, 12.60], 11);
		            map.addLayer(new L.tileLayer.wms("http://wfs-kbhkort.kk.dk/k101/wms", {
		                layers: 'k101:theme-startkort',
		                format: 'image/png',
		                transparent: true,
		                version: '1.1.0',
		                attribution: "myattribution"
		            }));
	    		}

            L.control.fullscreen().addTo(map);

	    	//
            require("../../../../util/Ajax").get("/gwklicapp/tmp/data/features-total", function(resp, req) {
            	resp = JSON.parse(resp);

            	var features = L.Proj.geoJson(resp, {

					style: {
					    "color": "#ff7800",
					    "weight": 5,
					    "opacity": 0.65
					},

//					filter: function() {
//						return scope.features.isSelected();
//					}

					//onEachFeature: onEachFeature,

//					pointToLayer: function (feature, latlng) {
//						return L.circleMarker(latlng, {
//							radius: 8,
//							fillColor: "#ff7800",
//							color: "#000",
//							weight: 1,
//							opacity: 1,
//							fillOpacity: 0.8
//						});
//					}
				});

            	L.control.layers({"Open Street Map": osm}, {"Klics": features}).addTo(map);

            	features.addTo(map);
			});

	    	this.setVar("map", map);
    	}
    })
]);
