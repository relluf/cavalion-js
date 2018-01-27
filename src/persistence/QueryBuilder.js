/**
 * QueryBuilder.js
 */
define(function(require) {
	
	var ns = require("namespace!.");
	var js = require("js");
	
	var QueryBuilder = ns.Constructor.define("./QueryBuilder", {
		
		/**
		 * 
		 */
		QueryBuilder: function(entity, select_attributes, criteria) {
			this._entity = entity;
			this._aliases = {};
			this._aliases_rev = {};
			this._alias1 = this._aliases["."] = {
		    	name: this._entity.getName().split(".").pop().toLowerCase() + "1",
		    	entity: this._entity,
		    	path: ".",
		    	key: this._entity.getKeyName(),
		    	ecn: this._entity.getName()
		    };
		    this._joins = [];
		    this._keys = [];
			this.compile(select_attributes || "mo .", criteria || undefined);
		},
		
		Prototype: {
			_entity: null,
			_aliases: null,
			_aliases_rev: null,
			_alias1: null,
			_joins: null,
			_keys: null,
			_attributes_ex: {},
			_attributes: null,
			_pql: "",
			_tuples: null,

			// TODO find better names
			_mainEntityOnly: false,
			
			/**
			 *
			 */
			getAlias: function(namePath) {

				if(namePath.charAt(0) === ".") {
					namePath = namePath.substring(1);
				}

		        var key;
		        var name;
		        var path;
		        var prev_alias;
		        var alias = this._alias1;
		        var names = namePath.split(".");

		        if (names.length > 1) {
		            names.pop();
		            key = names.join(".");
		            if ((alias = this._aliases[key]) === undefined) {
		                path = [];
		                prev_alias = this._alias1;
		                while (names.length) {
		                    name = names.splice(0, 1)[0];
		                    path.push(name);
		                    key = path.join(".");
		                    alias = this._aliases[key];
		                    if (alias === undefined) {
						    	var def = prev_alias.entity.getDefinition();
						    	var r = def.manyToOne[name] || def.oneToMany[name] || def.oneToOne[name];
						    	if(r === undefined) {
						    		throw new Error(String.format("%s.%s is not a one-to-one, " +
						    				"many-to-one or one-to-many attribute", prev_alias.entity.getName(), name));
						    	}
		                        alias = this._aliases[key] = {
			                    	name: String.format("%s%d", name, js.keys(this._aliases).length + 1),
			                    	entity: r.entity,
			                    	path: path.join("."),
			                    	ecn: r.entity.getName(),
			                    	key: r.entity.getKeyName(),
			                    	type: def.manyToOne[name] ? "manyToOne" : def.oneToOne[name] ? 
			                    			"oneToOne" : "oneToMany"
			                    };

		                        this._joins.push(String.format("%*cleft outer join %s.%s %s", path.length + 1, "\t", 
		                        		prev_alias.name, name, alias.name));
		                    }
		                    prev_alias = alias;
		                }
		            }
		        }
		        return alias;
			},

			/**
			 *
			 */
			compile: function(attributes, criteria) {
				var i, l;
				var alias, attr, namePath, name, entity_attrs;
				
				//FIXME this function is waaaaaaaaaaaaaaay too long
			    this._select = [];
			    this._select.push = function(obj) {
			    	if(this.indexOf(obj) === -1) {
			    		return Array.prototype.push.apply(this, arguments);
			    	}
			    };

			    if((this._mainEntityOnly = attributes.indexOf("mo ") === 0) === true) {
			    	attributes = attributes.substring(3);
			    }

			    var distinct = attributes.indexOf("distinct ") === 0 ? " distinct" : "";
			    if(distinct !== "") {
			    	attributes = attributes.substring("distinct ".length);
			    }

			    // trim and handle &
			    attributes = attributes !== "" ? attributes.split(",") : [];
				for(i = 0, l = attributes.length; i < l; ++i) {
					attributes[i] = String.trim(attributes[i]);
					if(attributes[i].indexOf("&") !== -1) {
						var parts = attributes[i].split("&");
						attributes[i] = parts[0];
						parts[0] = parts[0].split(".");
						parts[0].pop();
						parts[0] = parts[0].join(".");
						for(var p = 1; p < parts.length; ++p) {
							attributes.push(String.format("%s%c%s", parts[0], parts[0].length ? "." : "", parts[p]));
						}
					}
				}

			    // attributes MUST be sorted
			    attributes = attributes.sort();

			    this._attributes_ex = {};

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
			    
			    for(i = 0; i < attributes.length; ++i) {
			        namePath = attributes[i];

			        alias = this.getAlias(namePath);
			        name = namePath.split(".").pop();
			        entity_attrs = alias.entity.getAttributes();
			        
			        if(name === "*") {
			        	namePath = namePath.split(".");
			        	namePath.pop();
			        	if(namePath.length) {
			        		namePath = namePath.join(".") + ".";
			        	} else {
			        		namePath = "";
			        	}
			        	for(var k in entity_attrs) {
			        		attr = entity_attrs[k];
			        		if(attr.entity !== undefined) {
			        			this._select.push(String.format("%s.%s", alias.name, attr.attribute));
			        			alias.references = alias.references || {};
			        			alias.references[attr.attribute] = {
			        				ecn: attr.entity.getName(),
			        				name: k
			        			};

						        this._attributes_ex[String.format("%s%s", namePath, k)] = {
						        	alias: alias,
						        	attribute: attr,
						        	queryName: String.format("%s.%s", alias.name, k)
						        };

			        		} else {
			        			this._select.push(String.format("%s.%s", alias.name, k));
						        this._attributes_ex[String.format("%s%s", namePath, k)] = {
						        	alias: alias,
						        	attribute: attr,
						        	queryName: String.format("%s.%s", alias.name, k)
						        };
			        		}
			        	}
			        } else if(namePath === ".") {
			        	/*
				        this._attributes_ex[namePath] = {
				        	alias: alias,
//				        	attribute: attr,
				        	queryName: String.format("%s", alias.name)
				        };
				        */
				        this._select.push(alias.name);
			        } else if(name !== "?" /*&& namePath !== "."*/) {
			        	attr = entity_attrs[name];
			        	if(attr === undefined) {
			        		throw new Error(String.format("%s.%s is not a valid attribute", 
			        				alias.entity.getName(), name));
			        	}
			        	if(attr.entity !== undefined) {
		        			this._select.push(String.format("%s.%s", alias.name, attr.attribute));
		        			alias.references = alias.references || {};
		        			alias.references[attr.attribute] = {
		        				ecn: attr.entity.getName(),
		        				name: name
		        			};

					        this._attributes_ex[namePath] = {
					        	alias: alias,
					        	attribute: attr,
					        	queryName: String.format("%s.%s", alias.name, name)
					        };
			        	} else {
				        	this._select.push(String.format("%s.%s", alias.name, name));
					        this._attributes_ex[namePath] = {
					        	alias: alias,
					        	attribute: attr,
					        	queryName: String.format("%s.%s", alias.name, name)
					        };
			        	}
			        } else {
	/*		        	
			        	if(this._fetch_attributes[alias.path] === undefined) {
			        		this._fetch_attributes[alias.path] = "*";
			        	}
	*/
			        	this._select.push(alias.name);
			        }
			    }

			    if(this._mainEntityOnly === false && distinct === "") {
			    	// add primary keys
				    for(k in this._aliases) {
				    	alias = this._aliases[k];
			    		this._select.push(String.format("%s.%s", alias.name, alias.key));
				    	this._keys.push(alias.name);
				    }
		    	}


			    // add functions (after keys)
			    for(i = 0; i < functions.length; ++i) {
			    	var f = functions[i];
			    	var select;
			    	if(f.func === "count") {
			    		name = String.format("%s(%s)", f.func, f.namePath);
			    		if(f.namePath.indexOf("distinct ") === 0) {
			    			f.namePath = f.namePath.split(" ")[1];
			    			f.func = "count distinct";
			    		}
			    		if(f.namePath === ".") {
			    			alias = this._alias1;
			    		} else {
			    			alias = this.getAlias(f.namePath + ".");
			    		}
			    		if(f.func === "count") {
			    			select = String.format("count(%s)", alias.name);
			    		} else {
			    			select = String.format("count(distinct %s)", alias.name);
			    		}
				    	this._attributes_ex[name] = {
				    		isAggFunc: true,
				    		queryName: select,
				    		attribute: f.namePath === "." ? null : 
				    			this._entity.getAttributes(f.namePath)[f.namePath.split(".").shift()]
				    	};
			    	} else {
			        	alias = this.getAlias(f.namePath);
			        	select = String.format("%s(%s.%s)", f.func, alias.name, f.namePath.split(".").pop());
				    	this._attributes_ex[String.format("%s(%s)", f.func, f.namePath)] = {
				    		isAggFunc: true,
				    		queryName: select
				    	};
			    	}
		        	this._select.push(select);
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
			    if(criteria !== undefined) {
			    	var cr = criteria;
			    	var escaped = cr.indexOf("@") !== -1;
			    	var keywords = QueryBuilder.KEYWORDS;
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
								new_criteria += this._alias1.name;
							} else if(m.charAt(0) !== "#") {
								alias = this.getAlias(m);

								var o2m = alias.entity.getDefinition().oneToMany;

								if(o2m !== undefined && o2m[m.split(".").pop()] !== undefined) {
									alias = this.getAlias(m + ".");
									new_criteria += alias.name;
								} else {
									new_criteria += alias.name;
									new_criteria += ".";
									new_criteria += m.split(".").pop();
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
			    }

			    // restore string literals
			    for(i = 0; i < literals.length; ++i) {
			    	var idx = criteria.indexOf(String.format("$%d", i));
			    	criteria = String.format("%s%s%s", criteria.substring(0, idx), literals[i], 
			    			criteria.substring(idx + 2));
			    }

			    // reverse index for aliases
			    for(k in this._aliases) {
			    	alias = this._aliases[k];
			    	this._aliases_rev[alias.name] = alias;
			    }

			    this._pql = String.format("select%s\n\t", distinct);
			    this._pql += this._select.join(",\n\t");
			    this._pql += String.format("\nfrom\n\t%s %s", this._entity.getName(), this._alias1.name);
			    this._pql += "\n" + this._joins.join("\n");

			    if(criteria !== undefined) {
			    	this._pql += "\n";
			    	this._pql += criteria;
			    }
			},
			
			/**
			 * 
			 */
			getPql: function() {
				return this._pql;
			},
			
			/**
			 * 
			 */
			getTuples: function() {
				if(this._tuples === null) {
					this._tuples = this._pql.replace(/^[\s]+/g, "").replace(/[\s]+/g, " ");
					if(this._tuples.indexOf("select distinct") === -1) {
						this._tuples = this._tuples.substring("select ".length);
					} else {
						this._tuples = this._tuples.substring("select distinct ".length);
					}
					this._tuples = this._tuples.substring(0, this._tuples.indexOf(" from "));
					this._tuples = this._tuples.split(",");
					for(var i = 0; i < this._tuples.length; ++i) {
						this._tuples[i] = String.trim(this._tuples[i]);
					}
				}
				return [].concat(this._tuples);
			},

			/**
			 * 
			 */
			getAliases: function() {
				return js.mixIn({'.': this._alias1.name}, this._aliases_rev);
			},
			
			/**
			 * 
			 */
			pql2obj: function() {
				return QueryBuilder.pql2obj(this._pql, this._entity.getUnit().getPackages());
			}
			
		},
	
		Statics: {

			KEYWORDS: 
					"select,distinct,from,where,and,or,like,is,in,not,null,upper,lower,substring," +
					"having,count,group,by,order,asc,desc,cast,as,integer,nocase,collate".split(","),

			/**
			 * 
			 */
			parseByCriteria: function(entity, criteria) {
				var parameters = [];
				
				/**
				 * 
				 */
				function item(attr, op, value) {
					var r;
					if(attr.indexOf("(") !== -1) {
						var s = attr.split("(");
						r = String.format("%s(%s %s ?", s[0], s[1], op);
					} else {
						if(value === null && op === "=") {
							r = String.format("%s is null", attr, op);
						} else {
							r = String.format("%s %s ?", attr, op);
						}
					}
					return r;
				}
		
				/**
				 * 
				 */
				function add(expr, attr, value, op) {
					if(value !== null && value instanceof Array) {
						var subexpr = [];
						for(var i = 0; i < value.length; ++i) {
							add(subexpr, attr, value[i]);
						}
						expr.push(String.format("(%s)", subexpr.join(" or ")));
					} else if(value !== null && typeof(value) === "object") {
						if(value.like !== undefined) {
							add(expr, attr, value.like, "like");
						} else if(value.lt !== undefined) {
							add(expr, attr, value.lt, "<");
						} else if(value.gt !== undefined) {
							add(expr, attr, value.gt, ">");
						} else if(value.lte !== undefined) {
							add(expr, attr, value.lte, "<=");
						} else if(value.gte !== undefined) {
							add(expr, attr, value.gte, ">=");
						}
					} else {
						expr.push(item(attr, op || "=", value));
						if(value !== null) {
							parameters.push(value);
						}
					}
				}
		
				/**
				 * 
				 */
				function parse(by) {
					var where = [];
					if(by instanceof Array) {
						for(var i = 0; i < by.length; ++i) {
							where.push(expr(by[i]));
						}
						where = String.format("(%s)", where.join(" or "));
					} else {
						for(var b in by) {
							add(where, b, by[b]);
						}
						if(where.length > 0) {
							where = String.format("where (%s)", where.join(" and "));
						} else {
							where = "";
						}
					}
					return where;
				}
				
				return {
					parameters: parameters,
					criteria: parse(criteria)
				};
			},
			
			/**
			 * 
			 */
			pql2obj: function(pql, packages) {
		        var select, distinct, from, where, groupBy, having, orderBy;
		        var aliases = {};
		        
		        /**
		         * 
		         * @param entity
		         * @return
		         */
				function getKeyColumnName(entity) {
					var keyName = entity.getKeyName();
					return entity.getAttribute(keyName).columnName || keyName;
				}
		
				/**
				 * 
				 * @param entity
				 * @param attribute
				 * @return
				 */
				function getColumnName(entity, attribute) {
					return entity.getAttribute(attribute).columnName || attribute;
				}
		   
		        /**
		         *
		         */
		        function parseClauses() {
		            var index, index2;
		            
		            // Reduce multiple whitespaces to single ones 
		            pql = pql.replace(/\s+/g, " ").replace(/^\s/, "").replace(/,\s/g, ",").replace(/\s,/g, ",");
		            
		            distinct = pql.indexOf("select distinct") === 0;	            
		            select = pql.substring(/select\sdistinct\s*|select\s*/.exec(pql)[0].length);
		            index = /\sfrom\s/.exec(select).index;
		            from = select.substring(index + 6);
		            select = select.substring(0, index);
		            
		            where = from.indexOf(" where ");
		            groupBy = from.indexOf(" group by ");
		            having = from.indexOf(" having ");
		            orderBy = from.indexOf(" order by ");
		
		            index2 = where !== -1 ? where : groupBy !== -1 ? groupBy : orderBy !== -1 ? orderBy : -1;
		
		            if (where === -1) {
		                where = "";
		            } else {
		                index = groupBy !== -1 ? groupBy : orderBy;
		                if (index === -1) {
		                    where = from.substring(where + 7);
		                } else {
		                    where = from.substring(where + 7, index);
		                }
		            }
		
		            if (groupBy === -1) {
		                groupBy = "";
		            } else {
		                index = having !== -1 ? having : orderBy;
		                if (index === -1) {
		                    groupBy = from.substring(groupBy + 10);
		                } else {
		                    groupBy = from.substring(groupBy + 10, index);
		                }
		            }
		
		            if (having === -1) {
		                having = "";
		            } else {
		                if (orderBy === -1) {
		                    having = from.substring(having + 8);
		                } else {
		                    having = from.substring(having + 8, orderBy);
		                }
		            }
		
		            if (orderBy === -1) {
		                orderBy = "";
		            } else {
		                orderBy = from.substring(orderBy + 10);
		            }
		
		            if (index2 !== -1) {
		                from = from.substring(0, index2);
		            }
		        }
		        
		        /**
		         * 
		         * @return
		         */
		        function parseFrom() {
		
			        /**
			         * 
			         */
			        function joinOrComma(text) {
			            var comma = text.indexOf(",");
			            var join = text.indexOf("join");
			            return comma === -1 ? "join" : join === -1 ? "comma" : comma < join ? "comma" : "join";
			        }
			        
			        var items = [];
			        var text = from;
			        var type;
			        var match;
			        
			        while ((match = /[^\s]*\s[^\s]*/.exec(text)) !== null) {
			            text = text.substring(match[0].length + 1);
			            if (type !== undefined) {
			                items.push({
			                    path: match[0].split(" ")[0],
			                    alias: match[0].split(" ")[1],
			                    type: type
			                });
			            } else {
			                items.push({
			                    path: match[0].split(" ")[0],
			                    alias: match[0].split(" ")[1]
			                });
			            }
			
			            if (joinOrComma(text) === "join") {
			                type = text.substring(0, text.indexOf("join ") + 4);
			                if (type.length > 0) {
			                    text = text.substring(type.length + 1);
			                } else {
			                    break;
			                }
			            } else {
			                type = ",";
			                text = text.substring(text.indexOf(",") + 1);
			            }
			        }
		
		            for (var i = 0; i < items.length; ++i) {
		            	var item = items[i];
		                var path = item.path;
		                var entity;
		                
		                if (i === 0) {
		                    entity = js.get(path.replace(/\//g, "."), packages);
		                    if(entity === undefined) {
		                    	throw new Error(String.format("Internal error, entity %s not available", path));
		                    }
		                    aliases[item.alias] = item.entity = entity;
		                } else {
		                    path = path.split(".");
		                    entity = aliases[path[0]];
		                    
		                    if (entity !== undefined) {
		                    	item.entity = entity;
		                        item.attribute = entity.getAttribute(path[1]);
		                        aliases[item.alias] = item.attribute.entity;
		                    } else {
		                    	throw new Error(String.format("Internal error, alias %s not found", path[0]));
		                    }
		                }
		            }
			        from = items;
		        }
		        
		        parseClauses();
		        parseFrom();
		        
		        return ({
		            select: select,
		            distinct: distinct,
		            from: from,
		            where: where,
		            groupBy: groupBy,
		            having: having,
		            orderBy: orderBy,
		            aliases: aliases
		        });
		    }
		}
	});
	
	return QueryBuilder;
});