(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.webvrui = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(_dereq_,module,exports){
/*!
* screenfull
* v3.0.0 - 2015-11-24
* (c) Sindre Sorhus; MIT License
*/
(function () {
	'use strict';

	var isCommonjs = typeof module !== 'undefined' && module.exports;
	var keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element;

	var fn = (function () {
		var val;
		var valLength;

		var fnMap = [
			[
				'requestFullscreen',
				'exitFullscreen',
				'fullscreenElement',
				'fullscreenEnabled',
				'fullscreenchange',
				'fullscreenerror'
			],
			// new WebKit
			[
				'webkitRequestFullscreen',
				'webkitExitFullscreen',
				'webkitFullscreenElement',
				'webkitFullscreenEnabled',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			// old WebKit (Safari 5.1)
			[
				'webkitRequestFullScreen',
				'webkitCancelFullScreen',
				'webkitCurrentFullScreenElement',
				'webkitCancelFullScreen',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			[
				'mozRequestFullScreen',
				'mozCancelFullScreen',
				'mozFullScreenElement',
				'mozFullScreenEnabled',
				'mozfullscreenchange',
				'mozfullscreenerror'
			],
			[
				'msRequestFullscreen',
				'msExitFullscreen',
				'msFullscreenElement',
				'msFullscreenEnabled',
				'MSFullscreenChange',
				'MSFullscreenError'
			]
		];

		var i = 0;
		var l = fnMap.length;
		var ret = {};

		for (; i < l; i++) {
			val = fnMap[i];
			if (val && val[1] in document) {
				for (i = 0, valLength = val.length; i < valLength; i++) {
					ret[fnMap[0][i]] = val[i];
				}
				return ret;
			}
		}

		return false;
	})();

	var screenfull = {
		request: function (elem) {
			var request = fn.requestFullscreen;

			elem = elem || document.documentElement;

			// Work around Safari 5.1 bug: reports support for
			// keyboard in fullscreen even though it doesn't.
			// Browser sniffing, since the alternative with
			// setTimeout is even worse.
			if (/5\.1[\.\d]* Safari/.test(navigator.userAgent)) {
				elem[request]();
			} else {
				elem[request](keyboardAllowed && Element.ALLOW_KEYBOARD_INPUT);
			}
		},
		exit: function () {
			document[fn.exitFullscreen]();
		},
		toggle: function (elem) {
			if (this.isFullscreen) {
				this.exit();
			} else {
				this.request(elem);
			}
		},
		raw: fn
	};

	if (!fn) {
		if (isCommonjs) {
			module.exports = false;
		} else {
			window.screenfull = false;
		}

		return;
	}

	Object.defineProperties(screenfull, {
		isFullscreen: {
			get: function () {
				return Boolean(document[fn.fullscreenElement]);
			}
		},
		element: {
			enumerable: true,
			get: function () {
				return document[fn.fullscreenElement];
			}
		},
		enabled: {
			enumerable: true,
			get: function () {
				// Coerce to boolean in case of old WebKit
				return Boolean(document[fn.fullscreenEnabled]);
			}
		}
	});

	if (isCommonjs) {
		module.exports = screenfull;
	} else {
		window.screenfull = screenfull;
	}
})();

},{}],3:[function(_dereq_,module,exports){
'use strict';

var _enterVrButton = _dereq_('./enter-vr-button');

var _enterVrButton2 = _interopRequireDefault(_enterVrButton);

var _states = _dereq_('./states');

var _states2 = _interopRequireDefault(_states);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

/* global AFRAME */

if (typeof AFRAME !== 'undefined' && AFRAME) {
  AFRAME.registerComponent('webvr-ui', {
    dependencies: ['canvas'],

    schema: {
      enabled: { type: 'boolean', default: true },
      color: { type: 'string', default: 'white' },
      background: { type: 'string', default: 'black' },
      corners: { type: 'string', default: 'square' },
      disabledOpacity: { type: 'number', default: 0.5 },

      textEnterVRTitle: { type: 'string' },
      textExitVRTitle: { type: 'string' },
      textVRNotFoundTitle: { type: 'string' }
    },

    init: function init() {},

    update: function update() {
      var scene = document.querySelector('a-scene');
      scene.setAttribute('vr-mode-ui', { enabled: !this.data.enabled });

      if (this.data.enabled) {
        if (this.enterVREl) {
          return;
        }

        var options = {
          color: this.data.color,
          background: this.data.background,
          corners: this.data.corners,
          disabledOpacity: this.data.disabledOpacity,
          textEnterVRTitle: this.data.textEnterVRTitle,
          textExitVRTitle: this.data.textExitVRTitle,
          textVRNotFoundTitle: this.data.textVRNotFoundTitle,
          onRequestStateChange: function onRequestStateChange(state) {
            if (state == _states2.default.PRESENTING) {
              scene.enterVR();
            } else {
              scene.exitVR();
            }
            return false;
          }
        };

        var enterVR = this.enterVR = new _enterVrButton2.default(scene.canvas, options);

        this.enterVREl = enterVR.domElement;

        document.body.appendChild(enterVR.domElement);

        enterVR.domElement.style.position = 'absolute';
        enterVR.domElement.style.bottom = '10px';
        enterVR.domElement.style.left = '50%';
        enterVR.domElement.style.transform = 'translate(-50%, -50%)';
        enterVR.domElement.style.textAlign = 'center';
      } else {
        if (this.enterVREl) {
          this.enterVREl.parentNode.removeChild(this.enterVREl);
          this.enterVR.remove();
        }
      }
    },

    remove: function remove() {
      if (this.enterVREl) {
        this.enterVREl.parentNode.removeChild(this.enterVREl);
        this.enterVR.remove();
      }
    }
  });
}

},{"./enter-vr-button":5,"./states":7}],4:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
// Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

var _LOGO_SCALE = 0.8;
var _WEBVR_UI_CSS_INJECTED = {};

/**
 * Generate the innerHTML for the button
 *
 * @return {string} html of the button as string
 * @param {string} cssPrefix
 * @param {Number} height
 * @private
 */
var generateInnerHTML = function generateInnerHTML(cssPrefix, height) {
    var logoHeight = height * _LOGO_SCALE;
    var svgString = generateVRIconString(cssPrefix, logoHeight) + generateNoVRIconString(cssPrefix, logoHeight);

    return '<button class="' + cssPrefix + '-button">\n          <div class="' + cssPrefix + '-title"></div>\n          <div class="' + cssPrefix + '-logo" >' + svgString + '</div>\n        </button>';
};

/**
 * Inject the CSS string to the head of the document
 *
 * @param {string} cssText the css to inject
 */
var injectCSS = exports.injectCSS = function injectCSS(cssText) {
    // Create the css
    var style = document.createElement('style');
    style.innerHTML = cssText;

    var head = document.getElementsByTagName('head')[0];
    head.insertBefore(style, head.firstChild);
};

/**
 * Generate DOM element view for button
 *
 * @return {HTMLElement}
 * @param {Object} options
 */
var createDefaultView = exports.createDefaultView = function createDefaultView(options) {
    var fontSize = options.height / 3;
    if (options.injectCSS) {
        // Check that css isnt already injected
        if (!_WEBVR_UI_CSS_INJECTED[options.cssprefix]) {
            injectCSS(generateCSS(options, fontSize));
            _WEBVR_UI_CSS_INJECTED[options.cssprefix] = true;
        }
    }

    var el = document.createElement('div');
    el.innerHTML = generateInnerHTML(options.cssprefix, fontSize);
    return el.firstChild;
};

var createVRIcon = exports.createVRIcon = function createVRIcon(cssPrefix, height) {
    var el = document.createElement('div');
    el.innerHTML = generateVRIconString(cssPrefix, height);
    return el.firstChild;
};

var createNoVRIcon = exports.createNoVRIcon = function createNoVRIcon(cssPrefix, height) {
    var el = document.createElement('div');
    el.innerHTML = generateNoVRIconString(cssPrefix, height);
    return el.firstChild;
};

var generateVRIconString = function generateVRIconString(cssPrefix, height) {
    var aspect = 28 / 18;
    return '<svg class="' + cssPrefix + '-svg" version="1.1" x="0px" y="0px" \n        width="' + aspect * height + 'px" height="' + height + 'px" viewBox="0 0 28 18" xml:space="preserve">\n        <path d="M26.8,1.1C26.1,0.4,25.1,0,24.2,0H3.4c-1,0-1.7,0.4-2.4,1.1C0.3,1.7,0,2.7,0,3.6v10.7\n        c0,1,0.3,1.9,0.9,2.6C1.6,17.6,2.4,18,3.4,18h5c0.7,0,1.3-0.2,1.8-0.5c0.6-0.3,1-0.8,1.3-1.4l\n        1.5-2.6C13.2,13.1,13,13,14,13v0h-0.2 h0c0.3,0,0.7,0.1,0.8,0.5l1.4,2.6c0.3,0.6,0.8,1.1,1.3,\n        1.4c0.6,0.3,1.2,0.5,1.8,0.5h5c1,0,2-0.4,2.7-1.1c0.7-0.7,1.2-1.6,1.2-2.6 V3.6C28,2.7,27.5,\n        1.7,26.8,1.1z M7.4,11.8c-1.6,0-2.8-1.3-2.8-2.8c0-1.6,1.3-2.8,2.8-2.8c1.6,0,2.8,1.3,2.8,2.8\n        C10.2,10.5,8.9,11.8,7.4,11.8z M20.1,11.8c-1.6,0-2.8-1.3-2.8-2.8c0-1.6,1.3-2.8,2.8-2.8C21.7\n        ,6.2,23,7.4,23,9 C23,10.5,21.7,11.8,20.1,11.8z"/>\n    </svg>';
};

var generateNoVRIconString = function generateNoVRIconString(cssPrefix, height) {
    var aspect = 28 / 18;
    return '<svg class="' + cssPrefix + '-svg-error" x="0px" y="0px" \n        width="' + aspect * height + 'px" height="' + aspect * height + 'px" viewBox="0 0 28 28" xml:space="preserve">\n        <path d="M17.6,13.4c0-0.2-0.1-0.4-0.1-0.6c0-1.6,1.3-2.8,2.8-2.8s2.8,1.3,2.8,2.8s-1.3,2.8-2.8,2.8\n        c-0.2,0-0.4,0-0.6-0.1l5.9,5.9c0.5-0.2,0.9-0.4,1.3-0.8\n        c0.7-0.7,1.1-1.6,1.1-2.5V7.4c0-1-0.4-1.9-1.1-2.5c-0.7-0.7-1.6-1-2.5-1\n        H8.1 L17.6,13.4z"/>\n        <path d="M10.1,14.2c-0.5,0.9-1.4,1.4-2.4,1.4c-1.6,0-2.8-1.3-2.8-2.8c0-1.1,0.6-2,1.4-2.5\n        L0.9,5.1 C0.3,5.7,0,6.6,0,7.5v10.7c0,1,0.4,1.8,1.1,2.5c0.7,0.7,1.6,1,2.5,1\n        h5c0.7,0,1.3-0.1,1.8-0.5c0.6-0.3,1-0.8,1.3-1.4l1.3-2.6 L10.1,14.2z"/>\n        <path d="M25.5,27.5l-25-25C-0.1,2-0.1,1,0.5,0.4l0,0C1-0.1,2-0.1,2.6,0.4l25,25c0.6,0.6,0.6,1.5\n        ,0,2.1l0,0 C27,28.1,26,28.1,25.5,27.5z"/>\n    </svg>';
};

/**
 * Generate the CSS string to inject
 *
 * @param {Object} options
 * @param {Number} [fontSize=18]
 * @return {string}
 */
var generateCSS = exports.generateCSS = function generateCSS(options) {
    var fontSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 18;

    var height = options.height;
    var borderWidth = 2;
    var borderColor = options.background ? options.background : options.color;
    var cssPrefix = options.cssprefix;

    var borderRadius = void 0;
    if (options.corners == 'round') {
        borderRadius = options.height / 2;
    } else if (options.corners == 'square') {
        borderRadius = 2;
    } else {
        borderRadius = options.corners;
    }

    return '\n    @font-face {\n        font-family: \'Karla\';\n        font-style: normal;\n        font-weight: 400;\n        src: local(\'Karla\'), local(\'Karla-Regular\'), \n             url(https://fonts.gstatic.com/s/karla/v5/31P4mP32i98D9CEnGyeX9Q.woff2) format(\'woff2\');\n        unicode-range: U+0100-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF, U+2C60-2C7F, U+A720-A7FF;\n    }\n    @font-face {\n        font-family: \'Karla\';\n        font-style: normal;\n        font-weight: 400;\n        src: local(\'Karla\'), local(\'Karla-Regular\'), \n             url(https://fonts.gstatic.com/s/karla/v5/Zi_e6rBgGqv33BWF8WTq8g.woff2) format(\'woff2\');\n        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, \n                       U+20AC, U+2212, U+2215, U+E0FF, U+EFFD, U+F000;\n    }\n\n    button.' + cssPrefix + '-button {\n        font-family: \'Karla\', sans-serif;\n\n        border: ' + borderColor + ' ' + borderWidth + 'px solid;\n        border-radius: ' + borderRadius + 'px;\n        box-sizing: border-box;\n        background: ' + (options.background ? options.background : 'none') + ';\n\n        height: ' + height + 'px;\n        min-width: ' + fontSize * 9.6 + 'px;\n        display: inline-block;\n        position: relative;\n\n        cursor: pointer;\n    }\n    \n    button.' + cssPrefix + '-button:focus {\n      outline: none;\n    }\n\n    /*\n    * Logo\n    */\n\n    .' + cssPrefix + '-logo {\n        width: ' + height + 'px;\n        height: ' + height + 'px;\n        position: absolute;\n        top:0px;\n        left:0px;\n        width: ' + (height - 4) + 'px;\n        height: ' + (height - 4) + 'px;\n    }\n    .' + cssPrefix + '-svg {\n        fill: ' + options.color + ';\n        margin-top: ' + ((height - fontSize * _LOGO_SCALE) / 2 - 2) + 'px;\n        margin-left: ' + height / 3 + 'px;\n    }\n    .' + cssPrefix + '-svg-error {\n        fill: ' + options.color + ';\n        display:none;\n        margin-top: ' + ((height - 28 / 18 * fontSize * _LOGO_SCALE) / 2 - 2) + 'px;\n        margin-left: ' + height / 3 + 'px;\n    }\n\n\n    /*\n    * Title\n    */\n\n    .' + cssPrefix + '-title {\n        color: ' + options.color + ';\n        position: relative;\n        font-size: ' + fontSize + 'px;\n        padding-left: ' + height * 1.05 + 'px;\n        padding-right: ' + (borderRadius - 10 < 5 ? height / 3 : borderRadius - 10) + 'px;\n    }\n\n    /*\n    * disabled\n    */\n\n    button.' + cssPrefix + '-button[disabled=true] {\n        opacity: ' + options.disabledOpacity + ';\n    }\n\n    button.' + cssPrefix + '-button[disabled=true] > .' + cssPrefix + '-logo > .' + cssPrefix + '-svg {\n        display:none;\n    }\n\n    button.' + cssPrefix + '-button[disabled=true] > .' + cssPrefix + '-logo > .' + cssPrefix + '-svg-error {\n        display:initial;\n    }\n  ';
};

},{}],5:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webvrManager = _dereq_('./webvr-manager');

