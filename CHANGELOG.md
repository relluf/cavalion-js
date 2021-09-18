### 2021/09/18 -  1.0.64

- Introducing `String.decamelize = String.decamelcase`

### 2021/06/21 -  1.0.63
- Introducing `js.groupBy()`

### 2021/03/12 -  1.0.62
- util/Xml: Introducing `jsonfy()`

### 2021/02/07 -  1.0.61
- locale: Fix for using /-prefixed paths 

### 2021/01/24 -  1.0.60
- Adding extensions to Math in order to deal with floating points

### 2021/01/22 -  1.0.59
* Introducing `js.trim()` - get rid of undefined keys

### 2020-11-11 - 1.0.58
- Refactoring js.nameOf.methods => veldapps-xml /- also added some lamish debug/test feature to see which method is being used 

### 2020-11-06 - 1.0.57
- Adding minimal packing support through js/Packer.[un]pack(ace/string)

### 2020-10-28
- Editor<xml>/DetailViews: Working towards base class / integration .blocks features

### 2020-10-19 - 1.0.56
- Added more `js.nameOf`-methods

### 2020-10-07 - 1.0.55
- Introducing `js.nameOf.methods.after` (I guess we need priorities?)

### 2020-09-12 - 1.0.54
- Adding JSON-shortcuts to `js`, ie. `js.sj` & `js.pj`

### 2020-08-29 - 1.0.53
- Fixing uri display of vcl/Component-s in console
- Developing console features, working on vcl/Component.uri property

### 2020-08-27 - 1.0.52

	src/console/node/Function.js
	src/console/node/OnlyKey.js
	src/util/HotkeyManager.js

### 2020-08-18 - 1.0.51
- Adding Array.as

### 2020-08-05 - 1.0.50
- Adding default js.nameOf() method

