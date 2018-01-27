define(["require", "js/defineClass", "./Container"], function(require, Group, Container) {

	return (Group = Group(require, {

		inherits: Container,

		prototype: {
			"@css": {
				"&.inline-block": {
					display: "inline-block"
				}
			}
		},

		properties: {

		}

	}));
});