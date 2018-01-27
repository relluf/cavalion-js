define(function(require) {

	var EntityManager = require("js/defineClass");
//	var js = require("js");

	var PersistenceObject = require("./Object");
	var Entity = require("./Entity");

	EntityManager = EntityManager(require, {

		prototype: {

			/**
			 *
			 * @param model
			 */
			constructor: function(model) {
				this._model = model;
				this._persisting = [];
				this._removing = [];
			},

			_model: null,

			/**
			 *
			 */
			getEntity: function(entity) {
				if(!(entity instanceof Entity)) {
					entity = this._model.getEntity(entity);
				}
				return entity;
			},

			/**
			 *
			 * @param entity
			 * @param key
			 * @returns {Instance}
			 */
			getInstance: function(entity, key) {
				entity = this.getEntity(entity);
				return new Instance;
			},

			/**
			 *
			 * @param entity
			 * @param values
			 * @returns {Instance}
			 */
			newInstance: function(entity, values) {
				return this.getEntity(entity).newInstance(null, values);
			},

			/**
			 *
			 * @param entity
			 * @param key
			 * @param {PersistenceObject}
			 */
			getObject: function(entity, key) {
				return this.getInstance(entity, key).getObject();
			},

			/**
			 *
			 * @param entity
			 * @param values
			 * @param {PersistenceObject}
			 */
			newObject: function(entity, values) {

				// replace PersistenceObjects for Instances
				function walk(values) {
					for(var k in values) {
						var v = values[k];
						if(v instanceof PersistenceObject) {
							values[k] = v.$;
						} else if(v instanceof Array) {
							for(var i = 0; i < v.length; ++i) {
								if(v[i] instanceof PersistenceObject) {
									v[i] = v[i].$;
								}
							}
						} else if(typeof v === "object") {
							walk(v);
						}
					}
				}

				walk(values);

				return this.newInstance(entity, values).getObject();
			},

			/**
			 *
			 * @param entity
			 * @param key
			 * @param attributes
			 * @returns {Deferred}
			 */
			find: function(entity, key, attributes) {
				return new Deferred;
			},

			/**
			 *
			 * @param entity
			 * @param attributes
			 * @param criteria
			 * @returns {Deferred}
			 */
			query: function(entity, attributes, criteria) {
				return new Deferred;
			},

			/**
			 *
			 * @param instance
			 * @returns
			 */
			persist: function(instance) {
				if(instance instanceof Array) {
					var r = [];
					instance.forEach(function(instance) {
						r.push(this.persist(instance));
					}.bind(this));
					return r;
				}

				if(instance instanceof PersistenceObject) {
					instance = instance.$;
				}
				return this.persisting(instance);
			},

			/**
			 *
			 * @param instance
			 * @returns
			 */
			persisting: function(instance) {
			},

			/**
			 *
			 * @param instance
			 * @returns
			 */
			remove: function(instance) {
				if(instance instanceof Array) {
					var r = [];
					instance.forEach(function(instance) {
						r.push(this.remove(instance));
					}.bind(this));
					return r;
				}

				if(instance instanceof PersistenceObject) {
					instance = instance.$;
				}
				return this.removing(instance);
			},

			/**
			 *
			 * @param instance
			 * @returns
			 */
			removing: function(instance) {
			},

			/**
			 *
			 */
			flush: function() {
				//
			},

			/**
			 *
			 * @param callback
			 */
			transaction: function(callback) {

			}
		}

	});

	return EntityManager;
});