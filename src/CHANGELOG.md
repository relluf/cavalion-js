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
- 

### 2018-02-07 - 1.0.2
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
