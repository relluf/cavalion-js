define(function(require) {

	var ns = require("namespace!.");
	var js = require("js");

	var Deferred = require("js/util/Deferred");

	var Instance = require("../Instance");

	var Query = require("./Query");

	var EXTRA_ATTRIBUTES = {
		localkey: 	{columnName: "_id", type: "integer", isNullable: false},
		created: 	{columnName: "_created", type: "timestamp", isNullable: false},
		modified: 	{columnName: "_modified", type: "timestamp", isNullable: false},
		synckey: 	{columnName: "_sid", type: "varchar(64)"}
	};

	var KEY_ALLOCATE = 100;
	var TX_WAIT = 0;

	var Database = ns.Constructor.define("./Database", {

		/**
		 *
		 * @param model
		 */
		Database: function(model) {
			this._model = model;
			this._keyGenerator = {
				deferred: null,
				key: -1,
				allocated: 0
			};
			this._work = [];
		},

		Prototype: {
			_db: null,
			_model: null,
			_opened: null,
			_keyGenerator: null,
			_work: null,

			/**
			 *
			 * @param recreate
			 * @returns {Deferred}
			 */
			open: function(recreate) {
				if(this._opened === null) {
					var thisObj = this;
					this._opened = Database.open(this._model.getName(), this._model, recreate).
						addCallback(function(res) {
							thisObj._db = res;
							thisObj.delay = null;
							return res;
						}).
						addErrback(function(err) {
							if(err.db !== undefined) {
								thisObj._db = err.db;
							}
							return new Error("Could not open database", err);
						});
				}

				return this._opened;
			},

			/**
			 *
			 * @returns {Boolean}
			 */
			isOpen: function() {
				return this._db !== null;
			},

			/**
			 *
			 * @param callback
			 * @param deferred
			 */
			transaction: function(callback, deferred) {
				if(this._db === null) {
					// callback when database is ready (ie. opened/created/checked/altered)
					//console.log("transaction - waiting for open");
					TX_WAIT++;
					this.open().addCallback(function() {
						TX_WAIT--;
						this.transaction(callback, deferred);
					}.bind(this));
				} else {
					var kg = this._keyGenerator;
					if(kg.deferred && (kg.deferred !== deferred)) {
						// callback after keys have been generated
						//console.log("transaction - waiting for other generateKey");
						TX_WAIT++;
						kg.deferred.addCallback(function() {
							TX_WAIT--;
							this.transaction(callback, deferred);
						}.bind(this));
					} else {
						// it's a go!
						//console.log(TX_WAIT + "transaction - go!");
						this._db.transaction(callback);
					}
				}
			},

			/**
			 *
			 * @param tx
			 * @param sql
			 * @param params
			 * @param rollbackOnError
			 * @returns {Deferred}
			 */
			executeSql: function(tx, sql, params, rollbackOnError) {
				var r = new Deferred();
				tx.executeSql(sql, params,
					function(tx, res) {
						//console.log(sql, params, res);
						r.callback({tx: tx, res: res});
					},
					function(tx, err) {
						err.sql = sql;
						err.params = params;
						console.error(err);

						r.errback(new Error(sql, err));
						if(rollbackOnError === true) {
							return true;
						}
					});
				return r;
			},

			/**
			 *
			 * @param entity
			 * @param key
			 * @param attributes
			 * @returns {Deferred}
			 */
			find: function(entity, key, attributes) {
				return this.query(this._model.getEntity(entity), attributes, {
					where: String.format("%s = ?", Database.KEY_COLUMN_NAME),
					parameters: [key]
				}).addCallback(function(res) {
					switch(res.getSize()) {
						case 0:
							return null;
						case 1:
							return res.getObject(0)['.'];
						default:
							throw new Error("Expected one or none");
					}
				});
			},

			/**
			 *
			 * @param entity
			 * @param attributes
			 * @param criteria
			 * @returns {Deferred}
			 */
			query: function(entity, attributes, criteria) {
				return new Query(this, this._model.getEntity(entity), attributes, criteria).getResultList();
			},

			/**
			 *
			 * @param instance
			 * @returns {Deferred}
			 */
			persist: function(instance) {
				for(var i = 0; i < this._work.length; ++i) {
					if(this._work[i].instance === instance) {
						if(this._work[i].type === "persist") {
							return;
						}
						this._work.splice(i, 1);
						i = this._work.length;
					}
				}

				var r;
				if(instance.isManaged() || instance.getPreferredKey() !== null) {
					r = new Deferred();
					r.callback(instance.getKey() || instance.getPreferredKey());
				} else {
					r = this.generateKey(instance).
						addCallback(function(key) {
							instance.setPreferredKey(key);
							return key;
						});
				}
				this._work.push({type:"persist", instance:instance});
				return r;
			},

			/**
			 *
			 * @param instance
			 * @returns {Deferred}
			 */
			remove: function(instance) {
				for(var i = 0; i < this._work.length; ++i) {
					if(this._work[i].instance === instance) {
						if(this._work[i].type === "remove") {
							return;
						}
						this._work.splice(i, 1);
						i = this._work.length;
					}
				}
				if(instance.isManaged() === true) {
					this._work.push({type:"remove", instance:instance});
				}
			},

			/**
			 *
			 * @returns {Deferred}
			 */
			flush: function() {
				var r = new Deferred();
				var work = this._work;
				var count = work.length;
				var error = new Error("Flush failed with multiple errors");
				var errors = [];

				var callback = function(res) {
					if(res instanceof Error) {
						errors.push(res);
						count = 1;
					}
					if(--count === 0) {
						if(errors.length === 0) {
							this._work = [];
							r.callback();
						} else if(errors.length === 1) {
							r.errback(js.mixIn(errors[0], error.methodStack));
						} else {
							r.errback(errors);
						}
					}
				}.bind(this);

				this.transaction(function(tx) {
					work.forEach(function(item) {
						if(item.type === "persist") {
							if(item.instance.isDirty()) {
								if(item.instance.getPreferredKey() === null) {
									this.update(tx, item.instance).addBoth(callback);
								} else {
									this.insert(tx, item.instance).
										addCallback(function(res) {
											item.instance._key = item.instance._preferredKey;
											delete item.instance._preferredKey;
											callback(res);
										}).
										addErrback(callback);
								}
							} else {
								callback();
							}
						} else {
							this['delete'](tx, instance).addBoth(callback);
						}
					}.bind(this));
				}.bind(this));

				return r;
			},

			/**
			 *
			 * @param tx
			 * @param instance
			 * @returns {Deferred}
			 */
			update: function(tx, instance) {
				var attributes = instance.getEntity().getAttributes();
				var object = instance.getDirtyObject();
				var setters = [], params = [];
				var key = instance.getKey();

				for(var k in object) {
					var attribute = attributes[k];
					var v = object[k];
					if(attribute.type !== "many-to-many" && attribute.type !=="one-to-many") {
						var column = Database.escape(Database.getColumnName(attribute, k));

						setters.push(String.format("%s = %s", column, v === null ? "null" : "?"));
						if(v !== null) {
							params.push(Database.js2db(v, attribute));
						}
					} else {
						sql = String.format("DELETE FROM %s WHERE %s = ? /* UPDATE */",
								Database.escape(Database.getTableName(attribute.link.entity)),
								Database.escape(attribute.link.lhs));

						this.executeSql(tx, sql, [key]);

						v.forEach(function(value) {
							sql = String.format("INSERT INTO %s (%s, %s) VALUES (? ,?)",
									Database.escape(Database.getTableName(attribute.link.entity)),
									Database.escape(attribute.link.lhs),
									Database.escape(attribute.link.rhs));

							this.executeSql(tx, sql, [instance.getKey(), Database.js2db(value)]);

						}.bind(this));
					}
				}

				setters.push(String.format("%s = ?", Database.escape(Database.MODIFIED_COLUMN_NAME)));
				params.push(Database.js2db(Date.now()));

				params.push(instance.getKey());

				var sql = String.format("UPDATE %s SET %s WHERE %s = ?",
						Database.escape(Database.getTableName(instance.getEntity())),
						setters.join(", "), Database.KEY_COLUMN_NAME);

				return this.executeSql(tx, sql, params, true);
			},

			/**
			 *
			 * @param tx
			 * @param instance
			 * @returns {Deferred}
			 */
			insert: function(tx, instance) {
				var attributes = instance.getEntity().getAttributes();
				var object = instance.getDirtyObject();
				var columns = [], values = [], params = [];
				var now = Database.js2db(Date.now());
				var key = instance.getPreferredKey();
				var sql;

				columns.push(Database.escape(Database.KEY_COLUMN_NAME));
				params.push(Database.js2db(key));
				values.push("?");

				columns.push(Database.escape(Database.MODIFIED_COLUMN_NAME));
				params.push(Database.js2db(now));
				values.push("?");

				columns.push(Database.escape(Database.CREATED_COLUMN_NAME));
				params.push(Database.js2db(now));
				values.push("?");

				for(var k in attributes) {
					var attribute = attributes[k];
					var v = object[k];
					if(attribute.type !== "one-to-many" && attribute.type !== "many-to-many") {
						var column = Database.getColumnName(attribute, k);
						if(v !== undefined) {
							columns.push(Database.escape(column));
							values.push(v === null ? "null" : "?");
							if(v !== null) {
								params.push(Database.js2db(v, attribute));
							}
						}
					} else if(v !== undefined) {
						sql = String.format("DELETE FROM %s WHERE %s = ?",
								Database.escape(Database.getTableName(attribute.link.entity)),
								Database.escape(attribute.link.lhs));

						this.executeSql(tx, sql, [key]);

						v.forEach(function(value) {
							sql = String.format("INSERT INTO %s (%s, %s) VALUES (? ,?)",
									Database.escape(Database.getTableName(attribute.link.entity)),
									Database.escape(attribute.link.lhs),
									Database.escape(attribute.link.rhs));

							this.executeSql(tx, sql, [key, Database.js2db(value)]);
						}.bind(this));
					}
				}

				sql = String.format("INSERT INTO %s (%s) VALUES (%s)",
						Database.escape(Database.getTableName(instance.getEntity())),
						columns.join(", "), values.join(", "));

				return this.executeSql(tx, sql, params, true);
			},

			/**
			 *
			 * @param tx
			 * @param instance
			 * @returns {Deferred}
			 */
			'delete': function(tx, instance) {
				return new Deferred;
			},

			/**
			 *
			 * @param instance
			 */
			generateKey: function(instance) {
				var kg = this._keyGenerator;
				var r = new Deferred();
/**
				if(this._db === null) {
					this.open().addCallback(function() {
						this.generateKey(instance).addCallback(function(res) {
							r.callback(res);
						});
					}.bind(this));
					return r;
				}
*/
				if(kg.deferred) {
					//console.log("generateKey - wait");
					TX_WAIT++;
					return kg.deferred.addCallback(function() {
						TX_WAIT--;
						return this.generateKey(instance);
					}.bind(this));
				}

				if(kg.allocated === 0) {
					//console.log("generateKey - enter transaction");
					kg.deferred = r;
					this.transaction(function(tx) {
						//console.log("generateKey - selecting");
						this.executeSql(tx, "SELECT __id FROM __keys", []).
							addCallback(function(res) {
								if(res.res.rows.length === 0) {
									kg.key = 0;
									this.executeSql(tx, "INSERT INTO __keys VALUES (?)", [KEY_ALLOCATE]).
										addCallback(function(res) {
											//console.log("generateKey - inserted", res);
											delete kg.deferred;
											kg.allocated = KEY_ALLOCATE - 1;
											r.callback(++kg.key);
										}).
										addErrback(function(res) {
											//console.log("generateKey - insert failed", err);
											delete kg.deferred;
											r.errback(err);
										});
								} else {
									//console.log(res);
									kg.key = res.res.rows.item(0).__id;
									this.executeSql(tx, "UPDATE __keys SET __id = ?", [kg.key + KEY_ALLOCATE]).
										addCallback(function(res) {
											//console.log("generateKey - updated", res);
											delete kg.deferred;
											kg.allocated = KEY_ALLOCATE - 1;
											r.callback(++kg.key);
										}).
										addErrback(function(err) {
											//console.log("generateKey - update failed", err);
											delete kg.deferred;
											r.errback(err);
										});
								}
							}.bind(this)).
							addErrback(function(err) {
								//console.log("generateKey - select failed", err);
								delete kg.deferred;
								r.errback(err);
							});
					}.bind(this), r);
				} else {
					kg.allocated--;
					r.callback(++kg.key);
				}
				return r;
			}
		},

		Statics: {

			_cache: {},

			KEY_COLUMN_NAME: EXTRA_ATTRIBUTES.localkey.columnName,
			SYNCKEY_COLUMN_NAME: EXTRA_ATTRIBUTES.synckey.columnName,
			MODIFIED_COLUMN_NAME: EXTRA_ATTRIBUTES.modified.columnName,
			CREATED_COLUMN_NAME: EXTRA_ATTRIBUTES.created.columnName,

			/**
			 *
			 */
			columnDefinitions: {
				"string": 		"varchar(%d)",
				"integer":		"integer",
				"money":		"decimal",
				"float":		"float",
				"double":		"double",
				"boolean":		"integer",
				"text":			"longvarchar",
				"timestamp":	"timestamp",
				"geometry":		"longvarchar",

				"many-to-one":	EXTRA_ATTRIBUTES.localkey.type
			},

			/**
			 *
			 * @param entity
			 * @returns {String}
			 */
			getTableName: function(entity) {
				return /*entity.getDefinition().tableName ||*/ entity.getName().replace(/\./g, "_").replace(/\//g, "_");
			},

			/**
			 *
			 * @param entity
			 * @returns {Boolean}
			 */
			isHelperEntity: function(entity) {
				return entity.getLocalName().charAt(0) === "_";
			},

			/**
			 * @param attribute
			 * @param name
			 * @returns {String}
			 */
			getColumnName: function(attribute, name) {
				return attribute.columnName || name;
			},

			/**
			 *
			 * @param attribute
			 * @returns {String}
			 */
			getColumnDefinition: function(attribute) {
				var cd = this.columnDefinitions[attribute.type];
				if(cd === undefined) {
					throw new Error("Unknown type " + attribute.type);
				}

				return String.format(cd, attribute.size);
			},

			/**
			 *
			 * @param s
			 * @returns
			 */
			escape: function(s) {
				return String.format("\"%s\"", s);
			},

			/**
			 *
			 * @param value
			 * @param attribute
			 * @returns
			 */
			js2db: function(value, attribute) {
				if(value instanceof Instance) {
					var o = value;
					value = value._key || value._preferredKey;
					if(value === null) {
						throw new Error(String.format("Instance %n not managed", o));
					}
				}
				return value;
			},

			/**
			 *
			 */
			db2js: function(v, attribute) {
				if(v !== null) {
					switch(attribute.type) {
						case "integer":
							break;

						case "timestamp":
							v = new Date(v);
							break;
					}
				}
				return v;
			},

			/**
			 *
			 * @param name
			 * @param model
			 * @param recreate
			 * @returns {Deferred}
			 */
			open: function(name, model, recreate) {
				var db = this._cache[name];
				var r;

				if(db === undefined) {
					var MAX_SIZE = 1024 * 1024 * 10; // 10 MB

					db = (this._cache[name] = openDatabase(name, "1", name, MAX_SIZE));

					r = Database.checkTables(db, model, recreate).
						addCallback(function(result) {
							return db;
						}).
						addErrback(function(err) {
							return js.mixIn(err, {db: db});
						});
				} else {
					r = new Deferred();
					r.callback(db);
				}

				return r;
			},

			/**
			 *
			 * @param db
			 * @param model
			 * @param recreate
			 * @returns {Deferred}
			 */
			checkTables:function(db, model, recreate) {
				var r = new Deferred();

				//var statements = [];
				var entities = model.getEntities();
				var error = new Error("Database.checkTables failed with multiple errors");
				var errors = (error.errors = []);

				if(entities.length === 0) {
					// nothing to do
					r.callback();
					return;
				}

				/**
				 *
				 */
				function done() {
					if(errors.length === 1) {
						r.errback(js.mixIn(errors[0], error.methodStack));
					} else if(errors.length > 0) {
						r.errback(error);
					} else {
						r.callback(db);
					}
				}

				/**
				 *
				 * @param tx
				 * @param sql
				 * @param params
				 * @param callback
				 */
				function execute(tx, sql, params, callback) {
					//console.log(sql);
					tx.executeSql(sql, params, callback, function(tx, error) {
						error.sql = sql;
						error.parameters = params;
						errors.push(error);
						callback();
					});
				}

				db.transaction(function(tx) {

					/**
					 *
					 */
					function dropAll(callback) {
						var count = entities.length + 1;
						entities.forEach(function(entity) {
							var tableName = Database.escape(Database.getTableName(entity));
							var statement = String.format("DROP TABLE IF EXISTS %s", tableName);
							execute(tx, statement, [], function() {
								if(--count === 0) {
									callback();
								}
							});
						});

						execute(tx, "DROP TABLE IF EXISTS __keys", [], function() {
							if(--count === 0) {
								callback();
							}
						});
					}

					/**
					 *
					 */
					function createAll(callback) {
						var count = entities.length + 1;

						entities.forEach(function(entity) {
							var attributes = entity.getAttributes();
							var sql = [];
							var tableName = Database.getTableName(entity);
							var helper = Database.isHelperEntity(entity);
							var keys = [];

							if(helper === false) {
								for(var k in EXTRA_ATTRIBUTES) {
									var attribute = EXTRA_ATTRIBUTES[k];
									sql.push(String.format("\t%s %s%s",
											Database.escape(attribute.columnName), attribute.type,
											attribute.isNullable === false ? " not null" : ""));
									if(k === "localkey") {
										keys.push(attribute.columnName);
									}
								}
							}

							for(var k in attributes) {
								var attribute = attributes[k];
								if(attribute.type !== "many-to-many" && attribute.type.indexOf("one-to") !== 0) {
									var columnName = Database.getColumnName(attribute, k);
									var columnDef = Database.getColumnDefinition(attribute);
									sql.push(String.format("\t%s %s%s", Database.escape(columnName), columnDef,
											helper === true || attribute.isNullable === false ? " not null" : ""));
									if(helper === true) {
										keys.push(columnName);
									}
								}
							}

							if(keys.length > 0) {
								sql.push(String.format("\tPRIMARY KEY(%s)", keys.join(", ")));
							}
							sql = String.format("CREATE TABLE IF NOT EXISTS %s(\n\t%s\n)",
									Database.escape(tableName), sql.join(",\n\t"));

							execute(tx, sql, [], function() {
								if(--count === 0) {
									callback();
								}
							});
						});

						execute(tx, "CREATE TABLE IF NOT EXISTS __keys(__id integer not null)", [], function() {
							if(--count === 0) {
								callback();
							}
						});
					}

					try {
						if(recreate === true) {
							dropAll(function() {
								createAll(done);
							});
						} else {
							createAll(done);
						}
					} catch(e) {
						r.callback(e);
					}
				});

				return r;
			},

			/**
			 *
			 */
			alterTables:function(db, model, changes) {
				var r = new Deferred();
				var error = new Error("Database.checkTables failed with multiple errors");
				var errors = (error.errors = []);

				/**
				 *
				 */
				db.transaction(function(tx) {

					var executeSql = tx.executeSql;
					tx.executeSql = function(sql) {
						//console.log("Executing: " + sql);
						executeSql.apply(this, arguments);
					};

					for(var k in changes) {
						var info = changes[k];
						var attributes;
						var entity = model.getEntity(k);
						var tableName = Database.getTableName(entity);

						if(info.set !== undefined) {
							tx.executeSql(String.format("UPDATE %s SET %s", tableName, info.set), [],

								function(tx, result) {},

								/**
								 *
								 */
								function(tx, error) {
									console.error(error.message);
									error.sql = String.format("UPDATE %s SET %s", tableName, info.set);
									errors.push(error);
								}
							);
						}
						if((attributes = info.add) !== undefined) {
							attributes.split(",").forEach(function(attribute) {
								var attr = entity.getAttribute(attribute);
								var columnName = attr.columnName || attribute;
								var sql = String.format("ALTER TABLE %s ADD %s %s %s", tableName, Database.escape(columnName),
										Database.getColumnDefinition(attr), attr.isNullable === false ? " NOT NULL" : "");

								tx.executeSql(sql, [],

									function(tx, result) {},

									/**
									 *
									 */
									function(tx, error) {
										console.error(error.message);
										error.sql = sql;
										errors.push(error);
									}
								);
							});
						}
						if((attributes = info['delete']) !== undefined) {
						}
						if((attributes = info['update']) !== undefined) {
						}
					}

					tx.executeSql("to_rollback_or_not_to_rollback", [],
						function() {

						},
						function(tx, error) {
							if(errors.length === 1) {
								r.errback(js.mixIn(errors[0], error.methodStack));
								// Rollback!
								return true;
							} else if(errors.length > 0) {
								r.errback(error);
								// Rollback!
								return true;
							} else {
								r.callback();
							}
						});
				});

				return r;
			}
		}

	});

	return Database;

});