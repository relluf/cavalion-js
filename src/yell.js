define(function(require) {
	
	var listeners = [];
	
	var yell_later = (sender, topic, event) => setTimeout(() => {
		listeners.each(function(listener) {
			if(listener.pattern.match(topic)) {
				listener.callback.apply(listener.sender, event);
			}
		});
	});

	function yell(sender, topic, event) {
		// yell will always yell at least in the next callstack
		yell_later(sender, topic, event);
	}
	yell.on = function(pattern, callback) {
		if(arguments.length === 1) {
			var r = {};
			for(var k in pattern) {
				r[k] = yell.on(k, pattern[k]);
			}
			return r;
		}
		
		if(typeof pattern === "string") {
			pattern = new RegExp(pattern);
		}
		
		var li = {pattern: pattern, callback: callback};
		listeners.push(li);
		return li;
	};
	yell.un = yell.off = function(li) {
		return listeners.splice(listeners.indexOf(li), 1)[0];
	};

	return yell;
});