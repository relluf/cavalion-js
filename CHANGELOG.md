### `2026/03/16` 1.0.85 Formatting and entity expansion updates

**console/node/vcl/Component.js**:

* Adds root-component console rendering with `uri#hashCode`
* Keeps non-root `Component` labels unchanged; still shows `:root` and `:selected` markers.
* **Breaking**: code using `expand.Entity(...)` must migrate to `expand.newEntity(...)`.

**entities/expand.js**:

* Renames `expand.Entity` to `expand.newEntity` in 
* Adds `expand.DefaultEntity` for generic alias-based `join()` and `expand()` behavior.
* Improves `expand.attributes4()` fallback handling for unknown entity relations and single-item tuple paths.
* Extends `prefixId()` to preserve `count:id` selectors without prepending `id,`.

**js/_js.js**:

* Adds `js.qq(a, b)` for nullish fallback values.
* Fixes `String.format()` width and padding behavior for `%d`, including negative zero-padded numbers.
* Fixes `String.format()` float formatting for `%f`, including width, precision, and negative values.
* Fixes string alignment in `String.format()` for `%s`/`%H`/`%n`; left/right padding now behaves consistently.
* Improves `%` specifier parsing to stop safely at end-of-format input.
* Adjusts numeric formatting to return the original positive value when fixed `"0000"` formatting collapses to `"0"`.

**locale.js**:

* Adds `locale.prefixed(...).prefixed(...)` chaining in `src/locale.js`.
* Fixes prefixed locale fallback output so missing keys do not duplicate the prefix.


### `2026/02/05` Introducing entities.expand

It turns `expand.js` from a small “string builder” helper into a mini expansion/join framework.

* **Before:** the module essentially returned a function that, given an attribute (or list of attributes) plus a `path`, produced strings like `path.attr`, with some support for comma lists, aliases (`"id foo"`), and typed prefixes (`"Type:attr"`). Arrays were turned into a **comma-joined string**.

* **Now:** it exports a reusable `expand(expanderFn, as, path)` function plus an **`Entity` factory** (`expand.Entity(...)`) that builds an object representing an entity with:

  * **Named expanders** generated from a `paths` map (so you can call `Entity.bedrijf("id")` and get `meetpunt.onderzoek.bedrijf.id`).
  * A **`join(alias, attributes)`** method that resolves a join alias (case-insensitive) to one of those expanders via a mapping; unknown aliases now **throw an error**.
  * An **`expand(...)`** convenience method that expands multiple attributes using `expand.attributes4(...)`.

* **Normalization changes:**

  * Comma-separated strings are split and **trimmed**.
  * If `as` is an array, it maps each item through the expander and returns an **array** (not a comma-joined string).
  * There’s a helper that **auto-prefixes `"id"`** (e.g., ensures `"id"` is included in expansions) and supports mixed input shapes (strings and `[expanderName, attrs]` tuples).

Overall, it standardizes how “expand fields” and “join expansions” are defined and executed, moving from ad-hoc string concatenation to an entity-centric API with explicit alias resolution and stricter error handling.

### `2026/01/18` - 1.0.84

EM now uses the browser’s fetch API instead of jQuery. 

Serialization/deserialization is reworked to support circular references via reference tracking, and small usability helpers were added for clipboard text access and synchronizing element CSS classes.

Several core methods were changed and/or expanded:

* grouping can be keyed by a function, 
* identity lookups are supported, 
* sorting and number formatting are more defensive, 
* and naming heuristics recognize more label-like fields. 

#### New

* **[entities/expand.js](src/:)** adds a helper that expands an “as” spec into a mapped string: it accepts a single value, a comma-list, or an array, and supports optional aliasing and `ns:path.field` formatting. 
* **[util/Queue.js](src/:)** adds a promise-based FIFO queue with a **concurrency limit**, plus `whenIdle()` to await drain. z
* **[util/EventEmitter.js](src/:)** adds a lightweight event-emitter mixin (`on`, `un`, `once`, `emit`) that stores handlers on a configurable property (default `"handlers"`). 


#### Label support + minor fallback tweak

- Improves [nameOf.js](src/js/:) value selection to also consider `label` alongside existing name/description fields.
- Keeps existing priority order (`id*` → remark → name-ish → title-ish), now including `label` in both lower/upper-case variants.
- Tweaks the no-constructor fallback string from `"<Native?>"` to `"<Native<?>>"`.
- Adds inline notes for a potential future recursion/cycle-safe naming helper (comment-only, no behavior change).


