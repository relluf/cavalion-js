$([], {
    '@require': ["ol", "epsg/28992", "epsg/900913"],
    
    onActivate: function() {
        //alert(1);
    }
}, [
    $i("description", {
        content: "<b>Maps</b>"
    }),
    $i("map", {
        onResize: function () {
            var map = this.getVar("map");
            if (map instanceof ol.Map) {
                map.updateSize();
            }
        },
        onShow: function () {
            /*- This event will typically fire only once */
            var attribution = new ol.control.Attribution({
                collapsible: false
            });
            this.setVar("attr", attribution);

            // OpenStreetMap (Default)
            this.setVar("map", new ol.Map({
                layers: [
	                new ol.layer.Tile({
	                    source: new ol.source.OSM()
	   //             }),
	   //             new ol.layer.Tile({
	   //             	source: new ol.source.TileDebug({
				// 			tileGrid: new ol.tilegrid.XYZ({
				// 				maxZoom: 22
				// 			})
	   //             	})
	                })
	            ],
                controls: ol.control.defaults({
                    attribution: false
                }).extend([attribution]),
                target: this.getNode(),
                view: new ol.View({
                    center: [0, 0],
                    zoom: 2
                })
            }));

            // openstreetmap.nl
            0 && this.setVar("map", new ol.Map({
                layers: [
	                new ol.layer.Tile({
	                    source: new ol.source.OSM({
	                    	//url: "//{a-c}.tile.openstreetmap.nl/{z}/{x}/{y}.png"
	                    	url: "//tile.openstreetmap.nl/tiles/{z}/{x}/{y}.png",
	                    	crossOrigin: null
	                    })
	                }),
	                new ol.layer.Tile({
	                	source: new ol.source.TileDebug({
							tileGrid: new ol.tilegrid.XYZ({
								maxZoom: 22
							})
	                	})
	                })
	            ],
                controls: ol.control.defaults({
                    attribution: false
                }).extend([attribution]),
                target: this.getNode(),
                view: new ol.View({
                    center: [0, 0],
                    zoom: 2
                })
            }));

            // http://r1.edugis.nl/tiles/tilecache.py?map=maps/edugis/cache/base.map
            0 && this.setVar("map", new ol.Map({
                layers: [
	                new ol.layer.Tile({
	                    source: new ol.source.TileWMS({
	                    	params: {
	                    		LAYERS: "topografie"
	                    	},
	                    	url: "//r1.edugis.nl/tiles/tilecache.py?map=maps/edugis/cache/base.map",
	                        crossOrigin: null,
	                    	tileGrid: new ol.tilegrid.XYZ({
	                    	    extent: [-819200, -819200, 819200, 819200],
	                    	    //maxZoom: 12,
	                    	    tileSize: 400
	                    	})
	                    })
	                })
	            ],
                controls: ol.control.defaults({
                    attribution: false
                }).extend([attribution]),
                target: this.getNode(),
                view: new ol.View({
                    center: [155000, 465000],
                    zoom: 10,
                    projection: ol.proj.get("EPSG:28992")
                })
            }));
            
            // joulz.gwklic.nl:8080/geoserver
            0 && this.setVar("map", new ol.Map({
                layers: [
	                new ol.layer.Tile({
	                    source: new ol.source.OSM({
	                    	//url: "//{a-c}.tile.openstreetmap.nl/{z}/{x}/{y}.png"
	                    	url: "//tile.openstreetmap.nl/tiles/{z}/{x}/{y}.png",
	                    	crossOrigin: null
	                    })
	                }),
	                new ol.layer.Tile({
	                	source: new ol.source.TileDebug({
							tileGrid: new ol.tilegrid.XYZ({
								maxZoom: 22
							})
	                	})
	                })
	            ],
                controls: ol.control.defaults({
                    attribution: false
                }).extend([attribution]),
                target: this.getNode(),
                view: new ol.View({
                    center: [0, 0],
                    //projection: ol.proj.get("EPSG:28992"),
                    zoom: 2
                })
            }));
            
            var small = true;
            attribution.setCollapsible(small);
            attribution.setCollapsed(small);
        },

        vars: {
            maps: [{
                "id": 1,
                "name": "Nederland: 900913, 256x256 - openstreetmap.nl",
                "projection": "EPSG:900913",
                "layers": [{
                    "config": ["OpenLayers.Layer.TMS", ["Mapnik", "http://tile.openstreetmap.nl/tiles/", {
                        "isBaseLayer": true,
                        "type": "png",
                        "projection": ["OpenLayers.Projection", ["EPSG:900913"]],
                        "getURL": "OpenLayers.GeoXplore.TileUrlFactory['tile.openstreetmap.nl']"
                    }]]
                }],
                "config": ["OpenLayers.Map", [{
                    "maxExtent": ["OpenLayers.Bounds", [-20037508.34, -20037508.34, 20037508.34, 20037508.34]],
                    "maxResolution": 156543.0399,
                    "numZoomLevels": 19,
                    "tileSize": ["OpenLayers.Size", [256, 256]],
                    "units": "m",
                    "projection": ["OpenLayers.Projection", ["EPSG:900913"]],
                    "center": ["OpenLayers.LonLat", [554371.0641505024, 6829107.369673997]],
                    "zoom": 8
                }]],
                "archived": false
            },
            {
                "id": 2,
                "name": "Nederland: 28992, 400x400 - edugis.nl ",
                "projection": "EPSG:28992",
                "layers": [{
                    "config": ["OpenLayers.Layer.WMS", ["Nederland", "http://r1.edugis.nl/tiles/tilecache.py?map=maps/edugis/cache/base.map", {
                        "layers": "topografie"
                    },
                    {
                        "isBaseLayer": true,
                        "projection": ["OpenLayers.Projection", ["EPSG:28992"]]
                    }]]
                }],
                "config": ["OpenLayers.Map", [{
                    "maxExtent": ["OpenLayers.Bounds", [-819200, -819200, 819200, 819200]],
                    "maxResolution": 2048,
                    "numZoomLevels": 19,
                    "tileSize": ["OpenLayers.Size", [400, 400]],
                    "units": "m",
                    "projection": ["OpenLayers.Projection", ["EPSG:28992"]],
                    "center": ["OpenLayers.LonLat", [155000, 465000]],
                    "zoom": 8
                }]],
                "archived": false
            },
            {
                "id": 3,
                "name": "Nederland: 28992, 256x256 - development.geoxplore.nl",
                "projection": "EPSG:28992",
                "layers": [{
                    "config": ["OpenLayers.Layer.WMS", ["Nederland", "http://development.geoxplore.nl:8008/geoserver/wms", {
                        "layers": ["nl_dkk:eurostreets_adm", "nl_dkk:es_weg_1"]
                    },
                    {
                        "isBaseLayer": true,
                        "projection": ["OpenLayers.Projection", ["EPSG:28992"]]
                    }]]
                }],
                "config": ["OpenLayers.Map", [{
                    "maxExtent": ["OpenLayers.Bounds", [-819200, -819200, 819200, 819200]],
                    "numZoomLevels": 19,
                    "tileSize": ["OpenLayers.Size", [256, 256]],
                    "units": "m",
                    "projection": ["OpenLayers.Projection", ["EPSG:28992"]],
                    "center": ["OpenLayers.LonLat", [155000, 465000]],
                    "zoom": 1
                }]],
                "archived": false
            },
            {
                "id": 4,
                "name": "OSM-WMS worldwide, 256x256 - 129.206.228.72/cached/osm",
                "projection": "EPSG:4326",
                "layers": [{
                    "config": ["OpenLayers.Layer.WMS", ["OSM Mapnik", "http://129.206.228.72/cached/osm", {
                        "layers": "osm_auto:all",
                        "srs": "EPSG:900913",
                        "format": "image/png"
                    },
                    {
                        "buffer": 1,
                        "transitionEffect": "resize",
                        "removeBackBufferDelay": 0,
                        "className": "olLayerGridCustom"
                    }]]
                }],
                "config": ["OpenLayers.Map", [{
                    "maxResolution": 156543.0339,
                    "maxExtent": ["OpenLayers.Bounds", [-20037508.3400, -20037508.3400, 20037508.3400, 20037508.3400]],
                    "projection": ["OpenLayers.Projection", ["EPSG:900913"]],
                    "displayProjection": ["OpenLayers.Projection", ["EPSG:4326"]],
                    "numZoomLevels": 19,
                    "tileSize": ["OpenLayers.Size", [256, 256]],
                    "units": "m",
                    "center": ["OpenLayers.LonLat", [-20037508.34, -20037508.34]],
                    "zoom": 1
                }]],
                "archived": false
            },
            {
                "id": 5,
                "name": "Waterrijk",
                "projection": "EPSG:28992",
                "layers": [{
                    "config": ["OpenLayers.Layer.WMS", ["Waterrijk", "http://145.131.135.51:8080/geoserver/groundwatercare/wms", {
                        "layers": "All"
                    },
                    {
                        "isBaseLayer": true,
                        "projection": ["OpenLayers.Projection", ["EPSG:28992"]]
                    }]]
                }],
                "config": ["OpenLayers.Map", [{
                    "maxExtent": ["OpenLayers.Bounds", [-819200, -819200, 819200, 819200]],
                    "numZoomLevels": 19,
                    "tileSize": ["OpenLayers.Size", [256, 256]],
                    "units": "m",
                    "projection": ["OpenLayers.Projection", ["EPSG:28992"]],
                    "center": ["OpenLayers.LonLat", [155000, 465000]],
                    "zoom": 1
                }]],
                "archived": false
            },
            {
                "id": 6,
                "name": "BRT",
                "projection": "EPSG:28992",
                "layers": [{
                    "config": ["OpenLayers.Layer.WMTS", [{
                        "name": "BRT Achtergrondkaart",
                        "url": "http://geodata.nationaalgeoregister.nl/wmts?",
                        "isBaseLayer": true,
                        "matrixSet": "EPSG:28992",
                        "matrixIds": ["EPSG:28992:0", "EPSG:28992:1", "EPSG:28992:2", "EPSG:28992:3", "EPSG:28992:4", "EPSG:28992:5", "EPSG:28992:6", "EPSG:28992:7", "EPSG:28992:8", "EPSG:28992:9", "EPSG:28992:10", "EPSG:28992:11", "EPSG:28992:12", "EPSG:28992:13"],
                        "layer": "brtachtergrondkaart",
                        "format": "image/png",
                        "style": "default"
                    }]]
                }],
                "config": ["OpenLayers.Map", [{
                    "maxExtent": ["OpenLayers.Bounds", [-819200, -819200, 819200, 819200]],
                    "resolutions": [3440.64, 1720.32, 860.16, 430.08, 215.04, 107.52, 53.76, 26.88, 13.44, 6.72, 3.36, 1.68, 0.84],
                    "numZoomLevels": 13,
                    "units": "m",
                    "tileSize": ["OpenLayers.Size", [256, 256]],
                    "projection": ["OpenLayers.Projection", ["EPSG:28992"]],
                    "center": ["OpenLayers.LonLat", [183841.26840172, 484186.19138769]],
                    "zoom": 5
                }]],
                "archived": false
            },
            {
                "id": 7,
                "name": "AHN",
                "projection": "EPSG:28992",
                "layers": [{
                    "config": ["OpenLayers.Layer.WMS", ["AHN2 (5m)", "http://geodata.nationaalgeoregister.nl/ahn2/wms", {
                        "layers": "ahn2_5m"
                    },
                    {
                        "isBaseLayer": true,
                        "projection": ["OpenLayers.Projection", ["EPSG:28992"]]
                    }]]
                }],
                "config": ["OpenLayers.Map", [{
                    "maxExtent": ["OpenLayers.Bounds", [-819200, -819200, 819200, 819200]],
                    "resolutions": [3440.64, 1720.32, 860.16, 430.08, 215.04, 107.52, 53.76, 26.88, 13.44, 6.72, 3.36, 1.68, 0.84],
                    "numZoomLevels": 13,
                    "units": "m",
                    "tileSize": ["OpenLayers.Size", [256, 256]],
                    "projection": ["OpenLayers.Projection", ["EPSG:28992"]],
                    "center": ["OpenLayers.LonLat", [183841.26840172, 484186.19138769]],
                    "zoom": 5
                }]],
                "archived": false
            }]

        }

    })

]);