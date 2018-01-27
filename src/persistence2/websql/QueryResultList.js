define(function(require) {

	var ns = require("namespace!.");
///	var js = require("js");

	var ResultList = require("../ResultList");


	var QueryResultList = ns.Constructor.define("./QueryResultList", {

		Extends: ResultList,

		/**
		 *
		 * @param objs
		 */
		QueryResultList: function(objs, query) {
			this._query = query;
		},

		Prototype: {
		}

	});

	return QueryResultList;

});