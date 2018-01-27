define(function(require) {

	var LargeIcon = require("js/defineClass");
	var Element = require("./Element");
	var Type = require("js/Type");

	return (LargeIcon = LargeIcon(require, {

		inherits: Element,

		prototype: {

			'@css': {
				display: "inline-block",
				margin: "20px",
				"vertical-align": "top",
				"&:hover": {
					"div.padding": {
						padding: "9px",
						border: "1px solid silver",
						cursor: "pointer",
						"background-color": "#f0f0f0"
					}
				},
				"div.padding": {
					padding: "10px",
				},
				"div.text": {
					"max-height": "60px",
					overflow: "hidden"
				},
				"div.caption": {
					"font-size": "12pt",
					"font-weight": "bold",
					"text-decoration": "underline"
				}
			},

			/**
			 * @overrides Control.prototype
			 */
			_width: 300,
			_height: 150,

			_allowHtmlMarkup: true,

			_caption: "",
			_text: "",
			_image: "",

			/**
			 * @overrides Control.prototype._innerHtml
			 */
			getInnerHtml: function() {
				if(this._allowHtmlMarkup === true) {
					return String.format(
						"<div class=\"padding\">" +
							"<div class=\"image\" style=\"float: left; margin-right: 8px;\">" +
								"<img align=\"absmiddle\" style=\"width: 48px; height: 48px;\" src=\"%s\"></img>" +
							"</div>" +
							"<div class=\"caption\">%s</div>" +
							"<div class=\"text\">%s</div>" +
						"</div>",

						this._image, this._caption, this._text);
				} else {
					return String.format(
						"<div class=\"padding\">" +
							"<div class=\"image\" style=\"float: left; margin-right: 8px;\">" +
								"<img align=\"absmiddle\" style=\"width: 48px; height: 48px;\" src=\"%s\"></img>" +
							"</div>" +
							"<div class=\"caption\">%H</div>" +
							"<div class=\"text\">%H</div>" +
						"</div>",

						this._image, this._caption, this._text);
				}
			},

			/**
			 * @overrides Control.prototype.initializeNodes
			 */
			initializeNodes: function() {
				this.inherited(arguments);

				this._nodes.image = this.getChildNode(0, 0, 0);
				this._nodes.caption = this.getChildNode(0, 1);
				this._nodes.text = this.getChildNode(0, 2);
			},

			/**
			 * @overrides Control.prototype.isHoverable
			 */
			isHoverable: function(node) {
				return node !== this._node;
			},

			/**
			 *
			 */
			getCaption: function() {
				return this._caption;
			},

			/**
			 *
			 */
			setCaption: function(value) {
				if(this._caption !== value) {
					this._caption = value;
					if(this._nodes !== null) {
						this._nodes.caption.childNodes[0].nodeValue = value;
						this.contentChanged();
					}
				}
			},

			/**
			 *
			 */
			getImage: function() {
				return this._image;
			},

			/**
			 *
			 */
			setImage: function(value) {
				if(this._image !== value) {
					this._image = value;
					if(this._nodes !== null) {
						this._nodes.image.src = value;
						this.contentChanged();
					}
				}
			},

			/**
			 *
			 */
			getText: function() {
				return this._text;
			},

			/**
			 *
			 */
			setText: function(value) {
				if(this._text !== value) {
					this._text = value;
					if(this._nodes !== null) {
						if(this._allowHtmlMarkup === true) {
							this._nodes.text.innerHTML = value;
						} else {
							this._nodes.text.childNodes[0].nodeValue = value;
						}
						this.contentChanged();
					}
				}
			}

		},

		/**
		 * Property definitions
		 */
		properties: {
			"caption":		{ set: Function, type: Type.STRING },
			"text":			{ set: Function, type: Type.STRING },
			"image":		{ set: Function, type: Type.STRING },

//			"height":		{ set: Function, type: js.lang.Type.INTEGER, stored: Function },
//			"width":		{ set: Function, type: js.lang.Type.INTEGER, stored: Function }
		}


	}));
});