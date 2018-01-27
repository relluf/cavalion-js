define(function() {

	var requested = false;

	return {

		request: function(element) {
		    if (element.requestFullscreen) {
		        element.requestFullscreen();
		    } else if (element.mozRequestFullScreen) {
		        element.mozRequestFullScreen();
		    } else if (element.webkitRequestFullscreen) {
		        element.webkitRequestFullscreen();
		    } else if (element.msRequestFullscreen) {
		        element.msRequestFullscreen();
		    }
		    requested = true;
		},

		exit: function() {
		    if (document.exitFullscreen) {
		        document.exitFullscreen();
		    } else if (document.mozCancelFullScreen) {
		        document.mozCancelFullScreen();
		    } else if (document.webkitExitFullscreen) {
		        document.webkitExitFullscreen();
		    }
		},

		getElement: function() {
			return document.fullscreenElement ||
				document.mozFullScreenElement ||
				document.webkitFullscreenElement ||
				document.msFullscreenElement;
		},

		isFullscreen: function() {
			return !!this.getElement();
		},

		hasRequested: function() {
			return requested;
		},

		addChangeEventListener: function(listener, capture) {
		    if (document.exitFullscreen) {
		        document.addEventListener("fullscreenchange", listener, capture);
		    } else if (document.mozCancelFullScreen) {
		        document.addEventListener("mozfullscreenchange", listener, capture);
		    } else if (document.webkitExitFullscreen) {
		        document.addEventListener("webkitfullscreenchange", listener, capture);
		    } else if (document.msExitFullscreen) {
		        document.addEventListener("msfullscreenchange", listener, capture);
		    }
		},

		removeChangeEventListener: function(listener) {
		    if (document.exitFullscreen) {
		        document.removeEventListener("fullscreenchange", listener);
		    } else if (document.mozCancelFullScreen) {
		        document.removeEventListener("mozfullscreenchange", listener);
		    } else if (document.webkitExitFullscreen) {
		        document.removeEventListener("webkitfullscreenchange", listener);
		    } else if (document.msExitFullscreen) {
		        document.removeEventListener("msfullscreenchange", listener);
		    }
		}

	};

});