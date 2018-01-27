define(function (require) {

    var FormContainer = require("js/defineClass");
    var Type = require("js/Type");
    var Panel = require("./Panel");
    var Form = require("./Form");
    var Control = require("../Control");
    var Factory = require("../Factory");

    return (FormContainer = FormContainer(require, {
        inherits: Panel,
        prototype: {
            "@css": {
                ">.loading": {
                    background: "url(/shared/vcl/images/loading.gif) no-repeat center",
                    position: "absolute",
                    width: "100%",
                    top: "25%",
                    height: "20px"
                }
            },

            _align: "client",

            _form: null,
            _formUri: "",
            _formListeners: null,
            _loading_form: false,

            _formParams: null,
            _onGetFormParams: null,

            _onFormOpen: null,
            _onFormLoad: null,
            _onFormLoadError: null,
            _onFormClose: null,
            _onFormCloseQuery: null,
            _onFormActivate: null,
            _onFormDeactivate: null,

            destroy: function () {
            /**
             * @overrides ../Component.prototype.destroy
             */
                // TODO check ../Component.prototype.destroy
                if (this._form !== null) {
                    this._form.destroy();
                }
                this.inherited(arguments);
            },
            removeComponent: function (component) {
            /**
             * @overrides ../Component.prototype.removeComponent
             */
                this.inherited(arguments);
                if (component === this._form) {
                    this._form = null;
                }
            },
            dispatchChildEvent: function (component, name, evt, f) {
            /**
             * @overrides ../Component.prototype.dispatchChildEvent
             */
                if (component === this._form) {
                    this.dispatch("form" + name, evt);
                }
                return this.inherited(arguments);
            },
            initializeNodes: function () {
            /**
             * @overrides ../Control.prototype.initializeNodes
             */
                this.inherited(arguments);

                this._nodes.loading = document.createElement("div");
                this._nodes.loading.className = "loading";
                this._nodes.loading.innerHTML = "&nbsp;";
            },
            showNode: function () {
            /**
             * @overrides ../Control.prototype.showNode
             */
                var r = this.inherited(arguments);

                if (this._formUri !== "" && this._form === null && this._loading_form !== true) {
                    this.loadForm();
                }

                return r;
            },
            visibleChanged: function (value) {
            /**
             * @overrides ../Control.prototype.visibleChanged
             */
                if (this._form === null) {
                    if (this.isVisible() && this._formUri !== "" && this._loading_form !== true) {
                        this.loadForm();
                    }
                }
                return this.inherited(arguments);
            },
            setFocus: function () {
            /**
             * @overrides ../Control.prototype.setFocus
             */
                if(this._form) {
                    this._form.setFocus.apply(this._form, arguments);
                }
            },
            
            forceLoad: function () {
                if (this._formUri !== "" && this._form === null && this._loading_form !== true) {
                    this.loadForm();
                }
            },
            reloadForm: function () {
                if (this._form) {
                    this._form.destroy();
                    delete this._form;
                }
                Factory.unreq(this.getSpecializedFormUri());
                this.loadForm();
            },
            loadForm: function () {
                if (this.isDesigning()) { return; }

                var thisObj = this;
                var uri = this.getSpecializedFormUri();
                var uri_classes = uri.split(" ");
                this.dispatch("formloadstart");

                if (uri_classes.length > 1) {
                    uri = uri_classes.shift();
                }
                var base = this.getBaseUri();
// console.log(uri, js.normalize(base, uri));
                uri = js.normalize(base, uri);
                Factory.require(uri, function (factory) {
                    try {
                        var component = factory.newInstance(thisObj, uri, {

                            loaded: function(component) {
                                /*- do nothing, blocking */
                            }

                        });

                        if (uri_classes.length > 0 && component instanceof Control) {
                        	//console.debug("adding", uri_classes.join(" && "));
                            component.addClasses(uri_classes);
                        }

                        if(component !== null) {
                        	if(!(component instanceof Form)) {
	                            console.error(String.format("%s is not a %n (but a %n)", uri, Form,
	                                typeof component.getClass === "function" ?
	                                    component.getClass() : component));
	                                    
                        		var form = new Form();
                        		form._uri = uri;
	                        	if(component instanceof Control) {
	                        		component.setParent(form);
	                        	}
	                        	component = form;
                        	}
                        }

                        if (component instanceof Form) {
                            thisObj.setForm(component);

	                        /*- loaded() was blocked, call it now */
	                        component.loaded();

                            thisObj.dispatch("formload");
                            component.setParams(thisObj.getFormParamsValue());
                            component.setParent(thisObj);
                            thisObj.dispatch("formopen");
                        } else if (component !== null) {
                            throw new Error(String.format("%s is not a %n (but a %n)", uri, Form,
                                typeof component.getClass === "function" ?
                                    component.getClass() : component));
                        }


                    } finally {
                        thisObj.dispatch("formloadend");
                    }
                },
                function (e) {
                    alert(e);
                    thisObj.dispatch("formloadend");
                    if (thisObj.dispatch("formloaderror", uri, e) === true) {
                    	console.error(e);
                        throw new Error(String.format("Could not instantiate form %s", uri), e);
                    }
                });
            },
            reload: function (evt) {
                if (this._form !== null) {
                    this._form.setParent(null);
                    //this._form.setOwner(null);
                    this._form.destroy(false); // false === do not cache the instance (@overrides ../Component._cache)
                    this._useCache = evt.useCache;
                    this._useScaffolding = evt.useScaffolding;
                    this.loadForm();
                }
            },
            
            releaseForm: function() {
            	var form = this._form;
            	if(form !== null) {
            		form.setParent(null);
            		form.setOwner(null);
            		this._form = null;
            	}	
            	return form;
            },

            onformloadstart: function () {
                this.setLoading(true);
                //return this.fire("onFormLoad", arguments);
            },
            onformloadend: function () {
                this.setLoading(false);
                //return this.fire("onFormLoad", arguments);
            },
            onformload: function () {
                this.emit("formloaded", arguments);
                return this.fire("onFormLoad", arguments);
            },
            onformloaderror: function (uri, e) {
                var r = this.fire("onFormLoadError", arguments);
                if (r === undefined) {
                    r = true;
                }
                return r;
            },
            onformactivate: function () {
                return this.fire("onFormActivate", arguments);
            },
            onformclose: function () {
                return this.fire("onFormClose", arguments);
            },
            onformopen: function () {
                return this.fire("onFormOpen", arguments);
            },
            onformdeactivate: function () {
                return this.fire("onFormDeactivate", arguments);
            },
            
            setLoading: function (value) {
                if (this._loading_form !== value) {
                    this._loading_form = value;

                    if (!this.isLoading()) {
                        this.getNode();
                    }
                    if (this._nodes !== null) {
                        if (this._loading_form === true && this._nodes.loading.parentNode !== this._node) {
                            this._node.appendChild(this._nodes.loading);
                            this.addClass("loading");
                        } else if (this._loading_form === !true && this._nodes.loading.parentNode === this._node) {
                            this._node.removeChild(this._nodes.loading);
                            this.removeClass("loading");
                        } else {
                            console.log("?");
                        }
                    }
                }
            },            
            getFormParamsValue: function () {
                if (this._formParams !== null || this._onGetFormParams !== null) {
                    var params = js.mixIn({},
                    this._formParams || {});
                    if (this._onGetFormParams !== null) {
                        params = this._onGetFormParams.apply(this, [params]);
                    }
                    return params;
                }
                return null;
            },
            refreshParams: function () {
            /**
             * Use this function to refresh the forms parameters.  If the form is not loaded, nothing happens.
             * The event onGetFormParams will be triggered if applicable.
             */
                if (this._form !== null) {
                    // TODO Might wanna refresh only when visible?
                    this._form.setParams(this.getFormParamsValue());
                }
            },
            
            getBaseUri: function() { 
            	return this._owner ? this._owner._uri : "";
            },
            getForm: function () {
                return this._form;
            },
            setForm: function(value) {
            	this._form = value;
            },
            swapForm: function (value, takeOwnership) {
				/* value can be of type string or Form */
            	var form; // returns undefined when no swap was made !!
                if (this._form !== value) {
                	form = this.releaseForm();
                	if(value instanceof Form) {
                    	this._form = value;
                    	if(takeOwnership !== false) value.setOwner(this);
                    	value.setParent(this);
                	} else if(typeof value === "string") {
						this.setFormUri(value);
					}
                }
                return form;
            },
            getSpecializedFormUri: function () {
                var uri = this._formUri;
                if (this._owner !== null && uri.indexOf("<>") !== -1) {
                    var specializer = this._owner.getSpecializer(false);
                    if(specializer !== ""){
                    	uri = String.format("%s<%s>%s", uri.split("<")[0], specializer, uri.split(">")[1]);//.split(".")[0]);
                    } else {
                    	uri = String.format("%s%s", uri.split("<")[0], uri.split(">")[1]);//.split(".")[0]);
                    }
                }
                return uri;
            },
            getFormUri: function () {
                return this._formUri;
            },
            setFormUri: function (value) {
                if (this._formUri !== value) {
                    this._formUri = value;
                    if (this._form !== null) {
                        this._form.destroy();
                    }
                    if (!this.isLoading() && this.isVisible()) {
                        this.loadForm();
                    }
                }
            },
            getFormParams: function () {
                return this._formParams;
            },
            setFormParams: function (value) {
                if (this._formParams !== value) {
                    this._formParams = value;
                }
            },
            getUseCache: function () {
                return this._useCache;
            },
            setUseCache: function (value) {
                if (this._useCache !== value) {
                    this._useCache = value;
                }
            },
            getReflectHash: function () {
                return this._reflectHash;
            },
            setReflectHash: function (value) {
                if (this._reflectHash !== value) {
                    this._reflectHash = value;
                }
            },
            
            getOnFormActivate: function () {
                return this._onFormActivate;
            },
            setOnFormActivate: function (value) {
                if (this._onFormActivate !== value) {
                    this._onFormActivate = value;
                }
            },
            getOnFormClose: function () {
                return this._onFormClose;
            },
            setOnFormClose: function (value) {
                if (this._onFormClose !== value) {
                    this._onFormClose = value;
                }
            },
            getOnFormDeactivate: function () {
                return this._onFormDeactivate;
            },
            setOnFormDeactivate: function (value) {
                if (this._onFormDeactivate !== value) {
                    this._onFormDeactivate = value;
                }
            },
            getOnFormLoad: function () {
                return this._onFormLoad;
            },
            setOnFormLoad: function (value) {
                if (this._onFormLoad !== value) {
                    this._onFormLoad = value;
                }
            },
            getOnFormLoadError: function () {
                return this._onFormLoadError;
            },
            setOnFormLoadError: function (value) {
                if (this._onFormLoadError !== value) {
                    this._onFormLoadError = value;
                }
            },
            getOnFormOpen: function () {
                return this._onFormOpen;
            },
            setOnFormOpen: function (value) {
                if (this._onFormOpen !== value) {
                    this._onFormOpen = value;
                }
            },
            getOnGetFormParams: function () {
                return this._onGetFormParams;
            },
            setOnGetFormParams: function (value) {
                if (this._onGetFormParams !== value) {
                    this._onGetFormParams = value;
                }
            }
        },
        properties: {

            "align": {
                set: Function,
                type: Panel.ALIGN
            },

            "formUri": {
                type: Type.STRING,
                editor: "./propertyeditor/FormContainerFormUri"
            },

            "formsParams": {
                type: Type.OBJECT
            },

            "onFormActivate": {
                type: Type.EVENT
            },

            "onFormClose": {
                type: Type.EVENT
            },

            "onFormDeactivate": {
                type: Type.EVENT
            },

            "onFormLoad": {
                type: Type.EVENT
            },

            "onFormLoadError": {
                type: Type.EVENT
            },

            "onFormOpen": {
                type: Type.EVENT
            },

            "onGetFormParams": {
                type: Type.EVENT
            }
        }
    }));
});