#### Safer generalized sorting + numeric formatting guard

- Makes `Array.sortValues` definition conditional (only defines it if not already present).
- Introduces explicit type-priority ordering for mixed-type sorts (undefined/null/boolean/number/string/object/function/symbol).
- Adds special-case comparison for arrays: sorts by `length` when both operands are arrays.
- Normalizes comparator return values to `-1/0/1` for stability and consistent ordering.
- Hardens object comparison by wrapping `stringify(...)` in try/catch and logging failures instead of throwing.
- Adds a fallback branch for unhandled types in `sortValues` (warns and returns equality).
- Updates `Math.f(n, d)` to only apply formatting heuristics when `n` is numeric; otherwise returns `n` unchanged.


#### Changes

- Refactors `EM.query(...)` in `src/entities/EM.js` to use `fetch` + `URLSearchParams` instead of `jquery.ajax`.
- Extends `js.groupBy(arr, key)` to accept a key function in `src/js/_js.js`.
- Breaking: switches `js.sj` / `js.pj` from `JSON.stringify` / `JSON.parse` to `serialize.serialize` / `serialize.deserialize` (handles `$ref` circular references).
- Adds `js.get(".")` to return the input object unchanged (identity accessor).
- Makes `Array.sortValues` definition conditional and adds type-aware ordering + array-length comparison in `src/js/extensions.js`.
- Hardens `Math.f(n, d)` to only apply string-based formatting when `n` is numeric; otherwise returns input unchanged.
- Expands `js.nameOf(...)` matching to include `label` fields and adjusts “native” fallback string to `"<Native<?>>"`.
- Replaces `src/js/serialize.js` export with `{ serialize, deserialize, isKeyword, keyNeedsEscape }` and implements `$ref`-based encode/decode for repeated objects.
- Adds `Clipboard.getText()` / `Clipboard.setText()` aliases and extends `Clipboard.paste(cb)` to optionally callback with pasted text.
- Adds `HtmlElement.syncClasses(node, classes, values)` to toggle CSS classes from booleans/functions and return changed class names.
- Applies minor style/semicolon fixes in `src/stylesheet.js`; adds commented Chrome iframe resize hack in `src/util/Browser.js` (no runtime change).

### `2025/04/03` - 1.0.83

* Introduces Array.moveItem 
* Updates js.set to handle escaped dots properly 
* Adds a delay of 2750ms before refresing LESS definitions

### `2024/11/08` - 1.0.82

* Service build in favor of cavalion-code

### `2024/11/01` - 1.0.81

* Adds Array.sortValues 
* Adds Date.format (USE IT! ;-)) 
* Fixes/prepares js.nameOf() for some exotic use case with dropped files

### `2024/07/07` - 1.0.79

* Removes `Array.prototype.last` and -`first`
* Improves beautifying XML sources and error detection during (uhm)

### `2024/05/16` - 1.0.78

* Adds Array.fn.nonNil
* Introduces js.eval

### `2024/03/24` - 1.0.77

* Introduces util/Text

### `2023/09/30` - 1.0.76

* Fixes a solid bug, in _JsObject.prototype.setProperties()_, sure why not?

### `2023/06/30` - 1.0.75

* Introduces locales.mixIn, prefixed.has()
* Ensures that Printer.prottype.print returns the printed value 
* Refactores String.escape to use JSON.stringify

### `2023/06/30` - 1.0.74

* Introduces `locale.has()`

### `2023/03/01` - 1.0.73

* Introduces `js.mi` alias for `js.mixIn`
* Fixes a bug in `js.sf` (ie. String.format) where specifiers where not handled correctly for %X.Yf like formats

### `2022/11/15` -  1.0.72

* DocumentHook: Adds the events onmouseover and onmouseout

### `2022/11/07`

* Adds `js.waitAll()`

### `2022/07/28` 10/29 -  1.0.71

* Adjusts/enhances `js.groupBy()` to use js.get(key,obj) in case obj doesn't have key
* !!!???? Implements the support for falling back automatically ([CVLN-20220901-2-](/Dropbox-cavalion/Issues/:/))
fixes a bug where falling back on wildcarded terms was not working correctly

### `2022/07/28` -  1.0.70

