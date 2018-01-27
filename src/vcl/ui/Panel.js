define(function (require) {

    var Class = require("js/Class");
    var js = require("js");
    var Type = require("js/Type");
    //	var Method = require("js/Method");
    var Browser = require("../../util/Browser");
    var Container = require("./Container");

    var PanelAlign = ["none", "client", "left", "right", "top", "bottom"];
    var PanelAlignPriority = ["index", "client-last"];
    var PanelAutoSize = ["none", "both", "width", "height"];
    var PanelAutoPosition = {
        top: false,
        left: false,
        bottom: false,
        right: false
    };
    var aligning = [];

    function getRevAnim(animation) {
        var animations = {
            "right-left": "left-right",
            "left-right": "right-left",
            "bottom-top": "top-bottom",
            "top-bottom": "bottom-top",
            "delayed": "instant",
            "instant": "delayed",
            "flip-to-front": "flip-to-back",
            "flip-to-back": "flip-to-front",
            "fadein-scaleup": "fadeout-scaledown"
        };
        return animations[animation];
    }

    /**
     *
     */
    function swap(obj, a1, a2) {
        var v = obj[a1];
        obj[a1] = obj[a2];
        obj[a2] = v;
    }

    /**
     *
     * @param control
     * @param left
     * @param top
     * @param right
     * @param bottom
     * @param callback
     */
    function setBounds(control, left, top, right, bottom, callback) {
        if (control.setBounds(left, top, right, bottom, undefined, undefined, callback) === undefined) {
            callback();
        }
    }

    var Panel = {
        inherits: Container,
        prototype: {          
            "@css": {
                "position": "absolute",
                "overflow": "auto",
                "cursor": "default",
                "&:focus": {
                    outline: "none"
                },
                "&.animated": {
                	"transition": "transform 0.45s"
                }
            },

            /** @overrides ../Control */
			//_removeNodeWhenHidden: true,

            // position and size
            _alignNode: null,
            _autoSize: "none",
            _autoPosition: PanelAutoPosition,
            _updateChildren: false,
            _left: 0,
            _top: 0,
            _right: 0,
            _bottom: 0,
            _width: 0,
            _height: 0,
            _zoom: 1.0,

            _focusable: false,
            
            _needsResize: false,

            // activePage indicates which control is currently the active client aligned control
            // FIXME Refactor activePage -> clientControl?
            _activePage: null,
            // history of activated pages
            _pages: null,
            // usePages indicates whether the behaviour is active
            _usePages: false,

            _draggable: "parent",
            
            alignControls: function (callback) {
            /** @return {Boolean} Indicates whether controls were actually aligned */
                if (aligning.indexOf(this) !== -1) {
                    // TODO This is blocked because it is probably always true that a child control is updating its
                    // bounds and the calling Panel has supplied a notification callback for that already.
                    return false;
                }

                var controls = this.getControlsToAlign();
                if (controls.length === 0) {
                    return false;
                }

                aligning.push(this);

                var cr = this.getClientRect();
                var thisObj = this;
                var i = 0;
                var U;

                /**
                 *
                 */
                function next() {
                    if (i < controls.length) {
                        var control = controls[i];
                        var align = control._align, zoom = control._zoom;

                        if (align !== "none" && control.isVisible()) {
                            if (align === "client") {
                                i++;
                                next();
                            } else {
                                controls.splice(i, 1);
/**
 * TODO The following calls setBounds rely on the post_update feature of 
 * Control.update. This is done in order to work around the fact/problem that 
 * the dimensions of a[n autosized] Control are not known until the moment that 
 * its DOM node is present in the document.
 * FIXME What happens if the control is destroyed while aligning?
 */
                                if (align === "top") {
                                    setBounds(control, cr.left, cr.top, cr.right, U, function () {
                                    	if(zoom != 1.0) {
                                    		console.log("alignControls", control._name, control);
                                        	cr.top += (control._height * zoom);
                                    	} else {
	                                        cr.top += (parseInt(control.getComputedStylePropValue("height"), 10) || 0);
                                    	}
                                        next();
                                    });
                                } else if (align === "bottom") {
                                    setBounds(control, cr.left, U, cr.right, cr.bottom, function () {
                                    	if(zoom != 1.0) {
                                    		console.log("alignControls", control._name, control);
                                        	cr.bottom += (control._height / zoom);
                                    	} else {
                                        	cr.bottom += (parseInt(control.getComputedStylePropValue("height"), 10) || 0);
                                    	}
                                        next();
                                    });
                                } else if (align === "left") {
                                    setBounds(control, cr.left, cr.top, U, cr.bottom, function () {
                                        //cr.left += control._width;
                                        cr.left += (parseInt(control.getComputedStylePropValue("width"), 10) || 0);
                                        next();
                                    });
                                } else if (align === "right") {
                                    setBounds(control, U, cr.top, cr.right, cr.bottom, function () {
                                        //cr.right += control._width;
                                        cr.right += (parseInt(control.getComputedStylePropValue("width"), 10) || 0);
                                        next();
                                    });
                                }
                            }
                        } else {
                            controls.splice(i, 1);
                            next();
                        }
                    } else {
                        controls.forEach(function (control) {
                            control.setBounds(cr.left, cr.top, cr.right, cr.bottom);
                        });

                        aligning.splice(aligning.indexOf(thisObj), 1);

                        // Calls to updateChildren will be blocked while aligning
                        if (thisObj._updateChildren === true) {
                            thisObj.updateChildren();
                        }

                        if (typeof callback === "function") {
                            callback(cr);
                        }
                    }
                }
                next();
            },
            getFocusable: function () {
            /** Property accessor */
                return this._focusable;
            },
            setFocusable: function (value) {
            /** @param value
             *            {Boolean} */
                if (this._focusable !== value) {
                    this._focusable = value;
                    if (this._node !== null) {
                        if (this._focusable === true) {
                            this._node.tabIndex = this.getIndex();
                        } else {
                            this._node.removeAttribute("tabIndex");
                        }
                    }
                }
            },
            getControlsToAlign: function () {
            /** @returns {Array} */
                var controls = [];
                this.hasOwnProperty("_controls") && this._controls.forEach(function (control) {
                    if (control._align !== "none"
                    /*&& control.isVisible()*/
                    ) {
                        controls.push(control);
                    }
                });
                return controls;
            },
            getClientRect: function () {
				var cs = this.getComputedStyle();
				var w = parseFloat(cs.width);
				var h = parseFloat(cs.height);
				var f = this._zoom < 1 ? -1 : 1;
				var cr = {
                    left: parseFloat(cs.getPropertyValue("padding-left")) || 0,
                    top: parseFloat(cs.getPropertyValue("padding-top")) || 0,
                    right: w - (w * (1 / this._zoom) * f),
                    bottom: h - (h * (1 / this._zoom) * f)
                    // TODO, Erhm, what about the padding?
                    // right: f * (parseFloat(cs.getPropertyValue("padding-right")) || 0),
                    // bottom: f * (parseFloat(cs.getPropertyValue("padding-bottom")) || 0)
                };
                // console.log(this._name, JSON.stringify(cr));
                return cr;
            },
            boundsChanged: function (changed) {
                this.align();
            },
            onresize: function (evt) {
            /** @overrides ../Control.prototype.onresize */
                /*- When this._needsResize === evt, ie. being called from 
                    Panel.prototype.shown, no matter that this isn't showing, 
                    resize anyways */
                if(this._needResize !== evt && !this.isShowing()) {
                    this._needsResize = evt;
                    //return;
                }
                
                delete this._needsResize;
                
                var r = this.inherited(arguments);
                if (r !== false) {
                    this.hasOwnProperty("_controls") && this._controls.forEach(function (control) {
                        if (control.hasOwnProperty("_node") && control._align && control._align !== "none") {
                            control.dispatch("resize", evt);
                        }
                    });
                }
                return r;
            },
            initializeNodes: function () {
            /** @overrides ../Control.prototype.initializeNodes */
                this.inherited(arguments);
                if (this._focusable === true) {
                    this._node.tabIndex = this.getIndex();
                }
            },
            updateChildren: function () {
            /** @overrides ../Control.prototype.updateChildren */
                if (aligning.indexOf(this) !== -1) {
                    // TODO This is blocked because it is probably always true that a child control is gonna be updated
                    // by the alignControls anyways...
                    this._updateChildren = true;
                    return false;
                }
                delete this._updateChildren;
                return this.inherited(arguments);
            },
            layoutChanged: function () {
            /** @overrides ../Control.prototype.layoutChanged */
                delete this._computedStyle;
                if (this._autoSize !== "none") {
                    if (this._align !== "none") {
                        var changed = [];
                        var cs = this.getComputedStyle(),
                        w,
                        h;

                        if (Browser.webkit === true) {
                            w = parseInt(cs.getPropertyValue("width"), 10);
                            h = parseInt(cs.getPropertyValue("height"), 10);
                        } else {
                            w = this._node.clientWidth;
                            h = this._node.clientHeight;
                        }

                        if (this._autoSize === "both" || this._autoSize === "height") {
                            if (this._height !== h) {
                                this._height = h;
                                changed.push("height");
                            }
                        }

                        if (this._autoSize === "both" || this._autoSize === "width") {
                            if (this._width != w) {
                                this._width = w;
                                changed.push("width");
                            }
                        }

                        if (changed.length > 0) {
                            this.boundsChanged(changed);
                        }
                    } else if (this._parent !== null) {
                        this._parent.contentChanged();
                    }
                } else if (this._parent !== null) {
                    this._parent.contentChanged();
                }
            },
            contentChanged: function () {
            /** @overrides ../Control.prototype.contentChanged */
                this.alignControls();
                this.layoutChanged();
                //this.inherited(arguments);
            },
            shown: function () {
            /** @overrides ../Control.prototype.shown */
                if(this._needsResize) {
                    //console.trace("Panel.shown-needsResize", this.hashCode(), this.isShowing());
                    this.onresize(this._needsResize);
                } else {
                    this.applyBounds();
                }
                return this.inherited(arguments);
            },
            hidden: function () {
            /** @overrides ../Control.prototype.layoutChanged */
                if (this._autoSize !== "none") {
                    this._height = 0;
                    this._width = 0;
                }
                return this.inherited(arguments);
            },
            render: function() {
            	if(this._node) {
            		this.renderZoom();
            	}
        		return this.inherited(arguments);
            },
            renderZoom: function() {
            	/** @required: this._node */
            	var zoomed = this.hasOwnProperty("_zoom");
            	var style = this._node.style;
            	if(zoomed) {
        			style.transform = String.format("scale3d(%s, %s, 1)", 
        				this._zoom, this._zoom);
        			style['transform-origin'] = "0 0";
            	} else {
            		style.transform = "";
            		style['transform-origin'] = "";
            	}
            },

// Bounds
            applyBounds: function (left, top, right, bottom, width, height) {
            /** @param left
             * @param top
             * @param right
             * @param bottom
             * @param width
             * @param height */

                var previousWidth = this._node.clientWidth;
                var previousHeight = this._node.clientHeight;
                var autoHeight = this._autoSize === "height" || this._autoSize === "both";
                var autoWidth = this._autoSize === "width" || this._autoSize === "both";
                var fixedHeight = !autoHeight && (this._align === "top" || this._align === "bottom" || this._align === "none");
                var fixedWidth = !autoWidth && (this._align === "right" || this._align === "left" || this._align === "none");
                
                var zoomed = this.hasOwnProperty("_zoom");

                var cs = this.getComputedStyle();
                this.setBoundsValidated(left, top, right, bottom, width, height);

                var bounds = {
                    top: this._top,
                    left: this._left,
                    bottom: this._bottom,
                    right: this._right
                };

                if (fixedWidth === true) {
                    bounds.width = this._width;
                    if(zoomed && this._zoom < 1) {
                    	bounds.width /= this._zoom;
                    }
                }

                if (fixedHeight === true) {
                    bounds.height = this._height;
                    if(zoomed && this._zoom < 1) {
                    	bounds.height /= this._zoom;
                    }
                }

                if (cs.position !== "static") {
                    if (this._align === "top") {
                        delete bounds.bottom;
                    } else if (this._align === "bottom") {
                        delete bounds.top;
                    } else if (this._align === "left") {
                        delete bounds.right;
                    } else if (this._align === "right") {
                        delete bounds.left;
                    } else if (this._align === "none") {
                    	// TODO autoPosition?
                        delete bounds.bottom;
                        delete bounds.right;
                    }
                } else {
                    //console.log(String.format("%n - position: static", this));
                }

                var ap = this._autoPosition;
                for (var k in ap) {
                    if (ap[k] === true) {
                        delete bounds[k];
                    }
                }

                var bu = "px";
                this.setStyleProp("top", bounds.top, bu);
                this.setStyleProp("left", bounds.left, bu);
                if(zoomed && this._zoom < 1) {
                	var w = parseFloat(cs.width);
                	var h = parseFloat(cs.height);
	                this.setStyleProp("bottom", -(h / this._zoom - h), bu);
	                this.setStyleProp("right", -(w / this._zoom - w), bu);
                } else {
	                this.setStyleProp("bottom", bounds.bottom, bu);
	                this.setStyleProp("right", bounds.right, bu);
                }
                this.setStyleProp("width", bounds.width, bu);
                this.setStyleProp("height", bounds.height, bu);

                if (previousWidth !== this._node.clientWidth || previousHeight !== this._node.clientHeight) {
                    this.dispatch("resize", {
                        previousWidth: previousWidth,
                        previousHeight: previousHeight,
                        width: this._node.clientWidth,
                        height: this._node.clientHeight
                    });
                }

                this.alignControls();
            },
            setBoundsValidated: function (left, top, right, bottom, width, height) {
            /** @param left
             * @param top
             * @param right
             * @param bottom
             * @param width
             * @param height */
                // FIXME what up with this method?
                if (left !== undefined) {
                    this._left = left;
                }
                if (right !== undefined) {
                    this._right = right;
                }
                if (top !== undefined) {
                    this._top = top;
                }
                if (bottom !== undefined) {
                    this._bottom = bottom;
                }
                if (width !== undefined) {
                    this._width = width;
                }
                if (height !== undefined) {
                    this._height = height;
                }
            },
            setBounds: function (left, top, right, bottom, width, height, post_update) {
            /** @param left
             * @param top
             * @param right
             * @param bottom
             * @param width
             * @param height
             * @param post_update */
                if (this.isLoading() || !this.isVisible()) {
                    this.setBoundsValidated(left, top, right, bottom, width, height);
                } else if (this.isShowing() === false) {
                    this.setBoundsValidated(left, top, right, bottom, width, height);
                    this.update(post_update);
                    if (post_update !== undefined) {
                        return "wait_for_post_update";
                    }
                } else {
                    this.applyBounds(left, top, right, bottom, width, height);
                    this.align();
                }
            },
            align: function (control, origin) {
            /** @overrides ./Container.prototype.align */
                if (this.isLoading()) {
                    return;
                }

                if (control !== undefined) {
                    this.alignControls();
                } else {
                    if (this._align !== "none") {
                        if (this._parent !== null) {
                            this._parent.align(this);
                        } else {
                            this.alignSelf();
                        }
                    } else if (this._node !== null && (this._parent !== null || this.getParentNode() !== undefined)) {
                        this.applyBounds();
                    }
                }
            },
            alignSelf: function () {
                var node = this._alignSelfNode || this.getParentNode();
                if (node !== null) {
                    switch (this._align) {
                    case "client":
                        this.applyBounds(0, 0, 0, 0, undefined, undefined);
                        break;

                    case "left":
                        this.applyBounds(0, 0, undefined, 0, this._width, undefined);
                        break;

                    case "right":
                        this.applyBounds(undefined, 0, 0, 0, this._width, undefined);
                        break;

                    case "top":
                        this.applyBounds(0, 0, 0, undefined, undefined, this._height);
                        break;

                    case "bottom":
                        this.applyBounds(0, undefined, 0, 0, undefined, this._height);
                        break;

                    case "none":
                        this.applyBounds(this._left, this._top, undefined, undefined, this._width, this._height);
                        break;

                    }
                }
            },
            setActivePage: function (value, animation) {
            /** @param value */

                // Tracks the classes added to 'node'
                var node_animation_classes;

                /**
                 *
                 */
                function dec_transitions() {
                    if (--transitions === 0) {
                        Element.removeClasses(node, node_animation_classes);
                        if (value !== null) {
                            value.setState("classesChanged", false, false);
                            value._update();
                        }
                        if (current !== null) {
                            current.setState("classesChanged", false, false);
                            current._update();
                        }
                    }
                }

                if (animation === null) {
                    this._activePage = value;
                    value._update();
                    return;
                }

                var transitions = 0;
                var node = this.getNode();
                var current = this._activePage;
                var current_node;
                var value_node;
                var current_listeners;
                var value_listeners;

                if (typeof animation === "string") {
                    animation = {
                        style: js.str2obj(animation)
                    };
                }

                if (this._animations === undefined) {
                    this._animations = [];
                }

                if (this._activePage !== value) {

                    if (value !== "previous") {
                        animation = animation || {};
                        animation.style = animation.style || {};

                        animation.show = value;
                        animation.hide = current;

                        animation.style.show = animation.style.show || "right-left";
                        animation.style.hide = animation.style.hide || animation.style.show;
                        animation.style['show-rev'] = animation.style['show-rev'] || getRevAnim(animation.style.hide);
                        animation.style['hide-rev'] = animation.style['hide-rev'] || getRevAnim(animation.style.show);

                        this._animations.push(animation);

                    } else {
                        animation = this._animations.pop();
                        value = animation.hide;
                        swap(animation.style, "show", "show-rev");
                        swap(animation.style, "hide", "hide-rev");
                    }

                    node_animation_classes = String.format("animate %s", animation.style.show);
                    Element.addClasses(node, node_animation_classes);
                    this._activePage = value;

                    if (current !== null) {
                        prepareForAnim(current, "hide", animation);
                        current_node = current.getNode();
                        Element.addClasses(current_node, String.format("%s hide from", animation.style.hide));
                    }

                    if (value !== null) {
                        prepareForAnim(value, "show", animation);
                        value_node = value.getNode();
                        if (value.hasState("classesChanged")) {
                            value._applyClasses();
                            value.clearState("classesChanged", false);
                        }

                        Element.addClasses(value_node, String.format("%s show from", animation.style.show));
                        value._update();
                    }

                    //console.log(String.format("start - %s - %s", current ? current._node.className : "*", value ? value._node.className : "*"));
                    window.setTimeout(function () {
                        if (value !== null) {
                            transitions++;
                            Element.removeClass(value_node, "from");
                            Element.addClass(value_node, "to");
                            value_listeners = value.on({
                                transitionend: function () {
                                    value.un(value_listeners);
                                    dec_transitions();
                                }
                            });
                        }

                        if (current !== null) {
                            transitions++;
                            Element.removeClasses(current_node, "from");
                            Element.addClasses(current_node, "to");
                            current_listeners = current.on({
                                transitionend: function () {
                                    current.un(current_listeners);
                                    dec_transitions();
                                }
                            });
                        }

                        //console.log(String.format("on - %s - %s", current ? current._node.className : "*", value ? value._node.className : "*"));
                    }.bind(this), 0);

                }
            },
            getUsePages: function () {
                return this._usePages;
            },
            setUsePages: function (value) {
                if (this._usePages !== value) {
                    if ((this._usePages = value) === false) {
                        delete this._pages;
                    } else {
                        this._pages = [];
                    }
                    this.updateChildren();
                }
            },
            getAlignNode: function () {
                return this._alignNode;
            },
            setAlignNode: function (value) {
            /** @param value {HtmlElement} */
                if (this._align !== value) {
                    if (value !== null) {
                        this._alignNode = value;
                    } else {
                        delete this._alignNode;
                    }
                    if (this.isVisible()) {
                        this.align();
                    }
                }
            },
            getAlign: function () {
                return this._align;
            },

            setAlign: function (value) {
            /** @param value {String} @overrides PanelAlign */
                if (this._align !== value) {
                    this._align = value;
                    this.align();
                }
            },
            getAutoSize: function () {
                return this._autoSize;
            },
            setAutoSize: function (value) {
            /** @param value {String} @overrides PanelAutoSize */
                if (this._autoSize !== value) {
                    this._autoSize = value;
                    this.align();
                }
            },
            getAutoPosition: function () {
            /** @returns {String} */
                var r = [];
                for (var k in this._autoPosition) {
                    if (this._autoPosition[k] === true) {
                        r.push(k);
                    }
                }
                return r.sort().join("-") || "align";
            },
            setAutoPosition: function (value) {
            /** @param value */
            	if(value === "all") { value = "top-left-bottom-right"; }
                if (typeof value === "string") {
                    var values = value.split("-");
                    value = {
                        top: false,
                        left: false,
                        bottom: false,
                        right: false
                    };
                    values.forEach(function (key) {
                        if (PanelAutoPosition[key] !== undefined) {
                            value[key] = true;
                        }
                    });
                }

                if (js.equals(value, PanelAutoPosition)) {
                    if (this._autoPosition !== PanelAutoPosition) {
                        delete this._autoPosition;
                        this.layoutChanged();
                    }
                } else {
                    var now = this._autoPosition;
                    for (var k in value) {
                        if (now[k] !== value[k]) {
                            this._autoPosition = Object.create(PanelAutoPosition);
                            js.mixIn(this._autoPosition, value);
                            this.align();
                            return;
                        }
                    }
                }
            },
            getLeft: function () {
            /** Returns the left property of the calling control. */
                return this._left;
            },
            setLeft: function (value) {
            /** @param value {Number} */
                this.setBounds(value, this._top, this._right, this._bottom, this._width, this._height);
            },
            isLeftStored: function () {
                return this._align === "none" && (this._autoPosition === "absolute" || this._autoPosition === "relative") && this._left !== 0;
            },
            getTop: function () {
                return this._top;
            },
            setTop: function (value) {
            /** @param value {Number} */
                this.setBounds(this._left, value, this._right, this._bottom, this._width, this._height);
            },
            isTopStored: function () {
                return this._align === "none" && (this._autoPosition === "absolute" || this._autoPosition === "relative") && this._top !== 0;
            },
            setRight: function (value) {
            /** @param value {Number} */
                this.setBounds(this._left, this._top, value, this._bottom, this._width, this._height);
            },
            isRightStored: function () {
                return this._align === "none" && (this._autoPosition === "absolute" || this._autoPosition === "relative") && this._right !== 0;
            },
            getBottom: function () {
                return this._bottom;
            },
            setBottom: function (value) {
            /** @param value {Number} */
                this.setBounds(this._left, this._top, this._right, value, this._width, this._height);
            },
            isBottomStored: function () {
                return this._align === "none" && (this._autoPosition === "absolute" || this._autoPosition === "relative") && this._bottom !== 0;
            },
            getWidth: function () {
                return this._width;
            },
            
            setWidth: function (value) {
            /** @param value {Number} */
                this.setBounds(this._left, this._top, this._right, this._bottom, value, this._height);
            },
            isWidthStored: function () {
                return this._align !== "top" && this._align !== "bottom" && this._align !== "client" && this._autoSize !== "width" && this._autoSize !== "both" && this._width !== 0;
            },
            getHeight: function () {
                return this._height;
            },
            setHeight: function (value) {
            /** @param value {Number} */
                this.setBounds(this._left, this._top, this._right, this._bottom, this._width, value);
            },
            isHeightStored: function () {
                return this._align !== "left" && this._align !== "right" && this._align !== "client" && this._autoSize !== "height" && this._autoSize !== "both";
            },
            setZoom: function(f) {
            	if(this._zoom !== f) {
            		this._zoom = f;
            		this.nodeNeeded();
            		this.renderZoom();
            		this.setTimeout("align", 450);
            		// TODO timeout should be tuned with css definition:
            		//		this.once("transitionend", () => this.align());
            	}
            }
        },
        properties: {

            "align": {
                set: Function,
                type: PanelAlign
            },
            "autoSize": {
                set: Function,
                type: PanelAutoSize
            },
            "autoPosition": {
                get: Function,
                set: Function,
                type: Class.Type.STRING
            },
            "focusable": {
                set: Function,
                type: Type.BOOLEAN
            },
            "left": {
                set: Function,
                type: Class.Type.INTEGER,
                stored: "isLeftStored"
            },
            "top": {
                set: Function,
                type: Class.Type.INTEGER,
                stored: "isTopStored"
            },
            "right": {
                set: Function,
                type: Class.Type.INTEGER,
                stored: "isRightStored"
            },
            "bottom": {
                set: Function,
                type: Class.Type.INTEGER,
                stored: "isBottomStored"
            },
            "height": {
                set: Function,
                type: Class.Type.INTEGER,
                stored: Function
            },
            "width": {
                set: Function,
                type: Class.Type.INTEGER,
                stored: Function
            },
            "zoom": {
            	set: Function,
            	type: Class.Type.NUMBER
            }

        },
        statics: {
            ALIGN: PanelAlign,
            ALIGNPRIORITY: PanelAlignPriority,
            AUTOSIZE: PanelAutoSize,
            AUTOPOSITION: PanelAutoPosition
        }
    };

    return (Panel = Class.define(require, Panel));
});
