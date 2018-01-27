define(function(require) {

	return {
        "/.*": {
        	name: function(context) {
        		return function(instance) {
        			return instance.toString();
        		};
        	},
        	noun: {
        		singular: function (context) {
                    return context.entity;
                },
                plural: function (context) {
                	return context.entity + "s";
//                    var entity = context.entity;
//                    var last = entity.split("").pop();
//                    if ("aeoiulr".indexOf(last) === -1) {
//                        if (last === "f") {
//                            return context.entity.substring(
//                            0, context.entity.length - 1) + "ven";
//                        }
//                        if (last === "s") {
//                            return context.entity + "sen";
//                        }
//                        return context.entity + "en";
//                    }
//                    return context.entity + "s";
                }
        	},
            description: {
                singular: function(context) {
                	return String.format("No description has been defined for entity %s yet.", context.entity);
                },
                plural: function(context) {
                	return String.format("No description has been defined for a set of entity %s yet.", context.entity);
                }
            },
            attributes: {
                "/.*": {
                    "/.*display_label.*": function (attribute) {
                        /*- TODO split words by parsing capatilization */
                        return attribute.name.charAt(0).toUpperCase() + attribute.name.substring(1);
                    },
                    "/.*hint.*": function(attribute) {
                    	return String.format("No description has been defined for this attribute (%s.%s)",
                    			attribute.entity, attribute.name);
                    }
                // },
                // archived: {
                //     "/.*display_label.*": "Archived at",
                //     "/.*hint.*": "Moment of archive. This attribute is read-only.",
                //     type: "timestamp"
                // },
                // created: {
                //     "/.*display_label.*": "Created at",
                //     "/.*hint.*": "Moment of creation. This attribute is read-only.",
                //     type: "timestamp"
                // },
                // modified: {
                //     "/.*display_label.*": "Modified at",
                //     "/.*hint.*": "Moment of modification. This attribute is read-only.",
                //     type: "timestamp"
                }
            },
			views: {
			    "ui/entities/Query": {
					entity: function(context) {
						return context.entity;
					},
					attributes: "*",
					//where: {},
					//groupBy: {},
					//having: {},
					//orderBy: {},
				    newInstance: function() {
				    	return function(EM, entity) {
					    	return EM.newInstance(entity);
					    };
				    }
			    },
			    "ui/entities/Edit": {
		        	attributes: function(context, namePath, scaffold) {
		        		var keys = js.keys(scaffold.getf("%s.attributes", namePath.split(".").shift()));
		        		return keys.filter(function(key) {
		        			return key.charAt(0) !== '/';
		        		});
		        	}
			    }
            }
        }
    };

});