* 2bb8d17 - updates/commits code that has been shipped for months now
* dc8fb8d - enhances js.groupBy for grouping on multiple attributes
* caa9abc - adds hint parameter to js.nameOf
* 004cc0f - clogs the latest changes

### `2022/03/28` -  1.0.69

* e3ce126 - Clogging
* 0d7badc - js/JsObject: Still refactoring [all !==> references (!)]

### `2022/03/28` -  1.0.68

* Updating 

### `2022/01/02` -  1.0.67

* Introducing `js.nameOf.methods.set(name, impl)` - it allows for overriding/extending a certain method iteratively

### `2021/12/17` -  1.0.66

- Enhancing `locale`, now supporting references with the ::-prefix

### `2021/10/09` -  1.0.65

- Now supporting the following patterns: 
 
	>	var locale = require("locale").prefixed(["Onderzoek"], { ... });
	>	var locale = require("locale").prefixed("Onderzoek");

Not sure what todo with the default yet.

### `2021/09/18` -  1.0.64

- Introducing `String.decamelize = String.decamelcase`

### `2021/06/21` -  1.0.63
- Introducing `js.groupBy()`

### `2021/03/12` -  1.0.62
- util/Xml: Introducing `jsonfy()`

### `2021/02/07` -  1.0.61
- locale: Fix for using /-prefixed paths 

### `2021/01/24` -  1.0.60
- Adding extensions to Math in order to deal with floating points

### `2021/01/22` -  1.0.59
* Introducing `js.trim()` - get rid of undefined keys

### `2020-11-11` - 1.0.58
- Refactoring js.nameOf.methods => veldapps-xml /- also added some lamish debug/test feature to see which method is being used 

### `2020-11-06` - 1.0.57
- Adding minimal packing support through js/Packer.[un]pack(ace/string)

### `2020-10-28`
- Editor<xml>/DetailViews: Working towards base class / integration .blocks features

### `2020-10-19` - 1.0.56
- Added more `js.nameOf`-methods

### `2020-10-07` - 1.0.55
- Introducing `js.nameOf.methods.after` (I guess we need priorities?)

### `2020-09-12` - 1.0.54
- Adding JSON-shortcuts to `js`, ie. `js.sj` & `js.pj`

### `2020-08-29` - 1.0.53
- Fixing uri display of vcl/Component-s in console
- Developing console features, working on vcl/Component.uri property

### `2020-08-27` - 1.0.52

	src/console/node/Function.js
	src/console/node/OnlyKey.js
	src/util/HotkeyManager.js

### `2020-08-18` - 1.0.51
- Adding Array.as

### `2020-08-05` - 1.0.50
- Adding default js.nameOf() method

