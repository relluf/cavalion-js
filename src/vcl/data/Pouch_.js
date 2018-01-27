define(function(require) {
	
	var Base = require("vcl/data/Array");
	var Pouch = require("js/defineClass");
	var Type = require("js/Type");
	
	var PouchDB = require("pouchdb");
	
	function put(keys, db, instance, id, doc) {
		doc = doc || {_id: id};
		keys.forEach(function(k) {
			if(instance.hasOwnProperty(k + "$")) {
				doc[k] = instance[k + "$"];
			} else {
				doc[k] = instance[k];
			}
		});
		
		// db.put(updated version);
		delete doc.id;
		return db.put(doc);
	}
	
	return (Pouch = Pouch(require, {
		inherits: Base,
		prototype: {
			_dbName: "",
			_db: null,
			_sync: "",

			loaded: function() {
				/** @overrides ./Component.prototype.loaded */
				if(this._refreshWL) {
					delete this._refreshWL;
					this.refresh();
				}
				return this.inherited(arguments);
			},
			
			changes: function(evt) {
		        // console.log("db changes", evt);
		        this._changes = (this._changes || []);
		        this._changes.push(evt.changes);
		        // this.setTimeout("refresh", () => this.refresh(), 250);
		        // this.refresh();
			},
			
			refresh: function() {
				if(this.isLoading()) {
					this._refreshWL = true;
					return;
				}

				var me = this, db;
				if((db = this._db) === null) {
					db = this._db = new PouchDB(this._dbName);
					db.info(function(error, info) {
						console.log("db info", arguments);
						db.changes({since: "now", live: true})
							.on("change", function(evt) {
								me.changes(evt);
							});
					});
					if(this._sync) {
						db.sync(this._sync, { live:true }, function() {
							console.error("db sync error", arguments);
						});
					}
				}
				
				console.log("refresh");

				this.setTimeout("refresh", function() {
					db.allDocs({include_docs: true, limit: 4500})
						.then(function(dataset) {
							me.setArray(dataset.rows
								.map(row => row.doc || row)
								// .sort((i1, i2) => i1.datum < i2.datum ? 1 : -1)
							);
					});
				}, 250);
			},
			
			getDbName: function() {
				return this._dbName;
			},
			setDbName: function(value) {
				if(this._dbName !== value) {
					delete this._db;
					
					this._dbName = value;
					this.refresh();
				}
			},
			setSync: function(value) {
				if(this._sync !== value) {
					delete this._db;
					
					this._sync = value;
					this.refresh();
				}
			}
			
		},
		properties: {
			dbName: { type: Type.STRING, get: Function, set: Function },
			sync: { type: Type.STRING, set: Function }
		}
	}));

});