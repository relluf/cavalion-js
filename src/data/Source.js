define(function(require) {

//	var Interface = require("js/Interface");
	var SourceState = require("./SourceState");
	var SourceEvent = require("./SourceEvent");

	var Source = {

		prototype: {
			getSize: function() {
				/** Returns the number of objects this source manages */
			},
			getObject: function(index) { 
				/** Returns the 'index'th object */ 
			},
			getObjects: function(start, end) { 
				/** Returns a js/Deferred */ 
			},
			getMonitor: function(start, end) { 
				/** Returns a ./SourceMonitor */ 
			},
			releaseMonitor: function(monitor) {},
			isActive: function() {
				return true;
			},
			isBusy: function() {
				return false;
			},
			isDirty: function() {},
			notifyEvent: function(event, data) {},
			getAttributeNames: function() {},
			getAttributeValue: function(name, index) {},
			setAttributeValue: function(name, value, index) {}
		},

		/**
		 *
		 */
		statics: {

			State: SourceState,
			Event: SourceEvent
		},

		Pending: {}

	};

//	return (Source = Interface.define(require, Source));
	return Source;
});