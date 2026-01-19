define(function(require) {

	var CIRCULAR_TOO_DEEP	= { toString: function() { return "CIRCULAR_TOO_DEEP"; }};
	var CIRCULAR_REFERENCE	= { toString: function() { return "CIRCULAR_REFERENCE"; }};
	var TOO_DEEP			= { toString: function() { return "TOO_DEEP"; }};

	var Date_prototype_serializeJson = function() {
		console.warn("Date serialization - still needed");
		return "" + this.getTime();
	};

	var keywords = ("break,class,catch,const,continue,default,delete," +
			"do,else,export,for,function,if,import,in,instanceof," +
			"implements,label,let,new,package,return,super,switch," +
			"this,throw,try,typeof,var,void,while,with,yield").split(",");

	function isKeyword(word) {
		return keywords.indexOf(word) !== -1;
	}
	function keyNeedsEscape(key) {
		var m = /^[A-Za-z_][A-Za-z_0-9]*$/.exec(key);
		if(m === null) {
			return true;
		}
		return serialize.isKeyword(key);
	}
	
	var serialize_ = {
		isKeyword, keyNeedsEscape,
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
			    } else if(obj instanceof Date) {
			    	return Data_prototype_serializeJson.apply(obj, []);
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
	// return serialize_;

	// 2025/11/01
	function serialize(value) {
		const seen = new Map();
		const path = [];
	
		function encode(val) {
			if (val === null || typeof val !== 'object') return val;
	
			if (seen.has(val)) {
				return { $ref: seen.get(val).join('.') };
			}
	
			seen.set(val, [...path]);
	
			if (Array.isArray(val)) {
				path.push(null);
				const arr = val.map((v, i) => {
					path[path.length - 1] = i;
					return encode(v);
				});
				path.pop();
				return arr;
			}
	
			const obj = {};
			for (const key of Object.keys(val)) {
				path.push(key);
				obj[key] = encode(val[key]);
				path.pop();
			}
			return obj;
		}
	
		return JSON.stringify(encode(value), null, 2);
	}
	function deserialize(json) {
		const data = JSON.parse(json);
		const refs = [];
	
		function build(val, root, path = []) {
			if (val && typeof val === 'object') {
				if ('$ref' in val) {
					refs.push({ target: root, path, refPath: val.$ref });
					return undefined;
				}
				if (Array.isArray(val)) {
					return val.map((v, i) => build(v, root, path.concat(i)));
				}
				const obj = {};
				for (const key of Object.keys(val)) {
					obj[key] = build(val[key], root, path.concat(key));
				}
				return obj;
			}
			return val;
		}
	
		function resolve(obj, path) {
			return path.split('.').reduce((acc, k) => acc[k], obj);
		}
	
		const root = build(data, data);
	
		// Patch all references after the first pass
		for (const { target, path, refPath } of refs) {
			const container = path.slice(0, -1).reduce((a, k) => a[k], target);
			const key = path[path.length - 1];
			container[key] = resolve(root, refPath);
		}
	
		return root;
	}

	return { serialize, deserialize, isKeyword, keyNeedsEscape };

});