var _webvrManager2 = _interopRequireDefault(_webvrManager);

var _dom = _dereq_('./dom');

var _states = _dereq_('./states');

var _states2 = _interopRequireDefault(_states);

var _eventemitter = _dereq_('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

/**
 * A button to allow easy-entry and messaging around a WebVR experience
 * @class
 */
var EnterVRButton = function (_EventEmitter) {
  _inherits(EnterVRButton, _EventEmitter);

  /**
   * Construct a new Enter VR Button
   * @constructor
   * @param {HTMLCanvasElement} sourceCanvas the canvas that you want to present in WebVR
   * @param {Object} [options] optional parameters
   * @param {HTMLElement} [options.domElement] provide your own domElement to bind to
   * @param {Boolean} [options.injectCSS=true] set to false if you want to write your own styles
   * @param {Function} [options.beforeEnter] should return a promise, opportunity to intercept request to enter
   * @param {Function} [options.beforeExit] should return a promise, opportunity to intercept request to exit
   * @param {Function} [options.onRequestStateChange] set to a function returning false to prevent default state changes
   * @param {string} [options.textEnterVRTitle] set the text for Enter VR
   * @param {string} [options.textVRNotFoundTitle] set the text for when a VR display is not found
   * @param {string} [options.textExitVRTitle] set the text for exiting VR
   * @param {string} [options.color] text and icon color
   * @param {string} [options.background] set to false for no brackground or a color
   * @param {string} [options.corners] set to 'round', 'square' or pixel value representing the corner radius
   * @param {string} [options.disabledOpacity] set opacity of button dom when disabled
   * @param {string} [options.cssprefix] set to change the css prefix from default 'webvr-ui'
   */
  function EnterVRButton(sourceCanvas, options) {
    _classCallCheck(this, EnterVRButton);

    var _this = _possibleConstructorReturn(this, (EnterVRButton.__proto__ || Object.getPrototypeOf(EnterVRButton)).call(this));

    options = options || {};

    options.color = options.color || 'rgb(80,168,252)';
    options.background = options.background || false;
    options.disabledOpacity = options.disabledOpacity || 0.5;
    options.height = options.height || 55;
    options.corners = options.corners || 'square';
    options.cssprefix = options.cssprefix || 'webvr-ui';

    options.textEnterVRTitle = options.textEnterVRTitle || 'ENTER VR';
    options.textVRNotFoundTitle = options.textVRNotFoundTitle || 'VR NOT FOUND';
    options.textExitVRTitle = options.textExitVRTitle || 'EXIT VR';

    options.onRequestStateChange = options.onRequestStateChange || function () {
      return true;
    };
    options.beforeEnter = options.beforeEnter || function () {
      return new Promise(function (resolve) {
        return resolve();
      });
    };
    options.beforeExit = options.beforeExit || function () {
      return new Promise(function (resolve) {
        return resolve();
      });
    };

    options.injectCSS = options.injectCSS !== false;

    _this.options = options;

    _this.sourceCanvas = sourceCanvas;

    // Pass in your own domElement if you really dont want to use ours
    _this.domElement = options.domElement || (0, _dom.createDefaultView)(options);
    _this.__defaultDisplayStyle = _this.domElement.style.display || 'initial';

    // Create WebVR Manager
    _this.manager = new _webvrManager2.default();
    _this.manager.checkDisplays();
    _this.manager.addListener('change', function (state) {
      return _this.__onStateChange(state);
    });

    // Bind button click events to __onClick
    _this.domElement.addEventListener('click', function () {
      return _this.__onEnterVRClick();
    });

    _this.__forceDisabled = false;
    _this.setTitle(_this.options.textEnterVRTitle);
    return _this;
  }

  /**
   * Set the title of the button
   * @param {string} text
   * @return {EnterVRButton}
   */


  _createClass(EnterVRButton, [{
    key: 'setTitle',
    value: function setTitle(text) {
      this.domElement.title = text;
      ifChild(this.domElement, this.options.cssprefix, 'title', function (title) {
        if (!text) {
          title.style.display = 'none';
        } else {
          title.innerText = text;
          title.style.display = 'initial';
        }
      });

      return this;
    }

    /**
     * Set the tooltip of the button
     * @param {string} tooltip
     * @return {EnterVRButton}
     */

  }, {
    key: 'setTooltip',
    value: function setTooltip(tooltip) {
      this.domElement.title = tooltip;
      return this;
    }

    /**
     * Show the button
     * @return {EnterVRButton}
     */

  }, {
    key: 'show',
    value: function show() {
      this.domElement.style.display = this.__defaultDisplayStyle;
      this.emit('show');
      return this;
    }

    /**
     * Hide the button
     * @return {EnterVRButton}
     */

  }, {
    key: 'hide',
    value: function hide() {
      this.domElement.style.display = 'none';
      this.emit('hide');
      return this;
    }

    /**
     * Enable the button
     * @return {EnterVRButton}
     */

  }, {
    key: 'enable',
    value: function enable() {
      this.__setDisabledAttribute(false);
      this.__forceDisabled = false;
      return this;
    }

    /**
     * Disable the button from being clicked
     * @return {EnterVRButton}
     */

  }, {
    key: 'disable',
    value: function disable() {
      this.__setDisabledAttribute(true);
      this.__forceDisabled = true;
      return this;
    }

    /**
     * clean up object for garbage collection
     */

  }, {
    key: 'remove',
    value: function remove() {
      this.manager.remove();

      if (this.domElement.parentElement) {
        this.domElement.parentElement.removeChild(this.domElement);
      }
    }

    /**
     * Returns a promise getting the VRDisplay used
     * @return {Promise.<VRDisplay>}
     */

  }, {
    key: 'getVRDisplay',
    value: function getVRDisplay() {
      return _webvrManager2.default.getVRDisplay();
    }

    /**
     * Check if the canvas the button is connected to is currently presenting
     * @return {boolean}
     */

  }, {
    key: 'isPresenting',
    value: function isPresenting() {
      return this.state === _states2.default.PRESENTING || this.state == _states2.default.PRESENTING_FULLSCREEN;
    }

    /**
     * Request entering VR
     * @return {Promise}
     */

  }, {
    key: 'requestEnterVR',
    value: function requestEnterVR() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (_this2.options.onRequestStateChange(_states2.default.PRESENTING)) {
          return _this2.options.beforeEnter().then(function () {
            return _this2.manager.enterVR(_this2.manager.defaultDisplay, _this2.sourceCanvas);
          }).then(resolve);
        } else {
          reject(new Error(_states2.default.ERROR_REQUEST_STATE_CHANGE_REJECTED));
        }
      });
    }

    /**
     * Request exiting presentation mode
     * @return {Promise}
     */

  }, {
    key: 'requestExit',
    value: function requestExit() {
      var _this3 = this;

      var initialState = this.state;

      return new Promise(function (resolve, reject) {
        if (_this3.options.onRequestStateChange(_states2.default.READY_TO_PRESENT)) {
          return _this3.options.beforeExit().then(function () {
            return (
              // if we were presenting VR, exit VR, if we are
              // exiting fullscreen, exit fullscreen
              initialState === _states2.default.PRESENTING ? _this3.manager.exitVR(_this3.manager.defaultDisplay) : _this3.manager.exitFullscreen()
            );
          }).then(resolve);
        } else {
          reject(new Error(_states2.default.ERROR_REQUEST_STATE_CHANGE_REJECTED));
        }
      });
    }

    /**
     * Request entering the site in fullscreen, but not VR
     * @return {Promise}
     */

  }, {
    key: 'requestEnterFullscreen',
    value: function requestEnterFullscreen() {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        if (_this4.options.onRequestStateChange(_states2.default.PRESENTING_FULLSCREEN)) {
          return _this4.options.beforeEnter().then(function () {
            return _this4.manager.enterFullscreen(_this4.sourceCanvas);
          }).then(resolve);
        } else {
          reject(new Error(_states2.default.ERROR_REQUEST_STATE_CHANGE_REJECTED));
        }
      });
    }

    /**
     * Set the disabled attribute
     * @param {boolean} disabled
     * @private
     */

  }, {
    key: '__setDisabledAttribute',
    value: function __setDisabledAttribute(disabled) {
      if (disabled || this.__forceDisabled) {
        this.domElement.setAttribute('disabled', 'true');
      } else {
        this.domElement.removeAttribute('disabled');
      }
    }

    /**
     * Handling click event from button
     * @private
     */

  }, {
    key: '__onEnterVRClick',
    value: function __onEnterVRClick() {
      if (this.state == _states2.default.READY_TO_PRESENT) {
        this.requestEnterVR();
      } else if (this.isPresenting()) {
        this.requestExit();
      }
    }

    /**
     * @param {State} state the state that its transitioning to
     * @private
     */

  }, {
    key: '__onStateChange',
    value: function __onStateChange(state) {
      if (state != this.state) {
        if (this.state === _states2.default.PRESENTING || this.state === _states2.default.PRESENTING_FULLSCREEN) {
          this.emit('exit');
        }
        this.state = state;

        switch (state) {
          case _states2.default.READY_TO_PRESENT:
            this.show();
            this.setTitle(this.options.textEnterVRTitle);
            if (this.manager.defaultDisplay) {
              this.setTooltip('Enter VR using ' + this.manager.defaultDisplay.displayName);
            }
            this.__setDisabledAttribute(false);
            this.emit('ready');
            break;

          case _states2.default.PRESENTING:
          case _states2.default.PRESENTING_FULLSCREEN:
            if (!this.manager.defaultDisplay || !this.manager.defaultDisplay.capabilities.hasExternalDisplay || state == _states2.default.PRESENTING_FULLSCREEN) {
              this.hide();
            }
            this.setTitle(this.options.textExitVRTitle);
            this.__setDisabledAttribute(false);
            this.emit('enter');
            break;

          // Error states
          case _states2.default.ERROR_BROWSER_NOT_SUPPORTED:
            this.show();
            this.setTitle(this.options.textVRNotFoundTitle);
            this.setTooltip('Browser not supported');
            this.__setDisabledAttribute(true);
            this.emit('error', new Error(state));
            break;

          case _states2.default.ERROR_NO_PRESENTABLE_DISPLAYS:
            this.show();
            this.setTitle(this.options.textVRNotFoundTitle);
            this.setTooltip('No VR headset found.');
            this.__setDisabledAttribute(true);
            this.emit('error', new Error(state));
            break;

          case _states2.default.ERROR_REQUEST_TO_PRESENT_REJECTED:
            this.show();
            this.setTitle(this.options.textVRNotFoundTitle);
            this.setTooltip('Something went wrong trying to start presenting to your headset.');
            this.__setDisabledAttribute(true);
            this.emit('error', new Error(state));
            break;

          case _states2.default.ERROR_EXIT_PRESENT_REJECTED:
          default:
            this.show();
            this.setTitle(this.options.textVRNotFoundTitle);
            this.setTooltip('Unknown error.');
            this.__setDisabledAttribute(true);
            this.emit('error', new Error(state));
        }
      }
    }
  }]);

  return EnterVRButton;
}(_eventemitter2.default);

