/**
 * Database.js
 */
define(function(require) {

	var ns = require("namespace!.");
	var js = require("js");
	var Deferred = require("js/util/Deferred");
	var Instance = require("../Instance");

	var Database = ns.Constructor.define("./Database", {

		/**
		 *
		 * @param unit
		 */
		Database: function(unit) {
			this._generators = {};
			this._unit = unit;
		},

		Prototype: {
			_unit: null,
			_db: null,
			_tx: null,
			_opened: null,
			_initialized: null,
			_generators: null,

			/**
			 * This method scans the unit for key attributes with generated set to {true}
			 * Returns {js/util/Deferred}
			 */
			instantiateGenerators: function() {
				var classes = [];
				var types = [];
				var generators = this._generators;
				var thisObj = this;
				var r = new Deferred();

				this._unit.getEntities().forEach(function(entity) {
					var key = entity.getKey();
					if(key.generated === true && types.indexOf(key.type) === -1) {
						types.push(key.type);
						classes.push(this.getGeneratorClassName(key.type));
					}
				}, this);

				if(classes.length > 0) {
					require(classes, function() {
						for(var i = 0; i < classes.length; ++i) {
							var generator = new arguments[i](thisObj);
							generators[types[i]] = generator;
						}

						thisObj.initializeGenerators().
							addCallback(function(res) {
								r.callback();
							}).
							addErrback(function(err) {
								r.errback(err);
							});
					});
				} else {
					r.callback();
				}

				return r;
			},

			/**
			 * Used internally by instantiateGenerators
			 */
			initializeGenerators: function() {
				var generators = this._generators;
				var count = js.keys(generators).length + 1;
				var errors = [];
				var r = new Deferred();

				/**
				 *
				 */
				function done() {
					if(--count === 0) {
						if(errors.length > 0) {
							if(errors.length === 1) {
								r.errback(errors[0]);
							} else {
								var error = new Error("Errors while initializing generators");
								error.errors = errors;
								r.errback(error);
							}
						} else {
							r.callback();
						}
					}
				}

				this.transaction(function(tx) {
					for(var k in generators) {
						generators[k].initialize(tx).
							addCallback(done, function(err) {
								errors.push(err);
								done();
							});
					}
				});

				done();

				return r;
			},

			/**
			 *
			 * @param type
			 */
			getGeneratorClassName: function(type) {
				var name = this.getClass().getName().split("/");
				name.pop();
				name.push("generator/" + type);
				return name.join("/");
			},

			/**
			 *
			 * @param instance
			 * @param attribute
			 * @returns
			 */
			generateId: function(instance, attribute, preferred) {
				var key = instance.getPreferredKey();
				if(key === null) {
					var generator = this._generators[attribute.type];
					if(generator === undefined) {
						throw new Error(String.format("No generator available for attribute type %s", attribute.type));
					}
					key = generator.generate(instance, attribute);
				}
				if(preferred === true) {
					instance.setPreferredKey(key);
				} else {
					instance.setKey(key);
				}
				//console.log(String.format("generateId %s for %n", key, instance), js.cs());
				return key;
			},

			/**
			 *
			 * @param method
			 * @param args
			 */
			delay: function(method, args) {
				//0 && console.log("delaying " + method, js.cs());

				var thisObj = this;
				var r = new Deferred();

				this._opened.addCallbacks(
					function() {
						//0 && console.log("delayed ok open");
						thisObj[method].apply(thisObj, args).addCallbacks(
							function(res) {
								//0 && console.log("delayed " + method + " ok", res);
								r.callback(res);
							},
							function(err) {
								//0 && console.log("delayed " + method + " err", err);
								r.errback(err);
							});
					},
					function(err) {
						//0 && console.log("delayed " + method + " err open");
						r.errback(err);
					});

				return r;
			},

			/**
			 *
			 * @param {Boolean} recreate When {true} the tables are recreated
			 */
			open: function(recreate) {
				if(this._opened === null) {
					var thisObj = this;
					var r = (this._opened = new Deferred());

					Database.open(this._unit, recreate).
						addCallback(function(res) {
							thisObj._db = res;
							thisObj.delay = null;
							thisObj.instantiateGenerators().
								addCallback(function(res) {
									r.callback();
								}).
								addErrback(function(err) {
									r.errback(err);
								});
						}).
						addErrback(function(error) {
							if(error.db !== undefined) {
								thisObj._db = error.db;
							}
							r.errback(error);
						});
				}

				return this._opened;
			},

			/**
			 *
			 * @returns {Boolean}
			 */
			isOpening: function() {
				return this._opened !== null && this._opened.fired === -1;
			},

			/**
			 *
			 */
			recreate: function() {
				if(this._db === null) {
					if(this._opened !== null) {
						var thisObj = this;
						var r = new Deferred();

						this._opened.
							addCallback(function(res) {
								thisObj.recreate().
									addCallback(function(res) {
										r.callback(res);
										return res;
									}).
									addErrback(function(err) {
										r.errback(err);
										return err;
									});

								return res;
							}).
							addErrback(function(err) {
								r.errback(err);
								return err;
							});

						return r;
					}
					return this.open(true);
				}
				return Database.checkTables(this._db, this._unit, true);
			},

			/**
			 *
			 */
			alter: function(changes) {
				return Database.alterTables(this._db, this._unit, changes);
			},

			/**
			 *
			 */
			persist: function(instance) {
				var r = new Deferred();
				var entity = instance._entity;
				var table = entity._def.tableName;
				var key = instance._key;
				var insert = key === null;
				var columns;

				if(insert === true) {
					columns = "*";
				} else {
					columns = js.keys(instance.getDirtyObject()).join(",");
				}

				if(columns.length > 0) {
					var keyName = entity.getKeyName();
					var keyAttr = entity.getAttribute(keyName);
					var keyColumn = keyAttr.columnName || keyName;
					var thisObj = this;

					columns = entity.getColumns(columns);

					for(var i = 0; i < columns.length;) {
						var column = columns[i];
						var value = instance._object[column.attributeName]; // bypass getter
						if(value !== undefined) {
							if(value instanceof Instance) {
								if(!value.isManaged()) {
									value = value.getPreferredKey();
									if(value === null) {
										throw new Error(String.format("Entity %n is not managed (%n.%s)",
												value, instance, column.attributeName));
									}
								} else {
									value = value.getKey();
								}
								if(column.attribute.entity !== undefined) {
									column.attribute = column.attribute.entity.getAttribute(
											column.attribute.entity.getKeyName());
								}
							}
							column.value = value;
							i++;
						} else {
							columns.splice(i, 1);
						}
					}

					if(insert === true) {
						this.generateId(instance, keyAttr);
						columns.push({
							columnName: keyColumn,
							attributeName: keyName,
							attribute: keyAttr,
							value: instance._key});

						thisObj.insert(table, columns).addCallbacks(
							function(res) {
								thisObj.inserted(instance);
								instance._preferredKey = null;
								instance._dirty = {};
								r.callback(res);
							},
							function(error) {
								r.errback(error);
							});
					} else {
						var where = {
								columnName: keyColumn,
								attributeName: keyName,
								attribute: keyAttr,
								value: instance._key};
						this.update(table, columns, where).addCallbacks(function(res) {
							thisObj.updated(instance);
							instance._dirty = {};
							r.callback(res);
						}, function(error) {
							r.errback(error);
						});
					}
				} else {
					r.callback("not dirty");
				}

				return r;
			},

			/**
			 *
			 */
			remove: function(instance) {
				if(instance._key === null) {
					return;
				}

				var r = new Deferred();
				var entity = instance._entity;
				var table = entity._def.tableName;
				var keyName = entity.getKeyName();
				var keyAttr = entity.getAttribute(keyName);
				var keyColumn = keyAttr.columnName || keyName;
				var thisObj = this;

				var where = {
						columnName: keyColumn,
						attributeName: keyName,
						attribute: keyAttr,
						value: instance._key};

				this['delete'](table, where).addCallbacks(function(res) {
					thisObj.removed(instance);
					r.callback(res);
				}, function(error) {
					r.errback(error);
				});

				return r;
			},

			/**
			 *
			 * @param f
			 * @returns
			 */
			transaction: function(f) {
				var thisObj = this;

				if(this.delay !== null) {

					//0 && console.log("transaction", this._opened);

					if(this._opened === null) {
						this.open();//throw new Error("Not open");
					}
					return this._opened.addCallback(function() {
						thisObj.transaction(f);
					});
				}

				//var rollback = new Error("forcing rollback");
				if(this._tx === null) {
					this._db.transaction(function(tx) {

						thisObj._tx = {

							_tx: tx,

							/**
							 *
							 */
							executeSql: function(sql, params, result, error) {
								//console.log(sql, params);
								return this._tx.executeSql(sql, params,
									function(tx, r) {
										thisObj.executed(sql, params, r);
										if(typeof result === "function") {
											result.apply(window, [tx, r]);
										}
									},
									function(tx, e) {
										e.sql = sql;
										e.params = params;
										thisObj.errornous(sql, params, e);
										if(typeof error === "function") {
											return error.apply(window, [tx, e]);
										} else {
											console.error("Tx rollback", e);
											return true;
										}
									});
							}
						};

						try {
							f(thisObj._tx);
						} catch(e) {
							tx.executeSql("RAISE AN EXCEPTION SO THAT TX IS ROLLBACKED", [], null, function() {
								return true;
							});

							console.error("Tx rollack", e);
						} finally {
							thisObj._tx = null;
						}
					});
				} else {
					f(thisObj._tx);
				}
			},

			/**
			 *
			 * @param table
			 * @param columns
			 * @param where
			 * @returns
			 */
			select: function(table, columns, where) {
				if(this.delay !== null) {
					return this.delay("select", arguments);
				}

				var r = new Deferred();
				var me = Database;
				var columnNames = [];

				var clause = [];
				var params = [];
				var i;

				for(i = 0; i < where.length; ++i) {
					clause.push(String.format("%s = ?", me.escape(where[i].columnName)));
					params.push(me.js2db(where[i].value));
				}

				table = me.escape(table);
				for(i = 0; i < columns.length; ++i) {
					columnNames.push(me.escape(columns[i].columnName));
				}

				var sql = String.format("SELECT %s FROM %s WHERE (%s)", columnNames.join(", "), table, clause.join(" AND "));
				this.transaction(function(tx) {
					tx.executeSql(sql, params, function(tx, result) {
						var arr = [];
						for(var i = 0, l = result.rows.length; i < l; ++i) {
							arr.push(result.rows.item(i));
						}
						r.callback(arr);
					}, function(tx, error) {
						r.errback(error);
						return true;
					});
				});

				return r;
			},

			/**
			 *
			 * @param table
			 * @param columns
			 * @returns
			 */
			insert: function(table, columns) {
				if(this.delay !== null) {
					return this.delay("insert", arguments);
				}

				var r = new Deferred();
				var me = Database;
				var columnNames = [];
				var column;
				var values = [];

				table = me.escape(table);

				for(var i = 0; i < columns.length; ++i) {
					column = columns[i];
					columnNames.push(me.escape(column.columnName));
					values.push(column.value === null ? "null" : "?");
				}

				var sql = String.format("INSERT INTO %s (%s) VALUES (%s)", table, columnNames.join(", "), values.join(", "));
				var params = [];
				for(i = 0; i < columns.length; ++i) {
					column = columns[i];
					if(column.value !== null) {
						params.push(me.js2db(column.value));
					}
				}

				this.transaction(function(tx) {
					tx.executeSql(sql, params, function(tx, result) {
						r.callback(result);
					}, function(tx, error) {
						r.errback(error);
						return true;
					});
				});

				return r;
			},

			/**
			 *
			 * @param table
			 * @param columns
			 * @param where
			 * @returns
			 */
			update: function(table, columns, where) {
				if(this.delay !== null) {
					return this.delay("update", arguments);
				}

				var r = new Deferred();
				var me = Database;
				var setters = [];
				var column;
				var value;
				var params = [];

				table = me.escape(table);
				where.columnName = me.escape(where.columnName);
				for(var i = 0; i < columns.length; ++i) {
					column = columns[i];
					value = column.value === null ? "null" : "?";
					setters.push(String.format("%s = %s", me.escape(columns[i].columnName), value));
					if(column.value !== null) {
						params.push(me.js2db(column.value, column.attribute));
					}
				}

				var sql = String.format("UPDATE %s SET %s WHERE %s = ?", table, setters.join(", "), where.columnName);
				params.push(me.js2db(where.value, where.attribute));

				this.transaction(function(tx) {
					tx.executeSql(sql, params, function(tx, result) {
						r.callback(result);
					}, function(tx, error) {
						r.errback(error);
						return true;
					});
				});

				return r;
			},

			/**
			 *
			 * @param table
			 * @param where
			 * @returns
			 */
			'delete': function(table, where) {
				if(this.delay !== null) {
					return this.delay("delete", arguments);
				}

				var r = new Deferred();
				var me = Database;

				table = me.escape(table);
				where.columnName = me.escape(where.columnName);

				var sql = String.format("DELETE FROM %s WHERE %s = ?", table, where.columnName);

				this.transaction(function(tx) {
					tx.executeSql(sql, [me.js2db(where.value, where.attribute)],
						function(tx, result) {
							r.callback(result);
						},
						function(tx, error) {
							r.errback(error);
							return true;
						});
				});

				return r;
			},

			/**
			 *
			 * @param obj
			 * @returns
			 */
			pql2sql: function(obj) {
				var me = Database;
				var select = obj.select;
				var from = obj.from;
				var criteria = [];

				/**
				 *
				 * @param entity
				 * @return
				 */
				function getKeyColumnName(entity) {
					return entity.getKeyColumn().columnName;
				}

				/**
				 *
				 * @param entity
				 */
				function getKeyAttribute(entity) {
					return entity.getKey();
				}

				/**
				 *
				 * @param entity
				 * @param attribute
				 * @return
				 */
				function getColumnName(entity, attribute) {
					var attr = entity.getAttribute(attribute);
					if(attr.entity !== undefined) {
						return entity.getAttribute(attr.attribute).columnName || attr.attribute;
					}
					return attr.columnName || attribute;
				}

				/**
				 *
				 * @param path
				 * @return
				 */
				function getAlias(path) {
					var items = from.items || from;
					for(var i = 0; i < items.length; ++i) {
						if(items[i].path === path) {
							return items[i].alias;
						}
					}
					//0 && console.log("ERROR", {path: path, items: items});
					throw new Error(String.format("Internal error; path %s not found", path));
				}

				/**
				 *
				 * @return
				 */
				function parseFrom() {
					var sql = [];
					for (var i = 0; i < from.length; ++i) {
						var item = from[i];
						var def = item.entity.getDefinition();
						var path = item.path;
						var entity;
						var pk, fk;

						if (i === 0) {
							sql.push(String.format("%s %s", me.escape(def.tableName), item.alias));
						} else {
							path = path.split(".");
							entity = item.entity;
							sql.push(item.type.toUpperCase());
							sql.push(String.format("%s %s", me.escape(item.attribute.entity._def.tableName), item.alias));
							if(item.type !== ",") {
								sql.push("ON");
								if(item.attribute.isOneToMany === true) {
									pk = getKeyColumnName(entity);
									fk = getColumnName(item.attribute.entity, item.attribute.attribute);
									sql.push(String.format("%s.%s = %s.%s", path[0], pk, item.alias, fk));
								} else if(item.attribute.attribute === undefined) {
									pk = getKeyColumnName(entity);
									fk = getKeyColumnName(item.attribute.entity);
									sql.push(String.format("%s.%s = %s.%s", path[0], pk, item.alias, fk));
								} else {
									pk = getKeyColumnName(item.attribute.entity);
									fk = getColumnName(entity, item.attribute.attribute);
									sql.push(String.format("%s.%s = %s.%s", path[0], fk, item.alias, pk));
								}
							}
						}
					}
					obj.from = from = {items: from, sql: sql.join(" ")};
				}

				/**
				 *
				 * @return
				 */
				function parseSelect() {

					var columns = [];
					var attributes = [];

					/**
					 *
					 * @param entity
					 * @param alias
					 * @return
					 */
					function addColumns(entity, alias, onlyKey) {
						var colName;

						if(onlyKey !== true) {
							var cols = entity.getColumns("*");
							for(var i = 0; i < cols.length; ++i) {
								colName = String.format("%s.%s", alias, cols[i].columnName);
								if(columns.indexOf(colName) === -1) {
									columns.push(colName);
									if(cols[i].attribute.entity !== undefined) {
										var attr = cols[i].attribute.attribute;
										if(attr !== undefined) {
											attributes.push({def: entity.getAttribute(attr), name: cols[i].attributeName});
										} else {
											// one-to-one relationship
											//attributes.push({def: getKeyAttribute(entity), name: cols[i].attributeName});
										}
									} else {
										attributes.push({def: cols[i].attribute, name: cols[i].attributeName});
									}
								}
							}
						}

						colName = String.format("%s.%s", alias, getKeyColumnName(entity));
						if(columns.indexOf(colName) === -1) {
							columns.push(colName);
							attributes.push({def: entity.getKey(), name: entity.getKeyName()});
						}
					}

					/**
					 *
					 * @param entity
					 * @param name
					 * @return
					 */
					function addColumn(alias, name) {
						var colName = String.format("%s.%s", alias, name);
						if(columns.indexOf(colName) === -1) {
							columns.push(colName);
							return true;
						}
						return false;
					}

					select = select.split(",");

					var agg;
					for(var i = 0; i < select.length; ++i) {
						var s = select[i];
						var entity;
						var attribute;
						var name;

						agg = undefined;

						if(s.indexOf("(") !== -1) {
							agg = s.split("(")[0];
							s = s.split("(")[1].split(")")[0].split(" ").pop();
						}

						s = s.split(".");

						entity = obj.aliases[s[0]];

						if(entity === undefined) {
							// FIXME no entity, is, error?!
							console.warn("not sure why this happens", js.cs());
							entity = obj.from.items[0].entity;
							s = [obj.from.items[0].alias];
						}

						if(s.length === 1) {
							if(agg === undefined) {
								// select key attribute of an entity (may be local or many-to-one)
								addColumns(entity, s[0], true);
							} else {
								name = select[i].replace(String.format("%s)", s), String.format("%s.%s)", s, getKeyColumnName(entity)));
								if(columns.indexOf(name) === -1) {
									columns.push(name);
									// TODO
									attributes.push({aggFunc: agg, def: {type: "Integer"}, name: select[i]});
								}
							}
						} else {
							// get the attribute to select
							attribute = entity.getAttribute(s[1]);
							if(attribute.entity !== undefined) {
								if(agg === undefined) {
									// select the key value of an entity attribute
									if(addColumn(s[0], getColumnName(entity, attribute.attribute))) {
										attributes.push({def: attribute, name: s[1]});
									}
									//0 && console.log("???", {a: attribute, e: entity, cn: getColumnName(entity, attribute.attribute)});
								} else {
									// TODO avg(contracts.credit.amount)?

									console.log("FIXME ??? 3 " + s);
								}
							} else {
								if(agg === undefined) {
									// select single 'normal' attribute
									if(addColumn(s[0], attribute.columnName || s[1]) === true) {
										attributes.push({def: attribute, name: s[1]});
									}
								} else {
									name = select[i];
									if(columns.indexOf(name) === -1) {
										columns.push(name);
										attributes.push({aggFunc: agg, def: attribute,
											name: String.format("%s(%s)", agg, s.join("."))});
									}
								}
							}
						}
					}

					obj.select = select = {attributes: attributes, columns: columns, org: select};
				}

				/**
				 *
				 */
				function parseWhere() {
					if(obj.where !== "") {
						var match;
						var index;
						var length;
						var where_ = obj.where;
						var new_where = "";
						var entity;
						var k, re;

						// replace attribute name with column names
						while( (match=/[^\s(]*\.[^\s.]*/.exec(where_)) !== null) {
							index = match.index;
							length = match[0].length;
							match = match[0].split(".");
							entity = obj.aliases[match[0]];
							new_where += where_.substring(0, index);
							new_where += String.format("%s.%s", match[0], getColumnName(entity, match[1]));
							where_ = where_.substring(index - (-length));
						}

						new_where += where_;

						/*
						 * Substitute alias names which are not followed by a dot, with the correct key field addressing.
						 * Typically these situations come forth out of something like;
						 *
						 *		../Persistence.query(X, "count(distinct Y)", "where . = ?", [ instance of X ]);
						 *
						 * FIXME Need to figure out how to match begin-of-string OR whitespaces (and viceversa for
						 * end-of-string...). So I have simply added a whitespace in front and at the back.
						 * Though I am wondering whether there will always be whitespaces around the alias names. Probably not,
						 * so we actually have to check for non alias characters and bos/eos as delimiters (sigh)
						 *
						 */
						new_where = String.format(" %s ", new_where);

						for(k in obj.aliases) {
							entity = obj.aliases[k];
							re = new RegExp("\\s" + k + "\\s", "g");
							new_where = new_where.replace(re, String.format(" %s.%s ", k, getKeyColumnName(entity)));
						}
						criteria.push("WHERE " + new_where);
					}
				}

				/**
				 *
				 */
				function parseGroupBy() {
					if(obj.groupBy !== "") {
						var arr = obj.groupBy.split(",");
						for(var i = 0; i < arr.length; ++i) {
							var o = arr[i];
							if(o.indexOf(".") === -1) {
								arr[i] += String.format(".%s", getKeyColumnName(obj.aliases[o]));
							} else {
								o = o.split(".");
								arr[i] = String.format("%s.%s", o[0], getColumnName(obj.aliases[o[0]], o[1]));
							}
						}
						criteria.push(String.format("GROUP BY %s", arr.join(",")));
					}
				}

				/**
				 *
				 */
				function parseHaving() {
					if(obj.having !== "") {
						var match;
						var index;
						var length;
						var having_ = obj.having;
						var new_having = "";
						var entity;

						while( (match =/(\w+[0-9]+)[^\.][\s\)]*/.exec(having_)) !== null) {
							index = match.index;
							length = match[1].length;
							match = match[1];
							entity = obj.aliases[match];
							new_having += having_.substring(0, index);
							new_having += String.format("%s.%s", match, getKeyColumnName(entity));
							having_ = having_.substring(index - (-length));
						}

						having_ = new_having + having_;
						new_having = "";

						while( (match=/[^\s.\(]*\.[^\s.\)]*/.exec(having_)) !== null) {
							index = match.index;
							length = match[0].length;
							match = match[0].split(".");
							entity = obj.aliases[match[0]];
							new_having += having_.substring(0, index);
							new_having += String.format("%s.%s", match[0], getColumnName(entity, match[1]));
							having_ = having_.substring(index - (-length));
						}

						new_having += having_;
						criteria.push("HAVING " + new_having);
					}
				}

				/**
				 *
				 */
				function parseOrderBy() {
					if(obj.orderBy !== "") {
						var arr = obj.orderBy.split(",");
						for(var i = 0; i < arr.length; ++i) {
							var o = arr[i];
							if(o.indexOf(".") === -1) {
								arr[i] += String.format(".%s", getKeyColumnName(obj.aliases[o]));
							} else {
								o = o.split(".");
								o[1] = o[1].split(" ");
								var cn = o[1].shift();
								arr[i] = String.format("%s.%s%s", o[0], getColumnName(obj.aliases[o[0]], cn), o[1].length > 0 ? (" " + o[1].join(" ")) : "");
							}
						}
						criteria.push(String.format("ORDER BY %s", arr.join(",")));
					}
				}

				parseFrom();
				parseSelect();
				parseWhere();
				parseGroupBy();
				parseHaving();
				parseOrderBy();

				var cols = [];
				for(var i = 0; i < select.columns.length; ++i) {
					if(select.columns[i].indexOf("(") === -1) {
						cols.push(String.format("%s %s", select.columns[i], select.columns[i].split(".").join("_")));
					} else {
						cols.push(select.columns[i]);
					}
				}

				//0 && console.log(String.format("SELECT\n\t%s\nFROM\n\t%s %s", cols.join(",\n\t"), from.sql, criteria.join(" ")));
				return String.format("SELECT%s %s FROM %s %s", obj.distinct === true ? " DISTINCT" : "",
						cols.join(","), from.sql, criteria.join(" "));
			},

			/**
			 *
			 */
			errornous: function(sql, params, error) {
				//console.error({sql: sql, params: params}, error);
				console.error(error);
			},

			/**
			 *
			 */
			executed: function(sql, params, result) {
				console.log({sql: sql, params: params}, result);
			},

			/**
			 *
			 */
			inserted: function(instance) {
			},

			/**
			 *
			 */
			updated: function(instance) {
			},

			/**
			 *
			 */
			removed: function(instance) {
			}
		},

		Statics: {

			_cache: {},

			/**
			 *
			 */
			columnDefinitions: {
				"Integer":		"integer",
				"SmallInt":		"integer",
				"Money":		"decimal",
				"BigDecimal":	"decimal",
				"Double":		"double",
				"Float":		"float",
				"Boolean":		"integer",
				"Memo":			"longvarchar",
				"Char":			"varchar(1)",
				"String":		"varchar(%d)",
				"UString":		"varchar(%d)",
				"HexaQuad":		"varchar(%d)",
				"Timestamp":	"timestamp",
				"DateTime":		"timestamp",
				"Created":		"timestamp",
				"Modified":		"timestamp",
				"Image":		"blob",
				
				"string": 		"varchar(%d)",
				"integer":		"integer",
				"money":		"decimal",
				"float":		"float",
				"double":		"double",
				"boolean":		"integer",
				"text":			"longvarchar",
				"timestamp":	"timestamp",
				"geometry":		"longvarchar"
			},

			/**
			 *
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
			 */
			escape: function(s) {
				return String.format("\"%s\"", s);
			},

			/**
			 *
			 */
			js2db: function(value, attribute) {
				if(attribute !== undefined && value !== null && value instanceof Instance) {
					value = value.getKey();
					attribute = attribute.entity.getAttribute(attribute.entity.getKeyName());
				} else if(value instanceof Instance) {
					value = value.getKey();
				}
				return value;
			},

			/**
			 *
			 */
			db2js: function(v, attribute) {
				if(v !== null) {
					switch(attribute.type) {
						case "Integer":
							break;

						case "Created":
						case "Modified":
						case "DateTime":
						case "Timestamp":
							v = new Date(v);
							break;
					}
				}
				return v;
			},

			/**
			 *
			 */
			open: function(unit, recreate) {
				var r = new Deferred();

				var me = Database;
				var name = unit.getName();
				var MAX_SIZE = 1024 * 1024 * 10; // 10 MB
				var db = this._cache[name];

				if(db === undefined) {
					db = this._cache[name] = openDatabase(name, "1", name, MAX_SIZE);
					//0 && console.log("checking tables", js.cs());
					me.checkTables(db, unit, recreate).
						addCallback(function(result) {
							//0 && console.log("checked tables", js.cs());
							r.callback(db);
						}).
						addErrback(function(err) {
							//0 && console.log("checked tables - error", js.cs());
							r.errback(js.mixIn(err, {db: db}));
						});
				} else {
					r.callback(db);
				}

				return r;
			},

			/**
			 *
			 */
			checkTables:function(db, unit, recreate) {
				var r = new Deferred();

				var me = Database;
				//var statements = [];
				var entities = unit.getEntities();
				var error = new Error(String.format("checkTables for persistence unit %s failed with multiple errors",
						unit.getName()));
				var errors = (error.errors = []);

				if(entities.length === 0) {
					// nothing to do
					r.callback();
					return;
				}

				/**
				 *
				 */
				function keysToColumnNames(keys) {
					var names = [];
					for(var k in keys) {
						var key = keys[k];
						names.push({name: key.columnName || k, keyIndex: key.keyIndex || 0});
					}
					names = names.sort(function(i1, i2) {
						return i1.keyIndex < i2.keyIndex;
					});
					for(var i = 0; i < names.length; ++i) {
						names[i] = names[i].name;
					}
					return names;
				}

				/**
				 *
				 */
				function getTableName(entity) {
					return entity.getDefinition().tableName || entity.getName();
				}

				/**
				 *
				 */
				function done() {
					if(errors.length > 0) {
						r.errback(error);
					} else {
						r.callback();
					}
				}

				/**
				 *
				 */
				db.transaction(function(tx) {

					/**
					 *
					 */
					function dropAll(callback) {
						var count = entities.length;
						entities.forEach(function(entity) {
							(function(sql) {
								tx.executeSql(sql, [],
									function(tx, result) {
										if(--count === 0) {
											callback();
										}
									},
									function(tx, error) {
										error.sql = sql;
										errors.push(error);
										if(--count === 0) {
											callback();
										}
									});
							})(String.format("DROP TABLE IF EXISTS %s", me.escape(getTableName(entity))));
						});
					}

					/**
					 *
					 */
					function createAll(callback) {
						var count = entities.length;
						entities.forEach(function(entity) {
							var def = entity.getDefinition();
							var keys = [entity.getKeyColumn().columnName];
							var sql = [];

							for(var a in def.attributes) {
								var attr = def.attributes[a];
								sql.push(String.format("\t%s %s%s", me.escape(attr.columnName || a),
										me.getColumnDefinition(attr), attr.isNullable === false ? " not null" : ""));
							}

							if(keys.length > 0) {
								sql.push(String.format("\tPRIMARY KEY(%s)", keys.join(",")));
							}
							sql = String.format("CREATE TABLE IF NOT EXISTS %s(\n\t%s\n)", def.tableName, sql.join(",\n\t"));

							(function(sql) {
								tx.executeSql(sql, [], function(tx, result) {
									if(--count === 0) {
										callback();
									}
								},
								function(tx, error) {
									error.sql = sql;
									errors.push(error);
									if(--count === 0) {
										callback();
									}
								});
							})(sql);
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
						// use the stackTrace of error because this exception occurs within a callback
						// r.callback(new Error("checkTables failed", e, error.stackTrace));
						r.callback(e);
					}
				});

				return r;
			},

			/**
			 *
			 */
			alterTables:function(db, unit, changes) {
				var me = Database;

				var r = new Deferred();
				var errors = [];

				/**
				 *
				 */
				db.transaction(function(tx) {

					var executeSql = tx.executeSql;
					tx.executeSql = function(sql) {
						console.log("Executing: " + sql);
						executeSql.apply(this, arguments);
					};

					for(var k in changes) {
						var info = changes[k];
						var attributes;
						var entity = unit.getEntity(k);
						var tableName = entity.getDefinition().tableName;

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
								var sql = String.format("ALTER TABLE %s ADD %s %s %s", tableName, me.escape(columnName),
										me.getColumnDefinition(attr), attr.isNullable === false ? " NOT NULL" : "");

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

					tx.executeSql("to_rollback_or_not_to_rollback", [], function() {}, function(tx, error) {
						if(errors.length === 0) {
							console.log("All good");
							r.callback();
						} else {
							if(errors.length === 1) {
								r.errback(errors.pop());
							} else {
								var e = new Error("Multiple errors");
								e.errors = errors;
								r.errback(e);
							}

							// Rollback!
							return true;
						}
					});
				});

				return r;
			}
		}
	});

	return Database;

});