### 2020-07-05 - 1.0.48 `#local-changes`
- Welcoming `ArrayFactory` to the family (_well yeah, hey, every drop counts and besides, now it's always there_)
- Prefixed `locale` functions now return their prefix by calling without arguments

### 2020-06-16 - 1.0.47

- Fixing `js.str2obj()` so it accepts just a key and it's value set to true - not sure whether the semi-colon should be obligated...

### 2020-06-12 - 1.0.46

- Enhancing `js.str2obj()` so it accepts just a key and it's value set to true - not sure whether the semi-colon should be obligated...

### 2020-06-10 - 1.0.45
- Decided not to mess with Array's prototype (1.0.34 cancelled)

### 2020-06-02 - 1.0.44
- Having some trouble with the HexaQuad due to Vectorklic.app (hoe heeft het ooit kunnen werken? - werd dus niet (meer) gebruikt!)
- Bugfix in EM.arrayOfAll

### 2020-05-13 - 1.0.42
- Improving locale so that arrays are used to wrap object values (which otherwise would be parsed out)

>> ![image](https://user-images.githubusercontent.com/686773/81868210-998b3b00-9537-11ea-9599-ca7eb57edfce.png?2x)

### 2020-05-10 - 1.0.40
- Promise: Featuring new class definition pattern

>> ![image](https://user-images.githubusercontent.com/686773/81533306-97ed2780-932b-11ea-8289-b2837dfa753a.png?2x)

- Method.copy_args: Optionally mixin callee
- js.nameOf: Now specifically handling Window
- locale: Paving the way for formatting

### 2020-04-28
- js.copy_args: callee optional added

### 2020-04-14 - 1.0.38
- js/nameOf: adding `@_name` as default name attribute"
 
### 2020-04-09 - 1.0.37
- json.js: Fix for: Error: Loader plugin did not call the load callback in the build
### 2020-01-27 - 1.0.36
- Introducing 'yell'

### 2020-01-22 - 1.0.35
- Introducing parameter `include_q` for static `util/net/Url.obj2qs`

### 2019-11-29  [1.0.33]
- Fixed Alt+Click in console/Node

### 2019-10-22  [1.0.32]
- Adding locale.slashDotRepl option (default: false)

### 2019-07-18  [1.0.30]
- Making nl the default locale
- Fighting the localStorage.locale bug, removed feature - apps should do this seperately (AND FOOLPROOF! ;-)

### 2019-07-14  [1.0.29]
- Enhancing `js.get()`, 1st argument can be an array of strings or a string which will be splitted by dot (`.`)

### 2019-06-07  [1.0.27]
- Working on ES6 module support

### 2019-05-25  [1.0.26]
- `locale!/` implemented in order to prevent locale_base

### 2019-05-18  [1.0.22]
- Introducing locale.prefixed

### 2019-05-09  [1.0.21]
- Introducing js.ctx and js.sf

### 2019-03-31 [1.0.19]
- Fixed a typo/bug, in destroy() method, wtf...
- Added support for distinct and raw queries (entities/EM)

### 2019-02-18 [1.0.18]
- Improving console (in another dimension vcl:ui)

### 2019-02-17 [1.0.17]
- Fixed a bug in `js.get()` [OMG!]

### 2018-12-15 [1.0.16]
- Fix in locale.js (for building cavalion-code)

### 2018-12 [1.0.14]
- Fix in js/Scaffold (like a temp hack)
- Fix in locale.js (for building cavalion-code)

### 2018-10-10
- Introducing json!

### 2018-08-22 [1.0.6]
- locale: Always looking for prototype

### 2018-05-21
- Fix for normalizing relative to /-paths
- Fix for class names with dashes
- Finetuning DocumentHook's wheelEvents

### 2018-03-21
- Springly commit

### 2018-02-28
- Fixed a bug which caused `specializer_classes` not be applied on components. Eg. `devtools/Workspace<Veldoffice.ralph>` would only apply `devtools/Workspace<Veldoffice>`)
- Fixed a bug where `vcl/Component.getImplicitBaseByUri()` would return duplicate bases

### 2018-02-27
- Introducing `Component.prototype.vars`
- Minor fix for Component.query
- Fix for vcl-ui/Node performance

### 2018-02-12
- Fixing expanded/expandable bugs for vcl-ui/Node
- Looking into performance of vcl-ui/Node and vcl-ui/List
- Introducing **vcl-ui/Console.evaluate**
- Adding onEvent style to Component.properties.handlers

### 2018-02-07 [1.0.2]
* **vcl/Factory** - Removed Method.trace-ing
* **vcl-ui/List* ** - Worked on List-classes - not really improved, lacks speed
* Fixed now longer functioning cavalion.org/databind
* Enhancing `inter-component-ness` as shown below here on lines 81 and 82:

> __vcl-comps/code/Navigator.js__:  
![](https://snag.gy/RExQgN.jpg)

>![](https://snag.gy/9JvVph.jpg)

>![](https://snag.gy/zqGH8t.jpg)

### 2018-02-04

* "vcl-ui/List" == "vcl/ui/List"

![](https://snag.gy/Go6mKe.jpg)

### 2018-02-02
- Improving vcl/ui/Tree: Vertical alignment, removed bottom padding for the selected item

![](https://snag.gy/VRr5BK.jpg)

### 2018-01-26
- Exploring Git

### 2018-01-21
- Developing vcl/entities/Query and descendants
- Start developing ListOf
- Finetuning code structures and styles (standard library?)

### 2018-01-08
- Developing Veldoffice entities client

### 2018-01-02
- Giving some love to vcl/Component::handlers and ::overrides
- vcl/Factory now catching eval errors
- vcl/ui/Printer now supports native Promise (js/Deferred.prototype.then())
- entities/Model.parse() now resolves models
- Added loaded event for Component::onLoad
- Developing veldoffice/Session, veldoffice/EM and veldoffice/models
- Adding locale

### 2017-11-04
- devtools/Workspace: Added query close for tabs
- devtools/Editor<html>: First steps to specific [uri=*.\.page/\.html] editor

### 2017-10-18
- Improved context handling with Pages and App7.loadPage (basically it's all back to url_query again, but that's a good thing :-))
- EM.query: When omitted pagesize will default to 50

### 2017-10-15
- Pages: Removing obligatory less resource. It seems these are hardly used and can always be required by the conroller module
- Commiting in favor of V7

### 2017-10-11
- Code: new release

### 2017-10-08
- V7: Releasing build 126
- stylesheet! - now supporting less
- Embracing Template7, setting up context before loading page

### 2017-10-02
- Editor<html>: Restoring scroll position upon changes in the source code

### 2017-08-11
- Component.query: Added toggleClass()
- Query.events: Added "event"
- vcl/data/Pouch: Finetuning, developing...
- vc/prototypes/App.framework7: Adding debug support
- vcl/ui/Panel: Finetuning zoom
- entities/EM: Developing, finetuning
- Resolved: #1297

### 2017-07-01
- Introducing vcl/ui/Panel (might move upwards in the class hierarchy) zoom (cool feature!!)

### 2017-06-24
- Adding vcl/data/Pouch in the mix
- Optmizing performance for vcl/ui/List icw vcl/data/Array
- Fixing (workaround) some weird bug with Function.prototype.toString

### 2017-06-20
- Updating code base

### 2017-04-23
- Improving make/Build

### 2017-03-16
- Reorganized JavaScript libraries
- Conformed code/devtools to new struture
- Currently working on:
	- eae.com/BBT/appx
	- veldapps.com/code
	- cavalion.org/devtools
	- veldapps.com/V7
	- veldapps.com/vcl-rapportage-module

### 2017-03-11
- Getting rid of cavalion.org/... module requires, now using relative paths within cavalion.org sources/modules

### 2017-03-07
- Removed [id^=vcl-] from Control CSSRules selector
- Making FormContainer work with relative formUris

### 2017-03-04
- Optimizing code for folding features in Ace
- Fixing bugs for not being comptabile with IE
- Refresh button in ui/entities/Query
- Time for cavalion.org/Command to go away - jquery.ajax should be sufficient
- Deprecating App.scaffold

### 2017-02-28
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

### 2017-02-25
- Bug fixed where parent could not be nulled in a vcl resource
- Refactoring/bugfixing scaffolding

	$(["View<Logger>.select"]);

### 2017-02-24
- Bugfixing vcl/Control.update, where controls could be updated while not anticipated for and leave them in a inconsistent state in relation to the DOM (mailny they would be removed from the DOM)
- Implementing scaffolding in vcl/Factory
- Added nesting operator (<) to vcl/Component.query, indicating to parent/child relationship

### 2017-02-23
- Integrated Dygraphs for visualizing measurements in a interactive timeline
- Keeping UI as simple as possible
- Refactoring vcl/prototypes/App.v1 to multiple classes, like .openform, .console (developing)
- Adding component name in DOM node classes, prefixed by a #-sign
- Refer to component names in css definitions (# --> \\#)

### 2017-02-17
- Developing ui/entities/Query, ./QueryFilters, ./AttributeInput
- Finetuning Component.qs, still need a good operator for controls

### 2017-02-14
- Working on vcl/ui/Input
	- toInputValue/fromInputValue

### 2017-02-02
- Reformatting code to be better suited for folding features in the editor
- Console: Introducing req()
- vcl/Component.prototype.setVars: Now allowing a string as input (js.str2obj)
