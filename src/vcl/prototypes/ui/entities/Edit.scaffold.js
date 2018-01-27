"js/Scaffold, vcl/Factory, js/Scaffold!entities";

var Component = require("vcl/Component");
var Scaffold = require("js/Scaffold");
var scaffold = require("js/Scaffold!entities");

$([], {

	'@scaffold': function() {
		var scope = this.scope();
		var me = this;

		/*- Which entity are we dealing with? */
		var entity = this.getSpecializer(true);

		/* initialize new scaffold with context */
		scaffold = new Scaffold(scaffold, {entity: entity});

		/*- Which attributes are to be edited? */
	    var attributes = scaffold.getf("%s.views.ui/entities/Edit.attributes", entity);
		if(typeof attributes === "string") {
			attributes = attributes.split(",");
		}

		attributes.forEach(function(name) {
			if(name.indexOf(".") !== -1) {
				var names = name.split(".");
				var path = [names.shift()];
				names.forEach(function(name) {
					path.push(name);
					if(attributes.indexOf(path.join(".")) === -1) {
						attributes.push(path.join("."));
					}
				});
			}
		});

		/*- Factories involved */
		var factories = [];

		/*- Returns the scaffold path for an attribute
		 * addressed by its entity and namePath */
		function getAttributePath(entity, namePath) {
			var names = namePath.split(".");
			var attr = 1, path;
			while(attr !== undefined && names.length) {
				path = String.format("%s.attributes.%s", entity, names.shift());
				if((attr = scaffold.get(path)) !== undefined) {
					if(["ref", "set", "has"].indexOf(attr.type.split(":").shift()) !== -1) {
						entity = attr.type.split(":").pop();
					}
				}
			}
			return path;
		}


		/*- step 0: set properties */
		function step0() {
			scope.instance.setEntity(entity);
			scope.instance.setAttributes(attributes.join(","));
			scope['@owner'].setVar("getCaption", scaffold.getf("%s.name", entity));

			// TODO Component.setPropertyValue(instance, prop, value); ?
			var desc = scaffold.getf("%s.description.singular",	entity);
			scope.description.setContent(desc);
			js.set("description.@properties.content", scope.description._content, scope);

		}

		/*- step 1: require all the factories needed */
		function step1() {
		    var prefix = "vcl/Factory!ui/entities/AttributeInput";

			attributes.forEach(function(attr) {
				var type = scaffold.getf("%s.type", getAttributePath(entity, attr));
				if(type.indexOf("enum:") === 0) {
					type = "string";
				}
				
				var uri = scaffold.getf(
						"%s.attributes.%s.factories." +
						"ui/entities/AttributeInput",
						entity, attr);

				if(uri === undefined) {
					// in case more abstraction is needed
					// uri = String.format("%s<%s/%s>.%s.scaffold", prefix, entity, attr, type.split(":").shift());
					uri = String.format("%s.%s.scaffold",
							prefix, type.split(":").shift());
				} else {
					uri = Component.getKeysByUri(uri);
					if(uri.template === "") {
						uri.template = String.format("%s/%s", uri.namespace, uri.name);
						uri.entity = String.format("%s/%s", entity, attr);
					}
					uri = String.format("vcl/Factory!%s.scaffold", Component.getUriByKeys(uri));
				}

				factories.push(uri);
			});

			require(factories, function() {
				factories = js.copy_args(arguments);
				step2();
			});
		}

		/*- step 2: create instance per factory */
		function step2() {

			attributes.forEach(function(attr, i) {
				var type = scaffold.getf("%s.type", getAttributePath(entity, attr));
				if(["id", "created", "modified", "archived"].indexOf(attr) === -1) {
					var input = factories[i].newInstance(me);
					var attribute = {
				    	entity: entity,
				    	name: attr,
				    	type: type
				    };
					input.sendMessage("scaffold", {
						scaffold: new Scaffold(scaffold, attribute),
						attribute: attribute
					});
					input.setParent(scope.client_editors);
				}
			});

			if(scope.client_editors.getControlCount()) {
				var control = scope.client_editors._controls[0].getScope().input || null;
				setTimeout(function() {
					me.setActiveControl(control);
					control.setFocus();
				}, 250);
			}

		}

		step0();
		step1(); // calls step2

		return this.inherited(arguments);
	}

}, []);