define(["require", "defineClass"], function(require, Foo) {

	return (Foo = Foo(require, {

		prototype: {

			constructor: function() {
				this.bar();
			},

			bar: function() {
				Foo.foo();
			}

		},

		statics: {
			foo: function() {
				console.log(String.format("%n", this));
			}
		}

	}));
});