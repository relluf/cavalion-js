define(function() {

	return {

		/**
		 * This value may be returned by {Ajax.get}, {Ajax.post} and/or {Ajax.request}
		 * indicating that a HTTP request has failed.
		 */
		REQUEST_FAILED: {},

		/**
		 * Returns a XMLHttpRequest object instance. Note: The first time this function is
		 * called it will reset the function referenced by {Command.getXMLHttpRequest}.
		 */
		getXMLHttpRequest: function() {
	        var tryThese; tryThese = [
	            function () { return new XMLHttpRequest(); },
	            function () { return new ActiveXObject('Msxml2.XMLHTTP'); },
	            function () { return new ActiveXObject('Microsoft.XMLHTTP'); },
	            function () { return new ActiveXObject('Msxml2.XMLHTTP.4.0'); },
	            function () {
	                throw new Error("Browser does not support XMLHttpRequest");
	            }
	        ];
	        for (var i = 0; i < tryThese.length; i++) {
	            var func = tryThese[i];
	            try {
	                this.getXMLHttpRequest = func;
	                return func.apply(this, []);
	            } catch (e) {
	                // pass
	            }
	        }
	        return this.getXMLHttpRequest();
		},

		/**
		 * Performs a HTTP request for the specified uri. The method can be blocking or non-blocking.
		 * In order to be non-blocking the user must specify a callback function for the parameter
		 * async_cb.
		 *
		 * @param method
		 * @param uri
		 * @param async_cb
		 * @param fail_ok
		 * @param content
		 * @returns
		 */
		request: function(method, uri, async_cb, fail_ok, content) {
		    var req = this.getXMLHttpRequest();
		    if (async_cb !== undefined) {
		        req.onreadystatechange = function() {
		        	if (4 === req.readyState && req.status !== undefined) {
		        		if (fail_ok === true || (req.status >= 200 && req.status < 300)) {
		        			async_cb(req.responseText, req, uri);
		        		} else {
	        				throw new Error("Failed to request " + uri);
		        		}
		        	}
		        };
		    }
		    req.open(method, uri, async_cb !== undefined ? true : false);
		    if(typeof req.overrideMimeType === "function") {
			    req.overrideMimeType("application/json");
		    }
		    req.setRequestHeader("Content-Type", "application/json");
		    try {
		        req.send(content || null);
			    if(async_cb === undefined && (req.status < 200 || req.status >= 300)) {
			    	if(fail_ok) {
			    		return undefined;
			    	}
			    	var err = new Error(req.status + " - " + uri);
			    	err.request = req;
			    	throw err;
			    }
			    return async_cb !== undefined ? undefined : req.responseText;
		    } catch (e) {
		        if (fail_ok === true && async_cb === undefined) {
		            return this.REQUEST_FAILED;
		        } else {
		        	throw e;
		        }
		    }
		},

		/**
		 * Lowlevel method to get a resource (using the HTTP GET method).
		 * The method can be blocking or non-blocking. In order to be non-blocking the
		 * user must specify a callback function for the parameter
		 * async_cb.
		 *
		 * @param uri
		 * @param async_cb
		 * @param fail_ok
		 * @returns
		 */
		get: function(uri, async_cb, fail_ok) {
			return this.request("GET", uri, async_cb, fail_ok);
		},

		/**
		 * Lowlevel method to get a resource (using HTTP POST method).
		 * The method can be blocking or non-blocking. In order to be non-blocking the
		 * user must specify a callback function for the parameter
		 * async_cb.
		 *
		 * @param uri
		 * @param content
		 * @param async_cb
		 * @param fail_ok
		 * @returns
		 */
		post: function(uri, content, async_cb, fail_ok) {
			return this.request("POST", uri, async_cb, fail_ok, content);
		}
	};
});