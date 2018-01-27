(function() {
	function CssSelectorParser() {
		this.pseudos = {};
		this.attrEqualityMods = {};
		this.ruleNestingOperators = {};
		this.substitutesEnabled = false;
	}
	(function() {
	
	    var ParseContext, doubleQuotesEscapeChars, identReplacements,
	    identReplacementsRev, identSpecialChars, isAttrMatchOperator,
	    isDecimal, isHex, isIdent, isIdentStart, singleQuoteEscapeChars,
	    strReplacementsRev;
	
	    CssSelectorParser.prototype.registerSelectorPseudos = function(name) {
	      var j, len;
	      for (j = 0, len = arguments.length; j < len; j++) {
	        name = arguments[j];
	        this.pseudos[name] = "selector";
	      }
	      return this;
	    };
	    CssSelectorParser.prototype.unregisterSelectorPseudos = function(name) {
	      var j, len;
	      for (j = 0, len = arguments.length; j < len; j++) {
	        name = arguments[j];
	        delete this.pseudos[name];
	      }
	      return this;
	    };
	    CssSelectorParser.prototype.registerNestingOperators = function(op) {
	      var j, len;
	      for (j = 0, len = arguments.length; j < len; j++) {
	        op = arguments[j];
	        this.ruleNestingOperators[op] = true;
	      }
	      return this;
	    };
	    CssSelectorParser.prototype.unregisterNestingOperators = function(op) {
	      var j, len;
	      for (j = 0, len = arguments.length; j < len; j++) {
	        op = arguments[j];
	        delete this.ruleNestingOperators[op];
	      }
	      return this;
	    };
	
	    CssSelectorParser.prototype.registerAttrEqualityMods = function(mod) {
	      var j, len;
	      for (j = 0, len = arguments.length; j < len; j++) {
	        mod = arguments[j];
	        this.attrEqualityMods[mod] = true;
	      }
	      return this;
	    };
	    CssSelectorParser.prototype.unregisterAttrEqualityMods = function(mod) {
	      var j, len;
	      for (j = 0, len = arguments.length; j < len; j++) {
	        mod = arguments[j];
	        delete this.attrEqualityMods[mod];
	      }
	      return this;
	    };
	
	    CssSelectorParser.prototype.enableSubstitutes = function() {
	      this.substitutesEnabled = true;
	      return this;
	    };
	    CssSelectorParser.prototype.disableSubstitutes = function() {
	      this.substitutesEnabled = false;
	      return this;
	    };
	
	    isIdentStart = function(c) {
	      return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
	    };
	    isIdent = function(c) {
	      return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '-' || c === '_';
	    };
	    isHex = function(c) {
	      return (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F') || (c >= '0' && c <= '9');
	    };
	    isDecimal = function(c) {
	      return c >= '0' && c <= '9';
	    };
	    isAttrMatchOperator = function(c) {
	      return c === '=' || c === '^' || c === '$' || c === '*' || c === '~';
	    };
	
	    identSpecialChars = {
	      '!': true,
	      '"': true,
	      '#': true,
	      '$': true,
	      '%': true,
	      '&': true,
	      '\'': true,
	      '(': true,
	      ')': true,
	      '*': true,
	      '+': true,
	      ',': true,
	      '.': true,
	      '/': true,
	      ';': true,
	      '<': true,
	      '=': true,
	      '>': true,
	      '?': true,
	      '@': true,
	      '[': true,
	      '\\': true,
	      ']': true,
	      '^': true,
	      '`': true,
	      '{': true,
	      '|': true,
	      '}': true,
	      '~': true
	    };
	    identReplacements = {
	      'n': '\n',
	      'r': '\r',
	      't': '\t',
	      ' ': ' ',
	      'f': '\f',
	      'v': '\v'
	    };
	    identReplacementsRev = {
	      '\n': '\\n',
	      '\r': '\\r',
	      '\t': '\\t',
	      ' ': '\\ ',
	      '\f': '\\f',
	      '\v': '\\v'
	    };
	    strReplacementsRev = {
	      '\n': '\\n',
	      '\r': '\\r',
	      '\t': '\\t',
	      '\f': '\\f',
	      '\v': '\\v'
	    };
	    singleQuoteEscapeChars = {
	      n: '\n',
	      r: '\r',
	      t: '\t',
	      f: '\f',
	      '\\': '\\',
	      '\'': '\''
	    };
	    doubleQuotesEscapeChars = {
	      n: '\n',
	      r: '\r',
	      t: '\t',
	      f: '\f',
	      '\\': '\\',
	      '"': '"'
	    };
	
	    ParseContext = function(str, p, pseudos, attrEqualityMods, ruleNestingOperators, substitutesEnabled) {
	      var c, getIdent, getStr, l, skipWhitespace;
	      l = str.length;
	      c = null;
	      getStr = function(quote, escapeTable) {
	        var esc, hex, result;
	        result = '';
	        p++;
	        c = str.charAt(p);
	        while (p < l) {
	          if (c === quote) {
	            p++;
	            return result;
	          } else if (c === '\\') {
	            p++;
	            c = str.charAt(p);
	            if (c === quote) {
	              result += quote;
	            } else if (esc = escapeTable[c]) {
	              result += esc;
	            } else if (isHex(c)) {
	              hex = c;
	              p++;
	              c = str.charAt(p);
	              while (isHex(c)) {
	                hex += c;
	                p++;
	                c = str.charAt(p);
	              }
	              if (c === ' ') {
	                p++;
	                c = str.charAt(p);
	              }
	              result += String.fromCharCode(parseInt(hex, 16));
	              continue;
	            } else {
	              result += c;
	            }
	          } else {
	            result += c;
	          }
	          p++;
	          c = str.charAt(p);
	        }
	        return result;
	      };
	      getIdent = function() {
	        var hex, r, result;
	        result = '';
	        c = str.charAt(p);
	        while (p < l) {
	          if (isIdent(c)) {
	            result += c;
	          } else if (c === '\\') {
	            p++;
	            c = str.charAt(p);
	            if (identSpecialChars[c]) {
	              result += c;
	            } else if (r = identReplacements[c]) {
	              result += r;
	            } else if (isHex(c)) {
	              hex = c;
	              p++;
	              c = str.charAt(p);
	              while (isHex(c)) {
	                hex += c;
	                p++;
	                c = str.charAt(p);
	              }
	              if (c === ' ') {
	                p++;
	                c = str.charAt(p);
	              }
	              result += String.fromCharCode(parseInt(hex, 16));
	              continue;
	            } else {
	              result += c;
	            }
	          } else {
	            return result;
	          }
	          p++;
	          c = str.charAt(p);
	        }
	        return result;
	      };
	      skipWhitespace = function() {
	        var result;
	        c = str.charAt(p);
	        result = false;
	        while (c === ' ' || c === "\t" || c === "\n" || c === "\r" || c === "\f") {
	          result = true;
	          p++;
	          c = str.charAt(p);
	        }
	        return result;
	      };
	      this.parse = function() {
	        var res;
	        res = this.parseSelector();
	        if (p < l) {
	          throw Error('Rule expected but "' + str.charAt(p) + '" found.');
	        }
	        return res;
	      };
	      this.parseSelector = function() {
	        var res, selector;
	        selector = res = this.parseSingleSelector();
	        c = str.charAt(p);
	        while (c === ',') {
	          p++;
	          skipWhitespace();
	          if (res.type !== 'selectors') {
	            res = {
	              type: 'selectors',
	              selectors: [selector]
	            };
	          }
	          selector = this.parseSingleSelector();
	          if (!selector) {
	            throw Error('Rule expected after ",".');
	          }
	          res.selectors.push(selector);
	        }
	        return res;
	      };
	      this.parseSingleSelector = function() {
	        var currentRule, op, rule, selector;
	        skipWhitespace();
	        selector = {
	          type: 'ruleSet'
	        };
	        rule = this.parseRule();
	        if (!rule) {
	          return null;
	        }
	        currentRule = selector;
	        while (rule) {
	          rule.type = 'rule';
	          currentRule.rule = rule;
	          currentRule = rule;
	          skipWhitespace();
	          c = str.charAt(p);
	          if (p >= l || c === ',' || c === ')') {
	            break;
	          }
	          if (ruleNestingOperators[c]) {
	            op = c;
	            p++;
	            skipWhitespace();
	            rule = this.parseRule();
	            if (!rule) {
	              throw Error('Rule expected after "' + op + '".');
	            }
	            rule.nestingOperator = op;
	          } else {
	            rule = this.parseRule();
	            if (rule) {
	              rule.nestingOperator = null;
	            }
	          }
	        }
	        return selector;
	      };
	      this.parseRule = function() {
	        var attr, attrValue, escapedCharacter, followingCharacter, id, operator, pseudo, pseudoName, rule, value;
	        rule = null;
	        while (p < l) {
	          c = str.charAt(p);
	          if (c === '*') {
	            p++;
	            (rule = rule || {}).tagName = '*';
	          } else if (isIdentStart(c) || c === '\\') {
	            (rule = rule || {}).tagName = getIdent();
	          } else if (c === '.') {
	            p++;
	            rule = rule || {};
	            (rule.classNames = rule.classNames || []).push(getIdent());
	          } else if (c === '#') {
	            p++;
	            c = str.charAt(p);
	            id = '';
	            while (c === '\\' || isIdent(c)) {
	              if (c === '\\') {
	                p++;
	                if (p >= l) {
	                  throw Error('Expected symbol but end of file reached.');
	                }
	                escapedCharacter = str.charAt(p);
	                while (p < l && escapedCharacter === '0') {
	                  p++;
	                  escapedCharacter = str.charAt(p);
	                }
	                if (escapedCharacter === '3') {
	                  p++;
	                  if (p < l) {
	                    id += str.charAt(p);
	                    p++;
	                    followingCharacter = str.charAt(p);
	                    if (followingCharacter === ' ') {
	                      p++;
	                      if (p < l) {
	                        id += str.charAt(p);
	                      }
	                    } else {
	                      id += followingCharacter;
	                    }
	                  }
	                } else {
	                  id += escapedCharacter;
	                }
	              } else {
	                id += c;
	              }
	              p++;
	              c = str.charAt(p);
	            }
	            (rule = rule || {}).id = id;
	          } else if (c === '[') {
	            p++;
	            skipWhitespace();
	            attr = {
	              name: getIdent()
	            };
	            skipWhitespace();
	            if (c === ']') {
	              p++;
	            } else {
	              operator = '';
	              if (attrEqualityMods[c]) {
	                operator = c;
	                p++;
	                c = str.charAt(p);
	              }
	              if (p >= l) {
	                throw Error('Expected "=" but end of file reached.');
	              }
	              if (c !== '=') {
	                throw Error('Expected "=" but "' + c + '" found.');
	              }
	              attr.operator = operator + '=';
	              p++;
	              skipWhitespace();
	              attrValue = '';
	              attr.valueType = 'string';
	              if (c === '"') {
	                attrValue = getStr('"', doubleQuotesEscapeChars);
	              } else if (c === '\'') {
	                attrValue = getStr('\'', singleQuoteEscapeChars);
	              } else if (substitutesEnabled && c === '$') {
	                p++;
	                attrValue = getIdent();
	                attr.valueType = 'substitute';
	              } else {
	                while (p < l) {
	                  if (c === ']') {
	                    break;
	                  }
	                  attrValue += c;
	                  p++;
	                  c = str.charAt(p);
	                }
	                attrValue = attrValue.trim();
	              }
	              skipWhitespace();
	              if (p >= l) {
	                throw Error('Expected "]" but end of file reached.');
	              }
	              if (c !== ']') {
	                throw Error('Expected "]" but "' + c + '" found.');
	              }
	              p++;
	              attr.value = attrValue;
	            }
	            rule = rule || {};
	            (rule.attrs = rule.attrs || []).push(attr);
	          } else if (c === ':') {
	            p++;
	            pseudoName = getIdent();
	            pseudo = {
	              name: pseudoName
	            };
	            if (c === '(') {
	              p++;
	              value = '';
	              skipWhitespace();
	              if (pseudos[pseudoName] === 'selector') {
	                pseudo.valueType = 'selector';
	                value = this.parseSelector();
	              } else {
	                pseudo.valueType = 'string';
	                if (c === '"') {
	                  value = getStr('"', doubleQuotesEscapeChars);
	                } else if (c === '\'') {
	                  value = getStr('\'', singleQuoteEscapeChars);
	                } else if (substitutesEnabled && c === '$') {
	                  p++;
	                  value = getIdent();
	                  pseudo.valueType = 'substitute';
	                } else {
	                  while (p < l) {
	                    if (c === ')') {
	                      break;
	                    }
	                    value += c;
	                    p++;
	                    c = str.charAt(p);
	                  }
	                  value = value.trim();
	                }
	                skipWhitespace();
	              }
	              if (p >= l) {
	                throw Error('Expected ")" but end of file reached.');
	              }
	              if (c !== ')') {
	                throw Error('Expected ")" but "' + c + '" found.');
	              }
	              p++;
	              pseudo.value = value;
	            }
	            rule = rule || {};
	            (rule.pseudos = rule.pseudos || []).push(pseudo);
	          } else {
	            break;
	          }
	        }
	        return rule;
	      };
	      return this;
	    };
	
	    CssSelectorParser.prototype.parse = function(str) {
	      var context;
	      context = new ParseContext(str, 0, this.pseudos, this.attrEqualityMods, this.ruleNestingOperators, this.substitutesEnabled);
	      return context.parse();
	    };
	    CssSelectorParser.prototype.escapeIdentifier = function(s) {
	      var c, cc, extraCharCode, i, l, r, result;
	      result = '';
	      i = 0;
	      l = s.length;
	      while (i < l) {
	        c = s.charAt(i);
	        if (identSpecialChars[c]) {
	          result += '\\' + c;
	        } else if (r = identReplacementsRev[c]) {
	          result += r;
	        } else if ((cc = c.charCodeAt(0)) && (cc < 32 || cc > 126)) {
	          if ((cc & 0xF800) === 0xD800) {
	            extraCharCode = s.charCodeAt(i++);
	            if ((cc & 0xFC00) !== 0xD800 || (extraCharCode & 0xFC00) !== 0xDC00) {
	              throw Error('UCS-2(decode): illegal sequence');
	            }
	            cc = ((cc & 0x3FF) << 10) + (extraCharCode & 0x3FF) + 0x10000;
	          }
	          result += '\\' + cc.toString(16) + ' ';
	        } else {
	          result += c;
	        }
	        i++;
	      }
	      return result;
	    };
	    CssSelectorParser.prototype.escapeId = function(s) {
	      var first;
	      first = s[0];
	      if (isDecimal(first)) {
	        return "\\3" + (this.escapeIdentifier(first)) + " " + (this.escapeIdentifier(s.slice(1)));
	      }
	      return this.escapeIdentifier(s);
	    };
	    CssSelectorParser.prototype.escapeStr = function(s) {
	      var c, i, l, r, result;
	      result = '';
	      i = 0;
	      l = s.length;
	      while (i < l) {
	        c = s.charAt(i);
	        if (c === '"') {
	          c = '\\"';
	        } else if (c === '\\') {
	          c = '\\\\';
	        } else if (r = strReplacementsRev[c]) {
	          c = r;
	        }
	        result += c;
	        i++;
	      }
	      return "\"" + result + "\"";
	    };
	    CssSelectorParser.prototype.render = function(path) {
	      var renderEntity;
	      renderEntity = (function(_this) {
	        return function(entity) {
	          var currentEntity, parts, res;
	          res = '';
	          switch (entity.type) {
	            case 'ruleSet':
	              currentEntity = entity.rule;
	              parts = [];
	              while (currentEntity) {
	                if (currentEntity.nestingOperator) {
	                  parts.push(currentEntity.nestingOperator);
	                }
	                parts.push(renderEntity(currentEntity));
	                currentEntity = currentEntity.rule;
	              }
	              res = parts.join(' ');
	              break;
	            case 'selectors':
	              res = entity.selectors.map(renderEntity).join(', ');
	              break;
	            case 'rule':
	              if (entity.tagName) {
	                if (entity.tagName === '*') {
	                  res = '*';
	                } else {
	                  res = _this.escapeIdentifier(entity.tagName);
	                }
	              }
	              if (entity.id) {
	                res += "#" + (_this.escapeId(entity.id));
	              }
	              if (entity.classNames) {
	                res += (entity.classNames.map(function(cn) {
	                  return "." + (_this.escapeIdentifier(cn));
	                })).join('');
	              }
	              if (entity.attrs) {
	                res += (entity.attrs.map(function(attr) {
	                  if (attr.operator) {
	                    if (attr.valueType === 'substitute') {
	                      return "[" + (_this.escapeIdentifier(attr.name)) + attr.operator + "$" + attr.value + "]";
	                    } else {
	                      return "[" + (_this.escapeIdentifier(attr.name)) + attr.operator + (_this.escapeStr(attr.value)) + "]";
	                    }
	                  } else {
	                    return "[" + (_this.escapeIdentifier(attr.name)) + "]";
	                  }
	                })).join('');
	              }
	              if (entity.pseudos) {
	                res += (entity.pseudos.map(function(pseudo) {
	                  if (pseudo.valueType) {
	                    if (pseudo.valueType === 'selector') {
	                      return ":" + (_this.escapeIdentifier(pseudo.name)) + "(" + (renderEntity(pseudo.value)) + ")";
	                    } else if (pseudo.valueType === 'substitute') {
	                      return ":" + (_this.escapeIdentifier(pseudo.name)) + "($" + pseudo.value + ")";
	                    } else {
	                      return ":" + (_this.escapeIdentifier(pseudo.name)) + "(" + (_this.escapeStr(pseudo.value)) + ")";
	                    }
	                  } else {
	                    return ":" + (_this.escapeIdentifier(pseudo.name));
	                  }
	                })).join('');
	              }
	              break;
	            default:
	              throw Error('Unknown entity type: "' + entity.type(+'".'));
	          }
	          return res;
	        };
	      })(this);
	      return renderEntity(path);
	    };
	
	    return CssSelectorParser;
	
	}());
	define(function() {
		
		var PARENT_HIERARCHY_OPERATOR = "<";
		var Component;
	
	    function Result() {}
	    
	    Result.prototype = [];
	    
	    /*- TODO find out which methods of Component, Control, Action to mixin */
	    
	    "on,un,listen,unlisten,connect,disconnect,execute,show,hide,render,dispatch,emit,fire,once,selectNext,selectPrevious,toggleClass".split(",").forEach(function(name) {
		        Result.prototype[name] = function() {
		            for(var i = 0; i < this.length; ++i) {
		                if(typeof this[i][name] === "function") {
		                    this[i][name].apply(this[i], arguments);
		                }
		            }
		            return this;
		        };
	    });
	    
	    Result.prototype.focus = function() {
	            for(var i = 0; i < this.length; ++i) {
	                if(typeof this[i].setFocused === "function") {
	                    this[i].setFocused(true);
	                }
	            }
	            return this;
	    };
	    
	    Result.prototype.each = Result.prototype.forEach;
	    
	    function match_uri(rule, component) {
	        var uri = component._uri;//getUri();
	        return ((rule.exact && uri === rule.uri) ||
	            (uri.split(".")[0] + "<").indexOf(rule.uri + "<") === 0);
	    }
	    function match_ctor(rule, component) {
	        if(rule.ctor === "*") {
	            return true;
	        }
	        return component.constructor === rule.ctor;
	    }
	    function match_classNames(rule, component) {
	    	Component = Component || require("vcl/Component");
	    	var classes = Component.getKeysByUri(component._uri).classes;
	        return rule.classNames.every(function(className) {
	        	return classes.indexOf(className) !== -1;
	        });            
	    }
	    function match_id(rule, component) {
	        var hashCode = parseInt(rule.id, 10);
	        if(!isNaN(hashCode)) {
	            return component.hashCode() === hashCode;
	        }
	        return component._name === rule.id;
	    }
	    function match_pseudos(rule, component, context, all) {
	        return rule.pseudos.every(function(pseudo) {
	            if(pseudo.name === "this") {
	                return component === context;
	            } else if(pseudo.name === "root") {
	                return component.isRootComponent();
	            } else if(pseudo.name === "selected") {
	                return component.isSelected && 
	                	(component.isSelected() === (pseudo.value !== "false"));
	            } else if(pseudo.name === "uri") {
	            	var value = pseudo.value.split(",");
		            return match_uri({exact: value[1] === "exact", 
		            	uri: value[0].replace(/\\\//g, "/")}, component);
	            } else if(pseudo.name === "childOf") {
	            	return component._parent && 
	            			component._parent._name === pseudo.value;
	            } else if(pseudo.name === "app") {
	            	return component.app();
	            } else if(pseudo.name === "instanceOf") {
	            	return component instanceof require(pseudo.value.replace(/\\\//g, "/"));
	            } else if(pseudo.name === "withVars") {
	            	var vars = component._vars || {};
	            	try {
	            		return eval("with(vars) { " + pseudo.value + "}");
	            	} catch(e) {
	            		return false;
	            	}
	            }
	            
	            var value;
	            if(pseudo.value === ".") {
	                value = context;
	            } else if(pseudo.value.charAt(0) === "#") {
	                value = parseInt(pseudo.value.substring(1), 10);
	                if(isNaN) {
	                	var name = pseudo.value.substring(1);
	                	value = all.filter(function(comp) {
	                		return comp.getName() === name;
	                	});
	                } else {
	                	value = require("vcl/Component").all[value];
	                }
	            } else {
	                value = js.get(pseudo.value, context);
	            }
	            
	            if(pseudo.name === "owner-of") {
	            	if(value instanceof Array) {
	            		return value.every(function(elem) {
	            			return component.isOwnerOf(elem);
	            		});
	            	}
	                return component.isOwnerOf(value);
	            } else if(pseudo.name === "is") {
	                return component === value;
	            }
	            return false; 
	        });
	    }
	    function match_properties(rule, component) {
	        return rule.attrs.every(function(attr) {
	            if(attr.name === "uri") {
	            	return match_uri({uri: attr.value.replace(/\\\//g, "/")}, component);
	            }
                var prop = component.defineProperties()[attr.name];
                var value = prop.get(component);
                if(value instanceof require("vcl/Component")) {
                	value = value.getName();
                }
                switch(attr.operator) {
                    case "=":
                        return ("" + value) === ("" + attr.value);
                    
                    default:
                        return false;
                }
	        });
	    }
	    function match(rule, component, operator, context, all) {
	    	if(operator === ">") {
	    		console.warn("DEPRECATED operator >");
	    		operator = PARENT_HIERARCHY_OPERATOR;
	    	}
	        if(operator === null) {
	        	/*- owner hierarchy */
	            while(component._owner) {
	                if(match(rule, component._owner, undefined, context)) {
	                    return true;
	                }
	                component = component._owner;
	            }
	            return false;
	        } else if(operator === PARENT_HIERARCHY_OPERATOR) {
	        	/*- parent hierarchy */
	            while(component._parent) {
	                if(match(rule, component._parent, undefined, context)) {
	                    return true;
	                }
	                component = component._parent;
	            }
	            return false;
	        	
	        } else if(operator === "first-owner-must-match") {
	        	/* owner must match */
	            return match(rule, component._owner, undefined, context);
	        }
	        
	        return component !== null &&
	            (!rule.uri || match_uri(rule, component)) &&
	            (!rule.ctor || match_ctor(rule, component)) &&
	            (!rule.classNames || match_classNames(rule, component)) &&
	            (!rule.id || match_id(rule, component)) &&
	            (!rule.pseudos || match_pseudos(rule, component, context, all)) &&
	            (!rule.attrs || match_properties(rule, component));
	    }
	    function parse(selector) {
	        var parser = new CssSelectorParser();
	        parser.registerNestingOperators(">");
	        parser.registerNestingOperators(PARENT_HIERARCHY_OPERATOR);
	        
	        tree = parser.parse(selector
	            .replace(/<([^>]*)>/g, "\\<$1\\>")
	            .replace(/\//g, "\\/"));
	
	        var rules = [], rule = tree.rule;
	        while(rule) {
	            if(rule.tagName && rule.tagName.indexOf("<") !== -1) {
	                rule.uri = rule.tagName;
	                if(!(rule.exact = rule.uri.indexOf("<>") === -1)) {
	                    rule.uri = rule.uri.split("<")[0];
	                }
	                delete rule.tagName;
	            } else if(rule.tagName && rule.tagName !== "*") {
	                rule.ctor = require(rule.tagName);
	                delete rule.tagName;
	            } else if(rule.tagName === "*") {
	                rule.ctor = "*";
	            }
	            rules.push(rule);
	            rule = rule.rule;
	        }
	        return rules;
	    }
	
	    return function(selector, context, all) {
	        var rules = parse(selector);
	        var operator;
	        var components = [].concat(all);
	        
	        rules.reverse().forEach(function(rule) {
	            components = components.reduce(function(arr, component) {
	                if(match(rule, component, operator, context, components)) {
	                    arr.push(component);
	                }
	                return arr;
	            }, new Result());
	            operator = rule.nestingOperator;
	        });
	        
	        return components;
	    };
	    
	});
}());