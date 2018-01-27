define(function(require) {

	var entities = require("./scaffold");
	var mixInR = require("js/mixInRecursive");

	// make sure to copy entities
	return mixInR(mixInR(entities), {
        "/.*": {
        	//name: "Er is nog geen methode gedefinieerd om de naam van een instantie van deze entiteit te bepalen",
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
                    var entity = context.entity;
                    var last = entity.split("").pop();
                    if ("aeoiulr".indexOf(last) === -1) {
                        if (last === "f") {
                            return context.entity.substring(
                            0, context.entity.length - 1) + "ven";
                        }
                        if (last === "s") {
                            return context.entity + "sen";
                        }
                        return context.entity + "en";
                    }
                    return context.entity + "s";
                }
        	},
            description: {
                singular: "Er is nog geen omschrijving voor deze entiteit gedefinieerd.",
                plural: "Er is nog geen omschrijving voor een verzameling van deze entiteit gedefinieerd."
            },
            attributes: {
                "/.*": {
                    "/.*display_label.*": function (attribute) {
                        /*- TODO split words by parsing capatilization */
                        return attribute.name.charAt(0).toUpperCase() + attribute.name.substring(1);
                    },
                    "/.*hint.*": "Er is nog geen omschrijving voor dit attribuut gedefinieerd."
                },
                archived: {
                    "/.*display_label.*": "Archived at",
                    "/.*hint.*": "Moment of archive. This attribute is read-only."
                },
                created: {
                    "/.*display_label.*": "Created at",
                    "/.*hint.*": "Moment of creation. This attribute is read-only."
                },
                modified: {
                    "/.*display_label.*": "Modified at",
                    "/.*hint.*": "Moment of modification. This attribute is read-only."
                }
            }
        }
	});

});