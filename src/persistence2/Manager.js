define(function(require) {

	var js = require("js");

	var Entity = require("./Entity");
	//var Instance = require("./Instance");
	//var Unit = require("./Unit");
	//var PersistenceObj = require("./Obj");
	//var UtilObject = require("js/util/Object");

	return {

		models: {},
		packages: {},
		entities: {},
		instances: {},

		emfs: {},

		/**
		 *
		 * @param model
		 */
		registerEntityManagerFactory: function(model, f) {
			js.mixIn(this.entities, model._entities);
			js.mixIn(this.packages, model._packages);
			this.emfs[model.getName()] = {model: model, factory: f};
		},

		/**
		 *
		 * @param entity
		 * @returns
		 */
		getEntityManager: function(entity) {
			var model = this.getEntity(entity).getModel();
			var emf = this.emfs[model.getName()];
			if(emf === undefined) {
				throw new Error(String.format("EntityManagerFactory %s not available", model.getName()));
			}
			return emf.factory(model);
		},

		/**
		 *
		 * @param em
		 * @returns
		 */
		releaseEntityManager: function(em) {

		},

		/**
		 *
		 * @param name
		 */
		getModel: function(name) {
			var r = this.models[name];
			if(r === undefined) {
				throw new Error(String.format("Model %s not available", name));
			}
			return r;
		},

		/**
		 *
		 * @param name
		 */
		getPackage: function(name) {
			var r = this.packages[name];
			if(r === undefined) {
				throw new Error(String.format("Package %s not available", name));
			}
			return r;
		},

		/**
		 *
		 */
		getEntity: function(entity) {
			if(typeof entity == "string") {
				var r;
				if(entity.indexOf(":") !== -1) {
					entity = entity.split(":");
					r = this.getModel(entity[0]).getEntity(entity[1]);
				} else {
					r = js.get(entity.replace(/\//g, "."), this.packages);
					if(!(r instanceof Entity)) {
						throw new Error(String.format("Entity %s not available", entity));
					}
				}
				return r;
			}
			return entity;
		},

		/**
		 *
		 * @param entity
		 * @param key
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

			var map = this.instances[ecn];
			var instance;
			if(map !== undefined) {
				instance = map[key];
				if(instance === undefined) {
					instance = (map[key] = entity.newInstance(key, {}));
				}
			} else {
				instance = entity.newInstance(key, {});
				this.instances[ecn] = {};
				this.instances[ecn][key] = instance;
			}
			return instance;
		},

		/**
		 *
		 * @param entity
		 * @param key
		 * @param attributes
		 * @returns {Deferred}
		 */
		find: function(entity, key, attributes) {
			return this.getEntityManager(entity).find(entity, key, attributes);
		},

		/**
		 *
		 * @param entity
		 * @param attributes
		 * @param criteria
		 * @returns {Deferred}
		 */
		query: function(entity, attributes, criteria) {
			return this.getEntityManager(entity).query(entity, attributes, criteria);
		},

		/**
		 *
		 * @param instances
		 * @returns
		 */
		persist: function(instances) {
			var em = this.getEntityManager(entity);
			em.persist(instances);
			return em.flush();
		},

		/**
		 *
		 * @param instances
		 * @returns
		 */
		remove: function(instances) {
			var em = this.getEntityManager(entity);
			em.remove(instances);
			return em.flush();
		}
	};
});