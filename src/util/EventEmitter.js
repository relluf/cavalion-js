define(() => {

	return {
		extend(obj, handlers = "handlers") {
			return js.mi(obj, {
				on(event, handler) {
					this[handlers].push([event, handler]);
				},
				un(event, handler) {
					this[handlers] = this[handlers].filter(
						([e, h]) => e !== event || h !== handler
					);
				},
				once(event, handler) {
					const wrapper = (args) => {
						this.un(event, wrapper);
						handler(args);
					};
					this.on(event, wrapper);
				},
				emit(event, args) {
					this[handlers].forEach(([e, h]) => {
						if (e === event) {
							h(args);
						}
					});
				}
			});
		}
	};	
	
});
