define(function(require) {
	
	/*- 2018-01-20: Added queueing of pages so that last pages are served first */

    var Query = require("js/defineClass");
	var Type = require("js/Type");
	var Method = require("js/Method");
	var Source = require("../../data/Source");
	var SourceEvent = require("../../data/SourceEvent");
	var EM = require("../../entities/EM");
	var Array = require("../data/Array");
	var NativeArray = ([]).constructor;
	
	var WAITING = {};

    return (Query = Query(require, {
    	inherits: Array,
    	prototype: {
    		_autoRequest: true,
    		_attributes: "",
    		_entity: "",
    		_where: null,
    		_groupBy: "",
    		_having: null,
    		_orderBy: "",
    		_parameters: null,
    		_limit: 100,
    		_count: true,
    		_onGetRequestCriteria: null,

    		_layoutChanged: false,
    		_request: null,
    		_pageReqs: null,
    		_pageQueue: null,
    		_monitors: null,
    		_tuples: null,

    		_servlet: "",

			constructor: function() {
				this._monitors = [];
				this._pageReqs = [];
			},
			loaded: function() {
			/** @overrides ../vcl/Compopnent.prototype.loaded */
				return this.inherited(arguments);
			},
			getSize: function() {
			/** @overrides ../data/Source.prototype.getSize */
				this.requestWhenNeeded();
				return this.inherited(arguments);
			},
			getLoaded: function() {
				var loaded = 0;
				(this._arr || []).forEach(function(o) {
					if(o !== Source.Pending) loaded++;
				});
				return loaded;
			},
			isLoaded: function() {
				return this.getLoaded() === this.getSize();
			},
			isActive: function(doNotRequest) {
			/** @overrides ../data/Source.prototype.isActive */
				!!doNotRequest && this.requestWhenNeeded();
				return this.isValid() && this.inherited(arguments);
			},
			isBusy: function() {
			/** @overrides ../data/Source.prototype.isBusy */
				return this._request !== null || this.getWaitingPages().length > 0;
			},
			getWaitingPages: function() {
				var r = [];
				for(var k in this._pageReqs) {
					var obj = this._pageReqs[k];
					if(obj === WAITING || (obj && obj.fired === -1)) {
						r.push(k);
					}
				}
				return r;
			},
			getObject: function(index) {
				/** @overrides ../data/Source.prototype.getObject */
				if(this._useTuplesInsteadOfArray) {
					this.assertArray(index);
					return this._tuples[index || 0];
				}
				return this.inherited(arguments);
			},
			getObjects: function(start, end) {
			/** @overrides ../data/Source.prototype.getObjects */
				// // console.debug(this._entity, "getObjects", start, end);
				
				/*- round limits */
				var startPage = parseInt(start / this._limit, 10);
				var endPage = parseInt(end / this._limit + 0.5, 10);
				
				while(startPage <= endPage) {
					// console.debug(this._entity, "getObjects: page", startPage, "needed");
					this.requestPage(startPage++); 
				}

				return this.inherited(arguments);
			},
			getMonitor: function(start, end) {
			/** @implements Source.prototype.getMonitor */
				if(!this.isValid()) {
					throw new Error("Can not deliver monitor now");
				}

	// TODO reuse code from org.cavalion.persistence.ResultList
	// create class org.cavalion.data.SourceMonitor, maybe SourceMonitor can have a destroy mechanism in itself

				var monitor = {
					start: start,
					end: end,
					source: this,
					objs: [],

					notifyEvent: function(that, args) {
						if(this.process !== undefined) {
							setTimeout(this.process.bind(this, that, args), 0);
						}
					}
				};
				this._monitors.push(monitor);

				var objs = this._arr;
				for(var i = start; i <= end; ++i) {
					var obj = objs[i];
					if(obj !== Source.Pending) {
						// TODO hook to get the actual instances (namePath - 1)
					}
				}
				return monitor;
			},
			releaseMonitor: function(monitor) {
			/**
			 * @see org.cavalion.data.Source.prototype.releaseMonitor
			 */
				var index = this._monitors.indexOf(monitor);
				if(index === -1) {
					throw new Error("Unknown monitor");
				}
				this._monitors.splice(index, 1);
				for(var i = 0, l = monitor.objs.length; i < l; ++i) {
					Method.disconnect(monitor.objs[i], "notifyEvent", monitor, "notifyEvent");
				}
			},
			requestWhenNeeded: function() {
				if(this.isValid() && this._arr === null) {
					this.requestPage(0);
				}
			},
			isValid: function() {
				if(this.isLoading()) { return false; }
				
				if(this._entity !== "") {
					if(this._layoutChanged === true) {
						delete this._layoutChanged;
						this.notify(SourceEvent.layoutChanged);
					}
				}

				return this._entity !== "";
			},
			getEM: function() {
				return EM;
			},
			getRequestCriteria: function(page) {
				var criteria = {
					count: this._count === true && this._arr === null,
					start: page * this._limit,
					limit: this._limit
				};
				if(this._where !== null) {
					criteria.where = EM.eb.where(
							this._where, this._parameters, this, []);
				}
				if(this._groupBy !== "") {
					criteria.groupBy = this._groupBy.split(",");
				}
				if(this._having !== null) {
					criteria.having = this._having;
				}
				if(this._orderBy !== "") {
					criteria.orderBy = this._orderBy.split(",");
				}
				
				if(this.hasOwnProperty("_onGetRequestCriteria")) {
					criteria = this.fire("onGetRequestCriteria", [criteria, page]);
				}
				
				return criteria;
			},
			requestPage: function(page, wasBusy_) {
			    var me = this, criteria, wasBusy = wasBusy_ || this.isBusy();
			    if(this._pageReqs[page] !== undefined) {
			    	var index;
			    	if(this._pageQueue && (index = this._pageQueue.indexOf(page)) !== -1) {
			    		if(index !== this._pageQueue.length - 1) {
				    		this._pageQueue.splice(index, 1);
				    		this._pageQueue.push(page);
							console.debug(this._entity, "requestPage: page", page, "to front of queue");
			    		}
			    	}
			    	return;
			    }
			    
			    /*- make sure additional requests for 'page' are ignored */
			    this._pageReqs[page] = WAITING;
			    if((criteria = this.getRequestCriteria(page)) === null) {
					console.debug(this._entity, "requestPage: page", page, "no criteria, skip");
					
					delete me._pageReqs[page];
			    	return;
			    }

			    if(this._request !== null) {
					console.debug(this._entity, "requestPage: page", page, "queued");
					if(this._pageQueue === null) {
						this._pageQueue = [];
					}
					
					this._pageQueue.push(page);
			    	this._request.then(function() {
			    		var page = me._pageQueue.pop();
						console.debug(me._entity, "popping page", page);
						
						delete me._pageReqs[page]; /* delete WAITING tag */
			    		me.requestPage(page, true); /*- make sure that we remain busy */
			    	});
			    	return;
			    }
			    
			    var EM = this.getEM();
			    /*- hold a reference to the current request and index by page */
			    this._pageReqs[page] = (this._request = 
			    	EM.query(
				    	criteria.entity || this._entity, 
				    	criteria.attributes || this._attributes, 
				    	criteria
				    ).then(function(res) {
						/*- if this response does not belong to the current request */
						if(me._request !== me._pageReqs[page]) {
							console.debug(me._entity, "requestPage: page", page, "receveid, but IGNORED");
							/* ...it should be ignored */
							return res;
						}
						
			        	delete me._request;
						if(res instanceof Error) {
							console.error(me._entity, "requestPage: page", page, "error received", err);
						} else {
							console.debug(me._entity, "requestPage: page", page, "received", {res: res});
						}
						me.processResult(res, page, criteria);
						
						if(!me.isBusy()) {
							me.notifyEvent(SourceEvent.busyChanged, false, page);
						}
						return res;
					}));
				
				console.debug(this._entity, "requestPage: page", page, "missile away - waiting for response");
				if(!wasBusy) {
					this.notify(SourceEvent.busyChanged, true, page);
				}
			},
			getAttributeValue: function(name, index) {
				/** @overrides ../data/Source.prototype.getAttributeValue */
				
				var instance, value;
				if(this._useTuplesInsteadOfArray) {
					var obj = this.getObject(index);
					index = this._attributes.split(",").indexOf(name);
					value = obj[index];
				} else {
					instance = this.getObject(index);
					if(instance === Source.Pending) {
						return instance;
					}
					value = (name === "." ? instance : instance.getAttributeValue(name));
				}
				if(this._onGetAttributeValue !== null) {
					value = this.fire("onGetAttributeValue", [name, index, value]);
				}
				return value;
			},
			setAttributeValue: function(name, value, index) {
			/**
			 * @overrides ../data/Source.prototype.setAttributeValue
			 */
				var instance = this.getObject(index);
				return instance.setAttributeValue(name, value);
			},
			getAttributeNames: function() {
				/**
				 * @overrides ../data/Source.prototype.getAttributeNames
				 */
				if(this._attributes instanceof NativeArray) {
					return this._attributes.map(function(attr) {
						/* returns the alias of the attribute or the attribute itself*/
						return attr.split(" ").pop();
					});
				}
				return this._attributes !== "" ? this._attributes.split(",") : [];
			},
			processResult: function(res, page, criteria) {
				var instances = res.instances;
				var tuples = res.tuples;
				var size = instances.length;
				var base = page * this._limit;
				
				// console.trace("processResult", res, base);

				if(res.names !== undefined) {
					this._attributes = res.names.join(",");
					this.notify(SourceEvent.layoutChanged);
				}

				if(this._arr === null) {
					if(!res.hasOwnProperty("count")) {
						if(this._count === false && page === 0 && res.instances.length === 0) {
							res.count = 0;
						} else {
							res.count = this.estimateCount(res.instances);
						}
					} else if(res.count > res.instances.length && page === 0) {
						//res.count = res.instances.length;
					}
					while(instances.length < res.count) {
						instances.push(Source.Pending);
						tuples.push(Source.Pending);
					}
					this._tuples = tuples;
					this.setArray(instances);
				} else {
					for(var i = 0; i < size; ++i) {
						this._array[i + base] = instances[i];
						this._tuples[i + base] = tuples[i];
					}
					this.updateFilter(false);
					this.notify(SourceEvent.updated, {start: base, end: base + size - 1});
				}
			},
			estimateCount: function(arr) {
				return arr.length;
			},
			refresh: function(size) {
				var wasActive = this.isActive(false);
				if(size === undefined) {
					this._arr = null;
					this._tuples = null;
				} else {
					this._tuples = [];
					while(size--) {
						this._tuples.push(Source.Pending);
					}
					this._arr = [].concat(this._tuples);
				}
				this._array = [];
				this._pageReqs = [];
				// FIXME #175 How to cancel current request?
				delete this._request;

				wasActive && this.notify("activeChanged", false);

				this.notify("changed");
				this.notify("layoutChanged");
				this.requestWhenNeeded();
			},
			setAll: function(entity, attributes, where, groupBy, having, orderBy, count, refresh /*refresh and count default to true*/) {
				// console.debug("setAll");
				if(this._request !== null) {
					var me = this;
					// console.debug(this._entity, "waiting for current request to finish");
					this._request.then(function(res) {
						me.setAll(entity, attributes, where, groupBy, having, orderBy);
						return res;
					}.bind(this));
				} else {
					this._attributes = attributes;
					this._entity = entity;
					if(where) {
						this._where = where;
					} else {
						delete this._where;
					}
					if(groupBy) {
						this._groupBy = groupBy;
					} else {
						delete this._groupBy;
					}
					if(having) {
						this._having = having;
					} else {
						delete this._having;
					}
					if(orderBy) {
						this._orderBy = orderBy;
					} else {
						delete this._orderBy;
					}
					if(count !== undefined) {
						this._count = count;
					} else {
						this._count = true;
					}
					if(refresh !== false) {
						this.refresh();
					}
				}
			},
			setAttributes: function(value) {
				if(this._attributes !== value) {
					this._attributes = value;
					if(this.isLoading()) {
						this._layoutChanged = true;
					} else {
						this.notify(SourceEvent.layoutChanged);
						this.notify(SourceEvent.changed);
					}
				}
			},
			setCount: function(value) {
				this._count = value === true;
			},
			setEntity: function(value) {
				if(this._entity !== value) {
					this._entity = value;
					if(this.isLoading()) {
						//this._changed = true;
					} else {
						this.notify(SourceEvent.changed);
					}
				}
			},
			setWhere: function(value) {
				if(this._where !== value) {
					this._where = value;
					this.notify(SourceEvent.changed);
				}
			},
			setGroupBy: function(value) {
				if(this._groupBy !== value) {
					this._groupBy = value;
					this.notify(SourceEvent.changed);
				}
			},
			setHaving: function(value) {
				if(this._having !== value) {
					this._having = value;
					this.notify(SourceEvent.changed);
				}
			},
			setOrderBy: function(value) {
				if(this._orderBy !== value) {
					this._orderBy = value;
					this.notify(SourceEvent.changed);
				}
			},
			setParameters: function(value) {
				if(this._parameters !== value) {
					this._parameters = value;
					this.notify(SourceEvent.changed);
				}
			},
			
			assign: function(query) {
				var wasActive = this.isActive();
				var wasActiveQ = query.isActive();
console.debug(this.hashCode(), "<--", query.hashCode());				
				if(query.constructor !== this.constructor) {
					throw new Error("Must be instance of exactly " + 
						js.nameOf(this.constructor));
				}
				
				var keys = "_attributes,_entity,_where,_groupBy,_having,_orderBy,_parameters,_limit,_count,_onGetRequestCriteria,_layoutChanged,_request,_pageReqs,_monitors,_servlet,_arr,_array".split(",");
				
				keys.forEach(function(key) {
					this[key] = query[key];
				}, this);
				
				wasActive && this.notify("activeChanged", false);
				this.notify("changed");
				this.notify("layoutChanged");
				
				query._array = [];
				query._arr = null;
				query._pageReqs = [];
				
				wasActiveQ && query.notify("activeChanged", false);
				query.notify("changed");
				query.notify("layoutChanged");
			}
    	},
    	properties: {
    		"servlet": {
    			type: Type.STRING
    		},
    		"attributes": {
    			type: Type.STRING,
    			set: Function
    		},
    		"entity": {
    			type: Type.STRING
    		},
    		"where": {
    			type: Type.OBJECT
    		},
    		"parameters": {
    			type: Type.OBJECT
    		},
    		"groupBy": {
    			type: Type.STRING
    		},
    		"having": {
    			type: Type.OBJECT
    		},
    		"orderBy": {
    			type: Type.STRING
    		},
    		"limit": {
    			/*- DEPRECATED */
    			type: Type.INTEGER
    		},
    		"pageSize": {
    			type: Type.INTEGER,
    			set: function(value) {
    				this._limit = value;
    			}
    		},
    		"count": {
    			type: Type.BOOLEAN
    		},
    		"onGetRequestCriteria": {
    			type: Type.EVENT,
    			f: function(page, criteria) {
    				/*	This method provides an interface to dynamically determine the request criteria, based upon for example user input. This method must return a criteria object. The function receives the criteria as they are currently indicated by its properties. Return null to prevent the request from going out.
    				*/
    			}
    		}
    	}
    }));

});