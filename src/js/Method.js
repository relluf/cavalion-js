define(["module", "./nameOf"], function(module, nameOf) {

	var registry = {
		override: module.id + ".override",
		connect: module.id + ".connect",
		trace: module.id + ".trace",
		name: module.id + ".name"
	};

	var time = Date.now();
	var stack = [];
	var traces = 0;

	/**
	 * Register a nameOf for functions (inclucing methods and constructors)
	 */
	nameOf.methods.push(function(obj) {
		if(obj instanceof Function) {
			return Method.getName(obj);
		}
	});

	/**
	 *
	 * @param args
	 *            {Arguments}
	 * @returns {Array}
	 */
	function copy_args(args) {
		return Array.prototype.slice.apply(args, [0]);
	}

	/**
	 * Returns an array containing string representations of an arguments
	 * object.
	 *
	 * @param args
	 *            {Arguments}
	 * @returns {Array} An array containing string representations of the
	 *          specified {Arguments} object
	 */
	function args2strs(args) {
		var s = [];
		for( var i = 0, l = args.length; i < l; ++i) {
			var v = args[i];
			switch(typeof v) {
				case "string":
					v = String.escape(v);
					if(v.length > 40) {
						v = v.substring(0, 40) + "...";
						v += "\"";
					}
					s.push(v);
				break;

				case "object":
					if(v !== null) {
						s.push(nameOf(v));
					} else {
						s.push("null");
					}
				break;

				case "undefined":
					s.push("undefined");
				break;

				case "function":
					s.push(nameOf(v));
				break;

				default:
					s.push(v);
			}
		}
		return s;
	}

	/**
	 *
	 * @param obj
	 * @param methodName
	 * @param f
	 * @param allowNoImpl
	 * @returns
	 */
	function override(obj, methodName, f, allowNoImpl) {
		if(typeof methodName === "object") {
			for(var name in methodName) {
				override(obj, name, methodName[name], f);
			}
		} else {
			var method = obj[methodName];

			if(f && f[registry.override] !== undefined) {
				throw new Error(String.format("Supplied function already seems to " +
						"override something (%n - %s)", obj, methodName), f);
			}

			if(typeof method !== "function") {
				if(allowNoImpl !== true) {
					throw new Error(String.format("%s is not a method of %n",
							methodName, obj));
				}
				obj[methodName] = f;
				if(typeof f === "function") {
					f[registry.override] = function() {};
				}
			} else {
				var info;
				if((info = method[registry.connect]) !== undefined) {
					f[registry.override] = info.method;
					info.method = f;
				} else {
					obj[methodName] = f;
					f[registry.override] = method;
				}
			}
		}
	}

	/**
	 *
	 * @param thisObj
	 * @param args
	 * @param skip
	 * @returns
	 */
	function inherited(thisObj, args, skip) {
		args = args || arguments.callee.caller['arguments'];

		var mth = args.callee[registry.override];

		// skip indicates how many levels of inheritance should be skipped
		for(skip = skip || 0; typeof mth === "function" && skip > 0; skip--) {
			mth = mth[registry.override];
		}

		if(typeof mth === "function") {
			return mth.apply(thisObj, args);
		}

		if(skip === undefined) {
			throw new Error(String.format("%n does not override an inherited method",
					args.callee, this, arguments));
		}
	}

	/**
	 *
	 */
	function Call(arr) {
		for(var i = 0; i < arr.length; ++i) {
			this.push(arr[i]);
		}
	}

	Call.prototype = new Array(); // FIXME inherit Array
	Call.prototype.constructor = Call;
	Call.prototype.toString = function() {
		return String.format("%n(%s) - %n", this[1], js.args2strs(this[2]), this[0]);
	};

	/**
	 *
	 */
	function CallStack(arr) {
		for(var i = 0; i < arr.length; ++i) {
			this.push(new Call(arr[i]));
		}
	}

	CallStack.prototype = new Array(); // FIXME inherit Array
	CallStack.prototype.constructor = CallStack;
	CallStack.prototype.toConsole = function(message) {
		if(this.length > 0) {
			var last = this.length - 1;
			var item = this[last];
			console.groupCollapsed(message || item.toString());

			for(var i = last; i >= 0; --i) {
				item = this[i];
				if(typeof item[0] !== "string") {
					console.groupCollapsed(item.toString(), item[3] - time, item[4]);
					console.log(item[0]);
					console.log("arguments:", item[2]);
					console.groupEnd();
				} else {
					console.log(item[0]);
				}
			}

			console.groupEnd();
		}
	};
	CallStack.prototype.toString = function() {
		return String.format("[object CallStack,%d]", this.length);
	};

	var Method = {

		CallStack: CallStack,
		Call: Call,

		override: override,
		callInherited: inherited,
		copy_args: copy_args,
		args2strs: args2strs,

		/**
		 *
		 * @param srcObj
		 * @param srcMethodName
		 * @param destObj
		 * @param destMethodName
		 * @param type
		 * @returns
		 */
		connect: function(srcObj, srcMethodName, destObj, destMethodName, type) {
			function createConnectMethod () {
				return function callListeners() {
					var info = arguments.callee[registry.connect];
					var r, i, li, l;

					if(info.firing === undefined) {
						info.firing = 1;
					} else {
						info.firing++;
					}

					for(i = 0, l = info.listeners.length; i < l; ++i) {
						li = info.listeners[i];
						if(li.type === "before") {
							li.method.apply(li.obj, arguments);
						} else if(li.type === "_before") {
							li.method.apply(li.obj, [this, arguments]);
						}
					}

					try {
						r = info.method.apply(this, arguments);
						for(i = 0, l = info.listeners.length; i < l; ++i) {
							li = info.listeners[i];
							if(li === undefined) {
								console.log(info);
							}
							if(li.type === "after") {
								li.method.apply(li.obj, arguments);
							} else if(li.type === "_after") {
								li.method.apply(li.obj, [this, arguments]);
							}
						}

					} catch(e) {
						var rt = e;
						for(i = 0, l = info.listeners.length; i < l; ++i) {
							li = info.listeners[i];
							if(li.type === "catch") {
								try {
									li.method.apply(li.obj, [e, this, arguments]);
									rt = undefined;
								} catch(ex) {
									rt = ex;
								}
							}
						}

						if(rt !== undefined) {
							throw rt;
						}

					} finally {

						try {
							for(i = 0, l = info.listeners.length; i < l; ++i) {
								li = info.listeners[i];
								if(li.type === "finally") {
									li.method.apply(li.obj, arguments);
								} else if(li.type === "_finally") {
									li.method.apply(li.obj, [this, arguments]);
								}
							}
						} finally {
							info.firing--;
							if(info.firing === 0) {
								delete info.firing;

								for(i = 0; i < info.listeners.length;) {
									if(info.listeners[i].type === "") {
										info.listeners.splice(i, 1);
									} else {
										i++;
									}
								}
								if(info.listeners.length === 0) {
									info.srcObj[info.srcMethodName] = info.method;
									delete info.srcObj;
									delete info.srcMethodName;
								}
							}
						}
					}
					return r;
				};
			}

			if(srcObj === null || srcObj === undefined) {
				throw new Error(String.format("%s.connect: srcObj is %n", module.id, srcObj));
			}

			if(destObj === null || destObj === undefined) {
				throw new Error(String.format("%s.connect: destObj is %n", module.id, destObj));
			}

			var src = srcObj[srcMethodName];
			var dest = destObj[destMethodName];
			var info;

			if(typeof src !== "function") {
				throw new Error(String.format("%s.connect: typeof srcObj['%s'] === %s, must be function",
						module.id, srcMethodName, typeof src));
			}

			if(typeof dest !== "function") {
				throw new Error(String.format("%s.connect: typeof destObj['%s'] === %s, must be function",
						module.id, destMethodName, typeof dest));
			}

			if((info = src[registry.connect]) === undefined) {
				info = {method: src, listeners: []};
				src = (srcObj[srcMethodName] = createConnectMethod());
				src[registry.connect] = info;
			}

			info.listeners.push({
				obj: destObj,
				method: dest,
				type: type || "after"
			});
		},

		/**
		 *
		 * @param srcObj
		 * @param srcMethodName
		 * @param destObj
		 * @param destMethodName
		 * @returns
		 */
		disconnect: function(srcObj, srcMethodName, destObj, destMethodName) {
			var src = srcObj[srcMethodName];
			var dest = destObj[destMethodName];
			var info;

			if(typeof src !== "function") {
				throw new Error(String.format("%s.disconnect: typeof srcObj['%s'] === %s, must be function",
					module.id, srcMethodName, typeof src));
			}

			if(typeof dest !== "function") {
				throw new Error(String.format("%s.disconnect: typeof destObj['%s'] === %s, must be function",
					module.id, destMethodName, typeof dest));
			}

			if(src[registry.connect] === undefined) {
				throw new Error(String.format("%s.disconnect: srcObj['%s'] has never been connected to",
					module.id, srcMethodName));
			}

			info = src[registry.connect];
			for(var i = 0, l = info.listeners.length; i < l; ++i) {
				var li = info.listeners[i];
				if(li.obj === destObj && li.method === dest) {
					if(info.firing !== undefined) {
						info.listeners[i] = {type: ""};
						info.srcObj = srcObj;
						info.srcMethodName = srcMethodName;
						return;
					} else {
						info.listeners.splice(i, 1);
						if(info.listeners.length === 0) {
							srcObj[srcMethodName] = info.method;
						}
						return;
					}
				}
			}

			throw new Error(String.format("%s.disconnect: srcObj['%s'] has never been connected to by destObj['%s']",
				module.id, srcMethodName, destMethodName));
		},

		/**
		 * Replaces the method with
		 *
		 * @param obj
		 * @param methodName
		 */
		trace: function(obj, methodName) {
			function createTraceMethod() {
				return function stacktrace() {
					var method = arguments.callee[registry.trace];
					stack.push([this, method, arguments, Date.now() - time, traces++]);
					try {
						return method.apply(this, arguments);
					} catch(e) {
						if(e.callStack === undefined) {
							e.callStack = Method.getCallStack();
							//e.callStack.toConsole(e.name + ": " + e.message);
						}
						Method.lastError = e;
						throw e;
					} finally {
						stack.pop();
					}
				};
			}

			var method;
			if(typeof obj === "function" && typeof methodName === "undefined") {
				method = obj;
				methodName = "mth";
				obj = {
					mth: method
				};
			} else {
				method = obj[methodName];
				if(typeof method !== "function") {
					throw new Error(String.format("%s.override: %s is not a method of %n",
							module.id, methodName, obj));
				}
			}

			if(this.isTraced(method)) {
				console.warn(String.format("Already tracing %n", method));
			} else {
				var info = method[registry.connect];
				if(info !== undefined) {
					method = info.method;
					info.method = createTraceMethod();
					info.method[registry.trace] = method;
				} else {
					obj[methodName] = createTraceMethod();
					obj[methodName][registry.trace] = method;
				}
			}
			return obj[methodName];
		},

		/**
		 *
		 * @param method
		 * @returns
		 */
		isTraced: function(method) {
			var info;
			if((info = method[registry.connect]) !== undefined) {
				return this.isTraced(info.method);
			//} else if((info = method[registry.override]) !== undefined) {
				//return this.isTraced(info);
			}
			return method[registry.trace] !== undefined;
		},

		/**
		 *
		 * @param method
		 */
		getName: function(method) {
			if(typeof method === "function") {
				var info;
				if((info = method[registry.connect]) !== undefined) {
					method = info.method;
				}
				if((info = method[registry.trace]) !== undefined) {
					method = info;
				}
				if((info = method[registry.name]) !== undefined) {
					return info;
				}
			}
		},

		/**
		 *
		 * @param method
		 * @param value
		 * @returns
		 */
		setName: function(method, value) {
			return method[registry.name] = value;
		},

		/**
		 *
		 * @param method
		 * @returns
		 */
		getInherited: function(method) {
			return method[registry.override];
		},

		/**
		 *
		 * @param method
		 * @param value
		 * @returns
		 */
		setInherited: function(method, value) {
			method[registry.override] = value;
		},

		/**
		 *
		 * @returns {CallStack}
		 */
		getCallStack: function() {
			return new CallStack(stack);
		},

		/**
		 *
		 * @param method
		 * @returns
		 */
		getOriginal: function(method) {
			var info;
			if((info = method[registry.connect]) !== undefined) {
				method = info.method;
			}
			if((info = method[registry.trace]) !== undefined) {
				method = info;
			}
			while((info = method[registry.override]) !== undefined) {
				method = info;
			}
			return method;//.apply(thisObj, args || []);
		}

	};

	// override Function.prototype.toString in order to hide wrapper functions
	Method.override(Function.prototype, "toString", function() {
		var method = this;
		if(method[registry.connect] !== undefined) {
			method = method[registry.connect].method;
		}
		if(method[registry.trace] !== undefined) {
			method = method[registry.trace];
		}
		return Method.callInherited(method, arguments);
	});

	/**
	 *
	function inherited(thisObj, args, skip, name) {
		args = args || arguments.callee.caller.arguments;
		return Method.callInherited(thisObj, args, skip, name);
	}
	 */

	return Method;
});