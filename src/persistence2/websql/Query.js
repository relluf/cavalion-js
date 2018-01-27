define(function(require) {

	var ns = require("namespace!.");
	var js = require("js");

	var Deferred = require("js/util/Deferred");

	var QueryResultList = require("./QueryResultList");
	var Manager = require("../Manager");

	var Database = ns.Constructor.reference("./Database");

	var Query = ns.Constructor.define("./Query", {

		/**
		 *
		 * @param database
		 * @param entity
		 * @param attributes
		 * @param criteria
		 */
		Query: function(db, entity, attributes, criteria) {
			this._db = db;
			this._entity = entity;
			this._attributes = attributes;
			this._criteria = criteria;
		},

		Prototype: {
			_db: null,
			_entity: null,
			_attributes: null,
			_criteria: null,
			_aliases: null,
			_aliases_r: null,
			_list: null,

			/**
			 *
			 * returns {Object} or undefined
			 */
			getAttribute: function(namePath) {
				var names = namePath.split(".");
				var entity = this._entity;
				var attribute;
				while(names.length > 0) {
					var name = names.splice(0, 1)[0];
					attribute = entity.getAttribute(name);
					if(attribute === null) {
						throw new Error(String.format("Attribute %s.%s does not exist (%s.%s)",
								entity.getQName(), name, this._entity.getQName(), namePath));
					}
					if(names.length > 0) {
						if((entity = attribute.entity) === undefined) {
							throw new Error(String.format("Attribute %s.%s does not exist",
									this._entity.getQName(), namePath));
						}
					}
				}
				return attribute;
			},

			/**
			 *
			 * @param namePath
			 * @returns
			 */
			getAlias: function(namePath) {

				if(namePath.charAt(0) === ".") {
					namePath = namePath.substring(1);
				}

		        var key, name, path, alias, prev_alias, attribute;
		        var names = namePath.split(".");
		        var i = 1;

		        if(names.length > 1) {
		        	// remove attribute name
		            names.pop();
		            // get key for join/alias
		            key = names.join(".");
		            if((alias = this._aliases[key]) === undefined) {
		            	// alias doesn't exist yet
		                path = [];
		                prev_alias = this._aliases["."];
				        // walk through names
		                while(names.length) {
		                    name = names.splice(0, 1)[0];
		                    path.push(name);
		                    key = path.join(".");
		                    alias = this._aliases[key];
					    	attribute = prev_alias.entity.getAttribute(name);
					    	if(attribute === null) {
					    		throw new Error(String.format("Attribute %s.%s does not exist", this._entity.getQName(), namePath));
					    	}
		                    if (alias === undefined) {
		                        alias = this._aliases[key] = {
			                    	name: String.format("%s%d", name, js.keys(this._aliases).length + 1).toLowerCase(),
			                    	entity: attribute.link ? attribute.link.entity : attribute.entity,
			                    	path: path.join("."),
			                    	type: attribute.type,
			                    	attributes: []
			                    };
		                        if(attribute.type === "many-to-one") {
			                        this._joins.push(String.format("%*cleft outer join %s %s on (%s.%s = %s.%s)", path.length + i, "\t",
			                        		Database.getTableName(alias.entity), alias.name,
			                        		prev_alias.name, name, alias.name, Database.KEY_COLUMN_NAME));
		                        } else if(attribute.link !== undefined) {
		                        	// helper/link entity, create two joins
			                        this._joins.push(String.format("%*cleft outer join %s %s on (%s.%s = %s.%s)", path.length + i, "\t",
			                        		Database.getTableName(attribute.link.entity), alias.name, prev_alias.name, Database.KEY_COLUMN_NAME,
			                        		alias.name, attribute.link.lhs));

			                        prev_alias = alias;
			                        this._aliases[key + "_"] = this._aliases[key];
			                        alias = this._aliases[key] = {
				                    	name: String.format("%s%d", attribute.link.rhs, js.keys(this._aliases).length).toLowerCase(),
				                    	entity: attribute.entity,
				                    	path: path.join("."),
				                    	type: attribute.type,
				                    	attributes: []
			                        };

			                        i++;
			                        this._joins.push(String.format("%*cleft outer join %s %s on (%s.%s = %s.%s)", path.length + i, "\t",
			                        		Database.getTableName(attribute.entity), alias.name, prev_alias.name, attribute.link.rhs,
			                        		alias.name, Database.KEY_COLUMN_NAME));

		                        } else if(attribute.type === "one-to-many") {
			                        this._joins.push(String.format("%*cleft outer join %s %s on (%s.%s = %s.%s)", path.length + i, "\t",
			                        		Database.getTableName(entity), alias.name, prev_alias.name,
			                        		Database.KEY_COLUMN_NAME, alias.name, attribute.attribute));
		                        } else {
		                        	throw new Error(String.format("%s.%s does not identify a valid join", this._entity.getQName(), namePath));
		                        }
		                    } else if(attribute.link !== undefined) {
		                    	i++;
		                    }
		                    prev_alias = alias;
		                }
		            }
		        }
		        return alias || this._aliases["."];
			},

			/**
			 *
			 */
			compile: function() {
				this._aliases_r = {};
				this._aliases = {};
				this._aliases["."] = {
			    	name: this._entity.getLocalName().toLowerCase() + "1",
			    	entity: this._entity,
			    	path: ".",
			    	attributes: []
			    };
				this._joins = [];

				//
				this.compileAttributes();

				var select = [];
				for(k in this._aliases) {
					var alias = this._aliases[k];
					this._aliases_r[alias.name] = this._aliases[k];
					alias.attributes.forEach(function(a) {
						if(a.indexOf("|") === -1) {
							// select key of alias/joined table in case that has not been done yet, this is done so that joins which are
							// only used for aggregated functions, won't lead to the selection of it's key (and thus more rows)
							if(alias.key_selected !== true) {
								if(Database.isHelperEntity(alias.entity) === false) {
									select.push(String.format("%s.%s %s_%s",
											alias.name, Database.KEY_COLUMN_NAME,
											alias.name, Database.KEY_COLUMN_NAME));
								}
								alias.key_selected = true;
							}
							a = Database.getColumnName(alias.entity.getAttribute(a), a);
							select.push(String.format("%s.%s %s_%s", alias.name, a, alias.name, a));
						} else {
							k = a.split("|");
							if(k[0] === "count distinct") {
								select.push(String.format("count(distinct %s.%s) distinct_%s_%s", alias.name, k[1], alias.name, k[1]));
							} else {
								select.push(String.format("%s(%s.%s) %s_%s_%s", k[0], alias.name, k[1], k[0], alias.name, k[1]));
							}
						}
					});
				}

				var criteria = this.compileCriteria();
				this._sql = String.format("select\n\t%s\nfrom\n\t%s %s\n%s",
						select.join(",\n\t"), Database.getTableName(this._entity),
						this._aliases['.'].name, this._joins.join("\n"));

				this._sql += criteria;
			},

			/**
			 *
			 */
			compileAttributes: function() {
				var i, k, l;
				var alias, name, namePath;
				var attributes = this._attributes;

				if(typeof attributes === "string") {
					attributes = attributes.split(",");
					attributes.forEach(function(s, i) {
						attributes[i] = String.trim(s);
					});
				}

				// distinct query?
				var distinct = attributes[0].indexOf("distinct ") === 0 ? " distinct" : "";
			    if(distinct !== "") {
			    	attributes[0] = attributes[0].substring("distinct ".length);
			    }

			    // aggregated functions
			    var functions = [];
			    for(i = 0; i < attributes.length;) {
			        // check for function
			    	namePath = attributes[i].split("(");
			        if(namePath.length === 2 && namePath[1].indexOf(")") === namePath[1].length - 1) {
			        	functions.push({func: namePath[0].toLowerCase(), namePath: namePath[1].split(")")[0]});
			        	attributes.splice(i, 1);
			        } else {
			        	++i;
			        }
			    }

			    // expand attributes when needed
			    for(i = 0; i < attributes.length;) {
			    	namePath = attributes[i];
			    	if(namePath.indexOf("*") === namePath.length - 1) {
			    		attributes.splice(i, 1);
			    		alias = this.getAlias(namePath);
			    		l = alias.entity.getAttributes("*");
			    		namePath = namePath.substring(0, namePath.length - 2);
			    		for(k in l) {
			    			if(l[k].type !== "one-to-many" && l[k].type !== "many-to-many") {
			    				attributes.push(String.format("%s.%s", namePath, k));
			    			}
			    		}
			    	} else {
			    		i++;
			    	}
			    }

				for(i = 0, l = attributes.length; i < l; ++i) {
					namePath = String.trim(attributes[i]);
					name = namePath.split(".").pop();
					//attribute = this.getAttribute(namePath);
					alias = this.getAlias(namePath);
					if(alias.attributes.indexOf(name) === -1) {
						alias.attributes.push(name);
					}
				}

			    // add functions (after keys)
			    for(i = 0; i < functions.length; ++i) {
			    	var f = functions[i];
			    	if(f.func === "count") {
		    			name = Database.KEY_COLUMN_NAME;
			    		if(f.namePath.indexOf("distinct ") === 0) {
			    			f.namePath = f.namePath.split(" ")[1];
			    			f.func = "count distinct";
			    		}
			    		if(f.namePath === ".") {
			    			alias = this._aliases['.'];
			    		} else {
			    			alias = this.getAlias(f.namePath + ".");
			    		}
			    	} else {
						name = namePath.split(".").pop();
			        	alias = this.getAlias(f.namePath);
			    	}
		    		alias.attributes.push(String.format("%s|%s", f.func, name));
			    }

			},

			/**
			 *
			 */
			compileCriteria: function() {
				var criteria = "";

				if(typeof this._criteria.where === "string") {
					criteria = String.format("\nwhere %s", this._criteria.where);
				}

				if(typeof this._criteria.group === "string") {
					criteria += String.format("\ngroup by %s", this._criteria.group);
				}

				if(typeof this._criteria.having === "string") {
					criteria += String.format("\nhaving %s", this._criteria.having);
				}

				if(typeof this._criteria.order === "string") {
					criteria += String.format("\norder by %s", this._criteria.order);
				}

				// find and replace string literals in criteria
			    var literals = [];
			    var re = /'[^'\r\n]*'/;
			    var match;
			    while((match = re.exec(criteria)) !== null) {
			    	criteria = String.format("%s$%d%s", criteria.substring(0, match.index), literals.length,
			    			criteria.substring(match.index + match[0].length));
			    	literals.push(match[0]);
			    }

			    // add additional joins based on criteria (after keys)
		    	var cr = criteria;
		    	var escaped = cr.indexOf("@") !== -1;
		    	var keywords = Query.KEYWORDS;
		    	var start = 0;
		    	var end = 0;
		    	var new_criteria = "";

		    	// FIXME describe what this escaped does
		    	re = escaped ? /@[A-Za-z_.][A-Za-z_0-9.]*/ : /[A-Za-z_.#][A-Za-z_0-9.#]*/;

				while((match = re.exec(cr)) !== null) {
					var m = match[0];

					//end += match.index;
					end -= (-match.index);
					//cr = cr.substring(match.index + m.length);
					cr = cr.substring(match.index - (-m.length));

					if(escaped || keywords.indexOf(m) === -1) {
						new_criteria += criteria.substring(start, end);

						if(escaped === true) {
							m = m.substring(1);
							end++;
						}

						if(m === ".") {
							new_criteria += String.format("%s.%s", this._aliases['.'].name, Database.KEY_COLUMN_NAME);
						} else if(m.charAt(0) !== "#") {
							alias = this.getAlias(m);

							var attribute = alias.entity.getAttribute(m.split(".").pop());
							if(attribute !== null && (attribute.type === "one-to-many" || attribute.type === "many-to-many")) {
								alias = this.getAlias(m + ".");
								new_criteria += String.format("%s.%s", alias.name, Database.KEY_COLUMN_NAME);
							} else {
								new_criteria += String.format("%s.%s", alias.name, m.split(".").pop());
							}
						} else {
							new_criteria += m.substring(1);
						}

						//start = end + m.length;
						start = end - (-m.length);
					}
					//end += m.length;
					end -= (-m.length);
				}

				new_criteria += criteria.substring(start);
				criteria = new_criteria;

			    // restore string literals
			    for(var i = 0; i < literals.length; ++i) {
			    	var s = String.format("$%d", i);
			    	var idx = criteria.indexOf(s);
			    	criteria = String.format("%s%s%s", criteria.substring(0, idx), literals[i],
			    			criteria.substring(idx + s.length));
			    }

			    return criteria;
			},

			/**
			 *
			 * @returns {Deferred}
			 */
			getResultList: function() {
				if(this._list === null) {
					this.compile();

					var list = this._list = new Deferred();
					var thisObj = this;

					this._db.transaction(function(tx) {
						this._db.executeSql(tx, this._sql, this._criteria.parameters).
							addCallback(function(res) {
								list.callback(new QueryResultList(thisObj.process(res.res), thisObj));
							}).
							addErrback(function(err) {
								list.errback(err);
							});

					}.bind(this));
				}
				return this._list;
			},

			/**
			 *
			 * @param res
			 * @returns {Array}
			 */
			process: function(res) {
				var objs = [];
				var instance;
				for(var i = 0, l = res.rows.length; i < l; ++i) {
					var row = res.rows.item(i);
					var obj = {};

					objs.push(obj);

					for(var k in this._aliases_r) {
						var alias = this._aliases_r[k];
						if(alias.key_selected === true) {
							var nk = this._aliases[alias.path].path;
							instance = obj[nk] = Manager.getInstance(alias.entity, row[String.format("%s__id", k)], row);
						}

						alias.attributes.forEach(function(attribute) {
							var value;
							if(attribute.indexOf("|") === -1) {
								value = row[String.format("%s_%s", alias.name, attribute)];
								instance.setAttributeValue(attribute, value, {}, true);
							} else {
								attribute = attribute.split("|");
								if(attribute[0] === "count distinct") {
									value = row[String.format("distinct_%s_%s", alias.name, attribute[1])];
									obj[String.format("count(distinct %s)", alias.path !== "." ? alias.path : "")] = value;
								} else if(attribute[0] === "count") {
									value = row[String.format("count_%s_%s", alias.name, attribute[1])];
									obj[String.format("count(%s)", alias.path !== "." ? alias.path : "")] = value;
								} else {
									value = row[String.format("%s_%s_%s", attribute[0], alias.name, attribute[1])];
									obj[String.format("%s(%s%s)", attribute[0], alias.path !== "." ? alias.path : "", attribute[1])] = value;
								}
							}
						});
					}
				}
				return objs;
			}

		},

		Statics: {
			KEYWORDS:
				"select,distinct,from,where,and,or,like,is,in,not,null,upper,lower,substring," +
				"having,count,group,by,order,asc,desc,cast,as,integer,nocase,collate".split(",")
		}

	});

	return Query;

});