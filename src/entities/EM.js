define(function(require) {

	var Command = require("../util/Command");
	var ExpressionBuilder = require("./ExpressionBuilder");
	var Instance = require("./Instance");
	var ajax = require("jquery").ajax;

	var IS_KEYFIELD_REGEXP = /\.id$/;
	
	function getViewData(from, attributes, criteria) {
		/*- Copy the criteria object */
    	var r = js.mixIn(criteria);

    	if(criteria && criteria.having) {
    		r.having = JSON.stringify(criteria.having);
    	}
    	
    	/*- Convert string usage */
    	if(criteria && typeof criteria.groupBy === "string") {
    		r.groupBy = criteria.groupBy.split(",");
    	}
    	
    	/* Convert string usage */
    	if(criteria && typeof criteria.orderBy === "string") {
    		r.orderBy = criteria.orderBy.split(",").map(function(ob) {
    			ob = ob.split(" ");
    			return { path: ob[0], type: ob[1] || "asc" };
    		});
    	}
    	
    	if(criteria && criteria.pagesize) {
    		r.page = criteria.page;
    		r.pagesize = criteria.pagesize;
    	}
    	
    	return JSON.stringify(r);
	}

	return {
		eb: ExpressionBuilder,
		prefix: "",
		
		instances: {},

		all: function(entity) {
			return entity === undefined ? Instance.all : Instance.all[entity] || [];
		},
		arrayOfAll: function(entity) {
			var all = this.all(entity);
			var arr = [];
			for(var k in all) {
				arr.push(all[k]);
			}
			return arr;
		},
		getInstance: function(entity, key) {
		/**
		 * Returns a reference to the specified entity. There is no check
		 * to see whether this instance actually exists.
		 */
			return Instance.get(entity, key);
		},
		findInstance: function(entity, f) {
			var instances = Instance.all[entity] || [];
			if(typeof f === "function") {
				for(var k in instances) {
					if(f(instances[k])) {
						return instances[k];
					}
				}
				return null;
			}
			return instances[f] || null;
		},
		getModel: function(unit, prefix) {
			unit = unit || "";
		    if(prefix === undefined && unit.indexOf("/") !== -1) {
		    	prefix = unit.split("/");
		    	unit = prefix.pop();
		    	prefix = prefix.join("/");
		    }

			if(typeof unit === "string") {
				unit = "/" + unit;
			} else {
				unit = "";
			}
			return Command.execute(String.format("%srest/entities/model%s", 
				prefix || this.prefix, unit));
		},
		commit: function(persist, remove, unit, prefix) {
			if(!(persist instanceof Array)) {
				persist = [persist];
			}

			var work = {
				persist: [],
				remove: []
			};
			var newKeys = {};

			persist && persist.forEach(function(instance) {
				var key = instance.getKey();
				if(instance.isManaged() === false) {
					newKeys[key] = instance;
				}

				var values = instance.getDirtyAttributeValues(true);
				for(var k in values) {
					if(values[k] instanceof Instance) {
						values[k] = String.format("@@%s:%s", values[k]._entity,
								values[k].getKey());
					}
				}

				work.persist.push({
					entity: instance.getEntity(),
					key: key,
					values: values
				});
			});

			remove && remove.forEach(function(instance) {
				if(instance.isManaged()) {
					work.remove.push({
						entity: instance.getEntity(),
						key: instance.getKey()
					});
				}
			});

			return Command.execute(String.format("%srest/entities/commit?unit=%s", prefix || this.prefix, unit), {}, work).
				addCallback(function(res) {
					for(var k in res) {
						var entity = newKeys[k]._entity;
						var key = res[k];
						newKeys[k].setKey(res[k]);
						Instance.all[entity] = Instance.all[entity] || {};
						Instance.all[entity][key] = newKeys[k];
					}
					return res;
				}).
				addErrback(function(err) {
					// TODO What if the commit fails, restore the dirty values?
					work.persist.forEach(function(obj, index) {
						//Instance.getInstance(obj.entity, obj.get)
						persist[index].setAttributeValues(obj.values);
					});
					return err;
				});
		},
		remove: function(instances) {
			if(!(instances instanceof Array)) {
				instances = [instances];
			}
		},
		newInstance: function(entity, values) {
			return new Instance(entity, null, values);
		},
		query: function(entity, attributes, criteria, prefix) {
		    var params = {};

		    if(prefix === undefined && entity.indexOf("/") !== -1) {
		    	prefix = entity.split("/");
		    	entity = prefix.pop();
		    	prefix = prefix.join("/");
		    }

		    if(entity.indexOf(":") !== -1) {
		        entity = entity.split(":");
		        params.unit = entity.shift();
		        entity = entity.join(":");
		    }

		    if(typeof attributes === "string") {
		    	attributes = attributes.replace(/\s/g, "").split(",");
		    }

			var req = {
				select: attributes || ["*"],
				from: [entity]
			};

			var uri = String.format("%srest/entities/query", prefix || this.prefix);
			criteria = criteria || {};

			"where,groupBy,having,orderBy,count,start,limit".split(",").forEach(function(k) {
				var value = criteria[k];
				if(typeof value === "string") {
					req[k] = value.split(",");
				} else if(criteria.hasOwnProperty(k)) {
					req[k] = value;
				}
			});

			var me = this;
			return Command.execute(uri,	params, req).addCallback(function(res) {
					me.processQueryResult(res, req, params.unit);
					return res;
				});
		},
		query_: function(entity, attributes, criteria, prefix) {
		    var params = {};

		    if(prefix === undefined && entity.indexOf("/") !== -1) {
		    	prefix = entity.split("/");
		    	entity = prefix.pop();
		    	prefix = prefix.join("/");
		    }

		    if(entity.indexOf(":") !== -1) {
		        entity = entity.split(":");
		        params.unit = entity.shift();
		        entity = entity.join(":");
		    }
		    
        	var d = new Deferred();
		    ajax({
		        url: String.format("%srest/entities/%s", prefix || this.prefix, entity),
		        method: "GET",
		        contentType: "application/json",
		        data: getViewData(from, attributes, criteria),
		        success: function (res) {
					me.processQueryResult(res, req, params.unit);
					d.callback(res);
		        },
		        error: function (res) {
		            d.errback(res);
		        }
		    });
		    return d;
		},
		processQueryResult: function(res, req, namespace) {
			if(res.names !== undefined) {
				req.select = res.names;
			}

			var paths = [];
			var l = req.select.length;

			if(namespace !== undefined && res.types !== undefined) {
				for(var i = l; i < res.types.length; ++i) {
					res.types[i] = String.format("%s:%s",
							namespace, res.types[i]);
				}
			}

			/*- Gather all paths. A path leads to a joined entity
			 * (eg. locatie.onderzoeken.meetpunten) */
			req.select.forEach(function(namePath, i) {
				if(namePath.indexOf(":") === -1) {
					var names = namePath.split(".");
					names.pop(); namePath = [];
					names.forEach(function(name) {
						namePath.push(name);
						if(paths.indexOf(namePath.join(".")) === -1) {
							paths.push(namePath.join("."));
						}
					});
				}
			});

			res.instances = [];

			/*- For each tuple... */
			res.tuples.forEach(function(tuple, index) {
				var obj = {};
				for(var i = 0; i < l; ++i) {
					/*- ...create (nested) objects and set their values */
					if(tuple[i] !== null && res.types[i] === "timestamp") {
						tuple[i] = new Date(tuple[i]);
					}
					/*- When a key attribute instance is referenced do nothing, the reference will
					 * be picked later. Reference instances by addressing it's keyfield. (id) */
					if(!IS_KEYFIELD_REGEXP.test(req.select[i])) {
						js.set(req.select[i], tuple[i], obj);
					}
				}

				/*- Now iterate the paths, updating references to real Instance's.
				 * Reverse order, so that the outer most nested objects of obj will
				 * be set first. */
				for(var i = paths.length - 1; i >= 0; --i) {
					var instance = tuple[i + l + 1];
					if(instance !== null) {
						instance = Instance.get(res.types[i + l + 1], instance);
						//console.log("setting", paths[i],instance,  "to", js.get(paths[i], obj));
						instance.setAttributeValues(js.get(paths[i], obj), true);

						/*- Nicely store the instance in the tuple, ie. replace the key value by a real instance */
						tuple[i + l + 1] = instance;

						/*- Update reference obj[~paths[i]~] -> instance */
						js.set(paths[i], instance, obj);
					}
				}

				/*- obj is now ready to set at the root instance */
				res.instances.push(tuple[l] = Instance.get(res.types[l], tuple[l]));
				tuple[l].setAttributeValues(obj, true);
			});
		},
		processWalkResult: function(result) {
			result.objs.forEach(obj => {
				for(var k in obj) {
					if(obj[k] instanceof Array) {
						if(obj[k].length > 0) {
							var elem0 = obj[k][0];
							if(elem0 instanceof Array) {
								// resolve all references
								obj[k] = obj[k].map(_ => result.objs[_]);
							} else {
								// resolve single reference
								obj[k] = result.objs[elem0]
							}
						} else {
							// empty set, no change necessary
						}
					}
				}
			});
			var instances = this.instances;
			for(var entity in result.instances) {
				if(instances[entity] === undefined) {
					instances[entity] = {};
				}
				for(var key in result.instances[entity]) {
					var index = result.instances[entity][key];
					instances[entity][key] = result.objs[index];
				}
				
			}
			return result;
		}
	};

});