### `2020-07-05` - 1.0.48 `#local-changes`
- Welcoming `ArrayFactory` to the family (_well yeah, hey, every drop counts and besides, now it's always there_)
- Prefixed `locale` functions now return their prefix by calling without arguments

### `2020-06-16` - 1.0.47

- Fixing `js.str2obj()` so it accepts just a key and it's value set to true - not sure whether the semi-colon should be obligated...

### `2020-06-12` - 1.0.46

- Enhancing `js.str2obj()` so it accepts just a key and it's value set to true - not sure whether the semi-colon should be obligated...

### `2020-06-10` - 1.0.45
- Decided not to mess with Array's prototype (1.0.34 cancelled)

### `2020-06-02` - 1.0.44
- Having some trouble with the HexaQuad due to Vectorklic.app (hoe heeft het ooit kunnen werken? - werd dus niet (meer) gebruikt!)
- Bugfix in EM.arrayOfAll

### `2020-05-13` - 1.0.42
- Improving locale so that arrays are used to wrap object values (which otherwise would be parsed out)

>> ![image](https://user-images.githubusercontent.com/686773/81868210-998b3b00-9537-11ea-9599-ca7eb57edfce.png?2x)

### `2020-05-10` - 1.0.40
- Promise: Featuring new class definition pattern

>> ![image](https://user-images.githubusercontent.com/686773/81533306-97ed2780-932b-11ea-8289-b2837dfa753a.png?2x)

- Method.copy_args: Optionally mixin callee
- js.nameOf: Now specifically handling Window
- locale: Paving the way for formatting

### `2020-04-28`
- js.copy_args: callee optional added

### `2020-04-14` - 1.0.38
- js/nameOf: adding `@_name` as default name attribute"
 
### `2020-04-09` - 1.0.37
- json.js: Fix for: Error: Loader plugin did not call the load callback in the build
### `2020-01-27` - 1.0.36
- Introducing 'yell'

### `2020-01-22` - 1.0.35
- Introducing parameter `include_q` for static `util/net/Url.obj2qs`

### `2019-11-29`  [1.0.33]
- Fixed Alt+Click in console/Node

### `2019-10-22`  [1.0.32]
- Adding locale.slashDotRepl option (default: false)

### `2019-07-18`  [1.0.30]
- Making nl the default locale
- Fighting the localStorage.locale bug, removed feature - apps should do this seperately (AND FOOLPROOF! ;-)

### `2019-07-14`  [1.0.29]
- Enhancing `js.get()`, 1st argument can be an array of strings or a string which will be splitted by dot (`.`)

### `2019-06-07`  [1.0.27]
- Working on ES6 module support

### `2019-05-25`  [1.0.26]
- `locale!/` implemented in order to prevent locale_base

### `2019-05-18`  [1.0.22]
- Introducing locale.prefixed

### `2019-05-09`  [1.0.21]
- Introducing js.ctx and js.sf

### `2019-03-31` [1.0.19]
- Fixed a typo/bug, in destroy() method, wtf...
- Added support for distinct and raw queries (entities/EM)

### `2019-02-18` [1.0.18]
- Improving console (in another dimension vcl:ui)

### `2019-02-17` [1.0.17]
- Fixed a bug in `js.get()` [OMG!]

### `2018-12-15` [1.0.16]
- Fix in locale.js (for building cavalion-code)

### `2018-12 [1`.0.14]
- Fix in js/Scaffold (like a temp hack)
- Fix in locale.js (for building cavalion-code)

### `2018-10-10`
- Introducing json!

### `2018-08-22` [1.0.6]
- locale: Always looking for prototype

### `2018-05-21`
- Fix for normalizing relative to /-paths
- Fix for class names with dashes
- Finetuning DocumentHook's wheelEvents

### `2018-03-21`
- Springly commit

### `2018-02-28`
- Fixed a bug which caused `specializer_classes` not be applied on components. Eg. `devtools/Workspace<Veldoffice.ralph>` would only apply `devtools/Workspace<Veldoffice>`)
- Fixed a bug where `vcl/Component.getImplicitBaseByUri()` would return duplicate bases

### `2018-02-27`
- Introducing `Component.prototype.vars`
- Minor fix for Component.query
- Fix for vcl-ui/Node performance

### `2018-02-12`
- Fixing expanded/expandable bugs for vcl-ui/Node
- Looking into performance of vcl-ui/Node and vcl-ui/List
- Introducing **vcl-ui/Console.evaluate**
- Adding onEvent style to Component.properties.handlers

### `2018-02-07` [1.0.2]
* **vcl/Factory** - Removed Method.trace-ing
* **vcl-ui/List* ** - Worked on List-classes - not really improved, lacks speed
* Fixed now longer functioning cavalion.org/databind
* Enhancing `inter-component-ness` as shown below here on lines 81 and 82:

> __vcl-comps/code/Navigator.js__:  
![](https://snag.gy/RExQgN.jpg)

>![](https://snag.gy/9JvVph.jpg)

>![](https://snag.gy/zqGH8t.jpg)

### `2018-02-04`

* "vcl-ui/List" == "vcl/ui/List"

![](https://snag.gy/Go6mKe.jpg)

### `2018-02-02`
- Improving vcl/ui/Tree: Vertical alignment, removed bottom padding for the selected item

![](https://snag.gy/VRr5BK.jpg)

### `2018-01-26`
- Exploring Git

### `2018-01-21`
- Developing vcl/entities/Query and descendants
- Start developing ListOf
- Finetuning code structures and styles (standard library?)

### `2018-01-08`
- Developing Veldoffice entities client

### `2018-01-02`
- Giving some love to vcl/Component::handlers and ::overrides
- vcl/Factory now catching eval errors
- vcl/ui/Printer now supports native Promise (js/Deferred.prototype.then())
- entities/Model.parse() now resolves models
- Added loaded event for Component::onLoad
- Developing veldoffice/Session, veldoffice/EM and veldoffice/models
- Adding locale

### `2017-11-04`
- devtools/Workspace: Added query close for tabs
- devtools/Editor<html>: First steps to specific [uri=*.\.page/\.html] editor

### `2017-10-18`
- Improved context handling with Pages and App7.loadPage (basically it's all back to url_query again, but that's a good thing :-))
- EM.query: When omitted pagesize will default to 50

### `2017-10-15`
- Pages: Removing obligatory less resource. It seems these are hardly used and can always be required by the conroller module
- Commiting in favor of V7

### `2017-10-11`
- Code: new release

### `2017-10-08`
- V7: Releasing build 126
- stylesheet! - now supporting less
- Embracing Template7, setting up context before loading page

### `2017-10-02`
- Editor<html>: Restoring scroll position upon changes in the source code

### `2017-08-11`
- Component.query: Added toggleClass()
- Query.events: Added "event"
- vcl/data/Pouch: Finetuning, developing...
- vc/prototypes/App.framework7: Adding debug support
- vcl/ui/Panel: Finetuning zoom
- entities/EM: Developing, finetuning
- Resolved: #1297

### `2017-07-01`
- Introducing vcl/ui/Panel (might move upwards in the class hierarchy) zoom (cool feature!!)

### `2017-06-24`
- Adding vcl/data/Pouch in the mix
- Optmizing performance for vcl/ui/List icw vcl/data/Array
- Fixing (workaround) some weird bug with Function.prototype.toString

### `2017-06-20`
- Updating code base

### `2017-04-23`
- Improving make/Build

### `2017-03-16`
- Reorganized JavaScript libraries
- Conformed code/devtools to new struture
- Currently working on:
	- eae.com/BBT/appx
	- veldapps.com/code
	- cavalion.org/devtools
	- veldapps.com/V7
	- veldapps.com/vcl-rapportage-module

### `2017-03-11`
- Getting rid of cavalion.org/... module requires, now using relative paths within cavalion.org sources/modules

### `2017-03-07`
- Removed [id^=vcl-] from Control CSSRules selector
- Making FormContainer work with relative formUris

### `2017-03-04`
- Optimizing code for folding features in Ace
- Fixing bugs for not being comptabile with IE
- Refresh button in ui/entities/Query
- Time for cavalion.org/Command to go away - jquery.ajax should be sufficient
- Deprecating App.scaffold

### `2017-02-28`
- Working on entities/Instance <--> model, how to receive sets/one-to-many collections from server?
- Fixing scaffolding issues. No longer a-synchronous. All scaffold code should run *before* onLoad.
- Explicit express in code that an certain component should be scaffolded, eg.:
	- View<Measurement>: $(["ui/entities/Query<Measurement>.scaffold"], {}, []);
	- View<Modem>: $(["ui/entities/Query<Modem>.scaffold"], {}, []);
- Working on nesting operators for Component.prototype.qsa
- Working on vcl/Control's update bug
- Introducing vcl/Action:onUpdate
- Bugfixing vcl/entities/Query; tuples vs instances
- Improving vcl/ui/FormContainer with new API swapForm()
- Simplyfing CSS fonts

### `2017-02-25`
- Bug fixed where parent could not be nulled in a vcl resource
- Refactoring/bugfixing scaffolding

	$(["View<Logger>.select"]);

### `2017-02-24`
- Bugfixing vcl/Control.update, where controls could be updated while not anticipated for and leave them in a inconsistent state in relation to the DOM (mailny they would be removed from the DOM)
- Implementing scaffolding in vcl/Factory
- Added nesting operator (<) to vcl/Component.query, indicating to parent/child relationship

### `2017-02-23`
- Integrated Dygraphs for visualizing measurements in a interactive timeline
- Keeping UI as simple as possible
- Refactoring vcl/prototypes/App.v1 to multiple classes, like .openform, .console (developing)
- Adding component name in DOM node classes, prefixed by a #-sign
- Refer to component names in css definitions (# --> \\#)

### `2017-02-17`
- Developing ui/entities/Query, ./QueryFilters, ./AttributeInput
- Finetuning Component.qs, still need a good operator for controls

### `2017-02-14`
- Working on vcl/ui/Input
	- toInputValue/fromInputValue

### `2017-02-02`
- Reformatting code to be better suited for folding features in the editor
- Console: Introducing req()
- vcl/Component.prototype.setVars: Now allowing a string as input (js.str2obj)
