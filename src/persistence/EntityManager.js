/**
 * EntityManager.js
 */
define(function(require) {

	var ns = require("namespace!.");

	var PersistenceObj = require("./Obj");
	var QueryBuilder = require("./QueryBuilder");

	var EntityManager = ns.Constructor.define("./EntityManager", {

		/**
		 *
		 * @param unit
		 * @param session
		 */
		EntityManager: function(unit, session) {
			this._unit = unit;
			this._session = session;
		},

		Prototype: {
			_unit: null,
			_session: null,
			_tx: null,

			/**
			 *
			 */
			getUnit: function() {
				return this._unit;
			},

			/**
			 *
			 */
			getPackage: function(name) {
				return this._unit.getPackage(name);
			},

			/**
			 *
			 */
			getEntity: function(entity) {
				return typeof entity === "string" ? this._unit.getEntity(entity) : entity;
			},

			/**
			 *
			 */
			getSession: function() {
				return this._session;
			},

			/**
			 *
			 */
			getTransaction: function() {
				return this._tx || (this._tx = this._unit.createTransaction(this));
			},

			/**
			 *
			 */
			close: function() {
			},

			/**
			 *
			 */
			newInstance: function(entity, object) {
				return this.getEntity(entity).newInstance(null, object);
			},

			/**
			 *
			 * @param entity
			 */
			newObj: function(entity, values) {
				return this.newInstance(this.getEntity(entity), values).getObj();
			},

			/**
			 *
			 * @param entity
			 * @param key
			 * @param attributes
			 * @returns
			 */
			find: function(entity, key, attributes) {
				return this._find(this.getEntity(entity), key, attributes);
			},

			/**
			 *
			 * @param entity
			 * @param criteria
			 * @param attributes
			 * @returns
			 */
			findBy: function(entity, criteria, attributes) {
				//attributes = attributes;
				return this.queryBy(this.getEntity(entity), criteria, attributes).addCallback(function(res) {
					var size = res.getSize();
					if(size > 1) {
						return new Error("Result contains %d objects where 0 or 1 was expected", size);
					}
					return size === 1 ? res.getAttributeValue(".", 0) : null;
				});
			},

			/**
			 *
			 * @param entity
			 * @param attributes
			 * @param criteria
			 * @param parameters
			 * @param fetch_attributes
			 * @returns
			 */
			query: function(entity, attributes, criteria, parameters, fetch_attributes) {
				return this._query(this.getEntity(entity), attributes, criteria, parameters, fetch_attributes);
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
				var parsed = QueryBuilder.parseByCriteria(entity, criteria);
				//console.log("parsed", parsed);
				return this.query(this.getEntity(entity), attributes, parsed.criteria, parsed.parameters, fetch_attributes);
			},

			/**
			 *
			 * @param pql
			 * @returns
			 */
			createQuery: function(pql) {
				return this._createQuery(pql);
			},

			/**
			 *
			 * @param instances
			 */
			persist: function(instances) {
				var unit = this._unit;

				if(!(instances instanceof Array)) {
					instances = [instances];
				}

				instances.forEach(function(instance) {
					if(instance instanceof PersistenceObj) {
						instance = instance.$;
					}
					if(unit !== instance._entity._unit) {
						throw new Error(String.format("Can not manage %n", instance));
					}

					this._persist(instance);
				}, this);
			},

			/**
			 *
			 * @param instances
			 */
			remove: function(instances) {
				var unit = this._unit;

				if(!(instances instanceof Array)) {
					instances = [instances];
				}

				instances.forEach(function(instance) {
					if(instance instanceof PersistenceObj) {
						instance = instance.$;
					}
					if(unit !== instance._entity._unit) {
						throw new Error(String.format("Can not manage %n", instance));
					}

					this._remove(instance);
				}, this);
			},
			
			/**
			 *
			 * @param entity
			 * @param key
			 * @param attributes
			 */
			_find: function(entity, key, attributes) {
				throw new Error("Abstract");
			},

			/**
			 *
			 * @param entity
			 * @param attributes
			 * @param criteria
			 * @param parameters
			 * @param fetch_attributes
			 */
			_query: function(entity, attributes, criteria, parameters, fetch_attributes) {
				throw new Error("Abstract");
			},

			/**
			 *
			 * @param pql
			 */
			_createQuery: function(pql) {
				throw new Error("Abstract");
			},

			/**
			 *
			 * @param instance
			 */
			_persist: function(instance) {
				if(this._tx === null) {
					throw new Error("No transaction");
				}

				this._tx.persist(instance);
			},

			/**
			 *
			 * @param instance
			 */
			_remove: function(instance) {
				if(this._tx === null) {
					throw new Error("No transaction");
				}

				this._tx.remove(instance);
			},

			/**
			 *
			 */
			_commit: function(tx) {
				throw new Error("Abstract");
			}
		}
	});

	return EntityManager;
});