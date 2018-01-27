define(function(require) {

	var ns = require("namespace!.");
	var js = require("js");

//	var Model = require("./Model");
	var Entity = require("./Entity");
	var Instance = require("./Instance");
	var Transaction = require("./Transaction");
	var Persistence = ns.Constructor.reference("./Persistence");

	var Unit = ns.Constructor.define("./Unit", {

		/**
		 *
		 */
		Unit: function(name, packages, entities) {
			this._name = name;
			this._packages = packages;
			this._entities = entities;
		},

		Prototype: {
			_name: null,
			_packages: null,
			_entities: null,

			/**
			 *
			 */
			getName: function() {
				return this._name;
			},

			/**
			 *
			 */
			getEntities: function() {
				return this._entities;
			},

			/**
			 *
			 */
			getPackages: function() {
				return this._packages;
			},

			/**
			 *
			 */
			getPackage: function(name) {
				var r = js.get(name, this._packages);
				if(r === undefined || r instanceof Entity) {
					throw new Error(String.format("Package %s not available", name));
				}
				return r;
			},

			/**
			 *
			 */
			getEntity: function(name) {
				var r = js.get(name.replace(/\//g, "."), this._packages);
				if(!(r instanceof Entity)) {
					throw new Error(String.format("Entity %s:%s not available", this._name, name));
				}
				return r;
			},

			/**
			 *
			 * @param session
			 */
			createEntityManager: function(session) {
				throw new Error("Abstract");
			},

			/**
			 *
			 * @param em
			 * @returns {Transaction}
			 */
			createTransaction: function(em) {
				return new Transaction(em);
			}

		},

		Statics: {

			/**
			 *
			 * @param name
			 * @param model
			 * @param Type
			 * @returns {Unit}
			 */
			define: function(name, model, Type) {
				var def, o2o, m2o, o2m;
				var e, k, o;
				var packages = {};
				var entities = [];

				Type = Type || Unit;
				
				var unit = new Type(name, packages, entities);

				// replace slashes
				for(k in model) {
					if(k.indexOf("/") !== -1) {
						model[k.replace(/\//g, ".")] = model[k];
						delete model[k];
					}
				}
				
				// generate old structure, if needed
				for(k in model) {
					def = model[k];
					if(def.attributes === undefined || typeof def.attributes.type === "string") {
						var entity = (model[k] = {
							attributes: {},
							oneToMany: {},
							manyToOne: {},
							manyToMany: {},
							oneToOne: {},
							tableName: def['@tableName'] || k.replace(/\//g, "_").replace(/\./g , "_")
						});
						for(var a in def) {
							if(a.charAt(0) !== "@") {
								var attr = def[a];
								if(attr.entity ===  undefined) {
									entity.attributes[a] = attr;
								} else {
									attr.entity = attr.entity.replace(/\//g, ".");
									if(attr.type === "one-to-many") {
										if(attr.link !== undefined) {
											entity.oneToMany[a] = {
												entity: attr.link.entity,
												attribute: "_" + attr.link.lhs,
												org: attr 
											};
										} else {
											entity.oneToMany[a] = {
													entity: attr.entity,
													attribute: "_" + attr.attribute
											};
										}
									} else if(attr.type === "many-to-many") {
										//entity.manyToMany[a] = attr;
										entity.oneToMany[a] = {
											entity: attr.link.entity,
											attribute: "_" + attr.link.attribute,
											org: attr
										};
									} else {
										entity.manyToOne[a] = attr;
									}
								}
							}
						}
					}
				}

				// setup entities
				for(k in model) {
					//e = new Entity(unit, k.replace(/\./g, "/"), model[k], Instance);
					e = new Entity(unit, k, model[k], Instance);
					js.set(k, e, packages);
					entities.push(e);
				}

				for(k in model) {
					def = js.get(k, packages)._def;
					if(def.manyToOne !== undefined) {
						for(m2o in def.manyToOne) {
							o = def.manyToOne[m2o];
							o.entity = js.get(o.entity.replace(/\//g, "."), packages);
						}
					}
					if(def.oneToOne !== undefined) {
						for(o2o in def.oneToOne) {
							o = def.oneToOne[o2o];
							o.entity = js.get(o.entity.replace(/\//g, "."), packages);
						}
					}
					if(def.oneToMany !== undefined) {
						for(o2m in def.oneToMany) {
							o = def.oneToMany[o2m];
							o.entity = js.get(o.entity.replace(/\//g, "."), packages);
							o.isOneToMany = true;
						}
					}
				}

				Persistence.registerUnit(name, unit);

				return unit;
			}

		}

	});

	return Unit;
});