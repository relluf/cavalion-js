define(require => {
	
	// var Queue = require("js/defineClass");
	
	// return Queue(require, {
	// 	prototype: {
	
	class Queue {
			constructor(concurrentLimit, opts = {}) {
				if(typeof concurrentLimit === "object") {
					opts = concurrentLimit;
					concurrentLimit = opts.concurrentLimit;
				}
				this.concurrentLimit = concurrentLimit || 1;
				this.interval = opts.interval || 0;
				this.running = 0;
				this.fifo = [];
				this.idleResolvers = [];
				this.timer = null;
				this.lastStart = 0;
			}
			add(fn) {
				return new Promise((resolve, reject) => {
					this.fifo.push({ fn, resolve, reject });
					this.next();
				});
			}
			next() {
				if(this.timer || this.running >= this.concurrentLimit || this.fifo.length === 0) {
					return this.resolveIdle();
				}
				
				const wait = Math.max(0, this.interval - (Date.now() - this.lastStart));
				if(wait > 0) {
					this.timer = setTimeout(() => {
						this.timer = null;
						this.next();
					}, wait);
					return;
				}
				
				const task = this.fifo.shift();
				this.running++;
				this.lastStart = Date.now();
				
				Promise.resolve(task.fn())
					.then(task.resolve)
					.catch(task.reject)
					.finally(() => {
						this.running--;
						this.next();
					});
					
				this.next();
			}
			resolveIdle() {
				if(this.running === 0 && this.fifo.length === 0 && !this.timer) {
					// Alles is klaar!
					this.idleResolvers.forEach(r => r());
					this.idleResolvers = [];
				}
			}
			whenIdle() {
				if (this.running === 0 && this.fifo.length === 0 && !this.timer) {
					return Promise.resolve();
				}
				return new Promise(resolve => this.idleResolvers.push(resolve));
			}
		}
	// });

	return Queue;
});
