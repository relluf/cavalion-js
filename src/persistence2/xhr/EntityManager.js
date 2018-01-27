define(function(require) {

	var ns = require("namespace!.");
//	var js = require("js");

	var Base = require("../EntityManager");

/*	var Entity = */require("./Entity");

	var EntityManager = ns.Constructor.define("./EntityManager", {

		Extends: Base,

		/**
		 *
		 * @param model
		 */
		EntityManager: function(model) {
			//
		},

		Prototype: {

			/**
			 * @overrides ../EntityManager.prototype.find
			 */
			find: function(entity, key, attributes) {
				return new Deferred;
			},

			/**
			 * @overrides ../EntityManager.prototype.query
			 */
			query: function(entity, attributes, criteria) {
				return new Deferred;
			},

			/**
			 * @overrides ../EntityManager.prototype.persist
			 */
			persist: function(instance) {

			},

			/**
			 * @overrides ../EntityManager.prototype.remove
			 */
			remove: function(instance) {

			},

			/**
			 * @overrides ../EntityManager.prototype.transaction
			 */
			transaction: function(callback) {

			}

		}

	});

	return EntityManager;
});