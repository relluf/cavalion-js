define(function(require) {

	function Enum(name, values) {
		if(values instanceof Array) {
			var arr = values;
			values = {};
			for(var i = 0; i < arr.length; ++i) {
				values[arr[i]] = arr[i];
			}
		}
		this.values = values;
		this.name = name;
	}

	Enum.prototype.nameOf = function(value) {
		for(var k in this.values) {
			if(this.values[k] === value) {
				return k;
			}
		}
	};

	Enum.prototype.valueOf = function(name) {
		return this.values[name];
	};

	return Enum;
});

