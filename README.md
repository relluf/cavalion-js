# cavalion-js

## TL;DR:

Cavalion common JavaScript library.

## src/js.js

* Entry point for RequireJS

		require.config({ paths: { js: "`${npm("cavalion-js")}`/src/js"}})

		require("js");