define(function(require) {

	var ns = require("namespace!.");
	var js = require("js");

	var FOREIGN_KEY_ATTR = {
			type: "HexaQuad",
			size: 10
		};

	var KEY_NAME = "id";
	var KEY_ATTR = js.mixIn({isKey: true, generated: true}, FOREIGN_KEY_ATTR);
	var allowKeyAttribute = false;

	var Model = ns.Constructor.define("./Model", {

		/**
		 *
		 */
		Model: function(model) {
			this._model = Model.parse(model);
			this._packages = {};

			for(var k in this._model) {
				js.set(k.replace(/\//g, "."), this._model[k], this._packages);
			}

		},

		/**
		 *
		 */
		Prototype: {

			_model: null,
			_packages: null

		},

		Statics: {

			/**
			 *
			 * @param model
			 * @returns
			 */
			parse: function(model) {

				function normalize(base, name) {
					var r = base instanceof Array ? [].concat(base) : base.split("/");
					r.pop();
					name.split("/").forEach(function(part) {
						if(part === "..") {
							r.pop();
						} else if(part === ".") {

						} else {
							r.push(part);
						}
					});

					return r.join("/");
				}

				function denormalize(fullname) {
					return fullname.split("/").pop();
				}

				function validateEntityName(s) {
					if(s.indexOf("_") !== -1) {
						throw new Error(String.format("Illegal entity name '%s'. Underscores are not allowed.", s));
					}
				}

				function validateAttributeName(s) {
					if(s === KEY_NAME && !allowKeyAttribute) {
						throw new Error(String.format("Key attributes are not allowed"));
					}
					if(s.charAt(0) === "_") {
						throw new Error(String.format("Illegal attribute name '%s'. Leading underscores are not allowed.", s));
					}
				}

				function isPackage(obj) {
					for(var k in obj) {
						if(typeof obj[k] === "string") {
							return false;
						}
					}
					return true;
				}

				function isEntity(obj) {
					if(typeof obj === "string") {
						return obj.indexOf(".") !== -1 || obj.indexOf("/") !== -1 || obj.charAt(0).toUpperCase() === obj.charAt(0);
					}
					return !isPackage(obj);
				}

				function isRelationship(obj) {
					return obj === "set" || obj === "ref";
				}

				var types = "geometry,timestamp,string,text,float,integer,double,money,js,boolean".split(",");
				function isType(obj) {
					return types.indexOf(obj) !== -1;
				}

				var generated_names = [];
				function generateName(name) {
					if(generated_names.indexOf(name) !== -1) {
						var i = 2;
						var s;
						while(generated_names.indexOf((s = String.format("%s%d", name, i))) !== -1) {
							i++;
						}
						console.warn(String.format("prevent nameclash %s -> %s", name, s));
						name = s;
					}
					generated_names.push(name);
					return name;
				}

				/**
				 *
				 * @param root
				 * @param session
				 * @returns
				 */
				function walk(root, session) {
					session = session || {};

					var entities = (session.entities = (session.entities || {}));
					var location = (session.location = (session.location || []));
					var sets = (session.sets = (session.sets || []));
					var refs = (session.refs = (session.refs || []));
					var adjustments = (session.adjustments = (session.adjustments || []));

					for(var k in root) {
						var obj = root[k];
						if(k.indexOf("/") !== -1 || isEntity(obj)) {
							if(session.pass1) {
								validateEntityName(normalize(location, k));
							}

							obj = js.mixIn(obj);

							location.push(k);
							entities[location.join("/")] = obj;

							for(var a in obj) {
								if(a.charAt(0) !== "@") {
									var s = obj[a];
									if(typeof s === "string") {
										validateAttributeName(normalize(location, a));
										adjustments.push({entity: location.join("/"), attribute: a, def: s});
										if(s.indexOf(";") === -1) {
											s = s.split(":");
											if(isType(s[0])) {
												// attribute of primitive type
												obj[a] = {type: s[0]};
												if(s.length === 2) {
													if(s[0] === "string") {
														obj[a].size = parseInt(s[1], 10);
													} else {
														throw new Error(String.format("Specifier %s not expected for %s.%s",
															s[1], location.join("/"), a));
													}
												}
											} else if(s.length === 1 && isEntity(s[0])) {
												// attribute is a 'owned reference' to another entity
												obj[a] = {type: {entity: normalize(location, s[0])}};
												refs.push({entity: normalize(location, k), attribute: a, obj: obj[a]});
											} else if(s.length === 2 && isRelationship(s[0])) {
												obj[a] = {type: {type: s[0], entity: normalize(location, s[1])}};
												(s[0] === "set" ? sets : refs).
													push({entity: normalize(location, k), attribute: a, obj: obj[a], location: [].concat(location)});
											}
										} else {
											obj[a] = js.str2obj(obj[a]);
										}
									} else {
										//throw new Error(String.format("Invalid attribute definition for %s.%s (%n)", location.join("."), a, s));
									}
								}
							}
							location.pop();
						} else {
							location.push(k);
							walk(obj, session);
							location.pop();
						}
					}
					return session;
				}

				/**
				 *
				 * @param session
				 * @returns
				 */
				function parse(session) {

					if(session !== undefined) {
						// cleanup
						delete session.refs;
						delete session.sets;
						delete session.adjustments;
					}

					// expand simple definitons
					session = walk(session.model, session);

					var entities = session.entities;
					var refs = session.refs;
					// sort this array so that all JSVMs will iterate in the same order (which was constructed by iteration over object keys)
					var sets = session.sets.sort(function(i1, i2) {
						return String.format("%s.%s", i1.entity, i1.attribute) < String.format("%s.%s", i2.entity, i2.attribute) ? -1 : 1;
					});

					// do we need to parse again, as in expand generated definitions?
					session.parse_again = false;

					// generate sets
					sets.forEach(function(set) {
						var entity = entities[set.entity];
						var reference = set.obj.type.entity;
						var obj = js.get(reference, entities);
						var name, info;

						if(obj === undefined) {
							throw new Error(String.format("Illegal set definition at %s.%s: %s does not exist", set.entity, set.attribute, reference));
						} else if(reference.indexOf(".") !== -1) {
							reference = reference.split(".");
							if(obj.type.type === "set" || set.obj.m2m !== undefined) {
								// we are dealing with a many-to-many situation (jolly!)
								if(set.obj.m2m === undefined) {
									// no definition available, iow this is the first time, so let's call this lhs

									// make up a name for a helper entity
									name = String.format("_%s_%s", denormalize(set.entity), denormalize(reference[0]));
									name = generateName(normalize(set.location, name));

									info = String.format("%s.%s >--< %s", set.entity, set.attribute, reference.join("."));

									// setup definition so next time, the rhs, can use it
									obj.m2m = {
										lhs: {
											entity: name,
											attribute: String.format("%as", denormalize(set.entity))
										},
										rhs: {
											entity: name,
											attribute: String.format("%as", denormalize(reference[0]))
										}
									};

									// prevent nameclash
									if(obj.m2m.lhs.attribute === obj.m2m.rhs.attribute) {
										console.warn(String.format("prevented nameclash %s -> %s2", obj.m2m.rhs.attribute, obj.m2m.rhs.attribute)); //FIXME
										obj.m2m.rhs.attribute += "2";
									}

									// create linking entity, it consists of two simple references
									entities[name] = {'@info': info};
									entities[name][obj.m2m.lhs.attribute] = String.format("ref:%s.%s", set.entity, set.attribute);
									entities[name][obj.m2m.rhs.attribute] = String.format("ref:%s.%s", reference[0], reference[1]);

									// entities[name] (see above) needs to be expanded
									session.parse_again = true;

									// declare final attribute on entity, this is the lhs
									entity[set.attribute] = {
										'@info': info,
										type: "many-to-many",
										entity: reference[0],
										reverse: reference[1],
										link: obj.m2m.lhs
									};
								} else {
									// we can immediately declare the final attribute on entity, this is the rhs, the hard work is already done while parsing the lhs
									entity[set.attribute] = {
										'@info': String.format("%s.%s >--< %s", set.entity, set.attribute, reference.join(".")),
										type: "many-to-many",
										entity: reference[0],
										reverse: reference[1],
										link: set.obj.m2m.rhs
									};
									// entities[name] (see above) needs to be expanded
									session.parse_again = true;
								}
							} else {
								// we are dealing with an explicitly defined reverse relationship, just substitute the definition

								entity[set.attribute] = {
									type: "one-to-many",
									entity: reference[0],
									attribute: String.format("_%s", reference[1])
								};
							}
						} else {
							// we are dealing with a one-to-many relationship where the related entity does not have a dedicated reference to the 'current entity'
							// in other words a helper entity is needed
							name = String.format("_%s_%s", denormalize(set.entity), denormalize(reference));
							name = generateName(normalize(set.location, name));

							info = String.format("%s.%s --< %s", set.entity, set.attribute, reference);

							var link = {
								entity: name,
								lhs: String.format("%as", denormalize(set.entity)),
								rhs: String.format("%as", denormalize(reference))
							};

							if(link.lhs === link.rhs) {
								console.warn(String.format("prevented nameclash %s.%s -> %s.%s2", name, link.rhs, name, link.rhs));
								link.rhs.attribute += "2";
							}

							entity[set.attribute] = {
								'@info': info,
								type: "one-to-many",
								entity: reference,
								link: link
							};

							entities[name] = {'@info': info};
							entities[name][link.lhs] = String.format("ref:%s", set.entity);
							entities[name][link.rhs] = String.format("ref:%s", reference);

							// entities[name] (see above) needs to be expanded
							session.parse_again = true;
						}
					});

					refs.forEach(function(ref) {
						var entity = entities[ref.entity];
						var attr = String.format("_%s", ref.attribute);
						var obj = ref.obj;
						var reference = ref.obj.type.entity;
						var info = String.format("%s.%s --. %s", ref.entity, ref.attribute, reference);

						if(js.get(reference, entities) === undefined) {
							throw new Error(String.format("Illegal reference %s", reference));
						}

						reference = reference.split(".");

						entity[attr] = js.mixIn(FOREIGN_KEY_ATTR);
						entity[attr]['@info'] = info;

						ref = (entity[ref.attribute] = {
							'@info': info,
							type: "many-to-one",
							inline: obj.type.type === undefined,
							attribute: attr,
							entity: reference[0]
						});

						if(reference.length == 2) {
							ref.reverse = reference[1];
						}
					});

					// next time ignore model, we already parsed/rebuild that (original model remains unchanged)
					session.model = session.entities;
					return session;
				}

				var session = {model: model, parse_again: true};
				var i = 0;
				while(session.parse_again === true && (i++ < 100)) {
					parse(session);
				}

				if(i === 100) {
					throw new Error("Parsing the model failed, too many iterations");
				}

				// keys, if necessary
				for(var k in session.entities) {
					var obj = session.entities[k];
					if(obj[KEY_NAME] === undefined) {
						// if no key has been defined, implement default
						obj[KEY_NAME] = js.mixIn(KEY_ATTR);
					}
				}

				return session.entities;
			}
		}
	});

	return Model;
});