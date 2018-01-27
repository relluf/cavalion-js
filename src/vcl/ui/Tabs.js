define(function(require) {

    var Tabs = require("js/defineClass");
    var Bar = require("./Bar");
    var Type = require("js/Type");
    var js = require("js");

    return (Tabs = js.defineClass(require, {

    	inherits: Bar,
    	

    	prototype: {

    		_history: null,
    		_onChange: null,

	    	/**
	    	 * Constructor
	    	 */
	    	constructor: function() {
	    		this._history = [];
	    		js.mixIn(this._history, {
	    			remove: function(item) {
	    				for(var i = 0; i < this.length;) {
	    					if(this[i] === item) {
	    						this.splice(i, 1);
	    					} else {
	    						++i;
	    					}
	    				}
	    			}
	    		});
	    	},
	    	
	    	onkeyup: function(evt) {
	    		var r = this.inherited(arguments);
    			var selected = this.getSelectedControl(1);
	    		
    			function move(direction) {
    				var l = selected._parent._controls.length;
    				if(evt.ctrlKey === true) {
    					selected.setIndex(direction < 0 ? 0 : l - 1);
    				} else {
    					var index = (selected.getIndex() + direction + l) % l;
    					selected.setIndex(index);
    				}
    			}
    			
	    		if(r !== false && selected !== null) {
	    			switch(evt.keyCode) {
	    				case evt.KEY_LEFT_ARROW:
		    				evt.shiftKey ? move(-1) : this.selectPrevious();
	    					break;
	    					
	    				case evt.KEY_RIGHT_ARROW:
		    				evt.shiftKey ? move(1) : this.selectNext();
	    					break;
	    			}
	    		}
	    		return r;
	    	},
	    	
	    	/**
	    	 * 
	    	 */
	    	selectNext: function() {
	    	    var index = this.getSelectedControl(1).getIndex();
	    	    if(++index === this._controls.length) {
	    	        index = 0;
	    	    }
	    	    this.getControl(index).setSelected(true);
	    	},
	    	
	    	/**
	    	 * 
	    	 */
	    	selectPrevious: function() {
	    	    var index = this.getSelectedControl(1).getIndex();
	    	    if(--index < 0) {
	    	        index = this._controls.length - 1;
	    	    }
	    	    this.getControl(index).setSelected(true);
	    	},
	    	
    		/**
    		 * @overrides ../Control.prototype.initializeNodes
    		 */
    		initializeNodes: function(control) {
    			this._node.tabIndex = 1;
    			return this.inherited(arguments);
    		}, 
    		
    		/**
    		 * @overrides ../Control.prototype.insertControl
    		 */
    		insertControl: function(control) {
    		    this.inherited(arguments);
    		},
    		
    		/**
    		 * @overrides ../Control.prototype.removeControl
    		 */
    		removeControl: function(control) {
    			if(this._history.length > 0) {
    				if(control.isSelected()) {
    					this._history.pop().setSelected(true);
    				}
    				this._history.remove(control);
    			} else if(this._controls.length > 1) {
    				var index = control.getIndex();
    				index += (index > 0 ? - 1 : 1);
					this._controls[index].setSelected(true);
    			}
    			var r = this.inherited(arguments);
    			if(this._controls.length === 0) {
				    this.dispatch("change", null, control);
    			}
    			return r;
    		},

    		/**
    		 * @overrides ../Control.prototype.selectControl
    		 */
    		selectControl: function(control) {
    			var selected = this.getSelectedControl(1);
    			if(this.isDesigning() === true || 
    				this.dispatch("change", control, selected) !== false) {
        			if(selected !== null) {
        				this._history.push(selected);
        			}
    				var r = this.inherited(arguments);
    				if((selected = this.getSelectedControl(1)) !== null) {
    					selected.update(this.checkOverflow.bind(this));	
    				}
    				return r;
    			}
    		},

    		/**
    		 *
    		 */
    		onchange: function() {
				return this.fire("onChange", arguments);
    		}
    	},

    	properties: {

    		"onChange": {
    			type: Type.EVENT
    		}
    	},

    	statics: {

    	}
    }));
});