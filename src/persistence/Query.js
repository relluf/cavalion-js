/**
 * Query.js
 */
define(function(require) {
	
	var ns = require("namespace!.");

	var Query = ns.Constructor.define("./Query", {
		
		/**
		 * 
		 * @param em
		 * @param pql
		 */
		Query: function(em, pql) {
			this._em = em;
			this._pql = pql;
			this.prepare(pql);
		},
		
		
		Prototype: {
			
			_em: null,
			_pql: null,

			/**
			 * 
			 * @param pql
			 */
			prepare: function(pql) {
			},

			/**
			 * 
			 * @param index
			 * @param value
			 */
			setParameter: function(index, value) {
			},
			
			/**
			 * 
			 */
			getResultList: function() {
			},
			
			/**
			 * 
			 */
			getSingleResult: function() {
			},
			
			/**
			 * 
			 */
			executeUpdate: function() {
			}
			
		}
	});
	
	return Query;
});