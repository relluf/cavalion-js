define(function(require) {
	
	var ns = require("namespace!.");
//	var js = require("js");
	
	var Deferred = require("js/util/Deferred");
	var HQ = require("../../type/HexaQuad");
	
	var HexaQuad = ns.Constructor.define("./HexaQuad", {
		
		/**
		 * 
		 */
		HexaQuad: function(db) {
			this._db = db;
		},
		
		Prototype: {
			_db: null,
			_hq: null,
			_initialAlloc: 1, 	// for debugging purposes HQ only incs with 1
			_allocate: 25,
			_cache: 0,
			
			/**
			 * 
			 */
			initialize: function(tx, uid, id) {
				var r = new Deferred();
				var thisObj = this;
				var hq;
				
				tx.executeSql("CREATE TABLE IF NOT EXISTS HQ(hq varchar(10) not null)", [], function(tx, result) {
					tx.executeSql("SELECT hq FROM HQ", [], function(tx, result) {
						if(result.rows.length === 0) {
							hq = new HQ(uid || 0, id || 0);
							hq.inc(thisObj._initialAlloc);
															
							thisObj._hq = new HQ(uid || 0, id || 0);
							thisObj._cache = thisObj._initialAlloc;
							
							tx.executeSql("INSERT INTO HQ VALUES(?)", [hq.toString()], function(tx, result) {
								r.callback(thisObj._hq);
							}, function(tx, error) {
								r.errback(error);
								return true;
							});
							
						} else {
							if(uid === undefined) {
								hq = new HQ(result.rows.item(0).hq);
								thisObj._hq = new HQ(result.rows.item(0).hq);
							} else {
								hq = new HQ(uid, id || 0);
								thisObj._hq = new HQ(uid, id || 0);
							}
							hq.inc(thisObj._initialAlloc);
							thisObj._cache = thisObj._initialAlloc;
							
							tx.executeSql("UPDATE HQ SET hq = ?", [hq.toString()], function(tx, result) {
								r.callback(thisObj._hq);
							}, function(tx, error) {
								r.errback(error);
								return true;
							});
						}
					}, function(tx, error) {
						r.errback(error);
						return true;
					});
					
				}, function(tx, error) {
					r.errback(error);
					return true;
				});
				
				return r;
			},
			
			/**
			 * 
			 */
			generate: function() {
				if(this._cache === 0) {
					//run out of HQs, reallocate
					
					var hq = new HQ(this._hq.toString());
					hq.inc(this._allocate);
					
					this._cache = this._allocate;
					
					this._db.transaction(function(tx) {
						tx.executeSql("UPDATE HQ SET hq = ?", [hq.toString()], 
							function(tx, result) {
								//console.log("HQ updated to " + hq.toString());
							}, 
							function(tx, error) {
								console.error("Error while updating HQ", {error: error}); 
								return true;
							});
					});
				}
				
				this._cache--;
				
				return this._hq.inc();
			}
			
		},
		
		/**
		 * 
		 */
		Statics: {
			
			cs: [],
			
			/**
			 * 
			 */
			create: function(db) {
				var r = new Deferred();
				
				db.transaction(function(tx) {
					tx.executeSql("CREATE TABLE IF NOT EXISTS HQ(hq varchar(10) not null)", [], 
						function(tx, result) {
							var generator = new org.cavalion.persistence.db.w3c.generator.HexaQuad(database);
							generator.initialize(tx, r);
						}, 
						function(tx, error) {
							r.errback(error);
							return true;
						});
				});
				
				var cs = getCriticalSection();
				cs.lock(function() {
					db.executeSql(function() {
						cs.unlock();
					});
				});
				
				return r;
			},
			
			/**
			 * 
			 * @param db
			 */
			getCriticalSection: function(db) {
				var cs = this.cs;
				for(var i = 0; i < cs.length; ++i) {
					if(cs[i].db === db) {
						return cs[i];
					}
				}
				//var r = new js.util.CriticalSection();
				var r = {
						
					locks: [],
					
					lock: function(f) {
						if(this.locks.push(f) === 1) {
							f();
						}
					},
					
					unlock: function() {
						this.locks.splice(0, 1);
						if(this.locks.length > 0) {
							this.locks[0]();
						}
					}
				};
				this.cs.push(r);
				return r;
			}
		}
		
	});
	
	return HexaQuad;
	
});