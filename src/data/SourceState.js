/**
 * SourceState.js
 */
define(function(require) {
	return {
		busy: 0x0001,
	//	opening: 0x0002,
	//	closing: 0x0004,
	//	deleting: 0x0008,
	//	posting: 0x0010,
	//	canceling: 0x0020,
	//	scrolling: 0x0040,
		updating: 0x0080,
		active: 0x0100,
		readOnly: 0x0200,
	//	editing: 0x0400,
	//	appending: 0x0800,
		eof: 0x1000,
		bof: 0x2000,
		hasAttributes: 0x4000,
		objectChanged: 0x8000
	};
});
