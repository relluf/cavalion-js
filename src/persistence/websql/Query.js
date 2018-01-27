define(function(require) {
	
	var ns = require("namespace!.");
	var js = require("js");
	
	var Base = require("../Query");
	var QueryBuilder = require("../QueryBuilder");
	
	var Database = require("./Database");
	var Deferred = require("js/util/Deferred");
	
	var Query = ns.Constructor.define("./Query", {
		
		Extends: Base,
		
		Prototype: {
			_obj: null,
			_sql: null,
			_params: null,
			
			/**
			 * @overrides ../Query.prototype._prepare 
			 */
			prepare: function(pql) {
				this._obj = QueryBuilder.pql2obj(pql, this._em._unit.getPackages());
				this._sql = this._em._database.pql2sql(this._obj);
				this._params = [];
			},
			
			/**
			 * @overrides ../Query.prototype.setParameter 
			 */
			setParameter: function(index, value) {
				value = Database.js2db(value);
				this._params[index - 1] = value;
			},
			
			/**
			 * @overrides ../Query.prototype.getResultList
			 */
			getResultList: function() {
				var r = new Deferred();
				var columns = this._obj.select.columns;
				var attributes = this._obj.select.attributes;
				var thisObj = this;
				
				this._em._database.transaction(function(tx) {
					tx.executeSql(thisObj._sql, thisObj._params, function(tx, result) {
						var arr = [];
						var first = true;
						var names = [];
						for(var w = 0, l = result.rows.length; w < l; ++w) {
							var obj = {};
							var row = result.rows.item(w);
							
							for(var i = 0; i < columns.length; ++i) {
								var column = columns[i];
								var value;

								if(column.indexOf("(") === -1) {
									value = row[column.split(".").join("_")];
								} else {
									value = row[column];
								}
								
								var attribute = attributes[i];
								value = Database.db2js(value, attribute.def);
								
								if(attribute.aggFunc === undefined) {
									if(first === true) {
										names.push(column.split(".")[0] + "." + attribute.name);
									}
									js.set(names[i], value, obj);
								} else {
									if(first === true) {
										names.push("not_used");
									}
									obj[attribute.name] = value; 
								}						
							}
							
							arr.push(obj);
						}
						r.callback(arr);
					}, function(tx, error) {
						r.errback(error);
					});
				});
				
				return r;
			},
			
			/**
			 * @overrides ../Query.prototype.getSingleResult
			 */
			getSingleResult: function() {
			},
			
			/**
			 * @overrides ../Query.prototype.executeUpdate 
			 */
			executeUpdate: function() {
			}
			
		}
		
	}); 
	
	return Query;
	
});