define(function(require) {

	var Instance = require("./Instance");

	function marshallValue(rhs) {
    	if(rhs instanceof Instance) {
    		return EB.reference(rhs);
    	}
    	return rhs;
	}

    function create(props) {
        return Object.create(EB, props || {
        	items: {
        		value: [],
        		enumerable: true
        	}
        });
    }

    var EB = {
    	reference: function(instance) {
    		return String.format("@@%s:%s", instance._entity.split(":").pop(), instance._key);
    	},
        andor: function(operator, args) {
            if(this === EB) {
                return arguments.callee.apply(create(), arguments);
            }
            this.items.push([operator].concat(js.copy_args(args)));
            return this;
        },
        unary: function(operator, operand) {
            if(this === EB) {
                return arguments.callee.apply(create(), arguments);
            }
            this.items.push([operator, operand]);
            return this;
        },
        binary: function(operator, lhs, rhs) {
            if(this === EB) {
                return arguments.callee.apply(create(), arguments);
            }
            this.items.push([operator, lhs, rhs]);
            return this;
        },
        /*-
         * Parses a where structure. The result can be passed on the server.
         *
         * @param obj - where expression to be parsed
         * @param parameters - optional, when specified string constants
         * 		prefixed with a colon will be replaced by the value of the
         * 		corresponding key in parameters. If that key references
         * 		a function, it will be called in the context with args
         * @param context - The context on which a function parameter
         * 		should be applied
         * @param args - The arguments to be passed to a function parameter
         */
        where: function(obj, parameters, context, args) {
            var r;
            if(obj instanceof Array) {
                r = [].concat(obj);
                r.forEach(function(o, i) {
                    if(o instanceof Array) {
                        r[i] = EB.where(r[i], parameters, context, args);
                    } else if(typeof o === "function") {
                        r[i] = r[i].apply(context || window, args || []);
                    } else if(parameters && typeof o === "string" &&
                    		o.charAt(0) === ":" &&
                    		(o = parameters[o.substring(1)])) {

	            		r[i] = typeof o !== "function" ? o :
	            				o.apply(context || window, args || []);
                    }
                    r[i] = marshallValue(r[i]);
                });
                return r;
            } else if(obj !== null && typeof obj === "object") {
                r = {};
                for(var k in obj) {
                    r[k] = EB.where(obj[k], parameters, context, args);
                }
            } else if(obj instanceof Date) {
                r = new Date(obj.getTime());
            } else {
                r = obj;
            }
            return r;
        },
        toString: function() {
            var s = [];
            this.items.forEach(function(items) {
                if(items[0] === "and" || items[0] === "or") {
                    var a = [];
                	items.forEach(function(item, i) {
                		if(i) {
                			a.push(item.toString());
                		}
                	});
                	s.push(String.format("(%s)", a.join(" " + items[0] + " ")));
                } else if(items.length === 2) {
                    s.push(String.format("%s(%s)", items[0], items[1]));
                } else if(items.length === 3) {
                    s.push(String.format("%s %s %s", items[1], items[0], items[2]));
                } else {
                    s.push(items.toString());
                }
            });
            return "(" + s.join(" ") + ")";
        }
    };

    "and,or".split(",").forEach(function(operator) {
        EB[operator] = function() {
            return this.andor.apply(this, [operator, js.copy_args(arguments)]);
        };
    });

    "not".split(",").forEach(function(operator) {
        EB[operator] = function(operand) {
            return this.unary.apply(this, [operator, operand]);
        };
    });

    "lt,lte,gt,gte,eq,neq,like,in".split(",").forEach(function(operator) {
        EB[operator] = function(lhs, rhs) {
        	rhs = marshallValue(rhs);
            return this.binary(operator, lhs, rhs);
        };
    });
   
    EB.equals = EB.eq;
    EB.notEquals = EB.neq;
    EB.lessThan = EB.lt;
    EB.lessThanOrEquals = EB.lte;
    EB.greaterThan = EB.gt;
    EB.greaterThanOrEquals = EB.gte;
	EB.contains = function(lhs, rhs) {
	    if(this === EB) {
	        return arguments.callee.apply(create(), arguments);
	    }
    	this.items.push(["like", lhs, "%" + rhs + "%"]);
    	return this;	
    };

    return EB;

});