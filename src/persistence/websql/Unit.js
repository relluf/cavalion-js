define(function(require) {

	var ns = require("namespace!.");
	var Base = require("../Unit");

	var Database = require("./Database");
	var EntityManager = require("./EntityManager");

	var Unit = ns.Constructor.define("./Unit", {

		Extends: Base,

		Prototype: {

			/**
			 * @overrides ../Unit.createEntityManager
			 */
			createEntityManager: function(session) {
				var database = new Database(this);
				// In order to ensure that generators can initialize itself before any user code
				// is executed, open it here...
				// database.open();
				return new EntityManager(this, session, database);
			}

			/**
			 * @overrides ../Unit.prototype.createTransaction
			createTransaction: function(em) {
				var r = js.lang.Class.__inherited(this, arguments);
				//console.log("create tx", r);
				return r;
			}
			 */

		},

		Statics: {

			/**
			 *
			 * @param name
			 * @param model
			 */
			define: function(name, model) {
				return Base.define(name, model, Unit);
			}

		}

	});

	return Unit;

});