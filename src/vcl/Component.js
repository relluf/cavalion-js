define(function (require) {

    var Component = require("js/defineClass");
    var Type = require("js/Type");
    var Property = require("js/Property");
    var Listeners = require("./Listeners");
    var Factory = require("js/referenceClass!./Factory");
    var js = require("js");
    var mixInR = require("js/mixInRecursive");
    var query = require("./Component.query");

    var ILLEGAL_COMPONENT_NAME_CHARS = "/";
    var ILLEGAL_COMPONENT_URI_CHARS = "/";

    var all = [];

    Component = Component(require, {
        prototype: {
            // properties
            _name: "",
            _top: 0,
            _left: 0,
            _components: null,
            _owner: null,
            _uri: "",
            // runtime
            _params: null,
            _vars: null,
            _listeners: null,
            _timeouts: null,
            _loading: false,
            _designerHook: null,
            _isRoot: false,
            // events
            _onLoad: null,
            _onDestroy: null,
            _onDispatchChildEvent: null,
            _onReceiveParams: null,
            _onMessage: null,

            constructor: function (owner, uri, isRoot) {
	            /**
	             *
	             * @param owner
	             * @param uri
	             * @param isRoot
	             */
                if (owner !== undefined) {
                    this.setOwner(owner);
                }
                if (uri !== undefined) {
                    this._uri = uri;
                }
                if (isRoot) {
                    this._isRoot = isRoot;
                }
                all.push(this);
            },
            toString: function () {
	            /**
	             * @overrides Object.prototype.toString
	             */
                if (this.hasOwnProperty("_name")) {
                    return String.format("%n#%s#%d", this.constructor, this._name, this.hashCode());
                }
                return String.format("%n#%d", this.constructor, this.hashCode());
            },
            destroy: function () {
                all.splice(all.indexOf(this), 1);

                // FIXME destroying !== loading
                this.beginLoading();
                try {
                    this.dispatch("destroy");
                    this.destroyComponents();
                    this.setOwner(null);

                    this.clearTimeouts();
                } finally {
                    this.endLoading();
                }

                return this.inherited(arguments);
            },
            ondestroy: function () {
                this.fire("onDestroy", arguments);
            },
            destroyComponents: function () {
                if (this.hasOwnProperty("_components")) {
                    // avoiding a while(this._components.length > 0) {} loop
                    var comps = [].concat(this._components);
                    for (var i = 0, l = comps.length; i < l; ++i) {
                        if (comps[i]._owner === this) {
                            comps[i].destroy();
                        }
                    }
                }
            },
            dispatch: function (name, evt) {
                if (evt === undefined) {
                    evt = {
                        type: name
                    };
                }

                if (this._loading === false) {
                    var f = this["on" + name];
                    var args = js.copy_args(arguments);
                    args.shift();

                    var enabled = this.isEventEnabled(name, evt, f, args);
                    if (typeof f === "function" && enabled === true) {
                        return f.apply(this, args);
                    } else {
                        if (enabled === false) {
                            /*- might not want preventDefault? */
                            if (typeof evt.preventDefault === "function") {
                                // evt.preventDefault();
                            }
                        }
                        return false;
                    }
                }
            },
            dispatchChildEvent: function (component, name, evt, f, args) {
	            /**
	             * Returns whether the child -component- may receive the event
	             */
                if (this._onDispatchChildEvent !== null) {
                    if (this.fire("onDispatchChildEvent", arguments) === false) {
                        return false;
                    }
                }
                return true;
            },
            isEventEnabled: function (name, evt, f, args) {
	            /**
	             *
	             * @param name
	             * @param evt
	             * @param f
	             * @param args
	             * @returns
	             */
                var designer = this.getDesignerHook();
                if (designer !== null) {
                    return designer.dispatchEvent(this, name, evt, f, args);
                }
                return true;
            },
            loaded: function () {
                this.fire("onLoad", arguments);
                if (this.hasOwnProperty("_components")) {
	            	var args = js.copy_args(arguments);
                    var this_uri = this._uri;
                    this._components.forEach(function (c) {
                        c.loaded.apply(c, args);
                    });
                }
                this.emit("loaded", []);
            },
            fire: function (name, args, force, _undefined) {
	            /**
	             *
	             * @param name
	             * @param args
	             * @param force
	             * @returns
	             */
                if (force !== true && (this.isLoading() || this.isDesigning())) {
                    // do not execute event when component is being loaded or
                    // designed
                    return;
                }

                var mth, r = _undefined;
                name = "_" + name;

                if (typeof(mth = this[name]) === "function") {
                    r = mth.apply(this, args);
                }

                return r;
            },
            log: function () {
                var caller = arguments.callee.caller;
                var args = js.copy_args(arguments);
                if (caller) {
                    for (var k in this) {
                        if (this[k] === caller) {
                            if (k.indexOf("_on") === 0) {
                                k = k.substring(1);
                            }
                            args.unshift(k);
                            break;
                        }
                    }
                }
                this.bubble.apply(this, ["log", args]);
            },
            bubble: function (name, msg) {
                this.sendMessage(name, msg, this, true);
            },
            sendMessage: function (name, msg, sender, allowBubble) {
                if (this.fire("onMessage", [name, msg, sender || this, allowBubble]) === undefined) {
                    if (allowBubble !== false) {
                        return this._owner ? this._owner.sendMessage(
                        name, msg, sender || this, allowBubble) : undefined;
                    }
                }
            },
            setTimeout: function (name, f, ms, args) {
	            /**
	             * @param name Used to identify the timeout. Successive calls will cancel a previous timeout with the same name.
	             * @param f {String/Function} Identifies the function which should be called when at least ms has passed. Optional, when omitted it defaults to the same value as name. A string value to identify a member function or simply a reference to a function.
	             * @param ms {Number} Number of milliseconds
	             * @param args {Array} Array of arguments to be passed to the function.
	             * @returns The return value of js.setTimeout
	             * @seealso js.setTimeout, window.setTimeout
	             */
                var h, me = this;
                if (!this.hasOwnProperty("_timeouts")) {
                    this._timeouts = {};
                }
                
                if(typeof name === "object" && typeof name.f === "function") {
                    return this.setTimeout(name.name, name.f, name.ms, name.args);
                }

                // f is optional (where it defaults to the same value as name),
                // so in that case the arguments shift
                if (typeof f === "number") {
                    args = ms;
                    ms = f;
                    f = name;
                }
                
// console.debug("setTimeout", name, [this, arguments]);
                
                // If f turns out to be a string, assume it identifies a member
                // function of the calling Component
                if (typeof f === "string") {
                    f = this[f];
                    if (typeof f !== "function") {
                        throw new Error("Need a function");
                    }
                    // When args is not specified, simply bind the function
                    if (args === undefined) {
                        f = f.bind(this);
                    } else {
                        // ...else create a wrapper function and pass the
                        // arguments via Function.prototype.apply()
                        h = f;
                        f = function () {
                            return h.apply(me, args);
                        };
                    }
                } else if (args !== undefined) {
                    h = f;
                    f = function () {
                        return h.apply(window, args);
                    };
                }

                if (typeof f !== "function") {
                    throw new Error("Need a function");
                }

                function g() {
                    delete me._timeouts[name];
                    f();
                }

                this.clearTimeout(name);

                return (this._timeouts[name] = js.setTimeout(g, ms, this._timeouts[name]));
            },
            hasTimeout: function(name) {
            	return this._timeouts.hasOwnProperty(name);
            },
            clearTimeout: function (name) {
                if (this.hasOwnProperty("_timeouts")) {
                    var timeout = this._timeouts[name];
                    delete this._timeouts[name];
                    return js.clearTimeout(timeout);
                }
            },
            clearTimeouts: function () {
                for (var key in this._timeouts) {
                    if (this._timeouts.hasOwnProperty(key)) {
                        js.clearTimeout(this._timeouts[key]);
                    }
                }
                this._timeouts = null;
            },
            connect: function (listeners) {
                return this.on.apply(this, [listeners, true]);
            },
            disconnect: function (listeners) {
                return this.un.apply(this, arguments);
            },
            emit: function (name, args) {
	            /**
	             * Emits an event to listeners
	             */
                name = "on" + name;

                if (! (args instanceof Array) && !(args && args.callee)) {
                    // console.warn("DEPRECATED emit non-array");
                    args = js.copy_args(arguments);
                    args.shift();
                } else {
                    //console.log("emit array", args)
                }

                if (this.hasOwnProperty("_listeners")) {
                    this._listeners.call(name, args);
                }
            },
            once: function (name, f, asIs) {
                var lis = this.on(name, function () {
                    this.un(lis);
                    return f.apply(this, arguments);
                }, asIs);
                return lis;
            },
            on: function (listeners, asIs) {
	            /** @param listeners, asIs */
                if (this.hasOwnProperty("_listeners") === false) {
                    this._listeners = new Listeners(this);
                }

                if (typeof listeners === "string") {
                    /*- Parameters are: name, f, asIs */
                    var obj = {};
                    obj[listeners] = asIs;
                    listeners = obj;
                    asIs = arguments[2];
                }

                var r = {};
                for (var k in listeners) {
                    var f = listeners[k];
                    if (asIs !== true && k.substring(0, 2) !== "on") {
                        k = "on" + k;
                    }
                    r[k] = this._listeners.add(k, f);
                }
                return r;
            },
            un: function (listeners) {
	            /** @param listeners, asIs */
                if (this.hasOwnProperty("_listeners") === false) {
                    //throw new Error("No listeners");
                    console.warn("No listeners");
                    return;
                }

                if (typeof listeners === "string") {
                    // Parameters in this form are: name. f, asIs
                    var obj = {};
                    obj[listeners] = this._listeners.getListener("on" + listeners, arguments[1]);
                    listeners = obj;
                }

                for (var k in listeners) {
                    this._listeners.remove(listeners[k]);
                }

                if (Object.keys(this._listeners._listeners).length === 0) {
                    delete this._listeners;
                }
            },
            isLoading: function () {
	            /**
	             * Returns true when the component is in 'loading state'.
	             */
                return this.hasOwnProperty("_loading") || (this._owner !== null ? this._owner.isLoading() : false);
            },
            beginLoading: function () {
                if (this._loading === false) {
                    this._loading = [];
                }
                this._loading.push(Date.now());
            },
            endLoading: function () {
                if (this._loading === false) {
                    throw new Error("Not loading");
                }
                var time = this._loading.pop();
                if (this._loading.length === 0) {
                    delete this._loading;
                }
                return Date.now() - time;
            },
            isDesigning: function () {
	            /**
	             * Returns true whether the component is in 'designing state'.
	             */
                return this.getDesignerHook() !== null;
            },
            getDesignerHook: function () {
                return this._designerHook || (this._owner !== null ? this._owner.getDesignerHook() : null);
            },
            setDesignerHook: function (value) {
                if (this.isDesigning() && value !== null) {
                    throw new Error("Already designing");
                }
                this._designerHook = value;
            },
            isRootComponent: function () {
                return this._isRoot;
            },
            inheritsFrom: function (root) {
                if (!root.isRootComponent()) {
                    return false;
                }
                return this._uri !== "" && this._uri !== root.getUri();
            },
            revertPropertyValue: function (name) {
                var property = this.defineProperties()[name];
                property.set(this, this.getPropertyValue(name));
            },
            getPropertyValue: function (name) {
                return this['@properties'] ? this['@properties'][name] : undefined;
            },
            getVars: function () {
	            /**
	             * Returns the -vars- object associated with the calling component.
	             *
	             * @return Object
	             */
                if (this._vars === null) {
                    this._vars = {};
                }
                return this._vars;
            },
            setVars: function (value) {
            	if(typeof value === "string") {
            		value = js.str2obj(value);
            	}
                if (this.isLoading()) {
                    this._vars = mixInR(this._vars || {},
                    value);
                } else {
                    this._vars = value;
                }
                return this._vars;
            },
            mixInVars: function (value) {
                var vars = this.getVars();
                for (var k in value) {
                    vars[k] = value[k];
                }
                return vars;
            },
            hasVar: function (key) {
                return this._vars && this._vars.hasOwnProperty(key);
            },
            getVar: function (namePath, fallback_to_owner, defaultValue) {
                if (defaultValue) {
                    this._vars = this._vars || {};
                }

                var r = this._vars !== null ? js.get(namePath, this._vars, defaultValue) : undefined;
                if (r === undefined && fallback_to_owner === true && this._owner !== null) {
                    r = this._owner.getVar(namePath, true, defaultValue);
                }
                return r;
            },
            setVar: function (namePath, value) {
                if (this._vars === null) {
                    this._vars = {};
                }
                return js.set(namePath, value, this._vars);
            },
            removeVar: function (name) {
                var r;
                if (name.indexOf(".") !== -1) {
                    name = name.split(".");
                    var prop = name.pop();
                    r = [this.getVar(name.join("."))];
                    r.push(r[0][prop]);
                    delete r[0][prop];
                    r = r.pop();
                } else if (this._vars !== null) {
                    r = this._vars[name];
                    delete this._vars[name];
                }
                return r;
            },
            getAppVar: function () {
                var app = this.getApp();
                return app.getVar.apply(app, arguments);
            },
            setAppVar: function () {
                var app = this.getApp();
                return app.setVar.apply(app, arguments);
            },
            apply: function (name, args, callback) {
                return this.applyVar(name, args || [], true, this, callback);
            },
            applyVar: function (name, args, fallback_to_owner, thisObj, callback) {
	            /**
	             * @param fallback_to_owner - default false
	             */
                var f = this.getVar(name), r;
                if (typeof f !== "function") {
                    if (this._owner === null || fallback_to_owner !== true) {
                        if (fallback_to_owner === "silent") {
                            return;
                        }
                    }
                    return this._owner.applyVar(name, args, true, thisObj, callback);
                }
                if (! (args instanceof Array)) {
                    args = [args];
                }
                r = f.apply(thisObj || this, args);
                return typeof callback === "function" ? callback.apply(thisObj || this, [r]) : r;
            },
            findComponent: function (name) {
	            /**
	             * Returns the owned component named -name-
	             */
                if (this.hasOwnProperty("_components")) {
                    for (var i = 0, l = this._components.length; i < l; ++i) {
                        if (this._components[i]._name === name) {
                            return this._components[i];
                        }
                    }
                }
                return null;
            },
            isParentOf: function(component) {
            	/* overridden in ./Control */
            	return false;
            },
            isOwnerOf: function(component) {
	            /**
	             * Returns true when the calling component (indirectly) owns the
	             * specified component.
	             */
                while(component._owner !== null) {
                    if(component._owner === this) {
                        return true;
                    }
                    component = component._owner;
                }
                return false;
            },
            query1: function () {
                console.error("Should not be called anymore");
                return (this.query.apply(this, arguments) || [])[0];
            },
            query: function (selector, ctor) {
                console.error("ARGH query must be qsa");
                
                var r;
                if (selector === "@owner") {
                    var args = js.copy_args(arguments);
                    args.shift();
                    r = this.findOwner.apply(this, args);
                } else if (selector === "@scope") {
                    var args = js.copy_args(arguments);
                    args.shift();
                    r = this.getScope.apply(this, args);
                } else {
                    r = this;
                    if (selector.charAt(0) === "/") {
                        while (r._owner) {
                            r = r._owner;
                        }
                        selector = selector.substring(1);
                    }
                    // console.trace("Component.query", {
                    //     'this': this,
                    //     args: arguments
                    // });
                    if (selector.length > 0) {
                        selector = selector.split("/");
                        while (r !== null && selector.length > 0) {
                            r = r.getScope()[selector.shift().split("[").shift()];
                        }
                    }

                    // check whether the ctor matches
                    if (ctor && !(r instanceof ctor)) {
                        r = null;
                    } else {
                        r = [r];
                    }
                }

                return r;
            },
            up: function(selector, allowAll) {
	            /*- Queries all components for the given selector and filters out
	                those matches which are an owner of the calling component. The
	                result closest match (in the owner hierarchy) is returned, or 
	                all matched components are returned, sorted by 'closeness'. */
                var me = this;
                var all = query(selector || ":root", this, Component.all)
                    .map(function(owner) {
            			return {owner: owner, distance: me.distanceToOwner(owner)};
            		})
            		.filter(function(elem) {
            			return elem.owner !== this && elem.distance > 0;
            		})
            		.sort(function(elem1, elem2) {
            			return elem1.distance - elem2.distance;
            		})
            		.map(function(elem) {
            			return elem.owner;
            		});
        		
        		return allowAll ? all : all[0] || null;
            },
	        down: function(selector) {
	            /*- Return the first element of a call to ::qsa with the same
	                selector arguments or null when nothing matches. */
                return this.qsa(selector)[0] || null;
            },
            scope: function() {
	            /*- Search in the current scope. The scope being defined by the 
	                owning component of the calling component, or the calling 
	                component itself if it is a root component. */
                if(arguments.length === 0) {
                    return this.getScope();
                }
                return this.getScope()[arguments[0]];
            },
            qsa: function(selector, context) {
                var me = this, parent = selector.trim().charAt(0) === "<";
                return query(String.format("#%d %s", this.hashCode(), selector), 
                    context || this, 
                    all.reduce(function(arr, comp) {
                        if(	(parent === true	&& me.isParentOf(comp)) || 
                        	(parent === false	&& me.isOwnerOf(comp))
                        ) {
                        	arr.push(comp);
                        }
                        return arr;
                    }, [])
                );
            },
            qs: function(selector, context) {
                return this.qsa(selector, context)[0] || null;
            },
            
            getProxy: function() {
            	/*- Should return a simple wrapper object which enables 
            		control over the component */
            	return null;	
            },

            findOwner: function (ctor, uri, base) {
	            /**
	             * Finds the first root component in the owner hierarchy, which is an instanceof
	             * ctor (optional) and which uri matches the specified uri (optional) in case it.
	             * If base is not false, uris are reduced to the implicit base (default behaviour).
	             *
	             * @param ctor A reference to a constructor (optinal)
	             * @param uri An uri (optional, string)
	             * @param base If not false, uris are reduced to the implicit base
	             */
                
                console.warn("Component.prototype.findOwner will be deprecated");
                
                if (typeof ctor === "string" || ctor instanceof RegExp) {
                    base = uri;
                    uri = ctor;
                    ctor = undefined;
                }

                var owner = this._owner;
                while (owner !== null) {
                    if (!ctor || owner instanceof ctor) {
                        if (uri instanceof RegExp && uri.test(owner.getUri())) {
                            return owner;
                        }
                        if (!uri || uri === (base !== false ? owner.getUri().split("<")[0] : owner.getUri())) {
                            return owner;
                        }
                    }
                    owner = owner._owner;
                }
                return null;
            },
            getScope: function (parentScope) {
                var scope = {};

                if (parentScope === undefined && this._isRoot === true) {
                    parentScope = false;
                }

                if (this._owner !== null && parentScope !== false) {
                    scope = this._owner.getScope(parentScope !== true);
                }
                scope['@owner'] = parentScope !== false ? this._owner || this : this;
                if (this.hasOwnProperty("_components")) {
                    for (var i = 0, l = this._components.length; i < l; ++i) {
                        var component = this._components[i];
                        if (component.getName() !== "") {
                            scope[component.getName()] = component;
                        }
                    }
                }
                scope['@this'] = this;
                if (!scope.hasOwnProperty("@app")) {
                    scope['@app'] = this.getApp();
                }
                return scope;
            },
            getOwner: function () {
	            /**
	             * Returns the owner of a component
	             */
                if (arguments.length) {
                    return this.findOwner.apply(this, arguments);
                }
                return this._owner;
            },
            setOwner: function (value) {
                if (this._owner !== value) {
                    if (this._owner !== null) {
                        this._owner.removeComponent(this);
                    }
                    if (value !== null) {
                        value.insertComponent(this);
                    }
                }
            },
            getApp: function () {
                var r = this;
                while (r._owner) {
                    r = r._owner;
                }
                return r; // && r instanceof require("vcl/Application") ? r : null;
            },
           
            app: function() {
                return this.getApp();
            },

            getIsRoot: function () {
	            /**
	             *
	             * @returns {Boolean}
	             */
                console.warn("Component.prototype.getIsRoot is deprecated, use isRootComponent() instead");
                return this._isRoot;
            },
            setIsRoot: function (value) {
	            /**
	             *
	             * @param value
	             */
                if (!this.isLoading() && (this._owner !== null || this._uri !== "")) {
                    throw new Error("Can not set isRoot now");
                }
                if (value === true) {
                    this._isRoot = true;
                } else {
                    delete this._isRoot;
                }
            },
    		distanceToParentComponent: function(parent) {
    			var r = 1, cmp = this.getParentComponent();
    			while(cmp && cmp !== parent) {
    				cmp = cmp.getParentComponent();
    				r++;
    			}
    			return cmp === parent ? r : 0;
    		},
    		distanceToOwner: function(owner) {
    			var r = 1, cmp = this.getOwner();
    			while(cmp && cmp !== owner) {
    				cmp = cmp.getOwner();
    				r++;
    			}
    			return cmp === owner ? r : 0;
    		},
            getParentComponent: function () {
	            /**
	             * Returns the parent of a component
	             */
                return null;
            },
            setParentComponent: function (value) {},
            getChildren: function (func, root) {
                if (this.hasOwnProperty("_components") && root === this) {
                    this._components.forEach(function (component) {
                        var pc = component.getParentComponent();
                        if (pc === null || pc === this) {
                            func(component);
                        }
                    },
                    this);
                }
            },
            nameComponent: function (component, newName) {
	            /**
	             * Renames the component. If a component named -newName- is owned by
	             * the calling component or the calling components owner, this
	             * method raises an exception. Component names are case- sensitive.
	             */
                if (newName !== "" && this.findComponent(newName) !== null) {
                	/*- Allowing multiple components with the same name. So
                	scope() will become unreliable. Replacements are of the likes 
                	of up(), down() qs, and qsa should become the tools */
                	
                    //throw (new Error(String.format("A component named '%s' already exists.", newName)));
                }
                if (this._owner !== null && component === this) {
                    this._owner.nameComponent(component, newName);
                } else {
                    component._name = newName;
                    if (component.isDesigning()) {
                        component.getDesignerHook().modified(component, "name");
                    }
                }
            },
            getName: function () {
                return this._name;
            },
            setName: function (value) {
                if (this._name !== value) {
                    this.nameComponent(this, value);
                }
            },
            getParam: function (namePath) {
                return js.get(namePath, this._params || {});
            },
            getParams: function () {
                return this._params;
            },
            setParams: function (value) {
                this._params = value;
                if (value !== null) {
                    // null is nothing
                    this.fire("onReceiveParams", arguments);
                }
            },
            insertComponent: function (component) {
                if (!this.hasOwnProperty("_components")) {
                    this._components = [];
                }
                if (component._name !== "" && this.findComponent(component.getName()) !== null) {
                    throw new Error(String.format("A component named '%s' already exists.", component.getName()));
                }
                component._owner = this;
                this._components.push(component);
            },
            removeComponent: function (component) {
                // if(this.hasOwnProperty("_components")) {
                this._components.splice(this._components.indexOf(component), 1);
                component._owner = null;
                // }
            },
            getStorageKey: function(forKey) {
            	var app = this.getApp();
            	if(app) {
            		return app.getStorageKey([this, forKey]);
            	}
            },
            readStorage: function (key, callback, errback) {
                var r = localStorage.getItem(this.getStorageKey(key));
                if (typeof callback === "function") {
                    callback.apply(this, [r]);
                }
            },
            writeStorage: function (key, value, callback, errback) {
                try {
                    var item = this.getStorageKey(key);
                    var r = localStorage.setItem(item, value);
                    if (typeof callback === "function") {
                        callback.apply(this, [r]);
                    }
                } catch(e) {
                    if (typeof errback === "function") {
                        errback.apply(this, [e]);
                    }
                }
            },
            getUriInfo: function () {
	            /**
	             *  Returns an object describing the attributes of the uri of the calling component
	             */
                return Component.getKeysByUri(this._uri);
            },
            getUri: function () {
                if (this.isRootComponent()) {
                    return this._uri;
                }

                if (this._owner && this._name) {
                    return String.format("%s/%s", this._owner.getUri(), this._name);
                }

                return !this._owner || this.hasOwnProperty("_uri") ? this._uri : this._owner.getUri();
            },
            setUri: function (value) {
                this._uri = value;
            },
            getNamespace: function () {
                return Component.getKeysByUri(this.getUri()).namespace;
            },
            getSpecializer: function (removeClasses) {
                return Component.getKeysByUri(this._uri || this.getUri()).specializer;
            },
            getPropertyValue: function (name) {
                return this['@properties'][name];
            },
            hasPropertyValue: function (name) {
                return this['@properties'][name] !== undefined;
            }
        },
        statics: {
            all: all,
            nameComponent: function (component, name) {
                if (component._owner === null) {
                    throw new Error("No owner");
                }

                if (name !== undefined && component._owner.findComponent(name) === null) {
                    return component.setName(name);
                }

                var i = 0;
                base = name || component.getClass().getName().split(".").pop().toLowerCase();
                name = String.format("%s%d", base, ++i);
                while (component._owner.findComponent(name)) {
                    name = String.format("%s%d", base, ++i);
                }
                component.setName(name);
                return name;
            },
            getUriByKeys: function (keys) {

                var className = keys.className || (keys.classes ? keys.classes.join(" ") : "");
                var specializer = keys.specializer ? keys.specializer : keys.template ? keys.namespace || "" : "";
                var name = keys.name || "";
                var uri;
                if (className !== "") {
                    className = String.format(".%s", className.split(" ").join("."));
                }

                if (name.indexOf(".") === -1) {
                    name = "";
                } else {
                    name = "." + name;
                }

                if (keys.specializer_classes instanceof Array && keys.specializer_classes.length) {
                    specializer += String.format(".%s", keys.specializer_classes.join("."));
                }

                if (keys.template) {
                    uri = String.format("%s<%s>%s%s", keys.template, specializer, name, className);
                } else {
                    uri = String.format("%s%s%s%s", keys.namespace, keys.namespace ? "/" : "", keys.name, className);
                }

                return uri;
            },
            getImplicitBaseByUri: function (uri, loop) {
            	// TODO refactor to getImplicitBaseForUri
                if (loop === true) {
                    var arr = [];
                    while (uri !== null) {
                        arr.push(uri);
                        uri = Component.getImplicitBaseByUri(uri);
                    }
                    return arr;
                }

                var keys = Component.getKeysByUri(uri);

                // ui/forms/persistence/View
                if (keys.specializer === "" && keys.classes.length === 0) {
                    if (uri.indexOf("<>") !== -1) {
                        return uri.split("<")[0];
                    }
                    return null;
                }

                // ui/forms/persistence/View<X>.a
                if (keys.classes.length > 0) {
                    delete keys.classes;
                    return Component.getUriByKeys(keys);
                }

                // ui/forms/persistence/View<X.b>.a
                if (keys.specializer_classes.length > 0) {
                    delete keys.specializer_classes;
                    return Component.getUriByKeys(keys);
                }

                // ui/forms/persistence/View<X.a>
                if (keys.specializer !== "") {
                    if (keys.specializer.indexOf(".") !== -1) {
                        if ((keys.specializer = keys.specializer.split(".")[0]) !== "") {
                            return Component.getUriByKeys(keys);
                        }
                        // ui/forms/persistence/View<X/Y>
                    } else if (keys.specializer.indexOf("/") !== -1 || keys.specializer.indexOf(":") !== -1) {
                        keys.specializer = keys.specializer.split("/");
                        if (keys.specializer.length === 1) {
                            keys.specializer = keys.specializer[0].split(":");
                        }
                        keys.specializer.pop();
                        if ((keys.specializer = keys.specializer.join("/")) !== "") {
                            return Component.getUriByKeys(keys);
                        }
                    }
                }

                // ui/forms/persistence/View<X>
                return keys.template;
            },
            getImplicitBasesByUri: function (uri) {
                var base = Component.getImplicitBaseByUri(uri);
                var r = [];

                if (base !== null) {
                    var keys = Component.getKeysByUri(uri);
                    var classes = keys.classes;
                    var spec_classes = keys.specializer_classes;
                    if (classes.length > 1) {
                        // [A] Each class expands
                        classes.forEach(function (cls) {
                            keys.classes = [cls];
                            r.push(Component.getUriByKeys(keys));
                        });
                    } else if (classes.length === 1) {
                        if (spec_classes.length > 1) {
                            // [B] Each specializer_class expands
                            spec_classes.forEach(function (cls) {
                                keys.specializer_classes = [cls];
                                r.push(Component.getUriByKeys(keys));
                            });
                        } else if (spec_classes.length === 1) {
                            // [C]
                            delete keys.specializer_classes;
                            r.push(Component.getUriByKeys(keys));
                        } else if (keys.specializer) {
                            // [D] keys.classes.length === 1 && keys.specializer
                            delete keys.template;
                            delete keys.specializer;
                            r.push(Component.getUriByKeys(keys));
                        } else if (uri.indexOf(Factory.PREFIX_PROTOTYPES) !== 0) {
                            // [H] keys.classes.length === 1 && !keys.specializer && !prototypes/
                            r.push(String.format("%s%s", Factory.PREFIX_PROTOTYPES, uri));
                        } else {
                            // [J] equals [G], continue on prototypes/ prefix
                        }
                    } else if (spec_classes.length > 1) {
                        // [E] Each specializer_class expands
                        spec_classes.forEach(function (cls) {
                            keys.specializer_classes = [cls];
                            r.push(Component.getUriByKeys(keys));
                        });
                    } else if (spec_classes.length === 1) {
                        // [F]
                        delete keys.specializer_classes;
                        r.push(Component.getUriByKeys(keys));
                    } else if (keys.specializer) {
                        /*- [G] nothing todo here since there are no (spec_)classes
                         * and the implicit base is already pushed */
                    } else {
                        /*- console.warn("Thought this was unreachable code"); */
                        // empty specifier due to: ComponentClass<>
                    }

                    // Always inherit the implicit base
                    r.push(base);

                } else if (uri.indexOf(Factory.PREFIX_PROTOTYPES) !== 0) {
                    r.push(String.format("%s%s", Factory.PREFIX_PROTOTYPES, uri));
                } else {
                    // [I] it ends here, there is no implicit base for uri
                }
                return r;
            },
            getImplicitSourceByUri: function (uri) {
                var uris = Component.getImplicitBasesByUri(uri);
                if (uris.length === 0) {
                    if (uri.indexOf(Factory.PREFIX_PROTOTYPES) !== 0) {
                        uris.push(String.format("%s%s", Factory.PREFIX_PROTOTYPES, uri));
                    }
                }

                uris.sort(function (u1, u2) {
                    // WRONG: 304 App.desktop --> $(["App", "vcl/prototypes/App.desktop"]);
                    // RIGHT: 304 App.desktop --> $(["vcl/prototypes/App.desktop", "App"]);
                    u1 = u1.indexOf(".scaffold");
                    u2 = u2.indexOf(".scaffold");
                    return u1 < u2 ? -1 : 1;
                });

                return String.format("$([\"" + uris.join("\", \"") + "\"]);");
            },
            getKeysByUri: function (uri) {
                var r = {};

                uri = uri.split("<");
                if (uri.length === 2) {
                    r.template = uri[0];
                    r.namespace = uri[0].split(".")[0].split("/");
                    r.name = r.namespace.pop();
                    r.namespace = r.namespace.join("/");

                    uri = uri[1].split(">");
                    if ((r.specializer = uri.shift()) === "") {
                        r.template = "";
                    }
                    r.classes = uri.shift().split(".");
                    if (r.classes[0] === "") {
                        r.classes.shift();
                    }
                } else {
                    // Only last part can have a dot (.) indicating classes
                    r.classes = uri[0].split("/").pop().split(".");
                    r.classes.shift();

                    uri = uri[0].substring(0, uri[0].length - r.classes.join(".").length - 1);

                    r.template = "";
                    r.specializer = "";

                    r.namespace = uri.split("/");
                    r.name = r.namespace.pop();
                    r.namespace = r.namespace.join("/");
                }

                if (r.specializer) {
                    r.specializer = r.specializer.split(".");
                    r.specializer_classes = r.specializer.splice(1);
                    r.specializer = r.specializer.pop();
                } else {
                    r.specializer_classes = [];
                }

                return r;
            },
            load: function (name, parentRequire, load, config) {
	            /**
	             * @overrides http://requirejs.org/docs/plugins.html#apiload
	             */
                console.log(name);
            }
        },
        properties: {
            "components": {
                type: Type.ARRAY,
                assignable: false,
                visible: false,
                stored: false
            },
            "owner": {
                type: Type.OBJECT,
                assignable: false,
                visible: false,
                stored: false
            },
            "uri": {
                type: Type.STRING,
                get: Function,
                // visible: false,
                assignable: false,
                // editor: ComponentUri,
                enabled: false,
                stored: false
            },
            "left": {
                type: Type.INTEGER,
                visible: false
            },
            "top": {
                type: Type.INTEGER,
                visible: false
            },
            "vars": {
                type: Type.OBJECT,
                set: Function
            },
            "name": {
                set: Function,
                type: Type.STRING,
                // editor: ComponentName,
                stored: false
            },
            "handlers": {
            	fixUp: true,
            	set: function(value) {
            		for(var k in value) {
            			var method = value[k];
            			var selector = k.split(" ");
            			var event = selector.pop();
            			if(!selector.length) {
            				selector = [this];
            			} else {
	            			selector = this.qsa(selector.join(" "));
            			}
            			selector.forEach(function(component) {
            				component.on(event, method);
            			});
            		}
            	},
            	type: Type.OBJECT // MAP(String, Function)
            },
            "override": {
            	fixUp: true,
                set: function(value) {
            		for(var k in value) {
            			var method = value[k];
            			var selector = k.split(" ");
            			var event = selector.pop();
            			if(!selector.length) {
            				selector = [this];
            			} else {
	            			selector = this.qsa(selector.join(" "));
            			}
            			selector.forEach(function(component) {
            				component.override(event, method);
            			});
            		}
                },
                type: Type.OBJECT
            },
            "overrides": {
            	fixUp: true,
                set: function(value) {
            		for(var k in value) {
            			var method = value[k];
            			var selector = k.split(" ");
            			var event = selector.pop();
            			if(!selector.length) {
            				selector = [this];
            			} else {
	            			selector = this.qsa(selector.join(" "));
            			}
            			selector.forEach(function(component) {
            				component.override(event, method);
            			});
            		}
                },
                type: Type.OBJECT
            },
            "onLoad": {
                type: Type.EVENT
            },
            "onDestroy": {
                type: Type.EVENT
            },
            "onReceiveParams": {
                type: Type.EVENT
            },
            "onDispatchChildEvent": {
                type: Type.EVENT
            },
            "onMessage": {
                type: Type.EVENT
            }
        }
    });

    Property.registerReferencedClass(Component);

    return Component;
});