define(function(require) {

	var ns = require("namespace!.");

	var Base = require("../EntityManager");

	var Database = require("./Database");

	var EntityManager = ns.Constructor.define("./EntityManager", {

		Extends: Base,

		/**
		 *
		 * @param model
		 */
		EntityManager: function(model) {
			this._db = new Database(model);
		},

		Prototype: {
			_db: null,

			/**
			 * @overrides ../EntityManager.prototype.find
			 */
			find: function(entity, key, attributes) {
				return this._db.find(entity, key, attributes || "*");
			},

			/**
			 * @overrides ../EntityManager.prototype.query
			 */
			query: function(entity, attributes, criteria) {
				return this._db.query(entity, attributes || "*", criteria || "");
			},

			/**
			 * @overrides ../EntityManager.prototype.persisting
			 */
			persisting: function(instance) {
				return this._db.persist(instance);
			},

			/**
			 * @overrides ../EntityManager.prototype.removing
			 */
			removing: function(instance) {
				return this._db.remove(instance);
			},

			/**
			 * @overrides ../EntityManager.prototype.flush
			 */
			flush: function() {
				return this._db.flush();
			}

		}

	});

	return EntityManager;
});