/**
 * Function checking if a specific css class exists as child of element.
 *
 * @param {HTMLElement} el element to find child in
 * @param {string} cssPrefix css prefix of button
 * @param {string} suffix class name
 * @param {function} fn function to call if child is found
 * @private
 */


exports.default = EnterVRButton;
var ifChild = function ifChild(el, cssPrefix, suffix, fn) {
  var c = el.querySelector('.' + cssPrefix + '-' + suffix);
  c && fn(c);
};

},{"./dom":4,"./states":7,"./webvr-manager":8,"eventemitter3":1}],6:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebVRManager = exports.State = exports.dom = exports.EnterVRButton = undefined;

var _webvrManager = _dereq_('./webvr-manager');

var _webvrManager2 = _interopRequireDefault(_webvrManager);

var _states = _dereq_('./states');

var _states2 = _interopRequireDefault(_states);

var _dom = _dereq_('./dom');

var dom = _interopRequireWildcard(_dom);

var _enterVrButton = _dereq_('./enter-vr-button');

var _enterVrButton2 = _interopRequireDefault(_enterVrButton);

_dereq_('./aframe-component');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.EnterVRButton = _enterVrButton2.default;
exports.dom = dom;
exports.State = _states2.default;
exports.WebVRManager = _webvrManager2.default; // Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

},{"./aframe-component":3,"./dom":4,"./enter-vr-button":5,"./states":7,"./webvr-manager":8}],7:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

