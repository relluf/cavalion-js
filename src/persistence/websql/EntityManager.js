define(function(require) {

	var ns = require("namespace!.");
	var js = require("js");
	var Deferred = require("js/util/Deferred");

	var Base = require("../EntityManager");
	var QueryBuilder = require("../QueryBuilder");
	var ResultList = require("../ResultList");
	var Persistence = require("../Persistence");

	var Query = require("./Query");

	var EntityManager = ns.Constructor.define("./EntityManager", {

		Extends: Base,

		/**
		 *
		 * @param unit
		 * @param session
		 * @param database
		 */
		EntityManager: function(unit, session, database) {
			this._database = database;
		},

		Prototype: {
			_database: null,

			/**
			 * @overrides ../EntityManager
			 */
			_createQuery: function(pql) {
				return new Query(this, pql);
			},

			/**
			 * @overrides ../EntityManager.prototype._find
			 */
			_find: function(entity, key, attributes) {
				var names = [entity.getKeyName()];
				var fetch_attributes;
				var params = [key];

				if(attributes !== undefined && attributes !== "." && attributes !== "*") {
					var obj = this._selectOrFetch(entity, attributes);
					attributes = obj.select;
					if(obj.fetch !== undefined) {
						fetch_attributes = obj.fetch;
					}
				}

				var criteria = String.format("where (%s = ?)", names.join(" = ? and "));
				return this._query(entity, attributes, criteria, params, fetch_attributes).
					addCallback(function(result) {
						var size = result.getSize();
						if(size === 1) {
							return result.getObject(0)['.'];
						} else if(size === 0) {
							return null;
						} else {
							throw new Error("Too many results");
						}
					});
			},

			/**
			 * @overrides ../EntityManager.prototype._query
			 */
			_query: function(entity, attributes, criteria, parameters, fetch_attributes) {
				// criteria AND parameters are optional
				if(typeof criteria === "object") {
					fetch_attributes = criteria;
					criteria = undefined;
				}

				var r = new Deferred();

				if(attributes === undefined) {
					attributes = "*";
				}

				var qb = new QueryBuilder(entity, attributes, criteria);
				var qry = this.createQuery(qb.getPql());
				var thisObj = this;

				if(parameters instanceof Array) {
					for(var i = 0; i < parameters.length; ++i) {
						qry.setParameter(i + 1, parameters[i]);
					}
				}

				// convert string to local attributes to be fetched
				if(typeof fetch_attributes === "string") {
					fetch_attributes = {'.': fetch_attributes};
				}

				var error = new Error("Multiple errors");
				var errors = (error.errors = []);

				qry.getResultList().
					addCallback(function(result) {
						var count;

						/**
						 *
						 */
						function done() {
							if(--count === 0) {
								if(errors.length > 1) {
									r.errback(error);
								} else if(errors.length === 1) {
									r.errback(errors[0]);
								} else {
									r.callback(result);
								}
							}
						}

						/**
						 *
						 */
						function f(entity, str) {
							var obj = {}, key, o2ms = entity.getOneToManyAttributes();
							str.split(",").forEach(function(s) {
								s = s.split(".");
								key = s.shift();
								if(o2ms[key] === undefined) {
									throw new Error(String.format("%s is not an one-to-many relationship of %s",
											key, entity.getQName()));
								}
								// in case of empty string, select .
								(obj[key] = obj[key] || []).push(s.join(".") || ".");
							});
							return obj;
						}

						/**
						 *
						 */
						function request(instance, attr, o2m, where, sf) {
							// count the number of requests
							count++;
							thisObj.query(attr.entity, sf.select, where, [instance.getKey()], sf.fetch).addCallbacks(
								function(res) {
									var arr = [];
									for(var i = 0, s = res.getSize(); i < s; ++i) {
										arr.push(res.getAttributeValue(".", i));
									}
									instance.setAttributeValue(o2m, arr);
									done();
									return res;
								},
								function(err) {
									errors.push(err);
									done();
								});
						}

						result = thisObj.processQueryResult(result, qb);
						if(result.getSize() > 0 && fetch_attributes !== undefined) {
							// make sure we wait (library might become synchronized)
							count = 1;
							// for each instance...
							result._objs.forEach(function(object) {
								// for each part to fetch
								for(var k in fetch_attributes) {
									var instance = object[k];
									if(instance !== null) {
										var entity = instance.getEntity();
										var obj = f(entity, fetch_attributes[k]);

										for(var o2m in obj) {
											var attr = entity.getAttribute(o2m);
											var where = String.format("where %s = ?", attr.attribute);
											var sf = thisObj._selectOrFetch(attr.entity, obj[o2m].join(","));
											request(instance, attr, o2m, where, sf);
										}
									}
								}
							}, this);

							// count was initialized at 1, so call done at least once
							done();

						} else {
							r.callback(result);
						}
					}).
					addErrback(function(error) {
						r.errback(error);
					});

				return r;
			},

			/**
			 * @overrides ../EntityManager.prototype._commit
			 */
			_commit: function(tx) {
				var r = new Deferred();
				var errors = [];
				var count = 1;
				var work = tx.getWork();

				/**
				 *
				 */
				function done() {
					if(errors.length > 0) {
						r.errback(new Error(String.format("%d errors", errors.length), errors));
					} else {
						r.callback();
					}
				}

				/**
				 *
				 * @param res
				 */
				function result(res) {
					if(--count === 0) {
						done();
					}
				}

				/**
				 *
				 * @param err
				 */
				function error(err) {
					errors.push(err);
					if(--count === 0) {
						done();
					}
				}

				var db = this._database;
				db.transaction(function() {

					// Generate all key values so that all instances are managed and thus are able to refer to each other
					work.forEach(function(item) {
						if(item.type === "p" && item.instance._key === null) {
							var entity = item.instance.getEntity();
							var keyName = entity.getKeyName();
							var keyAttr = entity.getAttribute(keyName);
							db.generateId(item.instance, keyAttr, true);
						}
					});

					work.forEach(function(item) {
						count++;
						try {
							if(item.type === "p") {
								db.persist(item.instance).addCallbacks(result, error);
							} else {
								db.remove(item.instance).addCallbacks(result, error);
							}
						} catch(e) {
							error(e);
						}
					});

					// initialized at 1, decrement count at least once
					if(--count === 0) {
						done();
					}
				});

				return r;
			},

			/**
			 *
			 * @param entity
			 * @param attributes
			 */
			_selectOrFetch: function(entity, attributes) {
				var fetch_attributes = [];
				var attrs;

				// TODO get rid of duplicates in attributes (or throw)
				attributes = attributes.split(",");
				for(var i = 0; i < attributes.length;) {
					// remove leading or trailing whitespaces
					attributes[i] = String.trim(attributes[i]);

					if(attributes[i] === ".") {
						i++;
					} else {
						if(attributes[i].indexOf("*") !== -1) {
							attrs = entity.getAttributes(attributes[i]);

							var keys = js.keys(attrs);
							// many-to-one would return at least 2 attributes (or the entity has no attributes which is weird)
							if(keys.length === 1) {
								// attribute can not be selected with joins
								fetch_attributes.push(attributes.splice(i, 1)[0]);
							} else {
								// move one-to-many attributes to fetch
								for(var k = 0; k < keys.length;) {
									if(attrs[keys[k]].isOneToMany === true) {
										fetch_attributes.push(keys.splice(k, 1)[0]);
									} else {
										k++;
									}
								}

								if(keys.length > 0) {
									// replace attributes[i] with all attributes and increment i accordingly
									attributes.splice.apply(attributes, [i, 1].concat(keys));
									i += keys.length;
								}
							}
						} else {
							attrs = entity.getAttributes("**");
							// lookup attribute
							var attr = attrs[attributes[i]] || entity.getAttribute(attributes[i]);
							// attribute is valid,  otherwise an exception would've been thrown
							// but it might be undefined, which means that it can't be selected directly

							if(attr !== undefined && attr.entity !== undefined) {
								if(attr.isOneToMany !== true) {
									// attribute represents an instance (m2o attribute), do nothing
								} else {
									// attribute represents o2m attribute
									attr = undefined;
								}
							}

							if(attr === undefined) {
								// attribute can not be selected with joins, fetch it
								fetch_attributes.push(attributes.splice(i, 1)[0]);
							} else {
								// attribute can be selected with joins
								i++;
							}
						}
					}
				}

				return {
					select: attributes.join(",") || ".",
					fetch: fetch_attributes.length > 0 ? fetch_attributes.join(",") : undefined
				};
			},

			/**
			 *
			 * @param result
			 * @param qb
			 * @returns {ResultList}
			 */
			processQueryResult: function(result, qb) {
				var keys = qb._keys;
				var entity = qb._entity;
				var newKeys = {};
				var singleKey;
				var m2o_keys = js.keys(entity.getManyToOneAttributes());
				var o2m_keys = js.keys(entity.getOneToManyAttributes());
				var i;

				// create some handy objects needed to place values in the right spot
				for(i = 0; i < keys.length; ++i) {
					var ar = qb._aliases_rev[keys[i]];
					keys[i] = {
							from: keys[i],
							to: ar.path,
							key: ar.entity.getKeyName(),
							entity: ar.entity,
							m2o: ar.entity.getManyToOneAttributes()
					};
				}

				// sort the keys, local instance (.) should be handled first, followed by the shortest paths
				keys = keys.sort(function(k1, k2) {
					if(k1.to === ".") {
						return -1;
					}
					if(k2.to === ".") {
						return 1;
					}
					return k1.to < k2.to ? -1 : 1;
				});

				var obj1, obj2;
				var k, nk, v, attributeName, keyValue;

				for(i = 0; i < result.length; ++i) {
					obj1 = result[i];
					if(keys.length > 0) {
						obj2 = {};
						for(k = 0; k < keys.length; ++k) {
							var key = keys[k];
							var obj = obj1[key.from];
							keyValue = obj[key.key];
							delete obj[key.key];

							(function(/*key, obj, qb*/) {
								var v;
								for(var m in key.m2o) {
									var m2o = key.m2o[m];
									v = obj[m];
									if(v !== undefined) {
										obj[m] = v !== null ? Persistence.processInstance(m2o.entity, v, {}) : null;
									}
								}

								var alias = qb._aliases[key.to];
								for(var k in alias.references) {
									if(obj[k] !== undefined) {
										var r = alias.references[k];
										v = obj[k];
										if(v !== null) {
											v = Persistence.processInstance(this._unit.getEntity(r.ecn), v);
										}
										obj[r.name] = v;
										delete obj[k];
									}
								}
							}).apply(this, [/*key, obj, qb*/]);

							obj2[key.to] = keyValue !== null ? Persistence.processInstance(key.entity,
									keyValue, obj1[key.from]) : null;
							delete obj1[key.from];

							if(key.to !== "." && obj2['.'] !== undefined) {
								if(key.m2o_keys === undefined) {
									key.m2o_keys = js.keys(key.m2o);
								}
								attributeName = key.to.split(".")[0];
								if(m2o_keys.indexOf(attributeName) !== -1) {
									if(obj2[key.to] !== null) {
										//console.log(String.format("pqr - set %s", key.to), {'.': obj2['.'], value: obj2[key.to]});
										var attr = obj2['.']._entity.getAttribute(key.to);
										if(attr.isOneToMany) {
											v = obj2['.'].getAttributeValue(key.to) || [];
											if(v.indexOf(obj2[key.to]) === -1) {
												v.push(obj2[key.to]);											
											}
										} else {
											v = obj2[key.to];
										}
										obj2['.'].setAttributeValue(key.to, v, undefined, true);
									}
								} else if(o2m_keys.indexOf(attributeName) !== -1) {
									// get current array
									v = obj2['.'].getAttributeValue(attributeName) || [];
									if(v.indexOf(obj2[key.to]) === -1) {
										if(obj2[key.to] !== null) {
											// do not push a null value (left outer join resulted in nothing)
											v.push(obj2[key.to]);
										}
										obj2['.'].setAttributeValue(attributeName, v);
									}
									//console.log("pqr - should set o2m", {key: key, obj2: obj2, obj: obj, m2o_keys: m2o_keys});
								} else {
									//console.log("pqr - not set1", {key: key, obj2: obj2, obj: obj, m2o_keys: m2o_keys});
								}
							} else {
								//console.log("pqr - not set2", {key: key, obj2: obj2, obj: obj});
							}
						}

						for(k in obj1) {
							nk = newKeys[k];
							if(nk === undefined) {
								if(k.indexOf("(") !== -1) {
									if(k.indexOf("count(") !== -1) {
										nk = k.split("(")[1].split(")")[0].split(" ").pop();
										nk = newKeys[k] = k.replace(nk, qb._aliases_rev[nk].path);
									} else {
										nk = k.split("(")[1].split(")")[0].split(".").shift();
										nk = newKeys[k] = k.replace(nk, qb._aliases_rev[nk].path);
									}
								} else {
									//nk = newKeys[k] = qb._aliases_rev[k].path;
									console.log("FIXME ??? 1 " + k);
								}
							}
							obj2[nk] = obj1[k];
							delete obj1[k];
						}
						js.mixIn(obj1, obj2);
					} else {
						// FIXME
						// This is FAR from correct, but works in the one case I have encountered (need to impl) so far
						if(qb._select.length === 1 && qb._select[0].indexOf("count(") === 0) {
							obj2 = {};
							for(k in obj1) {
								nk = newKeys[k];
								if(nk === undefined) {
									if(k.indexOf("(") !== -1) {
										if(k.indexOf("count(") !== -1) {
											nk = k.split("(")[1].split(")")[0].split(" ").pop();
											nk = newKeys[k] = k.replace(nk, qb._aliases_rev[nk].path);
										} else {
											nk = k.split("(")[1].split(")")[0].split(".").shift();
											nk = newKeys[k] = k.replace(nk, qb._aliases_rev[nk].path);
										}
									}
								}
								if(nk === undefined) {
									console.log("FIXME ??? 2");
								}
								obj2[nk] = obj1[k];
								delete obj1[k];
							}
							js.mixIn(obj1, obj2);
						} else {
							if(singleKey === undefined) {
								singleKey = {
									key: js.keys(result[i])[0],
									keyName: entity.getKeyName(),
									m2o: entity.getManyToOneAttributes()
								};
							}
							js.mixIn(obj1, obj1[singleKey.key]);
							delete obj1[singleKey.key];

							for(var m in singleKey.m2o) {
								m2o = singleKey.m2o[m];
								v = obj1[m];
								if(v !== undefined) {
									obj1[m] = v !== null ? Persistence.processInstance(m2o.entity, v, {}) : null;
								}
							}

							keyValue = obj1[singleKey.keyName];
							delete obj1[singleKey.keyName];

							result[i] = Persistence.processInstance(entity, keyValue, obj1);
						}
					}
				}

				return new ResultList(result);
			},

			/**
			 *
			 */
			getDatabase: function() {
				return this._database;
			}
		}

	});

	return EntityManager;

});