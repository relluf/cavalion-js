define(["require", "js/defineClass"], function(require, Url) {
	return (Url = Url(require, {
		prototype: {
			_strUrl: "",
			_query: null,
			_params: [], // careful prototype value
			_names: [], // careful prototype value
			_hash: null,
			constructor: function(strUrl) {
				if(strUrl === undefined) {
					strUrl = window.location.toString();
				}

				this._strUrl = (strUrl = strUrl.split("#"))[0];
				if(strUrl.length > 1) {
					this._hash = strUrl[1];
				}
				if(this._strUrl.indexOf("?") !== -1) {
					this._query = this._strUrl.substring(this._strUrl.indexOf("?") + 1);
					this.parseParams();
				}
			},
			parseParams: function() {
				var query = this._query.split("&");
				var part;
				var name, value;

				this._params = [];
				this._names = [];

				for(var i = 0, l = query.length; i < l; ++i) {
					part = query[i].split("=");
					if(part.length === 1) {
						name = "";
						value = window.unescape(part[0]);
					} else {
						name = window.unescape(part[0]);
						value = window.unescape(part[1]);
					}
					this._params.push({
						name: name,
						value: value
					});
					if(this._names.indexOf(name) === -1) {
						this._names.push(name);
					}
				}
			},
			getAuthority: function() {
				if(this._authority === undefined) {
					this._authority = this._strUrl.split("/");
					this._authority.shift();
					while(this._authority[0] !== undefined && this._authority[0].length === 0) {
						this._authority.shift();
					}
					this._authority = this._authority[0];
				}
				return this._authority;
			},
			getProtocol: function() {
				if(this._protocol === undefined) {
					this._protocol = this._strUrl.split(":")[0];
				}
				return this._protocol;
			},
			getPort: function() {
				return parseInt(this.getAuthority().split(":")[1] || 80, 10);
			},
			getHost: function() {
				return this.getAuthority().split(":")[0];
			},
			getPath: function() {
				if(this._path === undefined) {
					this._path = this._strUrl.split("/");
					this._path.shift();
					while(this._path[0] !== undefined && this._path[0].length === 0) {
						this._path.shift();
					}
					this._path.shift();
					this._path = this._path.join("/");
				}
				return this._path;
			},
			getQuery: function() {
				return this._query;
			},
			getFileName: function() {
			},
			getRef: function() {
				return this.getHash();
			},
			getHash: function() {
				return this._hash;
			},
			getParamValue: function(name) {
				if(this._params !== null) {
					for(var i = 0, l = this._params.length; i < l; ++i) {
						if(this._params[i].name === name) {
							return this._params[i].value;
						}
					}
				}
			},
			getParamValues: function(name) {
				var r = [];
				if(this._params !== null) {
					for(var i = 0, l = this._params.length; i < l; ++i) {
						if(name === undefined || this._params[i].name === name) {
							r.push(this._params[i].value);
						}
					}
				}
				return r;
			},
			getParamNames: function() {
				return this._names;
			},
			hasParam: function(name) {
				return this._names.indexOf(name) !== -1;
			}
		},
		statics: {
			toUrlParamValueFactories: {},
			obj2qs: function (obj, include_q) {
			/**
			 * Converts the keys and values of an object to a query string which can be used in a url
			 *
			 * @param obj
			 * @returns
			 */
			    var str = [];
			    for (var k in obj) {
			    	var v = obj[k];

//			    	if(v instanceof js.lang.Object) {
//			    		v = this.toUrlParamValue(v, v.getClass());
//			    	}

			        if (v !== undefined) {
			            str.push(String.format("%s=%s",
			            		window.escape(k).replace(/\+/g, "%2B"),
			            		("" + window.escape(v)).replace(/\+/g, "%2B")));
			        }
			    }
			    
			    if(include_q === true && str.length) {
			    	return "?" + str.join("&");
			    }
			    
			    return str.join("&");
			},
			registerToUrlParamValueFactory: function(cls, f) {
				if(Class.isConstructor(cls)) {
					cls = Class.byConstructor(cls);
				}
				this.toUrlParamValueFactories[cls.getName()] = f;
			},
			toUrlParamValue: function(object, cls) {
			/**
			 *
			 * @param object
			 */
				var f = this.toUrlParamValueFactories[cls.getName()], spr;
				if(f !== undefined) {
					return f(object);
				} else if((spr = cls.getSuperClass()) !== undefined) {
					return this.toUrlParamValue(object, spr);
				}
				return object;
			}
		}
	}));
});