// Not yet presenting, but ready to present
var READY_TO_PRESENT = 'ready';

// In presentation mode
var PRESENTING = 'presenting';
var PRESENTING_FULLSCREEN = 'presenting-fullscreen';

// Checking device availability
var PREPARING = 'preparing';

// Errors
var ERROR_NO_PRESENTABLE_DISPLAYS = 'error-no-presentable-displays';
var ERROR_BROWSER_NOT_SUPPORTED = 'error-browser-not-supported';
var ERROR_REQUEST_TO_PRESENT_REJECTED = 'error-request-to-present-rejected';
var ERROR_EXIT_PRESENT_REJECTED = 'error-exit-present-rejected';
var ERROR_REQUEST_STATE_CHANGE_REJECTED = 'error-request-state-change-rejected';
var ERROR_UNKOWN = 'error-unkown';

exports.default = {
  READY_TO_PRESENT: READY_TO_PRESENT,
  PRESENTING: PRESENTING,
  PRESENTING_FULLSCREEN: PRESENTING_FULLSCREEN,
  PREPARING: PREPARING,
  ERROR_NO_PRESENTABLE_DISPLAYS: ERROR_NO_PRESENTABLE_DISPLAYS,
  ERROR_BROWSER_NOT_SUPPORTED: ERROR_BROWSER_NOT_SUPPORTED,
  ERROR_REQUEST_TO_PRESENT_REJECTED: ERROR_REQUEST_TO_PRESENT_REJECTED,
  ERROR_EXIT_PRESENT_REJECTED: ERROR_EXIT_PRESENT_REJECTED,
  ERROR_REQUEST_STATE_CHANGE_REJECTED: ERROR_REQUEST_STATE_CHANGE_REJECTED,
  ERROR_UNKOWN: ERROR_UNKOWN
};

},{}],8:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _states = _dereq_('./states');

