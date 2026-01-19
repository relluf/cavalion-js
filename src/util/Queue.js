define(require => {
	
	// var Queue = require("js/defineClass");
	
	// return Queue(require, {
	// 	prototype: {
	
	class Queue {
			constructor(concurrentLimit) {
				this.concurrentLimit = concurrentLimit;
				this.running = 0;
				this.fifo = [];
				this.idleResolvers = [];
			}
			add(fn) {
				return new Promise((resolve, reject) => {
					const execute = () => {
						this.running++;
						Promise.resolve(fn())
							.then(resolve)
							.catch(reject)
							.finally(() => {
								this.running--;
								if (this.fifo.length > 0) {
									const next = this.fifo.shift();
									next();
								} else if (this.running === 0) {
									// Alles is klaar!
									this.idleResolvers.forEach(r => r());
									this.idleResolvers = [];
								}
							});
					};
		
					if (this.running < this.concurrentLimit) {
						execute();
					} else {
						this.fifo.push(execute);
					}
				});
			}
			whenIdle() {
				if (this.running === 0 && this.fifo.length === 0) {
					return Promise.resolve();
				}
				return new Promise(resolve => this.idleResolvers.push(resolve));
			}
		}
	// });

	return Queue;
});