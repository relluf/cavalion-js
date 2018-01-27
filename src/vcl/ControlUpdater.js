define(function(require) {
	return {
		controls: [],
		timeout: undefined,
		interval: 2000,
		updating: false,

		queue: function(control) {
			if(this.controls.indexOf(control) !== -1) {
				return;
			}

			//Method.stack2console(String.format("ControlUpdater.queue(%n)", control));

			if(!this.updating) {

				this.controls.push(control);

				if(this.timeout === undefined) {
					this.timeout = setTimeout(this.update.bind(this, true), 0);
				}
			} else {
				//this.controls = [control].concat(this.controls);
				this.controls.push(control);
			}
		},
		dequeue: function(control) {
			while((index = this.controls.indexOf(control)) !== -1) {
				this.controls.splice(index, 1);
			}
		},
		update: function(fromTimeout) {
			if(fromTimeout) {
				delete this.timeout;
			} else if(this.timeout) {
				clearTimeout(this.timeout);
				delete this.timeout;
			}

			var end = Date.now() + this.interval;
			var counter = 0;

			this.updating = true;
			try {
				while (this.controls.length && Date.now() < end) {
					var control = this.controls.splice(0, 1)[0];
					var queue = this.controls;
					this.controls = [];
					control._update();
// TODO What's going on here?
// New updates are placed in front?
					this.controls = queue.concat(this.controls);
					counter++;
				}
			//} catch (e) {
				//throw new Error("Update failed; " + e.message, e);
			} finally {
				this.updating = false;
				if(this.controls.length) {
					this.timeout = setTimeout(this.update.bind(this, true), 0);
				}
			}
		}
	};
});