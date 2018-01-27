define(function(require) {

	var Deferred = require("./defineClass");
	var Method = require("./Method");
	var mixIn = require("./mixIn");

	return (Deferred = Deferred(require, {

		prototype: {

			/**
			 *
			 */
			constructor: function(/* optional */ canceller) {
				this.chain = [];
				this.results = [null, null];
				if(arguments.length > 0) {
					this.canceller = canceller;
				}

				this.callStack = Method.getCallStack();
			},

			chain: null,
			fired: -1,
			paused: 0,
			results: null,
//			result: null,
			canceller: null,
			silentlyCancelled: false,
			chained: false,

			callStack: null,

			then: function (opt_onFulfilled, opt_onRejected, opt_context) {
			    var resolve, reject;
			    var promise = new Promise(function (res, rej) {
			        // Copying resolvers to outer scope, so that they are available when the
			        // deferred callback fires (which may be synchronous).
			        resolve = res;
			        reject = rej;
			    });
			    this.addCallbacks(resolve, function (reason) {
			        // if (reason instanceof Error) {
			        //     promise.cancel();
			        // } else {
			            reject(reason);
			        // }
			    });
			    return promise.then(opt_onFulfilled, opt_onRejected, opt_context);
			},
			
			/**
			 *
			 */
			cancel: function () {
				if (this.fired === -1) {
					if (this.canceller) {
						this.canceller(this);
					} else {
						this.silentlyCancelled = true;
					}
					if (this.fired === -1) {
						this.errback(new Error("Cancelled"));
					}
				} else if ((this.fired === 0) && (this.results[0] instanceof Deferred)) {
					this.results[0].cancel();
				}
			},


			/**
			 *
			 */
			_pause: function () {
				/***

				Used internally to signal that it's waiting on another Deferred

				***/
				this.paused++;
			},

			/**
			 *
			 */
			_unpause: function () {
				/***

				Used internally to signal that it's no longer waiting on another
				Deferred.

				***/
				this.paused--;
				if ((this.paused === 0) && (this.fired >= 0)) {
					this._fire();
				}
			},

			/**
			 *
			 */
			_continue: function (res) {
				/***

				Used internally when a dependent deferred fires.

				***/
				this._resback(res);
				this._unpause();
			},

			/**
			 *
			 */
			_resback: function (res) {
				/***

				The primitive that means either callback or errback

				***/
				this.fired = ((res instanceof Error) ? 1 : 0);
				this.results[this.fired] = (this.result = res);
				this._fire();
			},

			/**
			 *
			 */
			_check: function () {
				if (this.fired !== -1) {
					if (!this.silentlyCancelled) {
						throw new Error("Already called");
					}
					this.silentlyCancelled = false;
					return;
				}
			},

			/**
			 *
			 */
			callback: function (res) {
				this._check();
				if (res instanceof Deferred) {
					throw new Error("Deferred instances can only be chained if they are the result of a callback");
				}
				this._resback(res);
			},

			/**
			 *
			 */
			errback: function (res) {
				this._check();
				if (res instanceof Deferred) {
					throw new Error("Deferred instances can only be chained if they are the result of a callback");
				}
				if (!(res instanceof Error)) {
					res = new Error(res);
				}
				this._resback(res);
			},

			addBoth: function (fn) {
				return this.addCallbacks(fn, fn);
			},

			addCallback: function (fn) {
				return this.addCallbacks(fn, null);
			},

			addErrback: function (fn) {
				return this.addCallbacks(null, fn);
			},

			addCallbacks: function (cb, eb) {
				if (this.chained) {
					throw new Error("Chained Deferreds can not be re-used");
				}
				this.chain.push([cb, eb]);
				if (this.fired >= 0) {
					this._fire();
				}
				return this;
			},

			_fire: function () {
				/***

				Used internally to exhaust the callback sequence when a result
				is available.

				***/
				var chain = this.chain;
				var fired = this.fired;
				var res = this.results[fired];
				var self = this;
				var cb = null;

				function fcb(res) {
					self._continue(res);
				}

				while (chain.length > 0 && this.paused === 0) {
					// Array
					var pair = chain.shift();
					var f = pair[fired];
					if (f === null) {
						continue;
					}
					try {
						res = f(res);
						fired = ((res instanceof Error) ? 1 : 0);
						if (res instanceof Deferred) {
							cb = fcb;
							this._pause();
						}
					} catch (err) {
						fired = 1;
						if (!(err instanceof Error)) {
							res = new Error(err);
						} else {
							res = err;
						}
					}
				}
				this.fired = fired;
				this.results[fired] = res;

				if(fired === 1 && chain.length === 0 && this.reported === undefined) {
					this.reported = true;
					Deferred.unhandled_error(this);
				}

				if (cb && this.paused) {
					// this is for "tail recursion" in case the dependent deferred
					// is already fired
					res.addBoth(cb);
					res.chained = true;
				}
			}
		},

		statics: {

			/**
			 *
			 * @param deferred
			 */
			unhandled_error: function(deferred) {
				var e = deferred.results[1];
				console.error("Uncaught deferred exception:", e.message, e, mixIn(e));
/*
				if(e.callStack) {
					if(deferred.callStack) {
						e.callStack.splice(0, 0, DeferredSeperator);
						deferred.callStack.forEach(function(call) {
							var args = [0, 0].concat(call);
							Array.prototype.splice.apply(e.callStack, args);
						});
					}
					Method.stack2console("Uncaught deferred exception: " + e.message, e.callStack);
				} else {
					console.error("Uncaught deferred exception: ", e.message, e, mixIn(e));
				}
*/
			},

			require: function(require, what) {
				var d = new Deferred();
				require(what, function() {
					d.callback.apply(d, arguments);
				}, function() {
					d.errback.apply(d, arguments);
				});
				return d;
			},

            waitFor: function(arr) {
                var r = new Deferred();
                var n = arr.length;
                var results = [];

                arr.forEach(function(deferred) {
                    deferred.addBoth(function(res) {
                        results.push(res);
                        if(--n === 0) {
                            r.callback(results);
                            n--; // prevent from being called again
                        }
                        return res;
                    });
                });

                if(n === 0) {
                    r.callback(results);
                }

                return r;
            }
		}

	}));
});