var _states2 = _interopRequireDefault(_states);

var _eventemitter = _dereq_('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _screenfull = _dereq_('screenfull');

var _screenfull2 = _interopRequireDefault(_screenfull);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Copyright 2016 Google Inc.
//
//     Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//     Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

/**
 * WebVR Manager is a utility to handle VR displays
 */
var WebVRManager = function (_EventEmitter) {
  _inherits(WebVRManager, _EventEmitter);

  /**
   * Construct a new WebVRManager
   */
  function WebVRManager() {
    _classCallCheck(this, WebVRManager);

    var _this = _possibleConstructorReturn(this, (WebVRManager.__proto__ || Object.getPrototypeOf(WebVRManager)).call(this));

    _this.state = _states2.default.PREPARING;

    // Bind vr display present change event to __onVRDisplayPresentChange
    _this.__onVRDisplayPresentChange = _this.__onVRDisplayPresentChange.bind(_this);
    window.addEventListener('vrdisplaypresentchange', _this.__onVRDisplayPresentChange);

    _this.__onChangeFullscreen = _this.__onChangeFullscreen.bind(_this);
    if (_screenfull2.default.enabled) {
      document.addEventListener(_screenfull2.default.raw.fullscreenchange, _this.__onChangeFullscreen);
    }
    return _this;
  }

  /**
   * Check if the browser is compatible with WebVR and has headsets.
   * @return {Promise<VRDisplay>}
   */


  _createClass(WebVRManager, [{
    key: 'checkDisplays',
    value: function checkDisplays() {
      var _this2 = this;

      return WebVRManager.getVRDisplay().then(function (display) {
        _this2.defaultDisplay = display;
        _this2.__setState(_states2.default.READY_TO_PRESENT);
        return display;
      }).catch(function (e) {
        delete _this2.defaultDisplay;
        if (e.name == 'NO_DISPLAYS') {
          _this2.__setState(_states2.default.ERROR_NO_PRESENTABLE_DISPLAYS);
        } else if (e.name == 'WEBVR_UNSUPPORTED') {
          _this2.__setState(_states2.default.ERROR_BROWSER_NOT_SUPPORTED);
        } else {
          _this2.__setState(_states2.default.ERROR_UNKOWN);
        }
      });
    }

    /**
     * clean up object for garbage collection
     */

  }, {
    key: 'remove',
    value: function remove() {
      window.removeEventListener('vrdisplaypresentchange', this.__onVRDisplayPresentChange);
      if (_screenfull2.default.enabled) {
        document.removeEventListener(_screenfull2.default.raw.fullscreenchanged, this.__onChangeFullscreen);
      }

      this.removeAllListeners();
    }

    /**
     * returns promise returning list of available VR displays.
     * @return {Promise<VRDisplay>}
     */

  }, {
    key: 'enterVR',


    /**
     * Enter presentation mode with your set VR display
     * @param {VRDisplay} display the display to request present on
     * @param {HTMLCanvasElement} canvas
     * @return {Promise.<TResult>}
     */
    value: function enterVR(display, canvas) {
      var _this3 = this;

      this.presentedSource = canvas;
      return display.requestPresent([{
        source: canvas
      }]).then(function () {},
      // this could fail if:
      // 1. Display `canPresent` is false
      // 2. Canvas is invalid
      // 3. not executed via user interaction
      function () {
        return _this3.__setState(_states2.default.ERROR_REQUEST_TO_PRESENT_REJECTED);
      });
    }

    /**
     * Exit presentation mode on display
     * @param {VRDisplay} display
     * @return {Promise.<TResult>}
     */

  }, {
    key: 'exitVR',
    value: function exitVR(display) {
      var _this4 = this;

      return display.exitPresent().then(function () {
        _this4.presentedSource = undefined;
      },
      // this could fail if:
      // 1. exit requested while not currently presenting
      function () {
        return _this4.__setState(_states2.default.ERROR_EXIT_PRESENT_REJECTED);
      });
    }

    /**
     * Enter fullscreen mode
     * @param {HTMLCanvasElement} canvas
     * @return {boolean}
     */

  }, {
    key: 'enterFullscreen',
    value: function enterFullscreen(canvas) {
      if (_screenfull2.default.enabled) {
        _screenfull2.default.request(canvas);
      } else {
        // iOS
        this.__setState(_states2.default.PRESENTING_FULLSCREEN);
      }
      return true;
    }

    /**
     * Exit fullscreen mode
     * @return {boolean}
     */

  }, {
    key: 'exitFullscreen',
    value: function exitFullscreen() {
      if (_screenfull2.default.enabled && _screenfull2.default.isFullscreen) {
        _screenfull2.default.exit();
      } else if (this.state == _states2.default.PRESENTING_FULLSCREEN) {
        this.checkDisplays();
      }
      return true;
    }

    /**
     * Change the state of the manager
     * @param {State} state
     * @private
     */

  }, {
    key: '__setState',
    value: function __setState(state) {
      if (state != this.state) {
        this.emit('change', state, this.state);
        this.state = state;
      }
    }

    /**
     * Triggered on fullscreen change event
     * @param {Event} e
     * @private
     */

  }, {
    key: '__onChangeFullscreen',
    value: function __onChangeFullscreen(e) {
      if (_screenfull2.default.isFullscreen) {
        this.__setState(_states2.default.PRESENTING_FULLSCREEN);
      } else {
        this.checkDisplays();
      }
    }

    /**
     * Triggered on vr present change
     * @param {Event} event
     * @private
     */

  }, {
    key: '__onVRDisplayPresentChange',
    value: function __onVRDisplayPresentChange(event) {
      try {
        // Polyfill stores display under detail
        var display = event.display ? event.display : event.detail.display;
        if (display.isPresenting && display.getLayers()[0].source !== this.presentedSource) {
          // this means a different instance of WebVRManager has requested to present
          return;
        }

        var isPresenting = this.defaultDisplay && this.defaultDisplay.isPresenting;
        this.__setState(isPresenting ? _states2.default.PRESENTING : _states2.default.READY_TO_PRESENT);
      } catch (err) {
        // continue regardless of error
      }
    }
  }], [{
    key: 'getVRDisplay',
    value: function getVRDisplay() {
      return new Promise(function (resolve, reject) {
        if (!navigator || !navigator.getVRDisplays) {
          var e = new Error('Browser not supporting WebVR');
          e.name = 'WEBVR_UNSUPPORTED';
          reject(e);
          return;
        }

        var rejectNoDisplay = function rejectNoDisplay() {
          // No displays are found.
          var e = new Error('No displays found');
          e.name = 'NO_DISPLAYS';
          reject(e);
        };

        navigator.getVRDisplays().then(function (displays) {
          // Promise succeeds, but check if there are any displays actually.
          for (var i = 0; i < displays.length; i++) {
            if (displays[i].capabilities.canPresent) {
              resolve(displays[i]);
              break;
            }
          }

          rejectNoDisplay();
        }, rejectNoDisplay);
      });
    }
  }]);

  return WebVRManager;
}(_eventemitter2.default);

exports.default = WebVRManager;

},{"./states":7,"eventemitter3":1,"screenfull":2}]},{},[6])(6)
});