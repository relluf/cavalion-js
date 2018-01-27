define(function(require) {

	var ns = require("namespace!.");
	var js = require("js");

	var Entity = require("./Entity");
	var Instance = require("./Instance");
	var Unit = require("./Unit");
	var PersistenceObj = require("./Obj");
	var UtilObject = require("js/util/Object");

	// Persistence is referenced by (at least) ./Instance, so a constructor namespace is needed
	var Persistence = ns.Constructor.define("./Persistence", {

		Statics: {

			_units: {},
			_ems: {},
			_instances: {},
			_entities: {},
			_session: null,

			/**
			 *
			 */
			getEntity: function(entity) {
				if(typeof entity == "string") {
					var r;
					if(entity.indexOf(":") !== -1) {
						entity = entity.split(":");
						r = this.getUnit(entity[0]).getEntity(entity[1]);
					} else {
						r = js.get(entity.replace(/\//g, "."), this._entities);
						if(!(r instanceof Entity)) {
							throw new Error(String.format("Entity %s not found", entity));
						}
					}
					return r;
				}
				return entity;
			},

			/**
			 *
			 */
			findUnit: function(name) {
				return this._units[name] || null;
			},

			/**
			 *
			 */
			getUnit: function(name) {
				var r = this.findUnit(name);
				if(r === null) {
					throw new Error(String.format("EntityManagerFactory %s not registered", name));
				}
				return r;
			},

			/**
			 *
			 */
			registerUnit: function(name, unit) {
				if(this._units[name] !== undefined) {
					throw new Error(String.format("EntityManagerFactory %s already registered", name));
				}
				this._units[name] = unit;

				// register all entities (might overwrite, but that's ok)
				var pkgs = unit.getPackages();
				for(var k in pkgs) {
					js.mixIn((this._entities[k] = this._entities[k] || {}) , pkgs[k]);
				}

				return unit;
			},

			/**
			 *
			 */
			createEntityManager: function(name, session) {
				if(typeof name !== "string") {
					if(name instanceof Instance) {
						name = name.getEntity().getUnit().getName();
					} else if(name instanceof Entity) {
						name = name.getUnit().getName();
					} else if(name instanceof Unit) {
						name = name.getName();
					}
				}

				var ems = this._ems[name];
				if(ems instanceof Array && ems.length > 0) {
					return ems.pop();
				}

				var emf = this._units[name];
				if(emf === undefined) {
					emf = this._units["*"];
					if(emf === undefined) {
						throw new Error(String.format("No EntityManagerFactory registered for persistence unit %s", name));
					}
				}
				return emf.createEntityManager(session || this._session);
			},

			/**
			 *
			 */
			releaseEntityManager: function(em) {
				var key = em.getUnit().getName();

				em.close();

				if(this._ems[key] === undefined) {
					this._ems[key] = [em];
				} else {
					this._ems[key].push(em);
				}
			},

			/**
			 *
			 */
			newInstance: function(entity, attributes) {
				entity = this.getEntity(entity);
				return this.getEntity(entity).newInstance(null, attributes);
			},

			/**
			 *
			 */
			newObj: function(entity, attributes) {
				entity = this.getEntity(entity);
				return this.newInstance(entity, attributes).getObj();
			},

			/**
			 *
			 */
			find: function(entity, key, attributes) {
				entity = this.getEntity(entity);

				var em = this.createEntityManager(entity);
				var thisObj = this;

				function close(res) {
					thisObj.releaseEntityManager(em);
					return res;
				}

				return em.find(entity, key, attributes).addBoth(close);
			},

			/**
			 *
			 * @param entity
			 * @param criteria
			 * @param attributes
			 * @returns
			 */
			findBy: function(entity, criteria, attributes) {
				entity = this.getEntity(entity);

				var em = this.createEntityManager(entity);
				var thisObj = this;

				function close(res) {
					thisObj.releaseEntityManager(em);
					return res;
				}

				return em.findBy(entity, criteria, attributes).addBoth(close);
			},

			/**
			 *
			 */
			query: function(entity, attributes, criteria, parameters, fetch_attributes) {
				entity = this.getEntity(entity);

				var em = this.createEntityManager(entity);
				var thisObj = this;

				function close(res) {
					thisObj.releaseEntityManager(em);
					return res;
				}

				return em.query(entity, attributes || ".", criteria, parameters, fetch_attributes).addBoth(close);
			},

			/**
			 *
			 * @param entity
			 * @param criteria
			 * @param attributes
			 * @param fetch_attributes
			 * @returns
			 */
			queryBy: function(entity, criteria, attributes, fetch_attributes) {
				entity = this.getEntity(entity);

				var em = this.createEntityManager(entity);
				var thisObj = this;

				function close(res) {
					thisObj.releaseEntityManager(em);
					return res;
				}

				return em.queryBy(entity, criteria, attributes, fetch_attributes).addBoth(close);
			},

			/**
			 *
			 */
			sortForCommit: function(instances) {
				var sorted = [];
				var referenced = [];

				instances.forEach(function(instance) {
					if(referenced.indexOf(instance) === -1) {
						sorted.push(instance);
					} else {
						sorted.splice(0, 0, instance);
					}
					var attrs = instance.getEntity().getOneToManyAttributes();
					for(var k in attrs) {
						var value = instance.getAttributeValue(k);
						if(value !== null && referenced.indexOf(value) === -1) {
							referenced.push(value);
						}
					}
				});

				return sorted;
			},

			/**
			 *
			 */
			commit: function(persist, remove) {
				// downwards compatibility
				persist = persist || [];
				remove = remove || [];

				// determine instance
				var instance = persist[0] || remove[0];
				if(instance instanceof PersistenceObj) {
					instance = instance.$;
				}

				var em = this.createEntityManager(instance.getEntity());
				var tx = em.getTransaction();
				var thisObj = this;
				tx.begin();

				/**
				 *
				 * @param res
				 * @returns
				 */
				function close(res) {
					try {
						if(tx.isActive()) {
							console.warn("rolling back, still active");
							tx.rollback();
						}
					} finally {
						thisObj.releaseEntityManager(em);
					}
					return res;
				}

				em.persist(persist);
				em.remove(remove);

				return tx.commit().addBoth(close);
			},

			/**
			 *
			 */
			remove: function(instances) {
				if(!(instances instanceof Array)) {
					instances = [instances];
				}
				return this.commit([], instances);
			},

			/**
			 *
			 */
			instanceNotifyEvent: function(instance, event, data) {
				//console.log(String.format("%n %s %s", instance, event, js.sj(data)), instance, event, data);
			},

			/**
			 *
			 */
			getInstance: function(entity, key) {
				if(key === null) {
					return null;
				}

				var ecn;
				if(!(entity instanceof Entity)) {
					entity = this.getEntity(entity);
				}
				ecn = entity.getQName();

				var map = this._instances[ecn];
				var instance;
				if(map !== undefined) {
					instance = map[key];
					if(instance === undefined) {
						instance = (map[key] = entity.newInstance(key, {}));
					}
				} else {
					instance = entity.newInstance(key, {});
					this._instances[ecn] = {};
					this._instances[ecn][key] = instance;
				}
				return instance;
			},

			/**
			 *
			 */
			processInstance: function(entity, key, object) {
				//console.log(String.format("processInstance %s %s", entity.getQName(), key), {cs: js.cs(), object: object});

				var ecn;
				if(!(entity instanceof Entity)) {
					entity = this.getEntity(entity);
				}
				ecn = entity.getQName();

				var map = this._instances[ecn];
				if(map === undefined) {
					map = this._instances[ecn] = {};
				}
				var instance = map[key];
				if(instance === undefined) {
					instance = map[key] = entity.newInstance(key, object, false);
				} else {
					// FIXME to reset dirty or not to?
					instance.merge(object/*, true*/);
				}

				return instance;
			},

			/**
			 *
			 */
			processInstances: function(instances, undirty) {
				var setters = [];
				var cn, map, key;
				var this_map;
				var i, k, o, v;
				var instance;
				var obj;

				var entities = {};
				var entity;

				for(cn in instances) {
					entity = (entities[cn] = entities[cn] || this.getEntity(cn));
					map = instances[cn];
					this_map = this._instances[cn];
					if(this_map === undefined) {
						// All instances of entity class are new, wrap all...
						this._instances[cn] = map;
						for(key in map) {
							map[key] = entity.newInstance(key, map[key], false);
						}
					} else {
						for(key in map) {
							instance = this_map[key];
							if(instance === undefined) {
								// New instance, wrap it...
								this_map[key] = map[key] = entity.newInstance(key, map[key], false);
							} else {
								// Instance must be updated, but since map[key] might hold references which still need to be
								// resolved, store the old value in setters and call merge at the end of this function
								setters.push({instance: instance, oldValue: instance._object, newValue: map[key]});
								instance._object = map[key];
								map[key] = instance;
							}
						}
					}
				}

				for(cn in instances) {
					map = instances[cn];
					for(key in map) {
						obj = map[key]._object;
						for(k in obj) {
							v = obj[k];
							if(v instanceof Array) {
								for(i = 0; i < v.length; ++i) {
									o = v[i];
									if(o instanceof UtilObject) {
										v[i] = instances[o.c][o.k];
									}
								}
							} else {
								if(v instanceof UtilObject) {
									obj[k] = instances[v.c][v.k];
								}
							}
						}
					}
				}

				for(i = 0; i < setters.length; ++i) {
					var set = setters[i];
					// restore old value...
					set.instance._object = set.oldValue;
					// ...set new value
					set.instance.merge(set.newValue, undirty);
				}
			}
		}

	});

	return Persistence;
});