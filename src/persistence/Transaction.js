/**
 * Transaction.js
 */
define(function(require) {
	
	var ns = require("namespace!.");
	var js = require("js");
	var Deferred = require("js/util/Deferred");
	
	var Transaction = ns.Constructor.define("./Transaction", {

		/**
		 * 
		 * @param em
		 */
		Transaction: function(em) {
			this._em = em;
			this._work = [];
		},
		
		Prototype: {
			_active: null,
			_vars: null,

			_em: null,
			_work: null,
			
			/**
			 * 
			 */
			getEntityManager: function() {
				return this._em;
			},
			
			/**
			 * 
			 */
			getWork: function() {
				return this._work;
			},
			
			/**
			 *
			 */
			getVar: function(name) {
				return this._vars !== null ? js.get(name, this._vars) : undefined;
			},
			
			/**
			 * 
			 */
			setVar: function(name, value) {
				if(this._vars === null) {
					this._vars = {};
				}
				return js.set(name, value, this._vars);
			},
			
			/**
			 * Returns the -vars- object associated with the calling component.
			 *
			 * @return Object
			 */
			getVars: function() {
				if(this._vars === null) {
					this._vars = {};
				}
				return this._vars;
			},

			/**
			 *
			 */
			setVars: function(value) {
				this._vars = value;
			},

			/**
			 * 
			 */
			begin: function() {
				if(this._active !== null) {
					throw new Error("Transaction already active");
				}
				this._active = new Date();			
			},
			
			/**
			 * 
			 */
			isActive: function() {
				return this._active !== null;
			},
			
			/**
			 * 
			 */
			getTime: function() {
				if(this._active === null) {
					throw new Error("Transaction not active");
				}
				return this._active.getTime();
			},
			
			/**
			 * 
			 */
			persist: function(instance) {
				if(this._active === null) {
					throw new Error("Transaction not active");
				}
				// Schedule instance for 'persistal'
				
				this._work.push({type: "p", instance: instance});
				
				//console.log(String.format("%n.persist", this), instance);
			},
			
			/**
			 * 
			 */
			remove: function(instance) {
				if(this._active === null) {
					throw new Error("Transaction not active");
				}
				// Schedule instance for removal
				this._work.push({type: "r", instance: instance});
				
				//console.log(String.format("%n.remove", this), instance);
			},
			
			/**
			 * 
			 */
			commit: function() {
				if(this._active === null) {
					throw new Error("Transaction not active");
				}

				var thisObj = this;
				return this._em._commit(this).addCallback(
					function(res) {
						thisObj.end();
						return res;
					});
			},
			
			/**
			 * 
			 */
			rollback: function() {
				if(this._active === null) {
					throw new Error("Transaction not active");
				}
				var r = new Deferred();
				this.end();
				r.callback();
				return r;
			},
			
			/**
			 * 
			 */
			end: function() {
				delete this._work;
				delete this._em._tx;
				delete this._em;
				
				delete this._active;
			}
			
		}
		
	});
	
	return Transaction;

});