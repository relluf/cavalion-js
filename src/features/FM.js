define(function(require) {

    var Command = require("../util/Command");
    var EM = require("../entities/EM");

    return {

    	eb: EM.eb,

    	/**
    	 *
    	 */
        query: function (entity, attributes, criteria, prefix) {
            var params = {};

            if (prefix === undefined && entity.indexOf("/") !== -1) {
                prefix = entity.split("/");
                entity = prefix.pop();
                prefix = prefix.join("/");
            }

            if (entity.indexOf(":") !== -1) {
                entity = entity.split(":");
                params.unit = entity.shift();
                entity = entity.join(":");
            }

            if (typeof attributes === "string") {
                attributes = attributes.replace(/\s/g, "").split(",");
            }

            var req = {
                select: attributes || ["*"],
                from: [entity]
            };

            var uri = String.format("%srest/features/query", prefix || "");
            criteria = criteria || {};

            "where,groupBy,having,orderBy,count,start,limit".split(",").forEach(function (k) {
                var value = criteria[k];
                if (typeof value === "string") {
                    req[k] = value.split(",");
                } else if (criteria.hasOwnProperty(k)) {
                    req[k] = value;
                }
            });

            var me = this;
            return Command.execute(uri, params, req).addCallback(function (res) {
                return me.processQueryResult(res, req, params.unit);
            });
        },

        /**
         *
         */
        processQueryResult: function(res, req, unit) {
	        EM.processQueryResult(res, req, unit);

	        if(res.types) {
		        var index = res.types.length - 1;
		        res.instances.forEach(function (instance, tuple) {
		            instance.setAttributeValue("geom", res.tuples[tuple][index]);
		        });
	        }

	        return res;
        }
    };

});
