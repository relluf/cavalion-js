define(function(require) {

	var CIRCULAR_TOO_DEEP	= { toString: function() { return "CIRCULAR_TOO_DEEP"; }};
	var CIRCULAR_REFERENCE	= { toString: function() { return "CIRCULAR_REFERENCE"; }};
	var TOO_DEEP			= { toString: function() { return "TOO_DEEP"; }};

	Date.prototype.serializeJson = function() {
		return "" + this.getTime();
	};

	var keywords = ("break,class,catch,const,continue,default,delete," +
			"do,else,export,for,function,if,import,in,instanceof," +
			"implements,label,let,new,package,return,super,switch," +
			"this,throw,try,typeof,var,void,while,with,yield").split(",");

	var serialize = {
		isKeyword: function(word) {
			return keywords.indexOf(word) !== -1;
		},
		keyNeedsEscape: function(key) {
			var m = /^[A-Za-z_][A-Za-z_0-9]*$/.exec(key);
			if(m === null) {
				return true;
			}
			return serialize.isKeyword(key);
		},
		serialize: function (obj, indent, objs, depth) {
			var pushed = false;
			try {
				if(depth !== undefined) {
					--depth;
				}
				if(typeof obj === "object") {
					if(objs !== undefined) {
						if(objs.indexOf(obj) !== -1) {
							if(depth !== undefined) {
								if(depth === 0) {
									return CIRCULAR_TOO_DEEP;
								}
							} else {
								return CIRCULAR_REFERENCE;
							}
						}
						objs.push(obj);
						pushed = true;
					} else if(depth === 0) {
						return TOO_DEEP;
					}
				}

			    var nextIndent = indent !== undefined ? indent + "	" : indent;
			    if (obj === undefined) {
			        return "undefined";
			    }
			    if (obj === null) {
			        return "null";
			    }

			    var type = typeof obj;
			    if (type === "number" || type === "boolean") {
			        return "" + obj;
			    }
			    if (type === "string") {
			        return String.escape(obj);
			    }
			    if (type === "function") {
		//	    	var comm = obj['comment'];
		        	var r = obj.toString().split("\n");
		        	if(r[0].length === 0) {
		        		r.splice(0, 1);
		        	}
		        	if(r[r.length - 1].length === 0) {
		        		r.splice(r.length - 1, 1);
		        	}
			        if (indent !== undefined) {
			        	r = r.join("\n" + indent);
			        } else {
			        	r = r.join("\n");
			        }
		//	        if(comm === undefined) {
		//		        return r.join("\n");
		//	        }
		//	        comm = String.format("/*\n * %s\n */", comm.split("\n").join("\n * "));
		//	        return comm + "\n" + r.join("\n");
					return r;
			    }
			    if(obj.serializeJson) {
			    	return obj.serializeJson();
			    }
			    var me = arguments.callee, res, val;
			    if (obj instanceof Array) {
			        res = [];
			        for (var i = 0, l = obj.length; i < l; ++i) {
			            val = me(obj[i], nextIndent, objs, depth);
			            if(val === CIRCULAR_TOO_DEEP || val === CIRCULAR_REFERENCE || val === TOO_DEEP) {
			            	res.push(String.format("%s", val.__name));
			            } else {
			            	res.push(typeof val === "string" ? val : "undefined");
			            }
			        }
			        return String.format("[%s%s%s%s]",
			        	nextIndent ? "\n" : "",
			        	nextIndent || "",
			        	res.join(nextIndent ? ",\n" + nextIndent : ","),
			        	nextIndent ? "\n" + indent : "");
			    } else {
			    	res = [];
			        for (var k in obj) {
			        	if(1) {//obj.hasOwnProperty(k)) {
				            var key;
				            if (typeof k === "number") {
				                key = String.format("\"%s\"", k);
				                val = me(obj[k], nextIndent, objs, depth);
				            } else if (typeof k === "string") {
				                key = serialize.keyNeedsEscape(k) ? String.escape(k) : k;
				                val = me(obj[k], nextIndent, objs, depth);
				            } else {
				            }
				            if(val === CIRCULAR_TOO_DEEP || val === CIRCULAR_REFERENCE || val === TOO_DEEP) {
				            	res.push(String.format("%s:%s", key, val.__name));
				            } else if (typeof val === "string") {
				                res.push(String.format("%s:%s", key, val));
				            } else {
				            }
				        }
			        }
			        return String.format("{%s%s%s%s}",
			        	nextIndent ? "\n" : "",
			        	nextIndent || "",
			        	res.join(nextIndent ? ",\n" + nextIndent : ","),
			        	nextIndent ? "\n" + indent : "");
			    }
			} finally {
				if(pushed) {
					objs.pop();
				}
			}
		}
	};

	return serialize;

});