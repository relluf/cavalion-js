// console.log("deprecate me");
define(function(require) {

	var Deferred = require("js/Deferred");
	var js = require("js");
	var Ajax = require("./Ajax");

	return {

		basePath: "",

		/**
		 *
		 */
		getQueryString: function(obj) {
			var str; str = [];
			for(var k in obj) {
				if(obj[k] !== undefined) {
					str.push(String.format("%s=%s", k, window.escape(
							obj[k]).replace(/\+/g, "%2B")));
				}
			}
			return str.join("&");
		},

		/**
		 *
		 */
		execute: function(command, params, content, parse) {
			var deferred = new Deferred();
			var request = {
				command: command,
				params: params,
				content: content
			};
			var POST = command.indexOf("POST:") === 0;
			if(POST) {
				command = command.substring(5);
			}

			if(typeof content !== "string") {
				content = JSON.stringify(content);
			}
			if(typeof params !== "string") {
				params = this.getQueryString(params || {});
			}

			var uri = String.format("%s%s%s%s", this.basePath, command,
					command.indexOf("?") === -1 ? "?" : "", params);

			var args;
			args = [uri, content, function(resp, req, uri) {
				try {
					var result = parse !== false ? JSON.parse(resp) : resp;
					request.result = result;
					request.req = req;
					request.uri = uri;
					if(req.status >= 200 && req.status < 300) {
						deferred.callback(result);
					} else {
						var msg = String.format("%d - %s", req.status, result.message);
						deferred.errback(js.mixIn(new Error(msg), {
							status: req.status,
							result: result,
							request: request
						}));
					}
				} catch(ex) {
					if(deferred.fired === -1) {
						var obj = {
								status: req.status,
								response: "" + resp,
								request: request,
								exception: ex
							};

						if(obj.response.indexOf("<html") === 0) {
//							var node = document.createElement("div");
//							node.innerHTML = obj.response;
//							obj.response = node.textContent;
						}
						if(req.status === 0) {
							deferred.errback(js.mixIn(new Error("Fatal: No network"), obj));
						} else {
							deferred.errback(js.mixIn(new Error(
									String.format("Fatal: Invalid response from server (%d)",
											req.status)), obj));
						}
					}
				}
			}, true];

			// no content? -> GET otherwise POST
			if(!POST && args[1] === undefined) {
				args.splice(1, 1);
				Ajax.get.apply(Ajax, args);
			} else {
				Ajax.post.apply(Ajax, args);
			}
			return deferred;
		}
	};

});
