(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.1.2
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function() {
        process.nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertx() {
      try {
        var r = _dereq_;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof _dereq_ === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }
    function lib$es6$promise$then$$then(onFulfillment, onRejection) {
      var parent = this;
      var state = parent._state;

      if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
        return this;
      }

      var child = new this.constructor(lib$es6$promise$$internal$$noop);
      var result = parent._result;

      if (state) {
        var callback = arguments[state - 1];
        lib$es6$promise$asap$$asap(function(){
          lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
        });
      } else {
        lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
      }

      return child;
    }
    var lib$es6$promise$then$$default = lib$es6$promise$then$$then;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable, then) {
      if (maybeThenable.constructor === promise.constructor &&
          then === lib$es6$promise$then$$default &&
          constructor.resolve === lib$es6$promise$promise$resolve$$default) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value, lib$es6$promise$$internal$$getThen(value));
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        typeof resolver !== 'function' && lib$es6$promise$promise$$needsResolver();
        this instanceof lib$es6$promise$promise$$Promise ? lib$es6$promise$$internal$$initializePromise(this, resolver) : lib$es6$promise$promise$$needsNew();
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: lib$es6$promise$then$$default,

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;
    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      this._instanceConstructor = Constructor;
      this.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (Array.isArray(input)) {
        this._input     = input;
        this.length     = input.length;
        this._remaining = input.length;

        this._result = new Array(this.length);

        if (this.length === 0) {
          lib$es6$promise$$internal$$fulfill(this.promise, this._result);
        } else {
          this.length = this.length || 0;
          this._enumerate();
          if (this._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(this.promise, this._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(this.promise, this._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var length  = this.length;
      var input   = this._input;

      for (var i = 0; this._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var c = this._instanceConstructor;
      var resolve = c.resolve;

      if (resolve === lib$es6$promise$promise$resolve$$default) {
        var then = lib$es6$promise$$internal$$getThen(entry);

        if (then === lib$es6$promise$then$$default &&
            entry._state !== lib$es6$promise$$internal$$PENDING) {
          this._settledAt(entry._state, i, entry._result);
        } else if (typeof then !== 'function') {
          this._remaining--;
          this._result[i] = entry;
        } else if (c === lib$es6$promise$promise$$default) {
          var promise = new c(lib$es6$promise$$internal$$noop);
          lib$es6$promise$$internal$$handleMaybeThenable(promise, entry, then);
          this._willSettleAt(promise, i);
        } else {
          this._willSettleAt(new c(function(resolve) { resolve(entry); }), i);
        }
      } else {
        this._willSettleAt(resolve(entry), i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var promise = this.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        this._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          this._result[i] = value;
        }
      }

      if (this._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, this._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":27}],2:[function(_dereq_,module,exports){
'use strict';
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (e) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],3:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');
var WakeLock = _dereq_('./wakelock.js');

// Start at a higher number to reduce chance of conflict.
var nextDisplayId = 1000;
var hasShowDeprecationWarning = false;

/**
 * The base class for all VR displays.
 */
function VRDisplay() {
  this.isPolyfilled = true;
  this.displayId = nextDisplayId++;
  this.displayName = 'webvr-polyfill displayName';

  this.isConnected = true;
  this.isPresenting = false;
  this.capabilities = {
    hasPosition: false,
    hasOrientation: false,
    hasExternalDisplay: false,
    canPresent: false,
    maxLayers: 1
  };
  this.stageParameters = null;

  // "Private" members.
  this.waitingForPresent_ = false;
  this.layer_ = null;

  this.fullscreenElement_ = null;
  this.fullscreenWrapper_ = null;

  this.fullscreenEventTarget_ = null;
  this.fullscreenChangeHandler_ = null;
  this.fullscreenErrorHandler_ = null;

  this.wakelock_ = new WakeLock();
}

VRDisplay.prototype.getPose = function() {
  // TODO: Technically this should retain it's value for the duration of a frame
  // but I doubt that's practical to do in javascript.
  return this.getImmediatePose();
};

VRDisplay.prototype.requestAnimationFrame = function(callback) {
  return window.requestAnimationFrame(callback);
};

VRDisplay.prototype.cancelAnimationFrame = function(id) {
  return window.cancelAnimationFrame(id);
};

VRDisplay.prototype.wrapForFullscreen = function(element) {
  if (Util.isIOS())
    return element;

  if (!this.fullscreenWrapper_) {
    this.fullscreenWrapper_ = document.createElement('div');
    this.fullscreenWrapper_.classList.add('webvr-polyfill-fullscreen-wrapper');
    // Make sure the wrapper takes the full screen. Without this, there is a
    // white line at the bottom.
    this.fullscreenWrapper_.style.width = '100%';
    this.fullscreenWrapper_.style.height = '100%';
  }

  if (this.fullscreenElement_ == element)
    return this.fullscreenWrapper_;

  // Remove any previously applied wrappers
  this.removeFullscreenWrapper();

  this.fullscreenElement_ = element;
  var parent = this.fullscreenElement_.parentElement;
  parent.insertBefore(this.fullscreenWrapper_, this.fullscreenElement_);
  parent.removeChild(this.fullscreenElement_);
  this.fullscreenWrapper_.insertBefore(this.fullscreenElement_, this.fullscreenWrapper_.firstChild);

  return this.fullscreenWrapper_;
};

VRDisplay.prototype.removeFullscreenWrapper = function() {
  if (!this.fullscreenElement_)
    return;

  var element = this.fullscreenElement_;
  this.fullscreenElement_ = null;

  var parent = this.fullscreenWrapper_.parentElement;
  this.fullscreenWrapper_.removeChild(element);
  parent.insertBefore(element, this.fullscreenWrapper_);
  parent.removeChild(this.fullscreenWrapper_);

  return element;
};

VRDisplay.prototype.requestPresent = function(layers) {
  var self = this;

  if (!(layers instanceof Array)) {
    if (!hasShowDeprecationWarning) {
      console.warn("Using a deprecated form of requestPresent. Should pass in an array of VRLayers.");
      hasShowDeprecationWarning = true;
    }
    layers = [layers];
  }

  return new Promise(function(resolve, reject) {
    if (!self.capabilities.canPresent) {
      reject(new Error('VRDisplay is not capable of presenting.'));
      return;
    }

    if (layers.length == 0 || layers.length > self.capabilities.maxLayers) {
      reject(new Error('Invalid number of layers.'));
      return;
    }

    self.layer_ = layers[0];

    self.waitingForPresent_ = false;
    if (self.layer_ && self.layer_.source) {
      var fullscreenElement = self.wrapForFullscreen(self.layer_.source);

      function onFullscreenChange() {
        var actualFullscreenElement = Util.getFullscreenElement();

        self.isPresenting = (fullscreenElement === actualFullscreenElement);
        if (self.isPresenting) {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape-primary');
          }
          self.waitingForPresent_ = false;
          self.beginPresent_();
          resolve();
        } else {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
          self.removeFullscreenWrapper();
          self.wakelock_.release();
          self.endPresent_();
          self.removeFullscreenListeners_();
        }
        self.fireVRDisplayPresentChange_();
      }
      function onFullscreenError() {
        if (!self.waitingForPresent_) {
          return;
        }

        self.removeFullscreenWrapper();
        self.removeFullscreenListeners_();

        self.wakelock_.release();
        self.waitingForPresent_ = false;
        self.isPresenting = false;

        reject(new Error('Unable to present.'));
      }

      self.addFullscreenListeners_(fullscreenElement,
          onFullscreenChange, onFullscreenError);

      if (Util.requestFullscreen(fullscreenElement)) {
        self.wakelock_.request();
        self.waitingForPresent_ = true;
      } else if (Util.isIOS()) {
        // *sigh* Just fake it.
        self.wakelock_.request();
        self.isPresenting = true;
        self.beginPresent_();
        self.fireVRDisplayPresentChange_();
        resolve();
      }
    }

    if (!self.waitingForPresent_ && !Util.isIOS()) {
      Util.exitFullscreen();
      reject(new Error('Unable to present.'));
    }
  });
};

VRDisplay.prototype.exitPresent = function() {
  var wasPresenting = this.isPresenting;
  var self = this;
  this.isPresenting = false;
  this.layer_ = null;
  this.wakelock_.release();

  return new Promise(function(resolve, reject) {
    if (wasPresenting) {
      if (!Util.exitFullscreen() && Util.isIOS()) {
        self.endPresent_();
        self.fireVRDisplayPresentChange_();
      }

      self.removeFullscreenWrapper();

      resolve();
    } else {
      reject(new Error('Was not presenting to VRDisplay.'));
    }
  });
};

VRDisplay.prototype.getLayers = function() {
  if (this.layer_) {
    return [this.layer_];
  }
  return [];
};

VRDisplay.prototype.fireVRDisplayPresentChange_ = function() {
  var event = new CustomEvent('vrdisplaypresentchange', {detail: {vrdisplay: this}});
  window.dispatchEvent(event);
};

VRDisplay.prototype.addFullscreenListeners_ = function(element, changeHandler, errorHandler) {
  this.removeFullscreenListeners_();

  this.fullscreenEventTarget_ = element;
  this.fullscreenChangeHandler_ = changeHandler;
  this.fullscreenErrorHandler_ = errorHandler;

  if (changeHandler) {
    element.addEventListener('fullscreenchange', changeHandler, false);
    element.addEventListener('webkitfullscreenchange', changeHandler, false);
    document.addEventListener('mozfullscreenchange', changeHandler, false);
    element.addEventListener('msfullscreenchange', changeHandler, false);
  }

  if (errorHandler) {
    element.addEventListener('fullscreenerror', errorHandler, false);
    element.addEventListener('webkitfullscreenerror', errorHandler, false);
    document.addEventListener('mozfullscreenerror', errorHandler, false);
    element.addEventListener('msfullscreenerror', errorHandler, false);
  }
};

VRDisplay.prototype.removeFullscreenListeners_ = function() {
  if (!this.fullscreenEventTarget_)
    return;

  var element = this.fullscreenEventTarget_;

  if (this.fullscreenChangeHandler_) {
    var changeHandler = this.fullscreenChangeHandler_;
    element.removeEventListener('fullscreenchange', changeHandler, false);
    element.removeEventListener('webkitfullscreenchange', changeHandler, false);
    document.removeEventListener('mozfullscreenchange', changeHandler, false);
    element.removeEventListener('msfullscreenchange', changeHandler, false);
  }

  if (this.fullscreenErrorHandler_) {
    var errorHandler = this.fullscreenErrorHandler_;
    element.removeEventListener('fullscreenerror', errorHandler, false);
    element.removeEventListener('webkitfullscreenerror', errorHandler, false);
    document.removeEventListener('mozfullscreenerror', errorHandler, false);
    element.removeEventListener('msfullscreenerror', errorHandler, false);
  }

  this.fullscreenEventTarget_ = null;
  this.fullscreenChangeHandler_ = null;
  this.fullscreenErrorHandler_ = null;
};

VRDisplay.prototype.beginPresent_ = function() {
  // Override to add custom behavior when presentation begins.
};

VRDisplay.prototype.endPresent_ = function() {
  // Override to add custom behavior when presentation ends.
};

VRDisplay.prototype.submitFrame = function(pose) {
  // Override to add custom behavior for frame submission.
};

VRDisplay.prototype.getEyeParameters = function(whichEye) {
  // Override to return accurate eye parameters is canPresent is true.
  return null;
};

/*
 * Deprecated classes
 */

/**
 * The base class for all VR devices. (Deprecated)
 */
function VRDevice() {
  this.isPolyfilled = true;
  this.hardwareUnitId = 'webvr-polyfill hardwareUnitId';
  this.deviceId = 'webvr-polyfill deviceId';
  this.deviceName = 'webvr-polyfill deviceName';
}

/**
 * The base class for all VR HMD devices. (Deprecated)
 */
function HMDVRDevice() {
}
HMDVRDevice.prototype = new VRDevice();

/**
 * The base class for all VR position sensor devices. (Deprecated)
 */
function PositionSensorVRDevice() {
}
PositionSensorVRDevice.prototype = new VRDevice();

module.exports.VRDisplay = VRDisplay;
module.exports.VRDevice = VRDevice;
module.exports.HMDVRDevice = HMDVRDevice;
module.exports.PositionSensorVRDevice = PositionSensorVRDevice;

},{"./util.js":23,"./wakelock.js":25}],4:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var CardboardUI = _dereq_('./cardboard-ui.js');
var Util = _dereq_('./util.js');
var WGLUPreserveGLState = _dereq_('./deps/wglu-preserve-state.js');

var distortionVS = [
  'attribute vec2 position;',
  'attribute vec3 texCoord;',

  'varying vec2 vTexCoord;',

  'uniform vec4 viewportOffsetScale[2];',

  'void main() {',
  '  vec4 viewport = viewportOffsetScale[int(texCoord.z)];',
  '  vTexCoord = (texCoord.xy * viewport.zw) + viewport.xy;',
  '  gl_Position = vec4( position, 1.0, 1.0 );',
  '}',
].join('\n');

var distortionFS = [
  'precision mediump float;',
  'uniform sampler2D diffuse;',

  'varying vec2 vTexCoord;',

  'void main() {',
  '  gl_FragColor = texture2D(diffuse, vTexCoord);',
  '}',
].join('\n');

/**
 * A mesh-based distorter.
 */
function CardboardDistorter(gl) {
  this.gl = gl;
  this.ctxAttribs = gl.getContextAttributes();

  this.meshWidth = 20;
  this.meshHeight = 20;

  this.bufferScale = WebVRConfig.BUFFER_SCALE;

  this.bufferWidth = gl.drawingBufferWidth;
  this.bufferHeight = gl.drawingBufferHeight;

  // Patching support
  this.realBindFramebuffer = gl.bindFramebuffer;
  this.realEnable = gl.enable;
  this.realDisable = gl.disable;
  this.realColorMask = gl.colorMask;
  this.realClearColor = gl.clearColor;
  this.realViewport = gl.viewport;

  if (!Util.isIOS()) {
    this.realCanvasWidth = Object.getOwnPropertyDescriptor(gl.canvas.__proto__, 'width');
    this.realCanvasHeight = Object.getOwnPropertyDescriptor(gl.canvas.__proto__, 'height');
  }

  this.isPatched = false;

  // State tracking
  this.lastBoundFramebuffer = null;
  this.cullFace = false;
  this.depthTest = false;
  this.blend = false;
  this.scissorTest = false;
  this.stencilTest = false;
  this.viewport = [0, 0, 0, 0];
  this.colorMask = [true, true, true, true];
  this.clearColor = [0, 0, 0, 0];

  this.attribs = {
    position: 0,
    texCoord: 1
  };
  this.program = Util.linkProgram(gl, distortionVS, distortionFS, this.attribs);
  this.uniforms = Util.getProgramUniforms(gl, this.program);

  this.viewportOffsetScale = new Float32Array(8);
  this.setTextureBounds();

  this.vertexBuffer = gl.createBuffer();
  this.indexBuffer = gl.createBuffer();
  this.indexCount = 0;

  this.renderTarget = gl.createTexture();
  this.framebuffer = gl.createFramebuffer();

  this.depthStencilBuffer = null;
  this.depthBuffer = null;
  this.stencilBuffer = null;

  if (this.ctxAttribs.depth && this.ctxAttribs.stencil) {
    this.depthStencilBuffer = gl.createRenderbuffer();
  } else if (this.ctxAttribs.depth) {
    this.depthBuffer = gl.createRenderbuffer();
  } else if (this.ctxAttribs.stencil) {
    this.stencilBuffer = gl.createRenderbuffer();
  }

  this.patch();

  this.onResize();

  this.cardboardUI = new CardboardUI(gl);
};

/**
 * Tears down all the resources created by the distorter and removes any
 * patches.
 */
CardboardDistorter.prototype.destroy = function() {
  var gl = this.gl;

  this.unpatch();

  gl.deleteProgram(this.program);
  gl.deleteBuffer(this.vertexBuffer);
  gl.deleteBuffer(this.indexBuffer);
  gl.deleteTexture(this.renderTarget);
  gl.deleteFramebuffer(this.framebuffer);
  if (this.depthStencilBuffer) {
    gl.deleteRenderbuffer(this.depthStencilBuffer);
  }
  if (this.depthBuffer) {
    gl.deleteRenderbuffer(this.depthBuffer);
  }
  if (this.stencilBuffer) {
    gl.deleteRenderbuffer(this.stencilBuffer);
  }

  this.cardboardUI.destroy();
};


/**
 * Resizes the backbuffer to match the canvas width and height.
 */
CardboardDistorter.prototype.onResize = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.RENDERBUFFER_BINDING,
    gl.TEXTURE_BINDING_2D, gl.TEXTURE0
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Bind real backbuffer and clear it once. We don't need to clear it again
    // after that because we're overwriting the same area every frame.
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, null);

    // Put things in a good state
    if (self.scissorTest) { self.realDisable.call(gl, gl.SCISSOR_TEST); }
    self.realColorMask.call(gl, true, true, true, true);
    self.realViewport.call(gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    self.realClearColor.call(gl, 0, 0, 0, 1);

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Now bind and resize the fake backbuffer
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.framebuffer);

    gl.bindTexture(gl.TEXTURE_2D, self.renderTarget);
    gl.texImage2D(gl.TEXTURE_2D, 0, self.ctxAttribs.alpha ? gl.RGBA : gl.RGB,
        self.bufferWidth, self.bufferHeight, 0,
        self.ctxAttribs.alpha ? gl.RGBA : gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, self.renderTarget, 0);

    if (self.ctxAttribs.depth && self.ctxAttribs.stencil) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.depthStencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT,
          gl.RENDERBUFFER, self.depthStencilBuffer);
    } else if (self.ctxAttribs.depth) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
          gl.RENDERBUFFER, self.depthBuffer);
    } else if (self.ctxAttribs.stencil) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.stencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT,
          gl.RENDERBUFFER, self.stencilBuffer);
    }

    if (!gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer incomplete!');
    }

    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.lastBoundFramebuffer);

    if (self.scissorTest) { self.realEnable.call(gl, gl.SCISSOR_TEST); }

    self.realColorMask.apply(gl, self.colorMask);
    self.realViewport.apply(gl, self.viewport);
    self.realClearColor.apply(gl, self.clearColor);
  });

  if (this.cardboardUI) {
    this.cardboardUI.onResize();
  }
};

CardboardDistorter.prototype.patch = function() {
  if (this.isPatched) {
    return;
  }

  var self = this;
  var canvas = this.gl.canvas;
  var gl = this.gl;

  if (!Util.isIOS()) {
    canvas.width = Util.getScreenWidth() * this.bufferScale;
    canvas.height = Util.getScreenHeight() * this.bufferScale;

    Object.defineProperty(canvas, 'width', {
      configurable: true,
      enumerable: true,
      get: function() {
        return self.bufferWidth;
      },
      set: function(value) {
        self.bufferWidth = value;
        self.onResize();
      }
    });

    Object.defineProperty(canvas, 'height', {
      configurable: true,
      enumerable: true,
      get: function() {
        return self.bufferHeight;
      },
      set: function(value) {
        self.bufferHeight = value;
        self.onResize();
      }
    });
  }

  this.lastBoundFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

  if (this.lastBoundFramebuffer == null) {
    this.lastBoundFramebuffer = this.framebuffer;
    this.gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  }

  this.gl.bindFramebuffer = function(target, framebuffer) {
    self.lastBoundFramebuffer = framebuffer ? framebuffer : self.framebuffer;
    // Silently make calls to bind the default framebuffer bind ours instead.
    self.realBindFramebuffer.call(gl, target, self.lastBoundFramebuffer);
  };

  this.cullFace = gl.getParameter(gl.CULL_FACE);
  this.depthTest = gl.getParameter(gl.DEPTH_TEST);
  this.blend = gl.getParameter(gl.BLEND);
  this.scissorTest = gl.getParameter(gl.SCISSOR_TEST);
  this.stencilTest = gl.getParameter(gl.STENCIL_TEST);

  gl.enable = function(pname) {
    switch (pname) {
      case gl.CULL_FACE: self.cullFace = true; break;
      case gl.DEPTH_TEST: self.depthTest = true; break;
      case gl.BLEND: self.blend = true; break;
      case gl.SCISSOR_TEST: self.scissorTest = true; break;
      case gl.STENCIL_TEST: self.stencilTest = true; break;
    }
    self.realEnable.call(gl, pname);
  };

  gl.disable = function(pname) {
    switch (pname) {
      case gl.CULL_FACE: self.cullFace = false; break;
      case gl.DEPTH_TEST: self.depthTest = false; break;
      case gl.BLEND: self.blend = false; break;
      case gl.SCISSOR_TEST: self.scissorTest = false; break;
      case gl.STENCIL_TEST: self.stencilTest = false; break;
    }
    self.realDisable.call(gl, pname);
  };

  this.colorMask = gl.getParameter(gl.COLOR_WRITEMASK);
  gl.colorMask = function(r, g, b, a) {
    self.colorMask[0] = r;
    self.colorMask[1] = g;
    self.colorMask[2] = b;
    self.colorMask[3] = a;
    self.realColorMask.call(gl, r, g, b, a);
  };

  this.clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
  gl.clearColor = function(r, g, b, a) {
    self.clearColor[0] = r;
    self.clearColor[1] = g;
    self.clearColor[2] = b;
    self.clearColor[3] = a;
    self.realClearColor.call(gl, r, g, b, a);
  };

  this.viewport = gl.getParameter(gl.VIEWPORT);
  gl.viewport = function(x, y, w, h) {
    self.viewport[0] = x;
    self.viewport[1] = y;
    self.viewport[2] = w;
    self.viewport[3] = h;
    self.realViewport.call(gl, x, y, w, h);
  };

  this.isPatched = true;
};

CardboardDistorter.prototype.unpatch = function() {
  if (!this.isPatched) {
    return;
  }

  var gl = this.gl;
  var canvas = this.gl.canvas;

  if (!Util.isIOS()) {
    Object.defineProperty(canvas, 'width', this.realCanvasWidth);
    Object.defineProperty(canvas, 'height', this.realCanvasHeight);
  }
  canvas.width = this.bufferWidth;
  canvas.height = this.bufferHeight;

  gl.bindFramebuffer = this.realBindFramebuffer;
  gl.enable = this.realEnable;
  gl.disable = this.realDisable;
  gl.colorMask = this.realColorMask;
  gl.clearColor = this.realClearColor;
  gl.viewport = this.realViewport;

  // Check to see if our fake backbuffer is bound and bind the real backbuffer
  // if that's the case.
  if (this.lastBoundFramebuffer == this.framebuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  this.isPatched = false;
};

CardboardDistorter.prototype.setTextureBounds = function(leftBounds, rightBounds) {
  if (!leftBounds) {
    leftBounds = [0, 0, 0.5, 1];
  }

  if (!rightBounds) {
    rightBounds = [0.5, 0, 0.5, 1];
  }

  // Left eye
  this.viewportOffsetScale[0] = leftBounds[0]; // X
  this.viewportOffsetScale[1] = leftBounds[1]; // Y
  this.viewportOffsetScale[2] = leftBounds[2]; // Width
  this.viewportOffsetScale[3] = leftBounds[3]; // Height

  // Right eye
  this.viewportOffsetScale[4] = rightBounds[0]; // X
  this.viewportOffsetScale[5] = rightBounds[1]; // Y
  this.viewportOffsetScale[6] = rightBounds[2]; // Width
  this.viewportOffsetScale[7] = rightBounds[3]; // Height
};

/**
 * Performs distortion pass on the injected backbuffer, rendering it to the real
 * backbuffer.
 */
CardboardDistorter.prototype.submitFrame = function() {
  var gl = this.gl;
  var self = this;

  var glState = [];

  if (!WebVRConfig.DIRTY_SUBMIT_FRAME_BINDINGS) {
    glState.push(
      gl.CURRENT_PROGRAM,
      gl.ARRAY_BUFFER_BINDING,
      gl.ELEMENT_ARRAY_BUFFER_BINDING,
      gl.TEXTURE_BINDING_2D, gl.TEXTURE0
    );
  }

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Bind the real default framebuffer
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, null);

    // Make sure the GL state is in a good place
    if (self.cullFace) { self.realDisable.call(gl, gl.CULL_FACE); }
    if (self.depthTest) { self.realDisable.call(gl, gl.DEPTH_TEST); }
    if (self.blend) { self.realDisable.call(gl, gl.BLEND); }
    if (self.scissorTest) { self.realDisable.call(gl, gl.SCISSOR_TEST); }
    if (self.stencilTest) { self.realDisable.call(gl, gl.STENCIL_TEST); }
    self.realColorMask.call(gl, true, true, true, true);
    self.realViewport.call(gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // If the backbuffer has an alpha channel clear every frame so the page
    // doesn't show through.
    if (self.ctxAttribs.alpha || Util.isIOS()) {
      self.realClearColor.call(gl, 0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // Bind distortion program and mesh
    gl.useProgram(self.program);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.enableVertexAttribArray(self.attribs.position);
    gl.enableVertexAttribArray(self.attribs.texCoord);
    gl.vertexAttribPointer(self.attribs.position, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(self.attribs.texCoord, 3, gl.FLOAT, false, 20, 8);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(self.uniforms.diffuse, 0);
    gl.bindTexture(gl.TEXTURE_2D, self.renderTarget);

    gl.uniform4fv(self.uniforms.viewportOffsetScale, self.viewportOffsetScale);

    // Draws both eyes
    gl.drawElements(gl.TRIANGLES, self.indexCount, gl.UNSIGNED_SHORT, 0);

    self.cardboardUI.renderNoState();

    // Bind the fake default framebuffer again
    self.realBindFramebuffer.call(self.gl, gl.FRAMEBUFFER, self.framebuffer);

    // If preserveDrawingBuffer == false clear the framebuffer
    if (!self.ctxAttribs.preserveDrawingBuffer) {
      self.realClearColor.call(gl, 0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    if (!WebVRConfig.DIRTY_SUBMIT_FRAME_BINDINGS) {
      self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.lastBoundFramebuffer);
    }

    // Restore state
    if (self.cullFace) { self.realEnable.call(gl, gl.CULL_FACE); }
    if (self.depthTest) { self.realEnable.call(gl, gl.DEPTH_TEST); }
    if (self.blend) { self.realEnable.call(gl, gl.BLEND); }
    if (self.scissorTest) { self.realEnable.call(gl, gl.SCISSOR_TEST); }
    if (self.stencilTest) { self.realEnable.call(gl, gl.STENCIL_TEST); }

    self.realColorMask.apply(gl, self.colorMask);
    self.realViewport.apply(gl, self.viewport);
    if (self.ctxAttribs.alpha || !self.ctxAttribs.preserveDrawingBuffer) {
      self.realClearColor.apply(gl, self.clearColor);
    }
  });

  // Workaround for the fact that Safari doesn't allow us to patch the canvas
  // width and height correctly. After each submit frame check to see what the
  // real backbuffer size has been set to and resize the fake backbuffer size
  // to match.
  if (Util.isIOS()) {
    var canvas = gl.canvas;
    if (canvas.width != self.bufferWidth || canvas.height != self.bufferHeight) {
      self.bufferWidth = canvas.width;
      self.bufferHeight = canvas.height;
      self.onResize();
    }
  }
};

/**
 * Call when the deviceInfo has changed. At this point we need
 * to re-calculate the distortion mesh.
 */
CardboardDistorter.prototype.updateDeviceInfo = function(deviceInfo) {
  var gl = this.gl;
  var self = this;

  var glState = [gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING];
  WGLUPreserveGLState(gl, glState, function(gl) {
    var vertices = self.computeMeshVertices_(self.meshWidth, self.meshHeight, deviceInfo);
    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Indices don't change based on device parameters, so only compute once.
    if (!self.indexCount) {
      var indices = self.computeMeshIndices_(self.meshWidth, self.meshHeight);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      self.indexCount = indices.length;
    }
  });
};

/**
 * Build the distortion mesh vertices.
 * Based on code from the Unity cardboard plugin.
 */
CardboardDistorter.prototype.computeMeshVertices_ = function(width, height, deviceInfo) {
  var vertices = new Float32Array(2 * width * height * 5);

  var lensFrustum = deviceInfo.getLeftEyeVisibleTanAngles();
  var noLensFrustum = deviceInfo.getLeftEyeNoLensTanAngles();
  var viewport = deviceInfo.getLeftEyeVisibleScreenRect(noLensFrustum);
  var vidx = 0;
  var iidx = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++, vidx++) {
        var u = i / (width - 1);
        var v = j / (height - 1);

        // Grid points regularly spaced in StreoScreen, and barrel distorted in
        // the mesh.
        var s = u;
        var t = v;
        var x = Util.lerp(lensFrustum[0], lensFrustum[2], u);
        var y = Util.lerp(lensFrustum[3], lensFrustum[1], v);
        var d = Math.sqrt(x * x + y * y);
        var r = deviceInfo.distortion.distortInverse(d);
        var p = x * r / d;
        var q = y * r / d;
        u = (p - noLensFrustum[0]) / (noLensFrustum[2] - noLensFrustum[0]);
        v = (q - noLensFrustum[3]) / (noLensFrustum[1] - noLensFrustum[3]);

        // Convert u,v to mesh screen coordinates.
        var aspect = deviceInfo.device.widthMeters / deviceInfo.device.heightMeters;

        // FIXME: The original Unity plugin multiplied U by the aspect ratio
        // and didn't multiply either value by 2, but that seems to get it
        // really close to correct looking for me. I hate this kind of "Don't
        // know why it works" code though, and wold love a more logical
        // explanation of what needs to happen here.
        u = (viewport.x + u * viewport.width - 0.5) * 2.0; //* aspect;
        v = (viewport.y + v * viewport.height - 0.5) * 2.0;

        vertices[(vidx * 5) + 0] = u; // position.x
        vertices[(vidx * 5) + 1] = v; // position.y
        vertices[(vidx * 5) + 2] = s; // texCoord.x
        vertices[(vidx * 5) + 3] = t; // texCoord.y
        vertices[(vidx * 5) + 4] = e; // texCoord.z (viewport index)
      }
    }
    var w = lensFrustum[2] - lensFrustum[0];
    lensFrustum[0] = -(w + lensFrustum[0]);
    lensFrustum[2] = w - lensFrustum[2];
    w = noLensFrustum[2] - noLensFrustum[0];
    noLensFrustum[0] = -(w + noLensFrustum[0]);
    noLensFrustum[2] = w - noLensFrustum[2];
    viewport.x = 1 - (viewport.x + viewport.width);
  }
  return vertices;
}

/**
 * Build the distortion mesh indices.
 * Based on code from the Unity cardboard plugin.
 */
CardboardDistorter.prototype.computeMeshIndices_ = function(width, height) {
  var indices = new Uint16Array(2 * (width - 1) * (height - 1) * 6);
  var halfwidth = width / 2;
  var halfheight = height / 2;
  var vidx = 0;
  var iidx = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++, vidx++) {
        if (i == 0 || j == 0)
          continue;
        // Build a quad.  Lower right and upper left quadrants have quads with
        // the triangle diagonal flipped to get the vignette to interpolate
        // correctly.
        if ((i <= halfwidth) == (j <= halfheight)) {
          // Quad diagonal lower left to upper right.
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - width - 1;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx - width - 1;
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - 1;
        } else {
          // Quad diagonal upper left to lower right.
          indices[iidx++] = vidx - 1;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx - 1;
          indices[iidx++] = vidx - width - 1;
        }
      }
    }
  }
  return indices;
};

CardboardDistorter.prototype.getOwnPropertyDescriptor_ = function(proto, attrName) {
  var descriptor = Object.getOwnPropertyDescriptor(proto, attrName);
  // In some cases (ahem... Safari), the descriptor returns undefined get and
  // set fields. In this case, we need to create a synthetic property
  // descriptor. This works around some of the issues in
  // https://github.com/borismus/webvr-polyfill/issues/46
  if (descriptor.get === undefined || descriptor.set === undefined) {
    descriptor.configurable = true;
    descriptor.enumerable = true;
    descriptor.get = function() {
      return this.getAttribute(attrName);
    };
    descriptor.set = function(val) {
      this.setAttribute(attrName, val);
    };
  }
  return descriptor;
};

module.exports = CardboardDistorter;

},{"./cardboard-ui.js":5,"./deps/wglu-preserve-state.js":7,"./util.js":23}],5:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');
var WGLUPreserveGLState = _dereq_('./deps/wglu-preserve-state.js');

var uiVS = [
  'attribute vec2 position;',

  'uniform mat4 projectionMat;',

  'void main() {',
  '  gl_Position = projectionMat * vec4( position, -1.0, 1.0 );',
  '}',
].join('\n');

var uiFS = [
  'precision mediump float;',

  'uniform vec4 color;',

  'void main() {',
  '  gl_FragColor = color;',
  '}',
].join('\n');

var DEG2RAD = Math.PI/180.0;

// The gear has 6 identical sections, each spanning 60 degrees.
var kAnglePerGearSection = 60;

// Half-angle of the span of the outer rim.
var kOuterRimEndAngle = 12;

// Angle between the middle of the outer rim and the start of the inner rim.
var kInnerRimBeginAngle = 20;

// Distance from center to outer rim, normalized so that the entire model
// fits in a [-1, 1] x [-1, 1] square.
var kOuterRadius = 1;

// Distance from center to depressed rim, in model units.
var kMiddleRadius = 0.75;

// Radius of the inner hollow circle, in model units.
var kInnerRadius = 0.3125;

// Center line thickness in DP.
var kCenterLineThicknessDp = 4;

// Button width in DP.
var kButtonWidthDp = 28;

// Factor to scale the touch area that responds to the touch.
var kTouchSlopFactor = 1.5;

var Angles = [
  0, kOuterRimEndAngle, kInnerRimBeginAngle,
  kAnglePerGearSection - kInnerRimBeginAngle,
  kAnglePerGearSection - kOuterRimEndAngle
];

/**
 * Renders the alignment line and "options" gear. It is assumed that the canvas
 * this is rendered into covers the entire screen (or close to it.)
 */
function CardboardUI(gl) {
  this.gl = gl;

  this.attribs = {
    position: 0
  };
  this.program = Util.linkProgram(gl, uiVS, uiFS, this.attribs);
  this.uniforms = Util.getProgramUniforms(gl, this.program);

  this.vertexBuffer = gl.createBuffer();
  this.gearOffset = 0;
  this.gearVertexCount = 0;
  this.arrowOffset = 0;
  this.arrowVertexCount = 0;

  this.projMat = new Float32Array(16);

  this.listener = null;

  this.onResize();
};

/**
 * Tears down all the resources created by the UI renderer.
 */
CardboardUI.prototype.destroy = function() {
  var gl = this.gl;

  if (this.listener) {
    gl.canvas.removeEventListener('click', this.listener, false);
  }

  gl.deleteProgram(this.program);
  gl.deleteBuffer(this.vertexBuffer);
};

/**
 * Adds a listener to clicks on the gear and back icons
 */
CardboardUI.prototype.listen = function(optionsCallback, backCallback) {
  var canvas = this.gl.canvas;
  this.listener = function(event) {
    var midline = canvas.clientWidth / 2;
    var buttonSize = kButtonWidthDp * kTouchSlopFactor;
    // Check to see if the user clicked on (or around) the gear icon
    if (event.clientX > midline - buttonSize &&
        event.clientX < midline + buttonSize &&
        event.clientY > canvas.clientHeight - buttonSize) {
      optionsCallback(event);
    }
    // Check to see if the user clicked on (or around) the back icon
    else if (event.clientX < buttonSize && event.clientY < buttonSize) {
      backCallback(event);
    }
  };
  canvas.addEventListener('click', this.listener, false);
};

/**
 * Builds the UI mesh.
 */
CardboardUI.prototype.onResize = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.ARRAY_BUFFER_BINDING
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    var vertices = [];

    var midline = gl.drawingBufferWidth / 2;

    // Assumes your canvas width and height is scaled proportionately.
    // TODO(smus): The following causes buttons to become huge on iOS, but seems
    // like the right thing to do. For now, added a hack. But really, investigate why.
    var dps = (gl.drawingBufferWidth / (screen.width * window.devicePixelRatio));
    if (!Util.isIOS()) {
      dps *= window.devicePixelRatio;
    }

    var lineWidth = kCenterLineThicknessDp * dps / 2;
    var buttonSize = kButtonWidthDp * kTouchSlopFactor * dps;
    var buttonScale = kButtonWidthDp * dps / 2;
    var buttonBorder = ((kButtonWidthDp * kTouchSlopFactor) - kButtonWidthDp) * dps;

    // Build centerline
    vertices.push(midline - lineWidth, buttonSize);
    vertices.push(midline - lineWidth, gl.drawingBufferHeight);
    vertices.push(midline + lineWidth, buttonSize);
    vertices.push(midline + lineWidth, gl.drawingBufferHeight);

    // Build gear
    self.gearOffset = (vertices.length / 2);

    function addGearSegment(theta, r) {
      var angle = (90 - theta) * DEG2RAD;
      var x = Math.cos(angle);
      var y = Math.sin(angle);
      vertices.push(kInnerRadius * x * buttonScale + midline, kInnerRadius * y * buttonScale + buttonScale);
      vertices.push(r * x * buttonScale + midline, r * y * buttonScale + buttonScale);
    }

    for (var i = 0; i <= 6; i++) {
      var segmentTheta = i * kAnglePerGearSection;

      addGearSegment(segmentTheta, kOuterRadius);
      addGearSegment(segmentTheta + kOuterRimEndAngle, kOuterRadius);
      addGearSegment(segmentTheta + kInnerRimBeginAngle, kMiddleRadius);
      addGearSegment(segmentTheta + (kAnglePerGearSection - kInnerRimBeginAngle), kMiddleRadius);
      addGearSegment(segmentTheta + (kAnglePerGearSection - kOuterRimEndAngle), kOuterRadius);
    }

    self.gearVertexCount = (vertices.length / 2) - self.gearOffset;

    // Build back arrow
    self.arrowOffset = (vertices.length / 2);

    function addArrowVertex(x, y) {
      vertices.push(buttonBorder + x, gl.drawingBufferHeight - buttonBorder - y);
    }

    var angledLineWidth = lineWidth / Math.sin(45 * DEG2RAD);

    addArrowVertex(0, buttonScale);
    addArrowVertex(buttonScale, 0);
    addArrowVertex(buttonScale + angledLineWidth, angledLineWidth);
    addArrowVertex(angledLineWidth, buttonScale + angledLineWidth);

    addArrowVertex(angledLineWidth, buttonScale - angledLineWidth);
    addArrowVertex(0, buttonScale);
    addArrowVertex(buttonScale, buttonScale * 2);
    addArrowVertex(buttonScale + angledLineWidth, (buttonScale * 2) - angledLineWidth);

    addArrowVertex(angledLineWidth, buttonScale - angledLineWidth);
    addArrowVertex(0, buttonScale);

    addArrowVertex(angledLineWidth, buttonScale - lineWidth);
    addArrowVertex(kButtonWidthDp * dps, buttonScale - lineWidth);
    addArrowVertex(angledLineWidth, buttonScale + lineWidth);
    addArrowVertex(kButtonWidthDp * dps, buttonScale + lineWidth);

    self.arrowVertexCount = (vertices.length / 2) - self.arrowOffset;

    // Buffer data
    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  });
};

/**
 * Performs distortion pass on the injected backbuffer, rendering it to the real
 * backbuffer.
 */
CardboardUI.prototype.render = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.CULL_FACE,
    gl.DEPTH_TEST,
    gl.BLEND,
    gl.SCISSOR_TEST,
    gl.STENCIL_TEST,
    gl.COLOR_WRITEMASK,
    gl.VIEWPORT,

    gl.CURRENT_PROGRAM,
    gl.ARRAY_BUFFER_BINDING
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Make sure the GL state is in a good place
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    self.renderNoState();
  });
};

CardboardUI.prototype.renderNoState = function() {
  var gl = this.gl;

  // Bind distortion program and mesh
  gl.useProgram(this.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.enableVertexAttribArray(this.attribs.position);
  gl.vertexAttribPointer(this.attribs.position, 2, gl.FLOAT, false, 8, 0);

  gl.uniform4f(this.uniforms.color, 1.0, 1.0, 1.0, 1.0);

  Util.orthoMatrix(this.projMat, 0, gl.drawingBufferWidth, 0, gl.drawingBufferHeight, 0.1, 1024.0);
  gl.uniformMatrix4fv(this.uniforms.projectionMat, false, this.projMat);

  // Draws UI element
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.gearOffset, this.gearVertexCount);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.arrowOffset, this.arrowVertexCount);
};

module.exports = CardboardUI;

},{"./deps/wglu-preserve-state.js":7,"./util.js":23}],6:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var CardboardDistorter = _dereq_('./cardboard-distorter.js');
var CardboardUI = _dereq_('./cardboard-ui.js');
var DeviceInfo = _dereq_('./device-info.js');
var Dpdb = _dereq_('./dpdb/dpdb.js');
var FusionPoseSensor = _dereq_('./sensor-fusion/fusion-pose-sensor.js');
var RotateInstructions = _dereq_('./rotate-instructions.js');
var ViewerSelector = _dereq_('./viewer-selector.js');
var VRDisplay = _dereq_('./base.js').VRDisplay;
var Util = _dereq_('./util.js');

var Eye = {
  LEFT: 'left',
  RIGHT: 'right'
};

/**
 * VRDisplay based on mobile device parameters and DeviceMotion APIs.
 */
function CardboardVRDisplay() {
  this.displayName = 'Cardboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;
  this.capabilities.canPresent = true;

  // "Private" members.
  this.bufferScale_ = WebVRConfig.BUFFER_SCALE;
  this.poseSensor_ = new FusionPoseSensor();
  this.distorter_ = null;
  this.cardboardUI_ = null;

  this.dpdb_ = new Dpdb(true, this.onDeviceParamsUpdated_.bind(this));
  this.deviceInfo_ = new DeviceInfo(this.dpdb_.getDeviceParams());

  this.viewerSelector_ = new ViewerSelector();
  this.viewerSelector_.on('change', this.onViewerChanged_.bind(this));

  // Set the correct initial viewer.
  this.deviceInfo_.setViewer(this.viewerSelector_.getCurrentViewer());

  this.rotateInstructions_ = new RotateInstructions();
}
CardboardVRDisplay.prototype = new VRDisplay();

CardboardVRDisplay.prototype.getImmediatePose = function() {
  return {
    position: this.poseSensor_.getPosition(),
    orientation: this.poseSensor_.getOrientation(),
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

CardboardVRDisplay.prototype.resetPose = function() {
  this.poseSensor_.resetPose();
};

CardboardVRDisplay.prototype.getEyeParameters = function(whichEye) {
  var offset = [this.deviceInfo_.viewer.interLensDistance * 0.5, 0.0, 0.0];
  var fieldOfView;

  // TODO: FoV can be a little expensive to compute. Cache when device params change.
  if (whichEye == Eye.LEFT) {
    offset[0] *= -1.0;
    fieldOfView = this.deviceInfo_.getFieldOfViewLeftEye();
  } else if (whichEye == Eye.RIGHT) {
    fieldOfView = this.deviceInfo_.getFieldOfViewRightEye();
  } else {
    console.error('Invalid eye provided: %s', whichEye);
    return null;
  }

  return {
    fieldOfView: fieldOfView,
    offset: offset,
    // TODO: Should be able to provide better values than these.
    renderWidth: this.deviceInfo_.device.width * 0.5 * this.bufferScale_,
    renderHeight: this.deviceInfo_.device.height * this.bufferScale_,
  };
};

CardboardVRDisplay.prototype.onDeviceParamsUpdated_ = function(newParams) {
  console.log('DPDB reported that device params were updated.');
  this.deviceInfo_.updateDeviceParams(newParams);

  if (this.distorter_) {
    this.distorter.updateDeviceInfo(this.deviceInfo_);
  }
};

CardboardVRDisplay.prototype.beginPresent_ = function() {
  var gl = this.layer_.source.getContext('webgl');
  if (!gl)
    gl = this.layer_.source.getContext('experimental-webgl');
  if (!gl)
    gl = this.layer_.source.getContext('webgl2');

  if (!gl)
    return; // Can't do distortion without a WebGL context.

  // Provides a way to opt out of distortion
  if (this.layer_.predistorted) {
    this.cardboardUI_ = new CardboardUI(gl);
  } else {
    // Create a new distorter for the target context
    this.distorter_ = new CardboardDistorter(gl);
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
    this.cardboardUI_ = this.distorter_.cardboardUI;

    if (this.layer_.leftBounds || this.layer_.rightBounds) {
      this.distorter_.setTextureBounds(this.layer_.leftBounds, this.layer_.rightBounds);
    }
  }

  this.cardboardUI_.listen(function() {
    // Options clicked
    this.viewerSelector_.show(this.layer_.source.parentElement);
  }.bind(this), function() {
    // Back clicked
    this.exitPresent();
  }.bind(this));

  if (Util.isLandscapeMode() && Util.isMobile()) {
    // In landscape mode, temporarily show the "put into Cardboard"
    // interstitial. Otherwise, do the default thing.
    this.rotateInstructions_.showTemporarily(3000, this.layer_.source.parentElement);
  } else {
    this.rotateInstructions_.update();
  }

  // Listen for orientation change events in order to show interstitial.
  this.orientationHandler = this.onOrientationChange_.bind(this);
  window.addEventListener('orientationchange', this.orientationHandler);

  // Fire this event initially, to give geometry-distortion clients the chance
  // to do something custom.
  this.fireVRDisplayDeviceParamsChange_();
};

CardboardVRDisplay.prototype.endPresent_ = function() {
  if (this.distorter_) {
    this.distorter_.destroy();
    this.distorter_ = null;
  }
  if (this.cardboardUI_) {
    this.cardboardUI_.destroy();
    this.cardboardUI_ = null;
  }

  this.rotateInstructions_.hide();
  this.viewerSelector_.hide();

  window.removeEventListener('orientationchange', this.orientationHandler);
};

CardboardVRDisplay.prototype.submitFrame = function(pose) {
  if (this.distorter_) {
    this.distorter_.submitFrame();
  } else if (this.cardboardUI_) {
    this.cardboardUI_.render();
  }
};

CardboardVRDisplay.prototype.onOrientationChange_ = function(e) {
  console.log('onOrientationChange_');

  // Hide the viewer selector.
  this.viewerSelector_.hide();

  // Update the rotate instructions.
  this.rotateInstructions_.update();
};

CardboardVRDisplay.prototype.onViewerChanged_ = function(viewer) {
  this.deviceInfo_.setViewer(viewer);

  // Update the distortion appropriately.
  this.distorter_.updateDeviceInfo(this.deviceInfo_);

  // Fire a new event containing viewer and device parameters for clients that
  // want to implement their own geometry-based distortion.
  this.fireVRDisplayDeviceParamsChange_();
};

CardboardVRDisplay.prototype.fireVRDisplayDeviceParamsChange_ = function() {
  var event = new CustomEvent('vrdisplaydeviceparamschange', {
    detail: {
      vrdisplay: this,
      deviceInfo: this.deviceInfo_,
    }
  });
  window.dispatchEvent(event);
};

module.exports = CardboardVRDisplay;

},{"./base.js":3,"./cardboard-distorter.js":4,"./cardboard-ui.js":5,"./device-info.js":8,"./dpdb/dpdb.js":12,"./rotate-instructions.js":17,"./sensor-fusion/fusion-pose-sensor.js":19,"./util.js":23,"./viewer-selector.js":24}],7:[function(_dereq_,module,exports){
/*
Copyright (c) 2016, Brandon Jones.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
Caches specified GL state, runs a callback, and restores the cached state when
done.

Example usage:

var savedState = [
  gl.ARRAY_BUFFER_BINDING,

  // TEXTURE_BINDING_2D or _CUBE_MAP must always be followed by the texure unit.
  gl.TEXTURE_BINDING_2D, gl.TEXTURE0,

  gl.CLEAR_COLOR,
];
// After this call the array buffer, texture unit 0, active texture, and clear
// color will be restored. The viewport will remain changed, however, because
// gl.VIEWPORT was not included in the savedState list.
WGLUPreserveGLState(gl, savedState, function(gl) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, ....);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, ...);

  gl.clearColor(1, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
});

Note that this is not intended to be fast. Managing state in your own code to
avoid redundant state setting and querying will always be faster. This function
is most useful for cases where you may not have full control over the WebGL
calls being made, such as tooling or effect injectors.
*/

function WGLUPreserveGLState(gl, bindings, callback) {
  if (!bindings) {
    callback(gl);
    return;
  }

  var boundValues = [];

  var activeTexture = null;
  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    switch (binding) {
      case gl.TEXTURE_BINDING_2D:
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31) {
          console.error("TEXTURE_BINDING_2D or TEXTURE_BINDING_CUBE_MAP must be followed by a valid texture unit");
          boundValues.push(null, null);
          break;
        }
        if (!activeTexture) {
          activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        }
        gl.activeTexture(textureUnit);
        boundValues.push(gl.getParameter(binding), null);
        break;
      case gl.ACTIVE_TEXTURE:
        activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        boundValues.push(null);
        break;
      default:
        boundValues.push(gl.getParameter(binding));
        break;
    }
  }

  callback(gl);

  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    var boundValue = boundValues[i];
    switch (binding) {
      case gl.ACTIVE_TEXTURE:
        break; // Ignore this binding, since we special-case it to happen last.
      case gl.ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ARRAY_BUFFER, boundValue);
        break;
      case gl.COLOR_CLEAR_VALUE:
        gl.clearColor(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.COLOR_WRITEMASK:
        gl.colorMask(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.CURRENT_PROGRAM:
        gl.useProgram(boundValue);
        break;
      case gl.ELEMENT_ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boundValue);
        break;
      case gl.FRAMEBUFFER_BINDING:
        gl.bindFramebuffer(gl.FRAMEBUFFER, boundValue);
        break;
      case gl.RENDERBUFFER_BINDING:
        gl.bindRenderbuffer(gl.RENDERBUFFER, boundValue);
        break;
      case gl.TEXTURE_BINDING_2D:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, boundValue);
        break;
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, boundValue);
        break;
      case gl.VIEWPORT:
        gl.viewport(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.BLEND:
      case gl.CULL_FACE:
      case gl.DEPTH_TEST:
      case gl.SCISSOR_TEST:
      case gl.STENCIL_TEST:
        if (boundValue) {
          gl.enable(binding);
        } else {
          gl.disable(binding);
        }
        break;
      default:
        console.log("No GL restore behavior for 0x" + binding.toString(16));
        break;
    }

    if (activeTexture) {
      gl.activeTexture(activeTexture);
    }
  }
}

module.exports = WGLUPreserveGLState;
},{}],8:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Distortion = _dereq_('./distortion/distortion.js');
var MathUtil = _dereq_('./math-util.js');
var Util = _dereq_('./util.js');

function Device(params) {
  this.width = params.width || Util.getScreenWidth();
  this.height = params.height || Util.getScreenHeight();
  this.widthMeters = params.widthMeters;
  this.heightMeters = params.heightMeters;
  this.bevelMeters = params.bevelMeters;
}


// Fallback Android device (based on Nexus 5 measurements) for use when
// we can't recognize an Android device.
var DEFAULT_ANDROID = new Device({
  widthMeters: 0.110,
  heightMeters: 0.062,
  bevelMeters: 0.004
});

// Fallback iOS device (based on iPhone6) for use when
// we can't recognize an Android device.
var DEFAULT_IOS = new Device({
  widthMeters: 0.1038,
  heightMeters: 0.0584,
  bevelMeters: 0.004
});


var Viewers = {
  CardboardV1: new CardboardViewer({
    id: 'CardboardV1',
    label: 'Cardboard I/O 2014',
    fov: 40,
    interLensDistance: 0.060,
    baselineLensDistance: 0.035,
    screenLensDistance: 0.042,
    distortionCoefficients: [0.441, 0.156],
    inverseCoefficients: [-0.4410035, 0.42756155, -0.4804439, 0.5460139,
      -0.58821183, 0.5733938, -0.48303202, 0.33299083, -0.17573841,
      0.0651772, -0.01488963, 0.001559834]
  }),
  CardboardV2: new CardboardViewer({
    id: 'CardboardV2',
    label: 'Cardboard I/O 2015',
    fov: 60,
    interLensDistance: 0.064,
    baselineLensDistance: 0.035,
    screenLensDistance: 0.039,
    distortionCoefficients: [0.34, 0.55],
    inverseCoefficients: [-0.33836704, -0.18162185, 0.862655, -1.2462051,
      1.0560602, -0.58208317, 0.21609078, -0.05444823, 0.009177956,
      -9.904169E-4, 6.183535E-5, -1.6981803E-6]
  })
};


var DEFAULT_LEFT_CENTER = {x: 0.5, y: 0.5};
var DEFAULT_RIGHT_CENTER = {x: 0.5, y: 0.5};

/**
 * Manages information about the device and the viewer.
 *
 * deviceParams indicates the parameters of the device to use (generally
 * obtained from dpdb.getDeviceParams()). Can be null to mean no device
 * params were found.
 */
function DeviceInfo(deviceParams) {
  this.viewer = Viewers.CardboardV2;
  this.updateDeviceParams(deviceParams);
  this.distortion = new Distortion(this.viewer.distortionCoefficients);
}

DeviceInfo.prototype.updateDeviceParams = function(deviceParams) {
  this.device = this.determineDevice_(deviceParams) || this.device;
};

DeviceInfo.prototype.getDevice = function() {
  return this.device;
};

DeviceInfo.prototype.setViewer = function(viewer) {
  this.viewer = viewer;
  this.distortion = new Distortion(this.viewer.distortionCoefficients);
};

DeviceInfo.prototype.determineDevice_ = function(deviceParams) {
  if (!deviceParams) {
    // No parameters, so use a default.
    if (Util.isIOS()) {
      console.warn('Using fallback Android device measurements.');
      return DEFAULT_IOS;
    } else {
      console.warn('Using fallback iOS device measurements.');
      return DEFAULT_ANDROID;
    }
  }

  // Compute device screen dimensions based on deviceParams.
  var METERS_PER_INCH = 0.0254;
  var metersPerPixelX = METERS_PER_INCH / deviceParams.xdpi;
  var metersPerPixelY = METERS_PER_INCH / deviceParams.ydpi;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();
  return new Device({
    widthMeters: metersPerPixelX * width,
    heightMeters: metersPerPixelY * height,
    bevelMeters: deviceParams.bevelMm * 0.001,
  });
};

/**
 * Calculates field of view for the left eye.
 */
DeviceInfo.prototype.getDistortedFieldOfViewLeftEye = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Device.height and device.width for device in portrait mode, so transpose.
  var eyeToScreenDistance = viewer.screenLensDistance;

  var outerDist = (device.widthMeters - viewer.interLensDistance) / 2;
  var innerDist = viewer.interLensDistance / 2;
  var bottomDist = viewer.baselineLensDistance - device.bevelMeters;
  var topDist = device.heightMeters - bottomDist;

  var outerAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(outerDist / eyeToScreenDistance));
  var innerAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(innerDist / eyeToScreenDistance));
  var bottomAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(bottomDist / eyeToScreenDistance));
  var topAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(topDist / eyeToScreenDistance));

  return {
    leftDegrees: Math.min(outerAngle, viewer.fov),
    rightDegrees: Math.min(innerAngle, viewer.fov),
    downDegrees: Math.min(bottomAngle, viewer.fov),
    upDegrees: Math.min(topAngle, viewer.fov)
  };
};

/**
 * Calculates the tan-angles from the maximum FOV for the left eye for the
 * current device and screen parameters.
 */
DeviceInfo.prototype.getLeftEyeVisibleTanAngles = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Tan-angles from the max FOV.
  var fovLeft = Math.tan(-MathUtil.degToRad * viewer.fov);
  var fovTop = Math.tan(MathUtil.degToRad * viewer.fov);
  var fovRight = Math.tan(MathUtil.degToRad * viewer.fov);
  var fovBottom = Math.tan(-MathUtil.degToRad * viewer.fov);
  // Viewport size.
  var halfWidth = device.widthMeters / 4;
  var halfHeight = device.heightMeters / 2;
  // Viewport center, measured from left lens position.
  var verticalLensOffset = (viewer.baselineLensDistance - device.bevelMeters - halfHeight);
  var centerX = viewer.interLensDistance / 2 - halfWidth;
  var centerY = -verticalLensOffset;
  var centerZ = viewer.screenLensDistance;
  // Tan-angles of the viewport edges, as seen through the lens.
  var screenLeft = distortion.distort((centerX - halfWidth) / centerZ);
  var screenTop = distortion.distort((centerY + halfHeight) / centerZ);
  var screenRight = distortion.distort((centerX + halfWidth) / centerZ);
  var screenBottom = distortion.distort((centerY - halfHeight) / centerZ);
  // Compare the two sets of tan-angles and take the value closer to zero on each side.
  var result = new Float32Array(4);
  result[0] = Math.max(fovLeft, screenLeft);
  result[1] = Math.min(fovTop, screenTop);
  result[2] = Math.min(fovRight, screenRight);
  result[3] = Math.max(fovBottom, screenBottom);
  return result;
};

/**
 * Calculates the tan-angles from the maximum FOV for the left eye for the
 * current device and screen parameters, assuming no lenses.
 */
DeviceInfo.prototype.getLeftEyeNoLensTanAngles = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  var result = new Float32Array(4);
  // Tan-angles from the max FOV.
  var fovLeft = distortion.distortInverse(Math.tan(-MathUtil.degToRad * viewer.fov));
  var fovTop = distortion.distortInverse(Math.tan(MathUtil.degToRad * viewer.fov));
  var fovRight = distortion.distortInverse(Math.tan(MathUtil.degToRad * viewer.fov));
  var fovBottom = distortion.distortInverse(Math.tan(-MathUtil.degToRad * viewer.fov));
  // Viewport size.
  var halfWidth = device.widthMeters / 4;
  var halfHeight = device.heightMeters / 2;
  // Viewport center, measured from left lens position.
  var verticalLensOffset = (viewer.baselineLensDistance - device.bevelMeters - halfHeight);
  var centerX = viewer.interLensDistance / 2 - halfWidth;
  var centerY = -verticalLensOffset;
  var centerZ = viewer.screenLensDistance;
  // Tan-angles of the viewport edges, as seen through the lens.
  var screenLeft = (centerX - halfWidth) / centerZ;
  var screenTop = (centerY + halfHeight) / centerZ;
  var screenRight = (centerX + halfWidth) / centerZ;
  var screenBottom = (centerY - halfHeight) / centerZ;
  // Compare the two sets of tan-angles and take the value closer to zero on each side.
  result[0] = Math.max(fovLeft, screenLeft);
  result[1] = Math.min(fovTop, screenTop);
  result[2] = Math.min(fovRight, screenRight);
  result[3] = Math.max(fovBottom, screenBottom);
  return result;
};

/**
 * Calculates the screen rectangle visible from the left eye for the
 * current device and screen parameters.
 */
DeviceInfo.prototype.getLeftEyeVisibleScreenRect = function(undistortedFrustum) {
  var viewer = this.viewer;
  var device = this.device;

  var dist = viewer.screenLensDistance;
  var eyeX = (device.widthMeters - viewer.interLensDistance) / 2;
  var eyeY = viewer.baselineLensDistance - device.bevelMeters;
  var left = (undistortedFrustum[0] * dist + eyeX) / device.widthMeters;
  var top = (undistortedFrustum[1] * dist + eyeY) / device.heightMeters;
  var right = (undistortedFrustum[2] * dist + eyeX) / device.widthMeters;
  var bottom = (undistortedFrustum[3] * dist + eyeY) / device.heightMeters;
  return {
    x: left,
    y: bottom,
    width: right - left,
    height: top - bottom
  };
};

DeviceInfo.prototype.getFieldOfViewLeftEye = function(opt_isUndistorted) {
  return opt_isUndistorted ? this.getUndistortedFieldOfViewLeftEye() :
      this.getDistortedFieldOfViewLeftEye();
};

DeviceInfo.prototype.getFieldOfViewRightEye = function(opt_isUndistorted) {
  var fov = this.getFieldOfViewLeftEye(opt_isUndistorted);
  return {
    leftDegrees: fov.rightDegrees,
    rightDegrees: fov.leftDegrees,
    upDegrees: fov.upDegrees,
    downDegrees: fov.downDegrees
  };
};

/**
 * Calculates undistorted field of view for the left eye.
 */
DeviceInfo.prototype.getUndistortedFieldOfViewLeftEye = function() {
  var p = this.getUndistortedParams_();

  return {
    leftDegrees: MathUtil.radToDeg * Math.atan(p.outerDist),
    rightDegrees: MathUtil.radToDeg * Math.atan(p.innerDist),
    downDegrees: MathUtil.radToDeg * Math.atan(p.bottomDist),
    upDegrees: MathUtil.radToDeg * Math.atan(p.topDist)
  };
};

DeviceInfo.prototype.getUndistortedParams_ = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Most of these variables in tan-angle units.
  var eyeToScreenDistance = viewer.screenLensDistance;
  var halfLensDistance = viewer.interLensDistance / 2 / eyeToScreenDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;

  var eyePosX = screenWidth / 2 - halfLensDistance;
  var eyePosY = (viewer.baselineLensDistance - device.bevelMeters) / eyeToScreenDistance;

  var maxFov = viewer.fov;
  var viewerMax = distortion.distortInverse(Math.tan(MathUtil.degToRad * maxFov));
  var outerDist = Math.min(eyePosX, viewerMax);
  var innerDist = Math.min(halfLensDistance, viewerMax);
  var bottomDist = Math.min(eyePosY, viewerMax);
  var topDist = Math.min(screenHeight - eyePosY, viewerMax);

  return {
    outerDist: outerDist,
    innerDist: innerDist,
    topDist: topDist,
    bottomDist: bottomDist,
    eyePosX: eyePosX,
    eyePosY: eyePosY
  };
};


function CardboardViewer(params) {
  // A machine readable ID.
  this.id = params.id;
  // A human readable label.
  this.label = params.label;

  // Field of view in degrees (per side).
  this.fov = params.fov;

  // Distance between lens centers in meters.
  this.interLensDistance = params.interLensDistance;
  // Distance between viewer baseline and lens center in meters.
  this.baselineLensDistance = params.baselineLensDistance;
  // Screen-to-lens distance in meters.
  this.screenLensDistance = params.screenLensDistance;

  // Distortion coefficients.
  this.distortionCoefficients = params.distortionCoefficients;
  // Inverse distortion coefficients.
  // TODO: Calculate these from distortionCoefficients in the future.
  this.inverseCoefficients = params.inverseCoefficients;
}

// Export viewer information.
DeviceInfo.Viewers = Viewers;
module.exports = DeviceInfo;
},{"./distortion/distortion.js":10,"./math-util.js":15,"./util.js":23}],9:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var VRDisplay = _dereq_('./base.js').VRDisplay;
var HMDVRDevice = _dereq_('./base.js').HMDVRDevice;
var PositionSensorVRDevice = _dereq_('./base.js').PositionSensorVRDevice;

/**
 * Wraps a VRDisplay and exposes it as a HMDVRDevice
 */
function VRDisplayHMDDevice(display) {
  this.display = display;

  this.hardwareUnitId = display.displayId;
  this.deviceId = 'webvr-polyfill:HMD:' + display.displayId;
  this.deviceName = display.displayName + ' (HMD)';
}
VRDisplayHMDDevice.prototype = new HMDVRDevice();

VRDisplayHMDDevice.prototype.getEyeParameters = function(whichEye) {
  var eyeParameters = this.display.getEyeParameters(whichEye);

  return {
    currentFieldOfView: eyeParameters.fieldOfView,
    maximumFieldOfView: eyeParameters.fieldOfView,
    minimumFieldOfView: eyeParameters.fieldOfView,
    recommendedFieldOfView: eyeParameters.fieldOfView,
    eyeTranslation: { x: eyeParameters.offset[0], y: eyeParameters.offset[1], z: eyeParameters.offset[2] },
    renderRect: {
      x: (whichEye == 'right') ? eyeParameters.renderWidth : 0,
      y: 0,
      width: eyeParameters.renderWidth,
      height: eyeParameters.renderHeight
    }
  };
};

VRDisplayHMDDevice.prototype.setFieldOfView =
    function(opt_fovLeft, opt_fovRight, opt_zNear, opt_zFar) {
  // Not supported. getEyeParameters reports that the min, max, and recommended
  // FoV is all the same, so no adjustment can be made.
};

// TODO: Need to hook requestFullscreen to see if a wrapped VRDisplay was passed
// in as an option. If so we should prevent the default fullscreen behavior and
// call VRDisplay.requestPresent instead.

/**
 * Wraps a VRDisplay and exposes it as a PositionSensorVRDevice
 */
function VRDisplayPositionSensorDevice(display) {
  this.display = display;

  this.hardwareUnitId = display.displayId;
  this.deviceId = 'webvr-polyfill:PositionSensor: ' + display.displayId;
  this.deviceName = display.displayName + ' (PositionSensor)';
}
VRDisplayPositionSensorDevice.prototype = new PositionSensorVRDevice();

VRDisplayPositionSensorDevice.prototype.getState = function() {
  var pose = this.display.getPose();
  return {
    position: pose.position ? { x: pose.position[0], y: pose.position[1], z: pose.position[2] } : null,
    orientation: pose.orientation ? { x: pose.orientation[0], y: pose.orientation[1], z: pose.orientation[2], w: pose.orientation[3] } : null,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

VRDisplayPositionSensorDevice.prototype.resetState = function() {
  return this.positionDevice.resetPose();
};


module.exports.VRDisplayHMDDevice = VRDisplayHMDDevice;
module.exports.VRDisplayPositionSensorDevice = VRDisplayPositionSensorDevice;


},{"./base.js":3}],10:[function(_dereq_,module,exports){
/**
 * TODO(smus): Implement coefficient inversion.
 */
function Distortion(coefficients) {
  this.coefficients = coefficients;
}

/**
 * Calculates the inverse distortion for a radius.
 * </p><p>
 * Allows to compute the original undistorted radius from a distorted one.
 * See also getApproximateInverseDistortion() for a faster but potentially
 * less accurate method.
 *
 * @param {Number} radius Distorted radius from the lens center in tan-angle units.
 * @return {Number} The undistorted radius in tan-angle units.
 */
Distortion.prototype.distortInverse = function(radius) {
  // Secant method.
  var r0 = 0;
  var r1 = 1;
  var dr0 = radius - this.distort(r0);
  while (Math.abs(r1 - r0) > 0.0001 /** 0.1mm */) {
    var dr1 = radius - this.distort(r1);
    var r2 = r1 - dr1 * ((r1 - r0) / (dr1 - dr0));
    r0 = r1;
    r1 = r2;
    dr0 = dr1;
  }
  return r1;
};

/**
 * Distorts a radius by its distortion factor from the center of the lenses.
 *
 * @param {Number} radius Radius from the lens center in tan-angle units.
 * @return {Number} The distorted radius in tan-angle units.
 */
Distortion.prototype.distort = function(radius) {
  var r2 = radius * radius;
  var ret = 0;
  for (var i = 0; i < this.coefficients.length; i++) {
    ret = r2 * (ret + this.coefficients[i]);
  }
  return (ret + 1) * radius;
};

// Functions below roughly ported from
// https://github.com/googlesamples/cardboard-unity/blob/master/Cardboard/Scripts/CardboardProfile.cs#L412

// Solves a small linear equation via destructive gaussian
// elimination and back substitution.  This isn't generic numeric
// code, it's just a quick hack to work with the generally
// well-behaved symmetric matrices for least-squares fitting.
// Not intended for reuse.
//
// @param a Input positive definite symmetrical matrix. Destroyed
//     during calculation.
// @param y Input right-hand-side values. Destroyed during calculation.
// @return Resulting x value vector.
//
Distortion.prototype.solveLinear_ = function(a, y) {
  var n = a.length;

  // Gaussian elimination (no row exchange) to triangular matrix.
  // The input matrix is a A^T A product which should be a positive
  // definite symmetrical matrix, and if I remember my linear
  // algebra right this implies that the pivots will be nonzero and
  // calculations sufficiently accurate without needing row
  // exchange.
  for (var j = 0; j < n - 1; ++j) {
    for (var k = j + 1; k < n; ++k) {
      var p = a[j][k] / a[j][j];
      for (var i = j + 1; i < n; ++i) {
        a[i][k] -= p * a[i][j];
      }
      y[k] -= p * y[j];
    }
  }
  // From this point on, only the matrix elements a[j][i] with i>=j are
  // valid. The elimination doesn't fill in eliminated 0 values.

  var x = new Array(n);

  // Back substitution.
  for (var j = n - 1; j >= 0; --j) {
    var v = y[j];
    for (var i = j + 1; i < n; ++i) {
      v -= a[i][j] * x[i];
    }
    x[j] = v / a[j][j];
  }

  return x;
};

// Solves a least-squares matrix equation.  Given the equation A * x = y, calculate the
// least-square fit x = inverse(A * transpose(A)) * transpose(A) * y.  The way this works
// is that, while A is typically not a square matrix (and hence not invertible), A * transpose(A)
// is always square.  That is:
//   A * x = y
//   transpose(A) * (A * x) = transpose(A) * y   <- multiply both sides by transpose(A)
//   (transpose(A) * A) * x = transpose(A) * y   <- associativity
//   x = inverse(transpose(A) * A) * transpose(A) * y  <- solve for x
// Matrix A's row count (first index) must match y's value count.  A's column count (second index)
// determines the length of the result vector x.
Distortion.prototype.solveLeastSquares_ = function(matA, vecY) {
  var i, j, k, sum;
  var numSamples = matA.length;
  var numCoefficients = matA[0].length;
  if (numSamples != vecY.Length) {
    throw new Error("Matrix / vector dimension mismatch");
  }

  // Calculate transpose(A) * A
  var matATA = new Array(numCoefficients);
  for (k = 0; k < numCoefficients; ++k) {
    matATA[k] = new Array(numCoefficients);
    for (j = 0; j < numCoefficients; ++j) {
      sum = 0;
      for (i = 0; i < numSamples; ++i) {
        sum += matA[j][i] * matA[k][i];
      }
      matATA[k][j] = sum;
    }
  }

  // Calculate transpose(A) * y
  var vecATY = new Array(numCoefficients);
  for (j = 0; j < numCoefficients; ++j) {
    sum = 0;
    for (i = 0; i < numSamples; ++i) {
      sum += matA[j][i] * vecY[i];
    }
    vecATY[j] = sum;
  }

  // Now solve (A * transpose(A)) * x = transpose(A) * y.
  return this.solveLinear_(matATA, vecATY);
};

/// Calculates an approximate inverse to the given radial distortion parameters.
Distortion.prototype.approximateInverse = function(maxRadius, numSamples) {
  maxRadius = maxRadius || 1;
  numSamples = numSamples || 100;
  var numCoefficients = 6;
  var i, j;

  // R + K1*R^3 + K2*R^5 = r, with R = rp = distort(r)
  // Repeating for numSamples:
  //   [ R0^3, R0^5 ] * [ K1 ] = [ r0 - R0 ]
  //   [ R1^3, R1^5 ]   [ K2 ]   [ r1 - R1 ]
  //   [ R2^3, R2^5 ]            [ r2 - R2 ]
  //   [ etc... ]                [ etc... ]
  // That is:
  //   matA * [K1, K2] = y
  // Solve:
  //   [K1, K2] = inverse(transpose(matA) * matA) * transpose(matA) * y
  var matA = new Array(numCoefficients);
  for (j = 0; j < numCoefficients; ++j) {
    matA[j] = new Array(numSamples);
  }
  var vecY = new Array(numSamples);

  for (i = 0; i < numSamples; ++i) {
    var r = maxRadius * (i + 1) / numSamples;
    var rp = this.distort(r);
    var v = rp;
    for (j = 0; j < numCoefficients; ++j) {
      v *= rp * rp;
      matA[j][i] = v;
    }
    vecY[i] = r - rp;
  }

  var inverseCoefficients = this.solveLeastSquares_(matA, vecY);

  return new Distortion(inverseCoefficients);
};

module.exports = Distortion;

},{}],11:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * DPDB cache.
 */
var DPDB_CACHE = {
  "format": 1,
  "last_updated": "2016-01-20T00:18:35Z",
  "devices": [

  {
    "type": "android",
    "rules": [
      { "mdmh": "asus/*/Nexus 7/*" },
      { "ua": "Nexus 7" }
    ],
    "dpi": [ 320.8, 323.0 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "asus/*/ASUS_Z00AD/*" },
      { "ua": "ASUS_Z00AD" }
    ],
    "dpi": [ 403.0, 404.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC6435LVW/*" },
      { "ua": "HTC6435LVW" }
    ],
    "dpi": [ 449.7, 443.3 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One XL/*" },
      { "ua": "HTC One XL" }
    ],
    "dpi": [ 315.3, 314.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "htc/*/Nexus 9/*" },
      { "ua": "Nexus 9" }
    ],
    "dpi": 289.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One M9/*" },
      { "ua": "HTC One M9" }
    ],
    "dpi": [ 442.5, 443.3 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One_M8/*" },
      { "ua": "HTC One_M8" }
    ],
    "dpi": [ 449.7, 447.4 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One/*" },
      { "ua": "HTC One" }
    ],
    "dpi": 472.8,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Huawei/*/Nexus 6P/*" },
      { "ua": "Nexus 6P" }
    ],
    "dpi": [ 515.1, 518.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/Nexus 5X/*" },
      { "ua": "Nexus 5X" }
    ],
    "dpi": [ 422.0, 419.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LGMS345/*" },
      { "ua": "LGMS345" }
    ],
    "dpi": [ 221.7, 219.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LG-D800/*" },
      { "ua": "LG-D800" }
    ],
    "dpi": [ 422.0, 424.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LG-D850/*" },
      { "ua": "LG-D850" }
    ],
    "dpi": [ 537.9, 541.9 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/VS985 4G/*" },
      { "ua": "VS985 4G" }
    ],
    "dpi": [ 537.9, 535.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/Nexus 5/*" },
      { "ua": "Nexus 5 " }
    ],
    "dpi": [ 442.4, 444.8 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/Nexus 4/*" },
      { "ua": "Nexus 4" }
    ],
    "dpi": [ 319.8, 318.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LG-P769/*" },
      { "ua": "LG-P769" }
    ],
    "dpi": [ 240.6, 247.5 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LGMS323/*" },
      { "ua": "LGMS323" }
    ],
    "dpi": [ 206.6, 204.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LGLS996/*" },
      { "ua": "LGLS996" }
    ],
    "dpi": [ 403.4, 401.5 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Micromax/*/4560MMX/*" },
      { "ua": "4560MMX" }
    ],
    "dpi": [ 240.0, 219.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Micromax/*/A250/*" },
      { "ua": "Micromax A250" }
    ],
    "dpi": [ 480.0, 446.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Micromax/*/Micromax AQ4501/*" },
      { "ua": "Micromax AQ4501" }
    ],
    "dpi": 240.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/DROID RAZR/*" },
      { "ua": "DROID RAZR" }
    ],
    "dpi": [ 368.1, 256.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT830C/*" },
      { "ua": "XT830C" }
    ],
    "dpi": [ 254.0, 255.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1021/*" },
      { "ua": "XT1021" }
    ],
    "dpi": [ 254.0, 256.7 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1023/*" },
      { "ua": "XT1023" }
    ],
    "dpi": [ 254.0, 256.7 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1028/*" },
      { "ua": "XT1028" }
    ],
    "dpi": [ 326.6, 327.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1034/*" },
      { "ua": "XT1034" }
    ],
    "dpi": [ 326.6, 328.4 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1053/*" },
      { "ua": "XT1053" }
    ],
    "dpi": [ 315.3, 316.1 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1562/*" },
      { "ua": "XT1562" }
    ],
    "dpi": [ 403.4, 402.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/Nexus 6/*" },
      { "ua": "Nexus 6 " }
    ],
    "dpi": [ 494.3, 489.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1063/*" },
      { "ua": "XT1063" }
    ],
    "dpi": [ 295.0, 296.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1064/*" },
      { "ua": "XT1064" }
    ],
    "dpi": [ 295.0, 295.6 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1092/*" },
      { "ua": "XT1092" }
    ],
    "dpi": [ 422.0, 424.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1095/*" },
      { "ua": "XT1095" }
    ],
    "dpi": [ 422.0, 423.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OnePlus/*/A0001/*" },
      { "ua": "A0001" }
    ],
    "dpi": [ 403.4, 401.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OnePlus/*/ONE E1005/*" },
      { "ua": "ONE E1005" }
    ],
    "dpi": [ 442.4, 441.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OnePlus/*/ONE A2005/*" },
      { "ua": "ONE A2005" }
    ],
    "dpi": [ 391.9, 405.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OPPO/*/X909/*" },
      { "ua": "X909" }
    ],
    "dpi": [ 442.4, 444.1 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9082/*" },
      { "ua": "GT-I9082" }
    ],
    "dpi": [ 184.7, 185.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G360P/*" },
      { "ua": "SM-G360P" }
    ],
    "dpi": [ 196.7, 205.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/Nexus S/*" },
      { "ua": "Nexus S" }
    ],
    "dpi": [ 234.5, 229.8 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9300/*" },
      { "ua": "GT-I9300" }
    ],
    "dpi": [ 304.8, 303.9 ],
    "bw": 5,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-T230NU/*" },
      { "ua": "SM-T230NU" }
    ],
    "dpi": 216.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SGH-T399/*" },
      { "ua": "SGH-T399" }
    ],
    "dpi": [ 217.7, 231.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N9005/*" },
      { "ua": "SM-N9005" }
    ],
    "dpi": [ 386.4, 387.0 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SAMSUNG-SM-N900A/*" },
      { "ua": "SAMSUNG-SM-N900A" }
    ],
    "dpi": [ 386.4, 387.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9500/*" },
      { "ua": "GT-I9500" }
    ],
    "dpi": [ 442.5, 443.3 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9505/*" },
      { "ua": "GT-I9505" }
    ],
    "dpi": 439.4,
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G900F/*" },
      { "ua": "SM-G900F" }
    ],
    "dpi": [ 415.6, 431.6 ],
    "bw": 5,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G900M/*" },
      { "ua": "SM-G900M" }
    ],
    "dpi": [ 415.6, 431.6 ],
    "bw": 5,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G800F/*" },
      { "ua": "SM-G800F" }
    ],
    "dpi": 326.8,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G906S/*" },
      { "ua": "SM-G906S" }
    ],
    "dpi": [ 562.7, 572.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9300/*" },
      { "ua": "GT-I9300" }
    ],
    "dpi": [ 306.7, 304.8 ],
    "bw": 5,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-T535/*" },
      { "ua": "SM-T535" }
    ],
    "dpi": [ 142.6, 136.4 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N920C/*" },
      { "ua": "SM-N920C" }
    ],
    "dpi": [ 515.1, 518.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9300I/*" },
      { "ua": "GT-I9300I" }
    ],
    "dpi": [ 304.8, 305.8 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9195/*" },
      { "ua": "GT-I9195" }
    ],
    "dpi": [ 249.4, 256.7 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SPH-L520/*" },
      { "ua": "SPH-L520" }
    ],
    "dpi": [ 249.4, 255.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SAMSUNG-SGH-I717/*" },
      { "ua": "SAMSUNG-SGH-I717" }
    ],
    "dpi": 285.8,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SPH-D710/*" },
      { "ua": "SPH-D710" }
    ],
    "dpi": [ 217.7, 204.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-N7100/*" },
      { "ua": "GT-N7100" }
    ],
    "dpi": 265.1,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SCH-I605/*" },
      { "ua": "SCH-I605" }
    ],
    "dpi": 265.1,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/Galaxy Nexus/*" },
      { "ua": "Galaxy Nexus" }
    ],
    "dpi": [ 315.3, 314.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N910H/*" },
      { "ua": "SM-N910H" }
    ],
    "dpi": [ 515.1, 518.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N910C/*" },
      { "ua": "SM-N910C" }
    ],
    "dpi": [ 515.2, 520.2 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G130M/*" },
      { "ua": "SM-G130M" }
    ],
    "dpi": [ 165.9, 164.8 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G928I/*" },
      { "ua": "SM-G928I" }
    ],
    "dpi": [ 515.1, 518.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G920F/*" },
      { "ua": "SM-G920F" }
    ],
    "dpi": 580.6,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G920P/*" },
      { "ua": "SM-G920P" }
    ],
    "dpi": [ 522.5, 577.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G925F/*" },
      { "ua": "SM-G925F" }
    ],
    "dpi": 580.6,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G925V/*" },
      { "ua": "SM-G925V" }
    ],
    "dpi": [ 522.5, 576.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/C6903/*" },
      { "ua": "C6903" }
    ],
    "dpi": [ 442.5, 443.3 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/D6653/*" },
      { "ua": "D6653" }
    ],
    "dpi": [ 428.6, 427.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/E6653/*" },
      { "ua": "E6653" }
    ],
    "dpi": [ 428.6, 425.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/E6853/*" },
      { "ua": "E6853" }
    ],
    "dpi": [ 403.4, 401.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/SGP321/*" },
      { "ua": "SGP321" }
    ],
    "dpi": [ 224.7, 224.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "TCT/*/ALCATEL ONE TOUCH Fierce/*" },
      { "ua": "ALCATEL ONE TOUCH Fierce" }
    ],
    "dpi": [ 240.0, 247.5 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "THL/*/thl 5000/*" },
      { "ua": "thl 5000" }
    ],
    "dpi": [ 480.0, 443.3 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "ZTE/*/ZTE Blade L2/*" },
      { "ua": "ZTE Blade L2" }
    ],
    "dpi": 240.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 960 ] } ],
    "dpi": [ 325.1, 328.4 ],
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 960 ] } ],
    "dpi": [ 325.1, 328.4 ],
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 1136 ] } ],
    "dpi": [ 317.1, 320.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 1136 ] } ],
    "dpi": [ 317.1, 320.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 750, 1334 ] } ],
    "dpi": 326.4,
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 750, 1334 ] } ],
    "dpi": 326.4,
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 1242, 2208 ] } ],
    "dpi": [ 453.6, 458.4 ],
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 1242, 2208 ] } ],
    "dpi": [ 453.6, 458.4 ],
    "bw": 4,
    "ac": 1000
  }
]};

module.exports = DPDB_CACHE;

},{}],12:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Offline cache of the DPDB, to be used until we load the online one (and
// as a fallback in case we can't load the online one).
var DPDB_CACHE = _dereq_('./dpdb-cache.js');
var Util = _dereq_('../util.js');

// Online DPDB URL.
var ONLINE_DPDB_URL = 'https://storage.googleapis.com/cardboard-dpdb/dpdb.json';

/**
 * Calculates device parameters based on the DPDB (Device Parameter Database).
 * Initially, uses the cached DPDB values.
 *
 * If fetchOnline == true, then this object tries to fetch the online version
 * of the DPDB and updates the device info if a better match is found.
 * Calls the onDeviceParamsUpdated callback when there is an update to the
 * device information.
 */
function Dpdb(fetchOnline, onDeviceParamsUpdated) {
  // Start with the offline DPDB cache while we are loading the real one.
  this.dpdb = DPDB_CACHE;

  // Calculate device params based on the offline version of the DPDB.
  this.recalculateDeviceParams_();

  // XHR to fetch online DPDB file, if requested.
  if (fetchOnline) {
    // Set the callback.
    this.onDeviceParamsUpdated = onDeviceParamsUpdated;

    console.log('Fetching DPDB...');
    var xhr = new XMLHttpRequest();
    var obj = this;
    xhr.open('GET', ONLINE_DPDB_URL, true);
    xhr.addEventListener('load', function() {
      obj.loading = false;
      if (xhr.status >= 200 && xhr.status <= 299) {
        // Success.
        console.log('Successfully loaded online DPDB.');
        obj.dpdb = JSON.parse(xhr.response);
        obj.recalculateDeviceParams_();
      } else {
        // Error loading the DPDB.
        console.error('Error loading online DPDB!');
      }
    });
    xhr.send();
  }
}

// Returns the current device parameters.
Dpdb.prototype.getDeviceParams = function() {
  return this.deviceParams;
};

// Recalculates this device's parameters based on the DPDB.
Dpdb.prototype.recalculateDeviceParams_ = function() {
  console.log('Recalculating device params.');
  var newDeviceParams = this.calcDeviceParams_();
  console.log('New device parameters:');
  console.log(newDeviceParams);
  if (newDeviceParams) {
    this.deviceParams = newDeviceParams;
    // Invoke callback, if it is set.
    if (this.onDeviceParamsUpdated) {
      this.onDeviceParamsUpdated(this.deviceParams);
    }
  } else {
    console.error('Failed to recalculate device parameters.');
  }
};

// Returns a DeviceParams object that represents the best guess as to this
// device's parameters. Can return null if the device does not match any
// known devices.
Dpdb.prototype.calcDeviceParams_ = function() {
  var db = this.dpdb; // shorthand
  if (!db) {
    console.error('DPDB not available.');
    return null;
  }
  if (db.format != 1) {
    console.error('DPDB has unexpected format version.');
    return null;
  }
  if (!db.devices || !db.devices.length) {
    console.error('DPDB does not have a devices section.');
    return null;
  }

  // Get the actual user agent and screen dimensions in pixels.
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();
  console.log('User agent: ' + userAgent);
  console.log('Pixel width: ' + width);
  console.log('Pixel height: ' + height);

  if (!db.devices) {
    console.error('DPDB has no devices section.');
    return null;
  }

  for (var i = 0; i < db.devices.length; i++) {
    var device = db.devices[i];
    if (!device.rules) {
      console.warn('Device[' + i + '] has no rules section.');
      continue;
    }

    if (device.type != 'ios' && device.type != 'android') {
      console.warn('Device[' + i + '] has invalid type.');
      continue;
    }

    // See if this device is of the appropriate type.
    if (Util.isIOS() != (device.type == 'ios')) continue;

    // See if this device matches any of the rules:
    var matched = false;
    for (var j = 0; j < device.rules.length; j++) {
      var rule = device.rules[j];
      if (this.matchRule_(rule, userAgent, width, height)) {
        console.log('Rule matched:');
        console.log(rule);
        matched = true;
        break;
      }
    }
    if (!matched) continue;

    // device.dpi might be an array of [ xdpi, ydpi] or just a scalar.
    var xdpi = device.dpi[0] || device.dpi;
    var ydpi = device.dpi[1] || device.dpi;

    return new DeviceParams({ xdpi: xdpi, ydpi: ydpi, bevelMm: device.bw });
  }

  console.warn('No DPDB device match.');
  return null;
};

Dpdb.prototype.matchRule_ = function(rule, ua, screenWidth, screenHeight) {
  // We can only match 'ua' and 'res' rules, not other types like 'mdmh'
  // (which are meant for native platforms).
  if (!rule.ua && !rule.res) return false;

  // If our user agent string doesn't contain the indicated user agent string,
  // the match fails.
  if (rule.ua && ua.indexOf(rule.ua) < 0) return false;

  // If the rule specifies screen dimensions that don't correspond to ours,
  // the match fails.
  if (rule.res) {
    if (!rule.res[0] || !rule.res[1]) return false;
    var resX = rule.res[0];
    var resY = rule.res[1];
    // Compare min and max so as to make the order not matter, i.e., it should
    // be true that 640x480 == 480x640.
    if (Math.min(screenWidth, screenHeight) != Math.min(resX, resY) ||
        (Math.max(screenWidth, screenHeight) != Math.max(resX, resY))) {
      return false;
    }
  }

  return true;
}

function DeviceParams(params) {
  this.xdpi = params.xdpi;
  this.ydpi = params.ydpi;
  this.bevelMm = params.bevelMm;
}

module.exports = Dpdb;
},{"../util.js":23,"./dpdb-cache.js":11}],13:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function Emitter() {
  this.callbacks = {};
}

Emitter.prototype.emit = function(eventName) {
  var callbacks = this.callbacks[eventName];
  if (!callbacks) {
    //console.log('No valid callback specified.');
    return;
  }
  var args = [].slice.call(arguments);
  // Eliminate the first param (the callback).
  args.shift();
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i].apply(this, args);
  }
};

Emitter.prototype.on = function(eventName, callback) {
  if (eventName in this.callbacks) {
    this.callbacks[eventName].push(callback);
  } else {
    this.callbacks[eventName] = [callback];
  }
};

module.exports = Emitter;

},{}],14:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Util = _dereq_('./util.js');
var WebVRPolyfill = _dereq_('./webvr-polyfill.js');

// Initialize a WebVRConfig just in case.
window.WebVRConfig = Util.extend({
  // Forces availability of VR mode, even for non-mobile devices.
  FORCE_ENABLE_VR: false,

  // Complementary filter coefficient. 0 for accelerometer, 1 for gyro.
  K_FILTER: 0.98,

  // How far into the future to predict during fast motion (in seconds).
  PREDICTION_TIME_S: 0.040,

  // Flag to disable touch panner. In case you have your own touch controls.
  TOUCH_PANNER_DISABLED: false,

  // Enable yaw panning only, disabling roll and pitch. This can be useful
  // for panoramas with nothing interesting above or below.
  YAW_ONLY: false,

  // To disable keyboard and mouse controls, if you want to use your own
  // implementation.
  MOUSE_KEYBOARD_CONTROLS_DISABLED: false,

  // Prevent the polyfill from initializing immediately. Requires the app
  // to call InitializeWebVRPolyfill() before it can be used.
  DEFER_INITIALIZATION: false,

  // Enable the deprecated version of the API (navigator.getVRDevices).
  ENABLE_DEPRECATED_API: false,

  // Scales the recommended buffer size reported by WebVR, which can improve
  // performance.
  // UPDATE(2016-05-03): Setting this to 0.5 by default since 1.0 does not
  // perform well on many mobile devices.
  BUFFER_SCALE: 0.5,

  // Allow VRDisplay.submitFrame to change gl bindings, which is more
  // efficient if the application code will re-bind its resources on the
  // next frame anyway. This has been seen to cause rendering glitches with
  // THREE.js.
  // Dirty bindings include: gl.FRAMEBUFFER_BINDING, gl.CURRENT_PROGRAM,
  // gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING,
  // and gl.TEXTURE_BINDING_2D for texture unit 0.
  DIRTY_SUBMIT_FRAME_BINDINGS: false
}, window.WebVRConfig);

if (!window.WebVRConfig.DEFER_INITIALIZATION) {
  new WebVRPolyfill();
} else {
  window.InitializeWebVRPolyfill = function() {
    new WebVRPolyfill();
  }
}

},{"./util.js":23,"./webvr-polyfill.js":26}],15:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var MathUtil = window.MathUtil || {};

MathUtil.degToRad = Math.PI / 180;
MathUtil.radToDeg = 180 / Math.PI;

// Some minimal math functionality borrowed from THREE.Math and stripped down
// for the purposes of this library.


MathUtil.Vector2 = function ( x, y ) {
  this.x = x || 0;
  this.y = y || 0;
};

MathUtil.Vector2.prototype = {
  constructor: MathUtil.Vector2,

  set: function ( x, y ) {
    this.x = x;
    this.y = y;

    return this;
  },

  copy: function ( v ) {
    this.x = v.x;
    this.y = v.y;

    return this;
  },

  subVectors: function ( a, b ) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;

    return this;
  },
};

MathUtil.Vector3 = function ( x, y, z ) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
};

MathUtil.Vector3.prototype = {
  constructor: MathUtil.Vector3,

  set: function ( x, y, z ) {
    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  },

  copy: function ( v ) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;

    return this;
  },

  length: function () {
    return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
  },

  normalize: function () {
    var scalar = this.length();

    if ( scalar !== 0 ) {
      var invScalar = 1 / scalar;

      this.multiplyScalar(invScalar);
    } else {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }

    return this;
  },

  multiplyScalar: function ( scalar ) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
  },

  applyQuaternion: function ( q ) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var qx = q.x;
    var qy = q.y;
    var qz = q.z;
    var qw = q.w;

    // calculate quat * vector
    var ix =  qw * x + qy * z - qz * y;
    var iy =  qw * y + qz * x - qx * z;
    var iz =  qw * z + qx * y - qy * x;
    var iw = - qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
    this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
    this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

    return this;
  },

  dot: function ( v ) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  },

  crossVectors: function ( a, b ) {
    var ax = a.x, ay = a.y, az = a.z;
    var bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
  },
};

MathUtil.Quaternion = function ( x, y, z, w ) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.w = ( w !== undefined ) ? w : 1;
};

MathUtil.Quaternion.prototype = {
  constructor: MathUtil.Quaternion,

  set: function ( x, y, z, w ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;

    return this;
  },

  copy: function ( quaternion ) {
    this.x = quaternion.x;
    this.y = quaternion.y;
    this.z = quaternion.z;
    this.w = quaternion.w;

    return this;
  },

  setFromEulerXYZ: function( x, y, z ) {
    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;

    return this;
  },

  setFromEulerYXZ: function( x, y, z ) {
    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 - s1 * s2 * c3;
    this.w = c1 * c2 * c3 + s1 * s2 * s3;

    return this;
  },

  setFromAxisAngle: function ( axis, angle ) {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
    // assumes axis is normalized

    var halfAngle = angle / 2, s = Math.sin( halfAngle );

    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos( halfAngle );

    return this;
  },

  multiply: function ( q ) {
    return this.multiplyQuaternions( this, q );
  },

  multiplyQuaternions: function ( a, b ) {
    // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

    var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    var qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

    return this;
  },

  inverse: function () {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;

    this.normalize();

    return this;
  },

  normalize: function () {
    var l = Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

    if ( l === 0 ) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      l = 1 / l;

      this.x = this.x * l;
      this.y = this.y * l;
      this.z = this.z * l;
      this.w = this.w * l;
    }

    return this;
  },

  slerp: function ( qb, t ) {
    if ( t === 0 ) return this;
    if ( t === 1 ) return this.copy( qb );

    var x = this.x, y = this.y, z = this.z, w = this.w;

    // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

    var cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;

    if ( cosHalfTheta < 0 ) {
      this.w = - qb.w;
      this.x = - qb.x;
      this.y = - qb.y;
      this.z = - qb.z;

      cosHalfTheta = - cosHalfTheta;
    } else {
      this.copy( qb );
    }

    if ( cosHalfTheta >= 1.0 ) {
      this.w = w;
      this.x = x;
      this.y = y;
      this.z = z;

      return this;
    }

    var halfTheta = Math.acos( cosHalfTheta );
    var sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

    if ( Math.abs( sinHalfTheta ) < 0.001 ) {
      this.w = 0.5 * ( w + this.w );
      this.x = 0.5 * ( x + this.x );
      this.y = 0.5 * ( y + this.y );
      this.z = 0.5 * ( z + this.z );

      return this;
    }

    var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
    ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

    this.w = ( w * ratioA + this.w * ratioB );
    this.x = ( x * ratioA + this.x * ratioB );
    this.y = ( y * ratioA + this.y * ratioB );
    this.z = ( z * ratioA + this.z * ratioB );

    return this;
  },

  setFromUnitVectors: function () {
    // http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final
    // assumes direction vectors vFrom and vTo are normalized

    var v1, r;
    var EPS = 0.000001;

    return function ( vFrom, vTo ) {
      if ( v1 === undefined ) v1 = new MathUtil.Vector3();

      r = vFrom.dot( vTo ) + 1;

      if ( r < EPS ) {
        r = 0;

        if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {
          v1.set( - vFrom.y, vFrom.x, 0 );
        } else {
          v1.set( 0, - vFrom.z, vFrom.y );
        }
      } else {
        v1.crossVectors( vFrom, vTo );
      }

      this.x = v1.x;
      this.y = v1.y;
      this.z = v1.z;
      this.w = r;

      this.normalize();

      return this;
    }
  }(),
};

module.exports = MathUtil;

},{}],16:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var VRDisplay = _dereq_('./base.js').VRDisplay;
var MathUtil = _dereq_('./math-util.js');
var Util = _dereq_('./util.js');

// How much to rotate per key stroke.
var KEY_SPEED = 0.15;
var KEY_ANIMATION_DURATION = 80;

// How much to rotate for mouse events.
var MOUSE_SPEED_X = 0.5;
var MOUSE_SPEED_Y = 0.3;

/**
 * VRDisplay based on mouse and keyboard input. Designed for desktops/laptops
 * where orientation events aren't supported. Cannot present.
 */
function MouseKeyboardVRDisplay() {
  this.displayName = 'Mouse and Keyboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;

  // Attach to mouse and keyboard events.
  window.addEventListener('keydown', this.onKeyDown_.bind(this));
  window.addEventListener('mousemove', this.onMouseMove_.bind(this));
  window.addEventListener('mousedown', this.onMouseDown_.bind(this));
  window.addEventListener('mouseup', this.onMouseUp_.bind(this));

  // "Private" members.
  this.phi_ = 0;
  this.theta_ = 0;

  // Variables for keyboard-based rotation animation.
  this.targetAngle_ = null;
  this.angleAnimation_ = null;

  // State variables for calculations.
  this.orientation_ = new MathUtil.Quaternion();

  // Variables for mouse-based rotation.
  this.rotateStart_ = new MathUtil.Vector2();
  this.rotateEnd_ = new MathUtil.Vector2();
  this.rotateDelta_ = new MathUtil.Vector2();
  this.isDragging_ = false;

  this.orientationOut_ = new Float32Array(4);
}
MouseKeyboardVRDisplay.prototype = new VRDisplay();

MouseKeyboardVRDisplay.prototype.getImmediatePose = function() {
  this.orientation_.setFromEulerYXZ(this.phi_, this.theta_, 0);

  this.orientationOut_[0] = this.orientation_.x;
  this.orientationOut_[1] = this.orientation_.y;
  this.orientationOut_[2] = this.orientation_.z;
  this.orientationOut_[3] = this.orientation_.w;

  return {
    position: null,
    orientation: this.orientationOut_,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

MouseKeyboardVRDisplay.prototype.onKeyDown_ = function(e) {
  // Track WASD and arrow keys.
  if (e.keyCode == 38) { // Up key.
    this.animatePhi_(this.phi_ + KEY_SPEED);
  } else if (e.keyCode == 39) { // Right key.
    this.animateTheta_(this.theta_ - KEY_SPEED);
  } else if (e.keyCode == 40) { // Down key.
    this.animatePhi_(this.phi_ - KEY_SPEED);
  } else if (e.keyCode == 37) { // Left key.
    this.animateTheta_(this.theta_ + KEY_SPEED);
  }
};

MouseKeyboardVRDisplay.prototype.animateTheta_ = function(targetAngle) {
  this.animateKeyTransitions_('theta_', targetAngle);
};

MouseKeyboardVRDisplay.prototype.animatePhi_ = function(targetAngle) {
  // Prevent looking too far up or down.
  targetAngle = Util.clamp(targetAngle, -Math.PI/2, Math.PI/2);
  this.animateKeyTransitions_('phi_', targetAngle);
};

/**
 * Start an animation to transition an angle from one value to another.
 */
MouseKeyboardVRDisplay.prototype.animateKeyTransitions_ = function(angleName, targetAngle) {
  // If an animation is currently running, cancel it.
  if (this.angleAnimation_) {
    clearInterval(this.angleAnimation_);
  }
  var startAngle = this[angleName];
  var startTime = new Date();
  // Set up an interval timer to perform the animation.
  this.angleAnimation_ = setInterval(function() {
    // Once we're finished the animation, we're done.
    var elapsed = new Date() - startTime;
    if (elapsed >= KEY_ANIMATION_DURATION) {
      this[angleName] = targetAngle;
      clearInterval(this.angleAnimation_);
      return;
    }
    // Linearly interpolate the angle some amount.
    var percent = elapsed / KEY_ANIMATION_DURATION;
    this[angleName] = startAngle + (targetAngle - startAngle) * percent;
  }.bind(this), 1000/60);
};

MouseKeyboardVRDisplay.prototype.onMouseDown_ = function(e) {
  this.rotateStart_.set(e.clientX, e.clientY);
  this.isDragging_ = true;
};

// Very similar to https://gist.github.com/mrflix/8351020
MouseKeyboardVRDisplay.prototype.onMouseMove_ = function(e) {
  if (!this.isDragging_ && !this.isPointerLocked_()) {
    return;
  }
  // Support pointer lock API.
  if (this.isPointerLocked_()) {
    var movementX = e.movementX || e.mozMovementX || 0;
    var movementY = e.movementY || e.mozMovementY || 0;
    this.rotateEnd_.set(this.rotateStart_.x - movementX, this.rotateStart_.y - movementY);
  } else {
    this.rotateEnd_.set(e.clientX, e.clientY);
  }
  // Calculate how much we moved in mouse space.
  this.rotateDelta_.subVectors(this.rotateEnd_, this.rotateStart_);
  this.rotateStart_.copy(this.rotateEnd_);

  // Keep track of the cumulative euler angles.
  this.phi_ += 2 * Math.PI * this.rotateDelta_.y / screen.height * MOUSE_SPEED_Y;
  this.theta_ += 2 * Math.PI * this.rotateDelta_.x / screen.width * MOUSE_SPEED_X;

  // Prevent looking too far up or down.
  this.phi_ = Util.clamp(this.phi_, -Math.PI/2, Math.PI/2);
};

MouseKeyboardVRDisplay.prototype.onMouseUp_ = function(e) {
  this.isDragging_ = false;
};

MouseKeyboardVRDisplay.prototype.isPointerLocked_ = function() {
  var el = document.pointerLockElement || document.mozPointerLockElement ||
      document.webkitPointerLockElement;
  return el !== undefined;
};

MouseKeyboardVRDisplay.prototype.resetPose = function() {
  this.phi_ = 0;
  this.theta_ = 0;
};

module.exports = MouseKeyboardVRDisplay;

},{"./base.js":3,"./math-util.js":15,"./util.js":23}],17:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');

function RotateInstructions() {
  this.loadIcon_();

  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.top = 0;
  s.right = 0;
  s.bottom = 0;
  s.left = 0;
  s.backgroundColor = 'gray';
  s.fontFamily = 'sans-serif';

  var img = document.createElement('img');
  img.src = this.icon;
  var s = img.style;
  s.marginLeft = '25%';
  s.marginTop = '25%';
  s.width = '50%';
  overlay.appendChild(img);

  var text = document.createElement('div');
  var s = text.style;
  s.textAlign = 'center';
  s.fontSize = '16px';
  s.lineHeight = '24px';
  s.margin = '24px 25%';
  s.width = '50%';
  text.innerHTML = 'Place your phone into your Cardboard viewer.';
  overlay.appendChild(text);

  var snackbar = document.createElement('div');
  var s = snackbar.style;
  s.backgroundColor = '#CFD8DC';
  s.position = 'fixed';
  s.bottom = 0;
  s.width = '100%';
  s.height = '48px';
  s.padding = '14px 24px';
  s.boxSizing = 'border-box';
  s.color = '#656A6B';
  overlay.appendChild(snackbar);

  var snackbarText = document.createElement('div');
  snackbarText.style.float = 'left';
  snackbarText.innerHTML = 'No Cardboard viewer?';

  var snackbarButton = document.createElement('a');
  snackbarButton.href = 'https://www.google.com/get/cardboard/get-cardboard/';
  snackbarButton.innerHTML = 'get one';
  snackbarButton.target = '_blank';
  var s = snackbarButton.style;
  s.float = 'right';
  s.fontWeight = 600;
  s.textTransform = 'uppercase';
  s.borderLeft = '1px solid gray';
  s.paddingLeft = '24px';
  s.textDecoration = 'none';
  s.color = '#656A6B';

  snackbar.appendChild(snackbarText);
  snackbar.appendChild(snackbarButton);

  this.overlay = overlay;
  this.text = text;

  this.hide();
}

RotateInstructions.prototype.show = function(parent) {
  if (!parent && !this.overlay.parentElement) {
    document.body.appendChild(this.overlay);
  } else if (parent) {
    if (this.overlay.parentElement && this.overlay.parentElement != parent)
      this.overlay.parentElement.removeChild(this.overlay);

    parent.appendChild(this.overlay);
  }

  this.overlay.style.display = 'block';

  var img = this.overlay.querySelector('img');
  var s = img.style;

  if (Util.isLandscapeMode()) {
    s.width = '20%';
    s.marginLeft = '40%';
    s.marginTop = '3%';
  } else {
    s.width = '50%';
    s.marginLeft = '25%';
    s.marginTop = '25%';
  }
};

RotateInstructions.prototype.hide = function() {
  this.overlay.style.display = 'none';
};

RotateInstructions.prototype.showTemporarily = function(ms, parent) {
  this.show(parent);
  this.timer = setTimeout(this.hide.bind(this), ms);
};

RotateInstructions.prototype.disableShowTemporarily = function() {
  clearTimeout(this.timer);
};

RotateInstructions.prototype.update = function() {
  this.disableShowTemporarily();
  // In portrait VR mode, tell the user to rotate to landscape. Otherwise, hide
  // the instructions.
  if (!Util.isLandscapeMode() && Util.isMobile()) {
    this.show();
  } else {
    this.hide();
  }
};

RotateInstructions.prototype.loadIcon_ = function() {
  // Encoded asset_src/rotate-instructions.svg
  this.icon = Util.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjE5OHB4IiBoZWlnaHQ9IjI0MHB4IiB2aWV3Qm94PSIwIDAgMTk4IDI0MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczpza2V0Y2g9Imh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaC9ucyI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDMuMy4zICgxMjA4MSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+dHJhbnNpdGlvbjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHNrZXRjaDp0eXBlPSJNU1BhZ2UiPgogICAgICAgIDxnIGlkPSJ0cmFuc2l0aW9uIiBza2V0Y2g6dHlwZT0iTVNBcnRib2FyZEdyb3VwIj4KICAgICAgICAgICAgPGcgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTQtKy1JbXBvcnRlZC1MYXllcnMtQ29weS0rLUltcG9ydGVkLUxheWVycy1Db3B5LTItQ29weSIgc2tldGNoOnR5cGU9Ik1TTGF5ZXJHcm91cCI+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHktNCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsIDEwNy4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjYyNSwyLjUyNyBDMTQ5LjYyNSwyLjUyNyAxNTUuODA1LDYuMDk2IDE1Ni4zNjIsNi40MTggTDE1Ni4zNjIsNy4zMDQgQzE1Ni4zNjIsNy40ODEgMTU2LjM3NSw3LjY2NCAxNTYuNCw3Ljg1MyBDMTU2LjQxLDcuOTM0IDE1Ni40Miw4LjAxNSAxNTYuNDI3LDguMDk1IEMxNTYuNTY3LDkuNTEgMTU3LjQwMSwxMS4wOTMgMTU4LjUzMiwxMi4wOTQgTDE2NC4yNTIsMTcuMTU2IEwxNjQuMzMzLDE3LjA2NiBDMTY0LjMzMywxNy4wNjYgMTY4LjcxNSwxNC41MzYgMTY5LjU2OCwxNC4wNDIgQzE3MS4wMjUsMTQuODgzIDE5NS41MzgsMjkuMDM1IDE5NS41MzgsMjkuMDM1IEwxOTUuNTM4LDgzLjAzNiBDMTk1LjUzOCw4My44MDcgMTk1LjE1Miw4NC4yNTMgMTk0LjU5LDg0LjI1MyBDMTk0LjM1Nyw4NC4yNTMgMTk0LjA5NSw4NC4xNzcgMTkzLjgxOCw4NC4wMTcgTDE2OS44NTEsNzAuMTc5IEwxNjkuODM3LDcwLjIwMyBMMTQyLjUxNSw4NS45NzggTDE0MS42NjUsODQuNjU1IEMxMzYuOTM0LDgzLjEyNiAxMzEuOTE3LDgxLjkxNSAxMjYuNzE0LDgxLjA0NSBDMTI2LjcwOSw4MS4wNiAxMjYuNzA3LDgxLjA2OSAxMjYuNzA3LDgxLjA2OSBMMTIxLjY0LDk4LjAzIEwxMTMuNzQ5LDEwMi41ODYgTDExMy43MTIsMTAyLjUyMyBMMTEzLjcxMiwxMzAuMTEzIEMxMTMuNzEyLDEzMC44ODUgMTEzLjMyNiwxMzEuMzMgMTEyLjc2NCwxMzEuMzMgQzExMi41MzIsMTMxLjMzIDExMi4yNjksMTMxLjI1NCAxMTEuOTkyLDEzMS4wOTQgTDY5LjUxOSwxMDYuNTcyIEM2OC41NjksMTA2LjAyMyA2Ny43OTksMTA0LjY5NSA2Ny43OTksMTAzLjYwNSBMNjcuNzk5LDEwMi41NyBMNjcuNzc4LDEwMi42MTcgQzY3LjI3LDEwMi4zOTMgNjYuNjQ4LDEwMi4yNDkgNjUuOTYyLDEwMi4yMTggQzY1Ljg3NSwxMDIuMjE0IDY1Ljc4OCwxMDIuMjEyIDY1LjcwMSwxMDIuMjEyIEM2NS42MDYsMTAyLjIxMiA2NS41MTEsMTAyLjIxNSA2NS40MTYsMTAyLjIxOSBDNjUuMTk1LDEwMi4yMjkgNjQuOTc0LDEwMi4yMzUgNjQuNzU0LDEwMi4yMzUgQzY0LjMzMSwxMDIuMjM1IDYzLjkxMSwxMDIuMjE2IDYzLjQ5OCwxMDIuMTc4IEM2MS44NDMsMTAyLjAyNSA2MC4yOTgsMTAxLjU3OCA1OS4wOTQsMTAwLjg4MiBMMTIuNTE4LDczLjk5MiBMMTIuNTIzLDc0LjAwNCBMMi4yNDUsNTUuMjU0IEMxLjI0NCw1My40MjcgMi4wMDQsNTEuMDM4IDMuOTQzLDQ5LjkxOCBMNTkuOTU0LDE3LjU3MyBDNjAuNjI2LDE3LjE4NSA2MS4zNSwxNy4wMDEgNjIuMDUzLDE3LjAwMSBDNjMuMzc5LDE3LjAwMSA2NC42MjUsMTcuNjYgNjUuMjgsMTguODU0IEw2NS4yODUsMTguODUxIEw2NS41MTIsMTkuMjY0IEw2NS41MDYsMTkuMjY4IEM2NS45MDksMjAuMDAzIDY2LjQwNSwyMC42OCA2Ni45ODMsMjEuMjg2IEw2Ny4yNiwyMS41NTYgQzY5LjE3NCwyMy40MDYgNzEuNzI4LDI0LjM1NyA3NC4zNzMsMjQuMzU3IEM3Ni4zMjIsMjQuMzU3IDc4LjMyMSwyMy44NCA4MC4xNDgsMjIuNzg1IEM4MC4xNjEsMjIuNzg1IDg3LjQ2NywxOC41NjYgODcuNDY3LDE4LjU2NiBDODguMTM5LDE4LjE3OCA4OC44NjMsMTcuOTk0IDg5LjU2NiwxNy45OTQgQzkwLjg5MiwxNy45OTQgOTIuMTM4LDE4LjY1MiA5Mi43OTIsMTkuODQ3IEw5Ni4wNDIsMjUuNzc1IEw5Ni4wNjQsMjUuNzU3IEwxMDIuODQ5LDI5LjY3NCBMMTAyLjc0NCwyOS40OTIgTDE0OS42MjUsMi41MjcgTTE0OS42MjUsMC44OTIgQzE0OS4zNDMsMC44OTIgMTQ5LjA2MiwwLjk2NSAxNDguODEsMS4xMSBMMTAyLjY0MSwyNy42NjYgTDk3LjIzMSwyNC41NDIgTDk0LjIyNiwxOS4wNjEgQzkzLjMxMywxNy4zOTQgOTEuNTI3LDE2LjM1OSA4OS41NjYsMTYuMzU4IEM4OC41NTUsMTYuMzU4IDg3LjU0NiwxNi42MzIgODYuNjQ5LDE3LjE1IEM4My44NzgsMTguNzUgNzkuNjg3LDIxLjE2OSA3OS4zNzQsMjEuMzQ1IEM3OS4zNTksMjEuMzUzIDc5LjM0NSwyMS4zNjEgNzkuMzMsMjEuMzY5IEM3Ny43OTgsMjIuMjU0IDc2LjA4NCwyMi43MjIgNzQuMzczLDIyLjcyMiBDNzIuMDgxLDIyLjcyMiA2OS45NTksMjEuODkgNjguMzk3LDIwLjM4IEw2OC4xNDUsMjAuMTM1IEM2Ny43MDYsMTkuNjcyIDY3LjMyMywxOS4xNTYgNjcuMDA2LDE4LjYwMSBDNjYuOTg4LDE4LjU1OSA2Ni45NjgsMTguNTE5IDY2Ljk0NiwxOC40NzkgTDY2LjcxOSwxOC4wNjUgQzY2LjY5LDE4LjAxMiA2Ni42NTgsMTcuOTYgNjYuNjI0LDE3LjkxMSBDNjUuNjg2LDE2LjMzNyA2My45NTEsMTUuMzY2IDYyLjA1MywxNS4zNjYgQzYxLjA0MiwxNS4zNjYgNjAuMDMzLDE1LjY0IDU5LjEzNiwxNi4xNTggTDMuMTI1LDQ4LjUwMiBDMC40MjYsNTAuMDYxIC0wLjYxMyw1My40NDIgMC44MTEsNTYuMDQgTDExLjA4OSw3NC43OSBDMTEuMjY2LDc1LjExMyAxMS41MzcsNzUuMzUzIDExLjg1LDc1LjQ5NCBMNTguMjc2LDEwMi4yOTggQzU5LjY3OSwxMDMuMTA4IDYxLjQzMywxMDMuNjMgNjMuMzQ4LDEwMy44MDYgQzYzLjgxMiwxMDMuODQ4IDY0LjI4NSwxMDMuODcgNjQuNzU0LDEwMy44NyBDNjUsMTAzLjg3IDY1LjI0OSwxMDMuODY0IDY1LjQ5NCwxMDMuODUyIEM2NS41NjMsMTAzLjg0OSA2NS42MzIsMTAzLjg0NyA2NS43MDEsMTAzLjg0NyBDNjUuNzY0LDEwMy44NDcgNjUuODI4LDEwMy44NDkgNjUuODksMTAzLjg1MiBDNjUuOTg2LDEwMy44NTYgNjYuMDgsMTAzLjg2MyA2Ni4xNzMsMTAzLjg3NCBDNjYuMjgyLDEwNS40NjcgNjcuMzMyLDEwNy4xOTcgNjguNzAyLDEwNy45ODggTDExMS4xNzQsMTMyLjUxIEMxMTEuNjk4LDEzMi44MTIgMTEyLjIzMiwxMzIuOTY1IDExMi43NjQsMTMyLjk2NSBDMTE0LjI2MSwxMzIuOTY1IDExNS4zNDcsMTMxLjc2NSAxMTUuMzQ3LDEzMC4xMTMgTDExNS4zNDcsMTAzLjU1MSBMMTIyLjQ1OCw5OS40NDYgQzEyMi44MTksOTkuMjM3IDEyMy4wODcsOTguODk4IDEyMy4yMDcsOTguNDk4IEwxMjcuODY1LDgyLjkwNSBDMTMyLjI3OSw4My43MDIgMTM2LjU1Nyw4NC43NTMgMTQwLjYwNyw4Ni4wMzMgTDE0MS4xNCw4Ni44NjIgQzE0MS40NTEsODcuMzQ2IDE0MS45NzcsODcuNjEzIDE0Mi41MTYsODcuNjEzIEMxNDIuNzk0LDg3LjYxMyAxNDMuMDc2LDg3LjU0MiAxNDMuMzMzLDg3LjM5MyBMMTY5Ljg2NSw3Mi4wNzYgTDE5Myw4NS40MzMgQzE5My41MjMsODUuNzM1IDE5NC4wNTgsODUuODg4IDE5NC41OSw4NS44ODggQzE5Ni4wODcsODUuODg4IDE5Ny4xNzMsODQuNjg5IDE5Ny4xNzMsODMuMDM2IEwxOTcuMTczLDI5LjAzNSBDMTk3LjE3MywyOC40NTEgMTk2Ljg2MSwyNy45MTEgMTk2LjM1NSwyNy42MTkgQzE5Ni4zNTUsMjcuNjE5IDE3MS44NDMsMTMuNDY3IDE3MC4zODUsMTIuNjI2IEMxNzAuMTMyLDEyLjQ4IDE2OS44NSwxMi40MDcgMTY5LjU2OCwxMi40MDcgQzE2OS4yODUsMTIuNDA3IDE2OS4wMDIsMTIuNDgxIDE2OC43NDksMTIuNjI3IEMxNjguMTQzLDEyLjk3OCAxNjUuNzU2LDE0LjM1NyAxNjQuNDI0LDE1LjEyNSBMMTU5LjYxNSwxMC44NyBDMTU4Ljc5NiwxMC4xNDUgMTU4LjE1NCw4LjkzNyAxNTguMDU0LDcuOTM0IEMxNTguMDQ1LDcuODM3IDE1OC4wMzQsNy43MzkgMTU4LjAyMSw3LjY0IEMxNTguMDA1LDcuNTIzIDE1Ny45OTgsNy40MSAxNTcuOTk4LDcuMzA0IEwxNTcuOTk4LDYuNDE4IEMxNTcuOTk4LDUuODM0IDE1Ny42ODYsNS4yOTUgMTU3LjE4MSw1LjAwMiBDMTU2LjYyNCw0LjY4IDE1MC40NDIsMS4xMTEgMTUwLjQ0MiwxLjExMSBDMTUwLjE4OSwwLjk2NSAxNDkuOTA3LDAuODkyIDE0OS42MjUsMC44OTIiIGlkPSJGaWxsLTEiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTYuMDI3LDI1LjYzNiBMMTQyLjYwMyw1Mi41MjcgQzE0My44MDcsNTMuMjIyIDE0NC41ODIsNTQuMTE0IDE0NC44NDUsNTUuMDY4IEwxNDQuODM1LDU1LjA3NSBMNjMuNDYxLDEwMi4wNTcgTDYzLjQ2LDEwMi4wNTcgQzYxLjgwNiwxMDEuOTA1IDYwLjI2MSwxMDEuNDU3IDU5LjA1NywxMDAuNzYyIEwxMi40ODEsNzMuODcxIEw5Ni4wMjcsMjUuNjM2IiBpZD0iRmlsbC0yIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYzLjQ2MSwxMDIuMTc0IEM2My40NTMsMTAyLjE3NCA2My40NDYsMTAyLjE3NCA2My40MzksMTAyLjE3MiBDNjEuNzQ2LDEwMi4wMTYgNjAuMjExLDEwMS41NjMgNTguOTk4LDEwMC44NjMgTDEyLjQyMiw3My45NzMgQzEyLjM4Niw3My45NTIgMTIuMzY0LDczLjkxNCAxMi4zNjQsNzMuODcxIEMxMi4zNjQsNzMuODMgMTIuMzg2LDczLjc5MSAxMi40MjIsNzMuNzcgTDk1Ljk2OCwyNS41MzUgQzk2LjAwNCwyNS41MTQgOTYuMDQ5LDI1LjUxNCA5Ni4wODUsMjUuNTM1IEwxNDIuNjYxLDUyLjQyNiBDMTQzLjg4OCw1My4xMzQgMTQ0LjY4Miw1NC4wMzggMTQ0Ljk1Nyw1NS4wMzcgQzE0NC45Nyw1NS4wODMgMTQ0Ljk1Myw1NS4xMzMgMTQ0LjkxNSw1NS4xNjEgQzE0NC45MTEsNTUuMTY1IDE0NC44OTgsNTUuMTc0IDE0NC44OTQsNTUuMTc3IEw2My41MTksMTAyLjE1OCBDNjMuNTAxLDEwMi4xNjkgNjMuNDgxLDEwMi4xNzQgNjMuNDYxLDEwMi4xNzQgTDYzLjQ2MSwxMDIuMTc0IFogTTEyLjcxNCw3My44NzEgTDU5LjExNSwxMDAuNjYxIEM2MC4yOTMsMTAxLjM0MSA2MS43ODYsMTAxLjc4MiA2My40MzUsMTAxLjkzNyBMMTQ0LjcwNyw1NS4wMTUgQzE0NC40MjgsNTQuMTA4IDE0My42ODIsNTMuMjg1IDE0Mi41NDQsNTIuNjI4IEw5Ni4wMjcsMjUuNzcxIEwxMi43MTQsNzMuODcxIEwxMi43MTQsNzMuODcxIFoiIGlkPSJGaWxsLTMiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ4LjMyNyw1OC40NzEgQzE0OC4xNDUsNTguNDggMTQ3Ljk2Miw1OC40OCAxNDcuNzgxLDU4LjQ3MiBDMTQ1Ljg4Nyw1OC4zODkgMTQ0LjQ3OSw1Ny40MzQgMTQ0LjYzNiw1Ni4zNCBDMTQ0LjY4OSw1NS45NjcgMTQ0LjY2NCw1NS41OTcgMTQ0LjU2NCw1NS4yMzUgTDYzLjQ2MSwxMDIuMDU3IEM2NC4wODksMTAyLjExNSA2NC43MzMsMTAyLjEzIDY1LjM3OSwxMDIuMDk5IEM2NS41NjEsMTAyLjA5IDY1Ljc0MywxMDIuMDkgNjUuOTI1LDEwMi4wOTggQzY3LjgxOSwxMDIuMTgxIDY5LjIyNywxMDMuMTM2IDY5LjA3LDEwNC4yMyBMMTQ4LjMyNyw1OC40NzEiIGlkPSJGaWxsLTQiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNjkuMDcsMTA0LjM0NyBDNjkuMDQ4LDEwNC4zNDcgNjkuMDI1LDEwNC4zNCA2OS4wMDUsMTA0LjMyNyBDNjguOTY4LDEwNC4zMDEgNjguOTQ4LDEwNC4yNTcgNjguOTU1LDEwNC4yMTMgQzY5LDEwMy44OTYgNjguODk4LDEwMy41NzYgNjguNjU4LDEwMy4yODggQzY4LjE1MywxMDIuNjc4IDY3LjEwMywxMDIuMjY2IDY1LjkyLDEwMi4yMTQgQzY1Ljc0MiwxMDIuMjA2IDY1LjU2MywxMDIuMjA3IDY1LjM4NSwxMDIuMjE1IEM2NC43NDIsMTAyLjI0NiA2NC4wODcsMTAyLjIzMiA2My40NSwxMDIuMTc0IEM2My4zOTksMTAyLjE2OSA2My4zNTgsMTAyLjEzMiA2My4zNDcsMTAyLjA4MiBDNjMuMzM2LDEwMi4wMzMgNjMuMzU4LDEwMS45ODEgNjMuNDAyLDEwMS45NTYgTDE0NC41MDYsNTUuMTM0IEMxNDQuNTM3LDU1LjExNiAxNDQuNTc1LDU1LjExMyAxNDQuNjA5LDU1LjEyNyBDMTQ0LjY0Miw1NS4xNDEgMTQ0LjY2OCw1NS4xNyAxNDQuNjc3LDU1LjIwNCBDMTQ0Ljc4MSw1NS41ODUgMTQ0LjgwNiw1NS45NzIgMTQ0Ljc1MSw1Ni4zNTcgQzE0NC43MDYsNTYuNjczIDE0NC44MDgsNTYuOTk0IDE0NS4wNDcsNTcuMjgyIEMxNDUuNTUzLDU3Ljg5MiAxNDYuNjAyLDU4LjMwMyAxNDcuNzg2LDU4LjM1NSBDMTQ3Ljk2NCw1OC4zNjMgMTQ4LjE0Myw1OC4zNjMgMTQ4LjMyMSw1OC4zNTQgQzE0OC4zNzcsNTguMzUyIDE0OC40MjQsNTguMzg3IDE0OC40MzksNTguNDM4IEMxNDguNDU0LDU4LjQ5IDE0OC40MzIsNTguNTQ1IDE0OC4zODUsNTguNTcyIEw2OS4xMjksMTA0LjMzMSBDNjkuMTExLDEwNC4zNDIgNjkuMDksMTA0LjM0NyA2OS4wNywxMDQuMzQ3IEw2OS4wNywxMDQuMzQ3IFogTTY1LjY2NSwxMDEuOTc1IEM2NS43NTQsMTAxLjk3NSA2NS44NDIsMTAxLjk3NyA2NS45MywxMDEuOTgxIEM2Ny4xOTYsMTAyLjAzNyA2OC4yODMsMTAyLjQ2OSA2OC44MzgsMTAzLjEzOSBDNjkuMDY1LDEwMy40MTMgNjkuMTg4LDEwMy43MTQgNjkuMTk4LDEwNC4wMjEgTDE0Ny44ODMsNTguNTkyIEMxNDcuODQ3LDU4LjU5MiAxNDcuODExLDU4LjU5MSAxNDcuNzc2LDU4LjU4OSBDMTQ2LjUwOSw1OC41MzMgMTQ1LjQyMiw1OC4xIDE0NC44NjcsNTcuNDMxIEMxNDQuNTg1LDU3LjA5MSAxNDQuNDY1LDU2LjcwNyAxNDQuNTIsNTYuMzI0IEMxNDQuNTYzLDU2LjAyMSAxNDQuNTUyLDU1LjcxNiAxNDQuNDg4LDU1LjQxNCBMNjMuODQ2LDEwMS45NyBDNjQuMzUzLDEwMi4wMDIgNjQuODY3LDEwMi4wMDYgNjUuMzc0LDEwMS45ODIgQzY1LjQ3MSwxMDEuOTc3IDY1LjU2OCwxMDEuOTc1IDY1LjY2NSwxMDEuOTc1IEw2NS42NjUsMTAxLjk3NSBaIiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTIuMjA4LDU1LjEzNCBDMS4yMDcsNTMuMzA3IDEuOTY3LDUwLjkxNyAzLjkwNiw0OS43OTcgTDU5LjkxNywxNy40NTMgQzYxLjg1NiwxNi4zMzMgNjQuMjQxLDE2LjkwNyA2NS4yNDMsMTguNzM0IEw2NS40NzUsMTkuMTQ0IEM2NS44NzIsMTkuODgyIDY2LjM2OCwyMC41NiA2Ni45NDUsMjEuMTY1IEw2Ny4yMjMsMjEuNDM1IEM3MC41NDgsMjQuNjQ5IDc1LjgwNiwyNS4xNTEgODAuMTExLDIyLjY2NSBMODcuNDMsMTguNDQ1IEM4OS4zNywxNy4zMjYgOTEuNzU0LDE3Ljg5OSA5Mi43NTUsMTkuNzI3IEw5Ni4wMDUsMjUuNjU1IEwxMi40ODYsNzMuODg0IEwyLjIwOCw1NS4xMzQgWiIgaWQ9IkZpbGwtNiIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMi40ODYsNzQuMDAxIEMxMi40NzYsNzQuMDAxIDEyLjQ2NSw3My45OTkgMTIuNDU1LDczLjk5NiBDMTIuNDI0LDczLjk4OCAxMi4zOTksNzMuOTY3IDEyLjM4NCw3My45NCBMMi4xMDYsNTUuMTkgQzEuMDc1LDUzLjMxIDEuODU3LDUwLjg0NSAzLjg0OCw0OS42OTYgTDU5Ljg1OCwxNy4zNTIgQzYwLjUyNSwxNi45NjcgNjEuMjcxLDE2Ljc2NCA2Mi4wMTYsMTYuNzY0IEM2My40MzEsMTYuNzY0IDY0LjY2NiwxNy40NjYgNjUuMzI3LDE4LjY0NiBDNjUuMzM3LDE4LjY1NCA2NS4zNDUsMTguNjYzIDY1LjM1MSwxOC42NzQgTDY1LjU3OCwxOS4wODggQzY1LjU4NCwxOS4xIDY1LjU4OSwxOS4xMTIgNjUuNTkxLDE5LjEyNiBDNjUuOTg1LDE5LjgzOCA2Ni40NjksMjAuNDk3IDY3LjAzLDIxLjA4NSBMNjcuMzA1LDIxLjM1MSBDNjkuMTUxLDIzLjEzNyA3MS42NDksMjQuMTIgNzQuMzM2LDI0LjEyIEM3Ni4zMTMsMjQuMTIgNzguMjksMjMuNTgyIDgwLjA1MywyMi41NjMgQzgwLjA2NCwyMi41NTcgODAuMDc2LDIyLjU1MyA4MC4wODgsMjIuNTUgTDg3LjM3MiwxOC4zNDQgQzg4LjAzOCwxNy45NTkgODguNzg0LDE3Ljc1NiA4OS41MjksMTcuNzU2IEM5MC45NTYsMTcuNzU2IDkyLjIwMSwxOC40NzIgOTIuODU4LDE5LjY3IEw5Ni4xMDcsMjUuNTk5IEM5Ni4xMzgsMjUuNjU0IDk2LjExOCwyNS43MjQgOTYuMDYzLDI1Ljc1NiBMMTIuNTQ1LDczLjk4NSBDMTIuNTI2LDczLjk5NiAxMi41MDYsNzQuMDAxIDEyLjQ4Niw3NC4wMDEgTDEyLjQ4Niw3NC4wMDEgWiBNNjIuMDE2LDE2Ljk5NyBDNjEuMzEyLDE2Ljk5NyA2MC42MDYsMTcuMTkgNTkuOTc1LDE3LjU1NCBMMy45NjUsNDkuODk5IEMyLjA4Myw1MC45ODUgMS4zNDEsNTMuMzA4IDIuMzEsNTUuMDc4IEwxMi41MzEsNzMuNzIzIEw5NS44NDgsMjUuNjExIEw5Mi42NTMsMTkuNzgyIEM5Mi4wMzgsMTguNjYgOTAuODcsMTcuOTkgODkuNTI5LDE3Ljk5IEM4OC44MjUsMTcuOTkgODguMTE5LDE4LjE4MiA4Ny40ODksMTguNTQ3IEw4MC4xNzIsMjIuNzcyIEM4MC4xNjEsMjIuNzc4IDgwLjE0OSwyMi43ODIgODAuMTM3LDIyLjc4NSBDNzguMzQ2LDIzLjgxMSA3Ni4zNDEsMjQuMzU0IDc0LjMzNiwyNC4zNTQgQzcxLjU4OCwyNC4zNTQgNjkuMDMzLDIzLjM0NyA2Ny4xNDIsMjEuNTE5IEw2Ni44NjQsMjEuMjQ5IEM2Ni4yNzcsMjAuNjM0IDY1Ljc3NCwxOS45NDcgNjUuMzY3LDE5LjIwMyBDNjUuMzYsMTkuMTkyIDY1LjM1NiwxOS4xNzkgNjUuMzU0LDE5LjE2NiBMNjUuMTYzLDE4LjgxOSBDNjUuMTU0LDE4LjgxMSA2NS4xNDYsMTguODAxIDY1LjE0LDE4Ljc5IEM2NC41MjUsMTcuNjY3IDYzLjM1NywxNi45OTcgNjIuMDE2LDE2Ljk5NyBMNjIuMDE2LDE2Ljk5NyBaIiBpZD0iRmlsbC03IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTQyLjQzNCw0OC44MDggTDQyLjQzNCw0OC44MDggQzM5LjkyNCw0OC44MDcgMzcuNzM3LDQ3LjU1IDM2LjU4Miw0NS40NDMgQzM0Ljc3MSw0Mi4xMzkgMzYuMTQ0LDM3LjgwOSAzOS42NDEsMzUuNzg5IEw1MS45MzIsMjguNjkxIEM1My4xMDMsMjguMDE1IDU0LjQxMywyNy42NTggNTUuNzIxLDI3LjY1OCBDNTguMjMxLDI3LjY1OCA2MC40MTgsMjguOTE2IDYxLjU3MywzMS4wMjMgQzYzLjM4NCwzNC4zMjcgNjIuMDEyLDM4LjY1NyA1OC41MTQsNDAuNjc3IEw0Ni4yMjMsNDcuNzc1IEM0NS4wNTMsNDguNDUgNDMuNzQyLDQ4LjgwOCA0Mi40MzQsNDguODA4IEw0Mi40MzQsNDguODA4IFogTTU1LjcyMSwyOC4xMjUgQzU0LjQ5NSwyOC4xMjUgNTMuMjY1LDI4LjQ2MSA1Mi4xNjYsMjkuMDk2IEwzOS44NzUsMzYuMTk0IEMzNi41OTYsMzguMDg3IDM1LjMwMiw0Mi4xMzYgMzYuOTkyLDQ1LjIxOCBDMzguMDYzLDQ3LjE3MyA0MC4wOTgsNDguMzQgNDIuNDM0LDQ4LjM0IEM0My42NjEsNDguMzQgNDQuODksNDguMDA1IDQ1Ljk5LDQ3LjM3IEw1OC4yODEsNDAuMjcyIEM2MS41NiwzOC4zNzkgNjIuODUzLDM0LjMzIDYxLjE2NCwzMS4yNDggQzYwLjA5MiwyOS4yOTMgNTguMDU4LDI4LjEyNSA1NS43MjEsMjguMTI1IEw1NS43MjEsMjguMTI1IFoiIGlkPSJGaWxsLTgiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjU4OCwyLjQwNyBDMTQ5LjU4OCwyLjQwNyAxNTUuNzY4LDUuOTc1IDE1Ni4zMjUsNi4yOTcgTDE1Ni4zMjUsNy4xODQgQzE1Ni4zMjUsNy4zNiAxNTYuMzM4LDcuNTQ0IDE1Ni4zNjIsNy43MzMgQzE1Ni4zNzMsNy44MTQgMTU2LjM4Miw3Ljg5NCAxNTYuMzksNy45NzUgQzE1Ni41Myw5LjM5IDE1Ny4zNjMsMTAuOTczIDE1OC40OTUsMTEuOTc0IEwxNjUuODkxLDE4LjUxOSBDMTY2LjA2OCwxOC42NzUgMTY2LjI0OSwxOC44MTQgMTY2LjQzMiwxOC45MzQgQzE2OC4wMTEsMTkuOTc0IDE2OS4zODIsMTkuNCAxNjkuNDk0LDE3LjY1MiBDMTY5LjU0MywxNi44NjggMTY5LjU1MSwxNi4wNTcgMTY5LjUxNywxNS4yMjMgTDE2OS41MTQsMTUuMDYzIEwxNjkuNTE0LDEzLjkxMiBDMTcwLjc4LDE0LjY0MiAxOTUuNTAxLDI4LjkxNSAxOTUuNTAxLDI4LjkxNSBMMTk1LjUwMSw4Mi45MTUgQzE5NS41MDEsODQuMDA1IDE5NC43MzEsODQuNDQ1IDE5My43ODEsODMuODk3IEwxNTEuMzA4LDU5LjM3NCBDMTUwLjM1OCw1OC44MjYgMTQ5LjU4OCw1Ny40OTcgMTQ5LjU4OCw1Ni40MDggTDE0OS41ODgsMjIuMzc1IiBpZD0iRmlsbC05IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE5NC41NTMsODQuMjUgQzE5NC4yOTYsODQuMjUgMTk0LjAxMyw4NC4xNjUgMTkzLjcyMiw4My45OTcgTDE1MS4yNSw1OS40NzYgQzE1MC4yNjksNTguOTA5IDE0OS40NzEsNTcuNTMzIDE0OS40NzEsNTYuNDA4IEwxNDkuNDcxLDIyLjM3NSBMMTQ5LjcwNSwyMi4zNzUgTDE0OS43MDUsNTYuNDA4IEMxNDkuNzA1LDU3LjQ1OSAxNTAuNDUsNTguNzQ0IDE1MS4zNjYsNTkuMjc0IEwxOTMuODM5LDgzLjc5NSBDMTk0LjI2Myw4NC4wNCAxOTQuNjU1LDg0LjA4MyAxOTQuOTQyLDgzLjkxNyBDMTk1LjIyNyw4My43NTMgMTk1LjM4NCw4My4zOTcgMTk1LjM4NCw4Mi45MTUgTDE5NS4zODQsMjguOTgyIEMxOTQuMTAyLDI4LjI0MiAxNzIuMTA0LDE1LjU0MiAxNjkuNjMxLDE0LjExNCBMMTY5LjYzNCwxNS4yMiBDMTY5LjY2OCwxNi4wNTIgMTY5LjY2LDE2Ljg3NCAxNjkuNjEsMTcuNjU5IEMxNjkuNTU2LDE4LjUwMyAxNjkuMjE0LDE5LjEyMyAxNjguNjQ3LDE5LjQwNSBDMTY4LjAyOCwxOS43MTQgMTY3LjE5NywxOS41NzggMTY2LjM2NywxOS4wMzIgQzE2Ni4xODEsMTguOTA5IDE2NS45OTUsMTguNzY2IDE2NS44MTQsMTguNjA2IEwxNTguNDE3LDEyLjA2MiBDMTU3LjI1OSwxMS4wMzYgMTU2LjQxOCw5LjQzNyAxNTYuMjc0LDcuOTg2IEMxNTYuMjY2LDcuOTA3IDE1Ni4yNTcsNy44MjcgMTU2LjI0Nyw3Ljc0OCBDMTU2LjIyMSw3LjU1NSAxNTYuMjA5LDcuMzY1IDE1Ni4yMDksNy4xODQgTDE1Ni4yMDksNi4zNjQgQzE1NS4zNzUsNS44ODMgMTQ5LjUyOSwyLjUwOCAxNDkuNTI5LDIuNTA4IEwxNDkuNjQ2LDIuMzA2IEMxNDkuNjQ2LDIuMzA2IDE1NS44MjcsNS44NzQgMTU2LjM4NCw2LjE5NiBMMTU2LjQ0Miw2LjIzIEwxNTYuNDQyLDcuMTg0IEMxNTYuNDQyLDcuMzU1IDE1Ni40NTQsNy41MzUgMTU2LjQ3OCw3LjcxNyBDMTU2LjQ4OSw3LjggMTU2LjQ5OSw3Ljg4MiAxNTYuNTA3LDcuOTYzIEMxNTYuNjQ1LDkuMzU4IDE1Ny40NTUsMTAuODk4IDE1OC41NzIsMTEuODg2IEwxNjUuOTY5LDE4LjQzMSBDMTY2LjE0MiwxOC41ODQgMTY2LjMxOSwxOC43MiAxNjYuNDk2LDE4LjgzNyBDMTY3LjI1NCwxOS4zMzYgMTY4LDE5LjQ2NyAxNjguNTQzLDE5LjE5NiBDMTY5LjAzMywxOC45NTMgMTY5LjMyOSwxOC40MDEgMTY5LjM3NywxNy42NDUgQzE2OS40MjcsMTYuODY3IDE2OS40MzQsMTYuMDU0IDE2OS40MDEsMTUuMjI4IEwxNjkuMzk3LDE1LjA2NSBMMTY5LjM5NywxMy43MSBMMTY5LjU3MiwxMy44MSBDMTcwLjgzOSwxNC41NDEgMTk1LjU1OSwyOC44MTQgMTk1LjU1OSwyOC44MTQgTDE5NS42MTgsMjguODQ3IEwxOTUuNjE4LDgyLjkxNSBDMTk1LjYxOCw4My40ODQgMTk1LjQyLDgzLjkxMSAxOTUuMDU5LDg0LjExOSBDMTk0LjkwOCw4NC4yMDYgMTk0LjczNyw4NC4yNSAxOTQuNTUzLDg0LjI1IiBpZD0iRmlsbC0xMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDUuNjg1LDU2LjE2MSBMMTY5LjgsNzAuMDgzIEwxNDMuODIyLDg1LjA4MSBMMTQyLjM2LDg0Ljc3NCBDMTM1LjgyNiw4Mi42MDQgMTI4LjczMiw4MS4wNDYgMTIxLjM0MSw4MC4xNTggQzExNi45NzYsNzkuNjM0IDExMi42NzgsODEuMjU0IDExMS43NDMsODMuNzc4IEMxMTEuNTA2LDg0LjQxNCAxMTEuNTAzLDg1LjA3MSAxMTEuNzMyLDg1LjcwNiBDMTEzLjI3LDg5Ljk3MyAxMTUuOTY4LDk0LjA2OSAxMTkuNzI3LDk3Ljg0MSBMMTIwLjI1OSw5OC42ODYgQzEyMC4yNiw5OC42ODUgOTQuMjgyLDExMy42ODMgOTQuMjgyLDExMy42ODMgTDcwLjE2Nyw5OS43NjEgTDE0NS42ODUsNTYuMTYxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik05NC4yODIsMTEzLjgxOCBMOTQuMjIzLDExMy43ODUgTDY5LjkzMyw5OS43NjEgTDcwLjEwOCw5OS42NiBMMTQ1LjY4NSw1Ni4wMjYgTDE0NS43NDMsNTYuMDU5IEwxNzAuMDMzLDcwLjA4MyBMMTQzLjg0Miw4NS4yMDUgTDE0My43OTcsODUuMTk1IEMxNDMuNzcyLDg1LjE5IDE0Mi4zMzYsODQuODg4IDE0Mi4zMzYsODQuODg4IEMxMzUuNzg3LDgyLjcxNCAxMjguNzIzLDgxLjE2MyAxMjEuMzI3LDgwLjI3NCBDMTIwLjc4OCw4MC4yMDkgMTIwLjIzNiw4MC4xNzcgMTE5LjY4OSw4MC4xNzcgQzExNS45MzEsODAuMTc3IDExMi42MzUsODEuNzA4IDExMS44NTIsODMuODE5IEMxMTEuNjI0LDg0LjQzMiAxMTEuNjIxLDg1LjA1MyAxMTEuODQyLDg1LjY2NyBDMTEzLjM3Nyw4OS45MjUgMTE2LjA1OCw5My45OTMgMTE5LjgxLDk3Ljc1OCBMMTE5LjgyNiw5Ny43NzkgTDEyMC4zNTIsOTguNjE0IEMxMjAuMzU0LDk4LjYxNyAxMjAuMzU2LDk4LjYyIDEyMC4zNTgsOTguNjI0IEwxMjAuNDIyLDk4LjcyNiBMMTIwLjMxNyw5OC43ODcgQzEyMC4yNjQsOTguODE4IDk0LjU5OSwxMTMuNjM1IDk0LjM0LDExMy43ODUgTDk0LjI4MiwxMTMuODE4IEw5NC4yODIsMTEzLjgxOCBaIE03MC40MDEsOTkuNzYxIEw5NC4yODIsMTEzLjU0OSBMMTE5LjA4NCw5OS4yMjkgQzExOS42Myw5OC45MTQgMTE5LjkzLDk4Ljc0IDEyMC4xMDEsOTguNjU0IEwxMTkuNjM1LDk3LjkxNCBDMTE1Ljg2NCw5NC4xMjcgMTEzLjE2OCw5MC4wMzMgMTExLjYyMiw4NS43NDYgQzExMS4zODIsODUuMDc5IDExMS4zODYsODQuNDA0IDExMS42MzMsODMuNzM4IEMxMTIuNDQ4LDgxLjUzOSAxMTUuODM2LDc5Ljk0MyAxMTkuNjg5LDc5Ljk0MyBDMTIwLjI0Niw3OS45NDMgMTIwLjgwNiw3OS45NzYgMTIxLjM1NSw4MC4wNDIgQzEyOC43NjcsODAuOTMzIDEzNS44NDYsODIuNDg3IDE0Mi4zOTYsODQuNjYzIEMxNDMuMjMyLDg0LjgzOCAxNDMuNjExLDg0LjkxNyAxNDMuNzg2LDg0Ljk2NyBMMTY5LjU2Niw3MC4wODMgTDE0NS42ODUsNTYuMjk1IEw3MC40MDEsOTkuNzYxIEw3MC40MDEsOTkuNzYxIFoiIGlkPSJGaWxsLTEyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2Ny4yMywxOC45NzkgTDE2Ny4yMyw2OS44NSBMMTM5LjkwOSw4NS42MjMgTDEzMy40NDgsNzEuNDU2IEMxMzIuNTM4LDY5LjQ2IDEzMC4wMiw2OS43MTggMTI3LjgyNCw3Mi4wMyBDMTI2Ljc2OSw3My4xNCAxMjUuOTMxLDc0LjU4NSAxMjUuNDk0LDc2LjA0OCBMMTE5LjAzNCw5Ny42NzYgTDkxLjcxMiwxMTMuNDUgTDkxLjcxMiw2Mi41NzkgTDE2Ny4yMywxOC45NzkiIGlkPSJGaWxsLTEzIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTkxLjcxMiwxMTMuNTY3IEM5MS42OTIsMTEzLjU2NyA5MS42NzIsMTEzLjU2MSA5MS42NTMsMTEzLjU1MSBDOTEuNjE4LDExMy41MyA5MS41OTUsMTEzLjQ5MiA5MS41OTUsMTEzLjQ1IEw5MS41OTUsNjIuNTc5IEM5MS41OTUsNjIuNTM3IDkxLjYxOCw2Mi40OTkgOTEuNjUzLDYyLjQ3OCBMMTY3LjE3MiwxOC44NzggQzE2Ny4yMDgsMTguODU3IDE2Ny4yNTIsMTguODU3IDE2Ny4yODgsMTguODc4IEMxNjcuMzI0LDE4Ljg5OSAxNjcuMzQ3LDE4LjkzNyAxNjcuMzQ3LDE4Ljk3OSBMMTY3LjM0Nyw2OS44NSBDMTY3LjM0Nyw2OS44OTEgMTY3LjMyNCw2OS45MyAxNjcuMjg4LDY5Ljk1IEwxMzkuOTY3LDg1LjcyNSBDMTM5LjkzOSw4NS43NDEgMTM5LjkwNSw4NS43NDUgMTM5Ljg3Myw4NS43MzUgQzEzOS44NDIsODUuNzI1IDEzOS44MTYsODUuNzAyIDEzOS44MDIsODUuNjcyIEwxMzMuMzQyLDcxLjUwNCBDMTMyLjk2Nyw3MC42ODIgMTMyLjI4LDcwLjIyOSAxMzEuNDA4LDcwLjIyOSBDMTMwLjMxOSw3MC4yMjkgMTI5LjA0NCw3MC45MTUgMTI3LjkwOCw3Mi4xMSBDMTI2Ljg3NCw3My4yIDEyNi4wMzQsNzQuNjQ3IDEyNS42MDYsNzYuMDgyIEwxMTkuMTQ2LDk3LjcwOSBDMTE5LjEzNyw5Ny43MzggMTE5LjExOCw5Ny43NjIgMTE5LjA5Miw5Ny43NzcgTDkxLjc3LDExMy41NTEgQzkxLjc1MiwxMTMuNTYxIDkxLjczMiwxMTMuNTY3IDkxLjcxMiwxMTMuNTY3IEw5MS43MTIsMTEzLjU2NyBaIE05MS44MjksNjIuNjQ3IEw5MS44MjksMTEzLjI0OCBMMTE4LjkzNSw5Ny41OTggTDEyNS4zODIsNzYuMDE1IEMxMjUuODI3LDc0LjUyNSAxMjYuNjY0LDczLjA4MSAxMjcuNzM5LDcxLjk1IEMxMjguOTE5LDcwLjcwOCAxMzAuMjU2LDY5Ljk5NiAxMzEuNDA4LDY5Ljk5NiBDMTMyLjM3Nyw2OS45OTYgMTMzLjEzOSw3MC40OTcgMTMzLjU1NCw3MS40MDcgTDEzOS45NjEsODUuNDU4IEwxNjcuMTEzLDY5Ljc4MiBMMTY3LjExMywxOS4xODEgTDkxLjgyOSw2Mi42NDcgTDkxLjgyOSw2Mi42NDcgWiIgaWQ9IkZpbGwtMTQiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTY4LjU0MywxOS4yMTMgTDE2OC41NDMsNzAuMDgzIEwxNDEuMjIxLDg1Ljg1NyBMMTM0Ljc2MSw3MS42ODkgQzEzMy44NTEsNjkuNjk0IDEzMS4zMzMsNjkuOTUxIDEyOS4xMzcsNzIuMjYzIEMxMjguMDgyLDczLjM3NCAxMjcuMjQ0LDc0LjgxOSAxMjYuODA3LDc2LjI4MiBMMTIwLjM0Niw5Ny45MDkgTDkzLjAyNSwxMTMuNjgzIEw5My4wMjUsNjIuODEzIEwxNjguNTQzLDE5LjIxMyIgaWQ9IkZpbGwtMTUiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTMuMDI1LDExMy44IEM5My4wMDUsMTEzLjggOTIuOTg0LDExMy43OTUgOTIuOTY2LDExMy43ODUgQzkyLjkzMSwxMTMuNzY0IDkyLjkwOCwxMTMuNzI1IDkyLjkwOCwxMTMuNjg0IEw5Mi45MDgsNjIuODEzIEM5Mi45MDgsNjIuNzcxIDkyLjkzMSw2Mi43MzMgOTIuOTY2LDYyLjcxMiBMMTY4LjQ4NCwxOS4xMTIgQzE2OC41MiwxOS4wOSAxNjguNTY1LDE5LjA5IDE2OC42MDEsMTkuMTEyIEMxNjguNjM3LDE5LjEzMiAxNjguNjYsMTkuMTcxIDE2OC42NiwxOS4yMTIgTDE2OC42Niw3MC4wODMgQzE2OC42Niw3MC4xMjUgMTY4LjYzNyw3MC4xNjQgMTY4LjYwMSw3MC4xODQgTDE0MS4yOCw4NS45NTggQzE0MS4yNTEsODUuOTc1IDE0MS4yMTcsODUuOTc5IDE0MS4xODYsODUuOTY4IEMxNDEuMTU0LDg1Ljk1OCAxNDEuMTI5LDg1LjkzNiAxNDEuMTE1LDg1LjkwNiBMMTM0LjY1NSw3MS43MzggQzEzNC4yOCw3MC45MTUgMTMzLjU5Myw3MC40NjMgMTMyLjcyLDcwLjQ2MyBDMTMxLjYzMiw3MC40NjMgMTMwLjM1Nyw3MS4xNDggMTI5LjIyMSw3Mi4zNDQgQzEyOC4xODYsNzMuNDMzIDEyNy4zNDcsNzQuODgxIDEyNi45MTksNzYuMzE1IEwxMjAuNDU4LDk3Ljk0MyBDMTIwLjQ1LDk3Ljk3MiAxMjAuNDMxLDk3Ljk5NiAxMjAuNDA1LDk4LjAxIEw5My4wODMsMTEzLjc4NSBDOTMuMDY1LDExMy43OTUgOTMuMDQ1LDExMy44IDkzLjAyNSwxMTMuOCBMOTMuMDI1LDExMy44IFogTTkzLjE0Miw2Mi44ODEgTDkzLjE0MiwxMTMuNDgxIEwxMjAuMjQ4LDk3LjgzMiBMMTI2LjY5NSw3Ni4yNDggQzEyNy4xNCw3NC43NTggMTI3Ljk3Nyw3My4zMTUgMTI5LjA1Miw3Mi4xODMgQzEzMC4yMzEsNzAuOTQyIDEzMS41NjgsNzAuMjI5IDEzMi43Miw3MC4yMjkgQzEzMy42ODksNzAuMjI5IDEzNC40NTIsNzAuNzMxIDEzNC44NjcsNzEuNjQxIEwxNDEuMjc0LDg1LjY5MiBMMTY4LjQyNiw3MC4wMTYgTDE2OC40MjYsMTkuNDE1IEw5My4xNDIsNjIuODgxIEw5My4xNDIsNjIuODgxIFoiIGlkPSJGaWxsLTE2IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS44LDcwLjA4MyBMMTQyLjQ3OCw4NS44NTcgTDEzNi4wMTgsNzEuNjg5IEMxMzUuMTA4LDY5LjY5NCAxMzIuNTksNjkuOTUxIDEzMC4zOTMsNzIuMjYzIEMxMjkuMzM5LDczLjM3NCAxMjguNSw3NC44MTkgMTI4LjA2NCw3Ni4yODIgTDEyMS42MDMsOTcuOTA5IEw5NC4yODIsMTEzLjY4MyBMOTQuMjgyLDYyLjgxMyBMMTY5LjgsMTkuMjEzIEwxNjkuOCw3MC4wODMgWiIgaWQ9IkZpbGwtMTciIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTQuMjgyLDExMy45MTcgQzk0LjI0MSwxMTMuOTE3IDk0LjIwMSwxMTMuOTA3IDk0LjE2NSwxMTMuODg2IEM5NC4wOTMsMTEzLjg0NSA5NC4wNDgsMTEzLjc2NyA5NC4wNDgsMTEzLjY4NCBMOTQuMDQ4LDYyLjgxMyBDOTQuMDQ4LDYyLjczIDk0LjA5Myw2Mi42NTIgOTQuMTY1LDYyLjYxMSBMMTY5LjY4MywxOS4wMSBDMTY5Ljc1NSwxOC45NjkgMTY5Ljg0NCwxOC45NjkgMTY5LjkxNywxOS4wMSBDMTY5Ljk4OSwxOS4wNTIgMTcwLjAzMywxOS4xMjkgMTcwLjAzMywxOS4yMTIgTDE3MC4wMzMsNzAuMDgzIEMxNzAuMDMzLDcwLjE2NiAxNjkuOTg5LDcwLjI0NCAxNjkuOTE3LDcwLjI4NSBMMTQyLjU5NSw4Ni4wNiBDMTQyLjUzOCw4Ni4wOTIgMTQyLjQ2OSw4Ni4xIDE0Mi40MDcsODYuMDggQzE0Mi4zNDQsODYuMDYgMTQyLjI5Myw4Ni4wMTQgMTQyLjI2Niw4NS45NTQgTDEzNS44MDUsNzEuNzg2IEMxMzUuNDQ1LDcwLjk5NyAxMzQuODEzLDcwLjU4IDEzMy45NzcsNzAuNTggQzEzMi45MjEsNzAuNTggMTMxLjY3Niw3MS4yNTIgMTMwLjU2Miw3Mi40MjQgQzEyOS41NCw3My41MDEgMTI4LjcxMSw3NC45MzEgMTI4LjI4Nyw3Ni4zNDggTDEyMS44MjcsOTcuOTc2IEMxMjEuODEsOTguMDM0IDEyMS43NzEsOTguMDgyIDEyMS43Miw5OC4xMTIgTDk0LjM5OCwxMTMuODg2IEM5NC4zNjIsMTEzLjkwNyA5NC4zMjIsMTEzLjkxNyA5NC4yODIsMTEzLjkxNyBMOTQuMjgyLDExMy45MTcgWiBNOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDExMy4yNzkgTDEyMS40MDYsOTcuNzU0IEwxMjcuODQsNzYuMjE1IEMxMjguMjksNzQuNzA4IDEyOS4xMzcsNzMuMjQ3IDEzMC4yMjQsNzIuMTAzIEMxMzEuNDI1LDcwLjgzOCAxMzIuNzkzLDcwLjExMiAxMzMuOTc3LDcwLjExMiBDMTM0Ljk5NSw3MC4xMTIgMTM1Ljc5NSw3MC42MzggMTM2LjIzLDcxLjU5MiBMMTQyLjU4NCw4NS41MjYgTDE2OS41NjYsNjkuOTQ4IEwxNjkuNTY2LDE5LjYxNyBMOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDYyLjk0OCBaIiBpZD0iRmlsbC0xOCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMDkuODk0LDkyLjk0MyBMMTA5Ljg5NCw5Mi45NDMgQzEwOC4xMiw5Mi45NDMgMTA2LjY1Myw5Mi4yMTggMTA1LjY1LDkwLjgyMyBDMTA1LjU4Myw5MC43MzEgMTA1LjU5Myw5MC42MSAxMDUuNjczLDkwLjUyOSBDMTA1Ljc1Myw5MC40NDggMTA1Ljg4LDkwLjQ0IDEwNS45NzQsOTAuNTA2IEMxMDYuNzU0LDkxLjA1MyAxMDcuNjc5LDkxLjMzMyAxMDguNzI0LDkxLjMzMyBDMTEwLjA0Nyw5MS4zMzMgMTExLjQ3OCw5MC44OTQgMTEyLjk4LDkwLjAyNyBDMTE4LjI5MSw4Ni45NiAxMjIuNjExLDc5LjUwOSAxMjIuNjExLDczLjQxNiBDMTIyLjYxMSw3MS40ODkgMTIyLjE2OSw2OS44NTYgMTIxLjMzMyw2OC42OTIgQzEyMS4yNjYsNjguNiAxMjEuMjc2LDY4LjQ3MyAxMjEuMzU2LDY4LjM5MiBDMTIxLjQzNiw2OC4zMTEgMTIxLjU2Myw2OC4yOTkgMTIxLjY1Niw2OC4zNjUgQzEyMy4zMjcsNjkuNTM3IDEyNC4yNDcsNzEuNzQ2IDEyNC4yNDcsNzQuNTg0IEMxMjQuMjQ3LDgwLjgyNiAxMTkuODIxLDg4LjQ0NyAxMTQuMzgyLDkxLjU4NyBDMTEyLjgwOCw5Mi40OTUgMTExLjI5OCw5Mi45NDMgMTA5Ljg5NCw5Mi45NDMgTDEwOS44OTQsOTIuOTQzIFogTTEwNi45MjUsOTEuNDAxIEMxMDcuNzM4LDkyLjA1MiAxMDguNzQ1LDkyLjI3OCAxMDkuODkzLDkyLjI3OCBMMTA5Ljg5NCw5Mi4yNzggQzExMS4yMTUsOTIuMjc4IDExMi42NDcsOTEuOTUxIDExNC4xNDgsOTEuMDg0IEMxMTkuNDU5LDg4LjAxNyAxMjMuNzgsODAuNjIxIDEyMy43OCw3NC41MjggQzEyMy43OCw3Mi41NDkgMTIzLjMxNyw3MC45MjkgMTIyLjQ1NCw2OS43NjcgQzEyMi44NjUsNzAuODAyIDEyMy4wNzksNzIuMDQyIDEyMy4wNzksNzMuNDAyIEMxMjMuMDc5LDc5LjY0NSAxMTguNjUzLDg3LjI4NSAxMTMuMjE0LDkwLjQyNSBDMTExLjY0LDkxLjMzNCAxMTAuMTMsOTEuNzQyIDEwOC43MjQsOTEuNzQyIEMxMDguMDgzLDkxLjc0MiAxMDcuNDgxLDkxLjU5MyAxMDYuOTI1LDkxLjQwMSBMMTA2LjkyNSw5MS40MDEgWiIgaWQ9IkZpbGwtMTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjA5Nyw5MC4yMyBDMTE4LjQ4MSw4Ny4xMjIgMTIyLjg0NSw3OS41OTQgMTIyLjg0NSw3My40MTYgQzEyMi44NDUsNzEuMzY1IDEyMi4zNjIsNjkuNzI0IDEyMS41MjIsNjguNTU2IEMxMTkuNzM4LDY3LjMwNCAxMTcuMTQ4LDY3LjM2MiAxMTQuMjY1LDY5LjAyNiBDMTA4Ljg4MSw3Mi4xMzQgMTA0LjUxNyw3OS42NjIgMTA0LjUxNyw4NS44NCBDMTA0LjUxNyw4Ny44OTEgMTA1LDg5LjUzMiAxMDUuODQsOTAuNyBDMTA3LjYyNCw5MS45NTIgMTEwLjIxNCw5MS44OTQgMTEzLjA5Nyw5MC4yMyIgaWQ9IkZpbGwtMjAiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTA4LjcyNCw5MS42MTQgTDEwOC43MjQsOTEuNjE0IEMxMDcuNTgyLDkxLjYxNCAxMDYuNTY2LDkxLjQwMSAxMDUuNzA1LDkwLjc5NyBDMTA1LjY4NCw5MC43ODMgMTA1LjY2NSw5MC44MTEgMTA1LjY1LDkwLjc5IEMxMDQuNzU2LDg5LjU0NiAxMDQuMjgzLDg3Ljg0MiAxMDQuMjgzLDg1LjgxNyBDMTA0LjI4Myw3OS41NzUgMTA4LjcwOSw3MS45NTMgMTE0LjE0OCw2OC44MTIgQzExNS43MjIsNjcuOTA0IDExNy4yMzIsNjcuNDQ5IDExOC42MzgsNjcuNDQ5IEMxMTkuNzgsNjcuNDQ5IDEyMC43OTYsNjcuNzU4IDEyMS42NTYsNjguMzYyIEMxMjEuNjc4LDY4LjM3NyAxMjEuNjk3LDY4LjM5NyAxMjEuNzEyLDY4LjQxOCBDMTIyLjYwNiw2OS42NjIgMTIzLjA3OSw3MS4zOSAxMjMuMDc5LDczLjQxNSBDMTIzLjA3OSw3OS42NTggMTE4LjY1Myw4Ny4xOTggMTEzLjIxNCw5MC4zMzggQzExMS42NCw5MS4yNDcgMTEwLjEzLDkxLjYxNCAxMDguNzI0LDkxLjYxNCBMMTA4LjcyNCw5MS42MTQgWiBNMTA2LjAwNiw5MC41MDUgQzEwNi43OCw5MS4wMzcgMTA3LjY5NCw5MS4yODEgMTA4LjcyNCw5MS4yODEgQzExMC4wNDcsOTEuMjgxIDExMS40NzgsOTAuODY4IDExMi45OCw5MC4wMDEgQzExOC4yOTEsODYuOTM1IDEyMi42MTEsNzkuNDk2IDEyMi42MTEsNzMuNDAzIEMxMjIuNjExLDcxLjQ5NCAxMjIuMTc3LDY5Ljg4IDEyMS4zNTYsNjguNzE4IEMxMjAuNTgyLDY4LjE4NSAxMTkuNjY4LDY3LjkxOSAxMTguNjM4LDY3LjkxOSBDMTE3LjMxNSw2Ny45MTkgMTE1Ljg4Myw2OC4zNiAxMTQuMzgyLDY5LjIyNyBDMTA5LjA3MSw3Mi4yOTMgMTA0Ljc1MSw3OS43MzMgMTA0Ljc1MSw4NS44MjYgQzEwNC43NTEsODcuNzM1IDEwNS4xODUsODkuMzQzIDEwNi4wMDYsOTAuNTA1IEwxMDYuMDA2LDkwLjUwNSBaIiBpZD0iRmlsbC0yMSIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDkuMzE4LDcuMjYyIEwxMzkuMzM0LDE2LjE0IEwxNTUuMjI3LDI3LjE3MSBMMTYwLjgxNiwyMS4wNTkgTDE0OS4zMTgsNy4yNjIiIGlkPSJGaWxsLTIyIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS42NzYsMTMuODQgTDE1OS45MjgsMTkuNDY3IEMxNTYuMjg2LDIxLjU3IDE1MC40LDIxLjU4IDE0Ni43ODEsMTkuNDkxIEMxNDMuMTYxLDE3LjQwMiAxNDMuMTgsMTQuMDAzIDE0Ni44MjIsMTEuOSBMMTU2LjMxNyw2LjI5MiBMMTQ5LjU4OCwyLjQwNyBMNjcuNzUyLDQ5LjQ3OCBMMTEzLjY3NSw3NS45OTIgTDExNi43NTYsNzQuMjEzIEMxMTcuMzg3LDczLjg0OCAxMTcuNjI1LDczLjMxNSAxMTcuMzc0LDcyLjgyMyBDMTE1LjAxNyw2OC4xOTEgMTE0Ljc4MSw2My4yNzcgMTE2LjY5MSw1OC41NjEgQzEyMi4zMjksNDQuNjQxIDE0MS4yLDMzLjc0NiAxNjUuMzA5LDMwLjQ5MSBDMTczLjQ3OCwyOS4zODggMTgxLjk4OSwyOS41MjQgMTkwLjAxMywzMC44ODUgQzE5MC44NjUsMzEuMDMgMTkxLjc4OSwzMC44OTMgMTkyLjQyLDMwLjUyOCBMMTk1LjUwMSwyOC43NSBMMTY5LjY3NiwxMy44NCIgaWQ9IkZpbGwtMjMiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3Ni40NTkgQzExMy41OTQsNzYuNDU5IDExMy41MTQsNzYuNDM4IDExMy40NDIsNzYuMzk3IEw2Ny41MTgsNDkuODgyIEM2Ny4zNzQsNDkuNzk5IDY3LjI4NCw0OS42NDUgNjcuMjg1LDQ5LjQ3OCBDNjcuMjg1LDQ5LjMxMSA2Ny4zNzQsNDkuMTU3IDY3LjUxOSw0OS4wNzMgTDE0OS4zNTUsMi4wMDIgQzE0OS40OTksMS45MTkgMTQ5LjY3NywxLjkxOSAxNDkuODIxLDIuMDAyIEwxNTYuNTUsNS44ODcgQzE1Ni43NzQsNi4wMTcgMTU2Ljg1LDYuMzAyIDE1Ni43MjIsNi41MjYgQzE1Ni41OTIsNi43NDkgMTU2LjMwNyw2LjgyNiAxNTYuMDgzLDYuNjk2IEwxNDkuNTg3LDIuOTQ2IEw2OC42ODcsNDkuNDc5IEwxMTMuNjc1LDc1LjQ1MiBMMTE2LjUyMyw3My44MDggQzExNi43MTUsNzMuNjk3IDExNy4xNDMsNzMuMzk5IDExNi45NTgsNzMuMDM1IEMxMTQuNTQyLDY4LjI4NyAxMTQuMyw2My4yMjEgMTE2LjI1OCw1OC4zODUgQzExOS4wNjQsNTEuNDU4IDEyNS4xNDMsNDUuMTQzIDEzMy44NCw0MC4xMjIgQzE0Mi40OTcsMzUuMTI0IDE1My4zNTgsMzEuNjMzIDE2NS4yNDcsMzAuMDI4IEMxNzMuNDQ1LDI4LjkyMSAxODIuMDM3LDI5LjA1OCAxOTAuMDkxLDMwLjQyNSBDMTkwLjgzLDMwLjU1IDE5MS42NTIsMzAuNDMyIDE5Mi4xODYsMzAuMTI0IEwxOTQuNTY3LDI4Ljc1IEwxNjkuNDQyLDE0LjI0NCBDMTY5LjIxOSwxNC4xMTUgMTY5LjE0MiwxMy44MjkgMTY5LjI3MSwxMy42MDYgQzE2OS40LDEzLjM4MiAxNjkuNjg1LDEzLjMwNiAxNjkuOTA5LDEzLjQzNSBMMTk1LjczNCwyOC4zNDUgQzE5NS44NzksMjguNDI4IDE5NS45NjgsMjguNTgzIDE5NS45NjgsMjguNzUgQzE5NS45NjgsMjguOTE2IDE5NS44NzksMjkuMDcxIDE5NS43MzQsMjkuMTU0IEwxOTIuNjUzLDMwLjkzMyBDMTkxLjkzMiwzMS4zNSAxOTAuODksMzEuNTA4IDE4OS45MzUsMzEuMzQ2IEMxODEuOTcyLDI5Ljk5NSAxNzMuNDc4LDI5Ljg2IDE2NS4zNzIsMzAuOTU0IEMxNTMuNjAyLDMyLjU0MyAxNDIuODYsMzUuOTkzIDEzNC4zMDcsNDAuOTMxIEMxMjUuNzkzLDQ1Ljg0NyAxMTkuODUxLDUyLjAwNCAxMTcuMTI0LDU4LjczNiBDMTE1LjI3LDYzLjMxNCAxMTUuNTAxLDY4LjExMiAxMTcuNzksNzIuNjExIEMxMTguMTYsNzMuMzM2IDExNy44NDUsNzQuMTI0IDExNi45OSw3NC42MTcgTDExMy45MDksNzYuMzk3IEMxMTMuODM2LDc2LjQzOCAxMTMuNzU2LDc2LjQ1OSAxMTMuNjc1LDc2LjQ1OSIgaWQ9IkZpbGwtMjQiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUzLjMxNiwyMS4yNzkgQzE1MC45MDMsMjEuMjc5IDE0OC40OTUsMjAuNzUxIDE0Ni42NjQsMTkuNjkzIEMxNDQuODQ2LDE4LjY0NCAxNDMuODQ0LDE3LjIzMiAxNDMuODQ0LDE1LjcxOCBDMTQzLjg0NCwxNC4xOTEgMTQ0Ljg2LDEyLjc2MyAxNDYuNzA1LDExLjY5OCBMMTU2LjE5OCw2LjA5MSBDMTU2LjMwOSw2LjAyNSAxNTYuNDUyLDYuMDYyIDE1Ni41MTgsNi4xNzMgQzE1Ni41ODMsNi4yODQgMTU2LjU0Nyw2LjQyNyAxNTYuNDM2LDYuNDkzIEwxNDYuOTQsMTIuMTAyIEMxNDUuMjQ0LDEzLjA4MSAxNDQuMzEyLDE0LjM2NSAxNDQuMzEyLDE1LjcxOCBDMTQ0LjMxMiwxNy4wNTggMTQ1LjIzLDE4LjMyNiAxNDYuODk3LDE5LjI4OSBDMTUwLjQ0NiwyMS4zMzggMTU2LjI0LDIxLjMyNyAxNTkuODExLDE5LjI2NSBMMTY5LjU1OSwxMy42MzcgQzE2OS42NywxMy41NzMgMTY5LjgxMywxMy42MTEgMTY5Ljg3OCwxMy43MjMgQzE2OS45NDMsMTMuODM0IDE2OS45MDQsMTMuOTc3IDE2OS43OTMsMTQuMDQyIEwxNjAuMDQ1LDE5LjY3IEMxNTguMTg3LDIwLjc0MiAxNTUuNzQ5LDIxLjI3OSAxNTMuMzE2LDIxLjI3OSIgaWQ9IkZpbGwtMjUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3NS45OTIgTDY3Ljc2Miw0OS40ODQiIGlkPSJGaWxsLTI2IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMy42NzUsNzYuMzQyIEMxMTMuNjE1LDc2LjM0MiAxMTMuNTU1LDc2LjMyNyAxMTMuNSw3Ni4yOTUgTDY3LjU4Nyw0OS43ODcgQzY3LjQxOSw0OS42OSA2Ny4zNjIsNDkuNDc2IDY3LjQ1OSw0OS4zMDkgQzY3LjU1Niw0OS4xNDEgNjcuNzcsNDkuMDgzIDY3LjkzNyw0OS4xOCBMMTEzLjg1LDc1LjY4OCBDMTE0LjAxOCw3NS43ODUgMTE0LjA3NSw3NiAxMTMuOTc4LDc2LjE2NyBDMTEzLjkxNCw3Ni4yNzkgMTEzLjc5Niw3Ni4zNDIgMTEzLjY3NSw3Ni4zNDIiIGlkPSJGaWxsLTI3IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY3Ljc2Miw0OS40ODQgTDY3Ljc2MiwxMDMuNDg1IEM2Ny43NjIsMTA0LjU3NSA2OC41MzIsMTA1LjkwMyA2OS40ODIsMTA2LjQ1MiBMMTExLjk1NSwxMzAuOTczIEMxMTIuOTA1LDEzMS41MjIgMTEzLjY3NSwxMzEuMDgzIDExMy42NzUsMTI5Ljk5MyBMMTEzLjY3NSw3NS45OTIiIGlkPSJGaWxsLTI4IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMi43MjcsMTMxLjU2MSBDMTEyLjQzLDEzMS41NjEgMTEyLjEwNywxMzEuNDY2IDExMS43OCwxMzEuMjc2IEw2OS4zMDcsMTA2Ljc1NSBDNjguMjQ0LDEwNi4xNDIgNjcuNDEyLDEwNC43MDUgNjcuNDEyLDEwMy40ODUgTDY3LjQxMiw0OS40ODQgQzY3LjQxMiw0OS4yOSA2Ny41NjksNDkuMTM0IDY3Ljc2Miw0OS4xMzQgQzY3Ljk1Niw0OS4xMzQgNjguMTEzLDQ5LjI5IDY4LjExMyw0OS40ODQgTDY4LjExMywxMDMuNDg1IEM2OC4xMTMsMTA0LjQ0NSA2OC44MiwxMDUuNjY1IDY5LjY1NywxMDYuMTQ4IEwxMTIuMTMsMTMwLjY3IEMxMTIuNDc0LDEzMC44NjggMTEyLjc5MSwxMzAuOTEzIDExMywxMzAuNzkyIEMxMTMuMjA2LDEzMC42NzMgMTEzLjMyNSwxMzAuMzgxIDExMy4zMjUsMTI5Ljk5MyBMMTEzLjMyNSw3NS45OTIgQzExMy4zMjUsNzUuNzk4IDExMy40ODIsNzUuNjQxIDExMy42NzUsNzUuNjQxIEMxMTMuODY5LDc1LjY0MSAxMTQuMDI1LDc1Ljc5OCAxMTQuMDI1LDc1Ljk5MiBMMTE0LjAyNSwxMjkuOTkzIEMxMTQuMDI1LDEzMC42NDggMTEzLjc4NiwxMzEuMTQ3IDExMy4zNSwxMzEuMzk5IEMxMTMuMTYyLDEzMS41MDcgMTEyLjk1MiwxMzEuNTYxIDExMi43MjcsMTMxLjU2MSIgaWQ9IkZpbGwtMjkiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEyLjg2LDQwLjUxMiBDMTEyLjg2LDQwLjUxMiAxMTIuODYsNDAuNTEyIDExMi44NTksNDAuNTEyIEMxMTAuNTQxLDQwLjUxMiAxMDguMzYsMzkuOTkgMTA2LjcxNywzOS4wNDEgQzEwNS4wMTIsMzguMDU3IDEwNC4wNzQsMzYuNzI2IDEwNC4wNzQsMzUuMjkyIEMxMDQuMDc0LDMzLjg0NyAxMDUuMDI2LDMyLjUwMSAxMDYuNzU0LDMxLjUwNCBMMTE4Ljc5NSwyNC41NTEgQzEyMC40NjMsMjMuNTg5IDEyMi42NjksMjMuMDU4IDEyNS4wMDcsMjMuMDU4IEMxMjcuMzI1LDIzLjA1OCAxMjkuNTA2LDIzLjU4MSAxMzEuMTUsMjQuNTMgQzEzMi44NTQsMjUuNTE0IDEzMy43OTMsMjYuODQ1IDEzMy43OTMsMjguMjc4IEMxMzMuNzkzLDI5LjcyNCAxMzIuODQxLDMxLjA2OSAxMzEuMTEzLDMyLjA2NyBMMTE5LjA3MSwzOS4wMTkgQzExNy40MDMsMzkuOTgyIDExNS4xOTcsNDAuNTEyIDExMi44Niw0MC41MTIgTDExMi44Niw0MC41MTIgWiBNMTI1LjAwNywyMy43NTkgQzEyMi43OSwyMy43NTkgMTIwLjcwOSwyNC4yNTYgMTE5LjE0NiwyNS4xNTggTDEwNy4xMDQsMzIuMTEgQzEwNS42MDIsMzIuOTc4IDEwNC43NzQsMzQuMTA4IDEwNC43NzQsMzUuMjkyIEMxMDQuNzc0LDM2LjQ2NSAxMDUuNTg5LDM3LjU4MSAxMDcuMDY3LDM4LjQzNCBDMTA4LjYwNSwzOS4zMjMgMTEwLjY2MywzOS44MTIgMTEyLjg1OSwzOS44MTIgTDExMi44NiwzOS44MTIgQzExNS4wNzYsMzkuODEyIDExNy4xNTgsMzkuMzE1IDExOC43MjEsMzguNDEzIEwxMzAuNzYyLDMxLjQ2IEMxMzIuMjY0LDMwLjU5MyAxMzMuMDkyLDI5LjQ2MyAxMzMuMDkyLDI4LjI3OCBDMTMzLjA5MiwyNy4xMDYgMTMyLjI3OCwyNS45OSAxMzAuOCwyNS4xMzYgQzEyOS4yNjEsMjQuMjQ4IDEyNy4yMDQsMjMuNzU5IDEyNS4wMDcsMjMuNzU5IEwxMjUuMDA3LDIzLjc1OSBaIiBpZD0iRmlsbC0zMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNjUuNjMsMTYuMjE5IEwxNTkuODk2LDE5LjUzIEMxNTYuNzI5LDIxLjM1OCAxNTEuNjEsMjEuMzY3IDE0OC40NjMsMTkuNTUgQzE0NS4zMTYsMTcuNzMzIDE0NS4zMzIsMTQuNzc4IDE0OC40OTksMTIuOTQ5IEwxNTQuMjMzLDkuNjM5IEwxNjUuNjMsMTYuMjE5IiBpZD0iRmlsbC0zMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNTQuMjMzLDEwLjQ0OCBMMTY0LjIyOCwxNi4yMTkgTDE1OS41NDYsMTguOTIzIEMxNTguMTEyLDE5Ljc1IDE1Ni4xOTQsMjAuMjA2IDE1NC4xNDcsMjAuMjA2IEMxNTIuMTE4LDIwLjIwNiAxNTAuMjI0LDE5Ljc1NyAxNDguODE0LDE4Ljk0MyBDMTQ3LjUyNCwxOC4xOTkgMTQ2LjgxNCwxNy4yNDkgMTQ2LjgxNCwxNi4yNjkgQzE0Ni44MTQsMTUuMjc4IDE0Ny41MzcsMTQuMzE0IDE0OC44NSwxMy41NTYgTDE1NC4yMzMsMTAuNDQ4IE0xNTQuMjMzLDkuNjM5IEwxNDguNDk5LDEyLjk0OSBDMTQ1LjMzMiwxNC43NzggMTQ1LjMxNiwxNy43MzMgMTQ4LjQ2MywxOS41NSBDMTUwLjAzMSwyMC40NTUgMTUyLjA4NiwyMC45MDcgMTU0LjE0NywyMC45MDcgQzE1Ni4yMjQsMjAuOTA3IDE1OC4zMDYsMjAuNDQ3IDE1OS44OTYsMTkuNTMgTDE2NS42MywxNi4yMTkgTDE1NC4yMzMsOS42MzkiIGlkPSJGaWxsLTMyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NS40NDUsNzIuNjY3IEwxNDUuNDQ1LDcyLjY2NyBDMTQzLjY3Miw3Mi42NjcgMTQyLjIwNCw3MS44MTcgMTQxLjIwMiw3MC40MjIgQzE0MS4xMzUsNzAuMzMgMTQxLjE0NSw3MC4xNDcgMTQxLjIyNSw3MC4wNjYgQzE0MS4zMDUsNjkuOTg1IDE0MS40MzIsNjkuOTQ2IDE0MS41MjUsNzAuMDExIEMxNDIuMzA2LDcwLjU1OSAxNDMuMjMxLDcwLjgyMyAxNDQuMjc2LDcwLjgyMiBDMTQ1LjU5OCw3MC44MjIgMTQ3LjAzLDcwLjM3NiAxNDguNTMyLDY5LjUwOSBDMTUzLjg0Miw2Ni40NDMgMTU4LjE2Myw1OC45ODcgMTU4LjE2Myw1Mi44OTQgQzE1OC4xNjMsNTAuOTY3IDE1Ny43MjEsNDkuMzMyIDE1Ni44ODQsNDguMTY4IEMxNTYuODE4LDQ4LjA3NiAxNTYuODI4LDQ3Ljk0OCAxNTYuOTA4LDQ3Ljg2NyBDMTU2Ljk4OCw0Ny43ODYgMTU3LjExNCw0Ny43NzQgMTU3LjIwOCw0Ny44NCBDMTU4Ljg3OCw0OS4wMTIgMTU5Ljc5OCw1MS4yMiAxNTkuNzk4LDU0LjA1OSBDMTU5Ljc5OCw2MC4zMDEgMTU1LjM3Myw2OC4wNDYgMTQ5LjkzMyw3MS4xODYgQzE0OC4zNiw3Mi4wOTQgMTQ2Ljg1LDcyLjY2NyAxNDUuNDQ1LDcyLjY2NyBMMTQ1LjQ0NSw3Mi42NjcgWiBNMTQyLjQ3Niw3MSBDMTQzLjI5LDcxLjY1MSAxNDQuMjk2LDcyLjAwMiAxNDUuNDQ1LDcyLjAwMiBDMTQ2Ljc2Nyw3Mi4wMDIgMTQ4LjE5OCw3MS41NSAxNDkuNyw3MC42ODIgQzE1NS4wMSw2Ny42MTcgMTU5LjMzMSw2MC4xNTkgMTU5LjMzMSw1NC4wNjUgQzE1OS4zMzEsNTIuMDg1IDE1OC44NjgsNTAuNDM1IDE1OC4wMDYsNDkuMjcyIEMxNTguNDE3LDUwLjMwNyAxNTguNjMsNTEuNTMyIDE1OC42Myw1Mi44OTIgQzE1OC42Myw1OS4xMzQgMTU0LjIwNSw2Ni43NjcgMTQ4Ljc2NSw2OS45MDcgQzE0Ny4xOTIsNzAuODE2IDE0NS42ODEsNzEuMjgzIDE0NC4yNzYsNzEuMjgzIEMxNDMuNjM0LDcxLjI4MyAxNDMuMDMzLDcxLjE5MiAxNDIuNDc2LDcxIEwxNDIuNDc2LDcxIFoiIGlkPSJGaWxsLTMzIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0OC42NDgsNjkuNzA0IEMxNTQuMDMyLDY2LjU5NiAxNTguMzk2LDU5LjA2OCAxNTguMzk2LDUyLjg5MSBDMTU4LjM5Niw1MC44MzkgMTU3LjkxMyw0OS4xOTggMTU3LjA3NCw0OC4wMyBDMTU1LjI4OSw0Ni43NzggMTUyLjY5OSw0Ni44MzYgMTQ5LjgxNiw0OC41MDEgQzE0NC40MzMsNTEuNjA5IDE0MC4wNjgsNTkuMTM3IDE0MC4wNjgsNjUuMzE0IEMxNDAuMDY4LDY3LjM2NSAxNDAuNTUyLDY5LjAwNiAxNDEuMzkxLDcwLjE3NCBDMTQzLjE3Niw3MS40MjcgMTQ1Ljc2NSw3MS4zNjkgMTQ4LjY0OCw2OS43MDQiIGlkPSJGaWxsLTM0IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NC4yNzYsNzEuMjc2IEwxNDQuMjc2LDcxLjI3NiBDMTQzLjEzMyw3MS4yNzYgMTQyLjExOCw3MC45NjkgMTQxLjI1Nyw3MC4zNjUgQzE0MS4yMzYsNzAuMzUxIDE0MS4yMTcsNzAuMzMyIDE0MS4yMDIsNzAuMzExIEMxNDAuMzA3LDY5LjA2NyAxMzkuODM1LDY3LjMzOSAxMzkuODM1LDY1LjMxNCBDMTM5LjgzNSw1OS4wNzMgMTQ0LjI2LDUxLjQzOSAxNDkuNyw0OC4yOTggQzE1MS4yNzMsNDcuMzkgMTUyLjc4NCw0Ni45MjkgMTU0LjE4OSw0Ni45MjkgQzE1NS4zMzIsNDYuOTI5IDE1Ni4zNDcsNDcuMjM2IDE1Ny4yMDgsNDcuODM5IEMxNTcuMjI5LDQ3Ljg1NCAxNTcuMjQ4LDQ3Ljg3MyAxNTcuMjYzLDQ3Ljg5NCBDMTU4LjE1Nyw0OS4xMzggMTU4LjYzLDUwLjg2NSAxNTguNjMsNTIuODkxIEMxNTguNjMsNTkuMTMyIDE1NC4yMDUsNjYuNzY2IDE0OC43NjUsNjkuOTA3IEMxNDcuMTkyLDcwLjgxNSAxNDUuNjgxLDcxLjI3NiAxNDQuMjc2LDcxLjI3NiBMMTQ0LjI3Niw3MS4yNzYgWiBNMTQxLjU1OCw3MC4xMDQgQzE0Mi4zMzEsNzAuNjM3IDE0My4yNDUsNzEuMDA1IDE0NC4yNzYsNzEuMDA1IEMxNDUuNTk4LDcxLjAwNSAxNDcuMDMsNzAuNDY3IDE0OC41MzIsNjkuNiBDMTUzLjg0Miw2Ni41MzQgMTU4LjE2Myw1OS4wMzMgMTU4LjE2Myw1Mi45MzkgQzE1OC4xNjMsNTEuMDMxIDE1Ny43MjksNDkuMzg1IDE1Ni45MDcsNDguMjIzIEMxNTYuMTMzLDQ3LjY5MSAxNTUuMjE5LDQ3LjQwOSAxNTQuMTg5LDQ3LjQwOSBDMTUyLjg2Nyw0Ny40MDkgMTUxLjQzNSw0Ny44NDIgMTQ5LjkzMyw0OC43MDkgQzE0NC42MjMsNTEuNzc1IDE0MC4zMDIsNTkuMjczIDE0MC4zMDIsNjUuMzY2IEMxNDAuMzAyLDY3LjI3NiAxNDAuNzM2LDY4Ljk0MiAxNDEuNTU4LDcwLjEwNCBMMTQxLjU1OCw3MC4xMDQgWiIgaWQ9IkZpbGwtMzUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUwLjcyLDY1LjM2MSBMMTUwLjM1Nyw2NS4wNjYgQzE1MS4xNDcsNjQuMDkyIDE1MS44NjksNjMuMDQgMTUyLjUwNSw2MS45MzggQzE1My4zMTMsNjAuNTM5IDE1My45NzgsNTkuMDY3IDE1NC40ODIsNTcuNTYzIEwxNTQuOTI1LDU3LjcxMiBDMTU0LjQxMiw1OS4yNDUgMTUzLjczMyw2MC43NDUgMTUyLjkxLDYyLjE3MiBDMTUyLjI2Miw2My4yOTUgMTUxLjUyNSw2NC4zNjggMTUwLjcyLDY1LjM2MSIgaWQ9IkZpbGwtMzYiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE1LjkxNyw4NC41MTQgTDExNS41NTQsODQuMjIgQzExNi4zNDQsODMuMjQ1IDExNy4wNjYsODIuMTk0IDExNy43MDIsODEuMDkyIEMxMTguNTEsNzkuNjkyIDExOS4xNzUsNzguMjIgMTE5LjY3OCw3Ni43MTcgTDEyMC4xMjEsNzYuODY1IEMxMTkuNjA4LDc4LjM5OCAxMTguOTMsNzkuODk5IDExOC4xMDYsODEuMzI2IEMxMTcuNDU4LDgyLjQ0OCAxMTYuNzIyLDgzLjUyMSAxMTUuOTE3LDg0LjUxNCIgaWQ9IkZpbGwtMzciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE0LDEzMC40NzYgTDExNCwxMzAuMDA4IEwxMTQsNzYuMDUyIEwxMTQsNzUuNTg0IEwxMTQsNzYuMDUyIEwxMTQsMTMwLjAwOCBMMTE0LDEzMC40NzYiIGlkPSJGaWxsLTM4IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYyLjAwMDAwMCwgMC4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTkuODIyLDM3LjQ3NCBDMTkuODM5LDM3LjMzOSAxOS43NDcsMzcuMTk0IDE5LjU1NSwzNy4wODIgQzE5LjIyOCwzNi44OTQgMTguNzI5LDM2Ljg3MiAxOC40NDYsMzcuMDM3IEwxMi40MzQsNDAuNTA4IEMxMi4zMDMsNDAuNTg0IDEyLjI0LDQwLjY4NiAxMi4yNDMsNDAuNzkzIEMxMi4yNDUsNDAuOTI1IDEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQxLjM3MSBMMTIuMjQ1LDQxLjQxNCBMMTIuMjM4LDQxLjU0MiBDOC4xNDgsNDMuODg3IDUuNjQ3LDQ1LjMyMSA1LjY0Nyw0NS4zMjEgQzUuNjQ2LDQ1LjMyMSAzLjU3LDQ2LjM2NyAyLjg2LDUwLjUxMyBDMi44Niw1MC41MTMgMS45NDgsNTcuNDc0IDEuOTYyLDcwLjI1OCBDMS45NzcsODIuODI4IDIuNTY4LDg3LjMyOCAzLjEyOSw5MS42MDkgQzMuMzQ5LDkzLjI5MyA2LjEzLDkzLjczNCA2LjEzLDkzLjczNCBDNi40NjEsOTMuNzc0IDYuODI4LDkzLjcwNyA3LjIxLDkzLjQ4NiBMODIuNDgzLDQ5LjkzNSBDODQuMjkxLDQ4Ljg2NiA4NS4xNSw0Ni4yMTYgODUuNTM5LDQzLjY1MSBDODYuNzUyLDM1LjY2MSA4Ny4yMTQsMTAuNjczIDg1LjI2NCwzLjc3MyBDODUuMDY4LDMuMDggODQuNzU0LDIuNjkgODQuMzk2LDIuNDkxIEw4Mi4zMSwxLjcwMSBDODEuNTgzLDEuNzI5IDgwLjg5NCwyLjE2OCA4MC43NzYsMi4yMzYgQzgwLjYzNiwyLjMxNyA0MS44MDcsMjQuNTg1IDIwLjAzMiwzNy4wNzIgTDE5LjgyMiwzNy40NzQiIGlkPSJGaWxsLTEiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNODIuMzExLDEuNzAxIEw4NC4zOTYsMi40OTEgQzg0Ljc1NCwyLjY5IDg1LjA2OCwzLjA4IDg1LjI2NCwzLjc3MyBDODcuMjEzLDEwLjY3MyA4Ni43NTEsMzUuNjYgODUuNTM5LDQzLjY1MSBDODUuMTQ5LDQ2LjIxNiA4NC4yOSw0OC44NjYgODIuNDgzLDQ5LjkzNSBMNy4yMSw5My40ODYgQzYuODk3LDkzLjY2NyA2LjU5NSw5My43NDQgNi4zMTQsOTMuNzQ0IEw2LjEzMSw5My43MzMgQzYuMTMxLDkzLjczNCAzLjM0OSw5My4yOTMgMy4xMjgsOTEuNjA5IEMyLjU2OCw4Ny4zMjcgMS45NzcsODIuODI4IDEuOTYzLDcwLjI1OCBDMS45NDgsNTcuNDc0IDIuODYsNTAuNTEzIDIuODYsNTAuNTEzIEMzLjU3LDQ2LjM2NyA1LjY0Nyw0NS4zMjEgNS42NDcsNDUuMzIxIEM1LjY0Nyw0NS4zMjEgOC4xNDgsNDMuODg3IDEyLjIzOCw0MS41NDIgTDEyLjI0NSw0MS40MTQgTDEyLjI0NSw0MS4zNzEgQzEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQwLjkyNSAxMi4yNDMsNDAuNzkzIEMxMi4yNCw0MC42ODYgMTIuMzAyLDQwLjU4MyAxMi40MzQsNDAuNTA4IEwxOC40NDYsMzcuMDM2IEMxOC41NzQsMzYuOTYyIDE4Ljc0NiwzNi45MjYgMTguOTI3LDM2LjkyNiBDMTkuMTQ1LDM2LjkyNiAxOS4zNzYsMzYuOTc5IDE5LjU1NCwzNy4wODIgQzE5Ljc0NywzNy4xOTQgMTkuODM5LDM3LjM0IDE5LjgyMiwzNy40NzQgTDIwLjAzMywzNy4wNzIgQzQxLjgwNiwyNC41ODUgODAuNjM2LDIuMzE4IDgwLjc3NywyLjIzNiBDODAuODk0LDIuMTY4IDgxLjU4MywxLjcyOSA4Mi4zMTEsMS43MDEgTTgyLjMxMSwwLjcwNCBMODIuMjcyLDAuNzA1IEM4MS42NTQsMC43MjggODAuOTg5LDAuOTQ5IDgwLjI5OCwxLjM2MSBMODAuMjc3LDEuMzczIEM4MC4xMjksMS40NTggNTkuNzY4LDEzLjEzNSAxOS43NTgsMzYuMDc5IEMxOS41LDM1Ljk4MSAxOS4yMTQsMzUuOTI5IDE4LjkyNywzNS45MjkgQzE4LjU2MiwzNS45MjkgMTguMjIzLDM2LjAxMyAxNy45NDcsMzYuMTczIEwxMS45MzUsMzkuNjQ0IEMxMS40OTMsMzkuODk5IDExLjIzNiw0MC4zMzQgMTEuMjQ2LDQwLjgxIEwxMS4yNDcsNDAuOTYgTDUuMTY3LDQ0LjQ0NyBDNC43OTQsNDQuNjQ2IDIuNjI1LDQ1Ljk3OCAxLjg3Nyw1MC4zNDUgTDEuODcxLDUwLjM4NCBDMS44NjIsNTAuNDU0IDAuOTUxLDU3LjU1NyAwLjk2NSw3MC4yNTkgQzAuOTc5LDgyLjg3OSAxLjU2OCw4Ny4zNzUgMi4xMzcsOTEuNzI0IEwyLjEzOSw5MS43MzkgQzIuNDQ3LDk0LjA5NCA1LjYxNCw5NC42NjIgNS45NzUsOTQuNzE5IEw2LjAwOSw5NC43MjMgQzYuMTEsOTQuNzM2IDYuMjEzLDk0Ljc0MiA2LjMxNCw5NC43NDIgQzYuNzksOTQuNzQyIDcuMjYsOTQuNjEgNy43MSw5NC4zNSBMODIuOTgzLDUwLjc5OCBDODQuNzk0LDQ5LjcyNyA4NS45ODIsNDcuMzc1IDg2LjUyNSw0My44MDEgQzg3LjcxMSwzNS45ODcgODguMjU5LDEwLjcwNSA4Ni4yMjQsMy41MDIgQzg1Ljk3MSwyLjYwOSA4NS41MiwxLjk3NSA4NC44ODEsMS42MiBMODQuNzQ5LDEuNTU4IEw4Mi42NjQsMC43NjkgQzgyLjU1MSwwLjcyNSA4Mi40MzEsMC43MDQgODIuMzExLDAuNzA0IiBpZD0iRmlsbC0yIiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY2LjI2NywxMS41NjUgTDY3Ljc2MiwxMS45OTkgTDExLjQyMyw0NC4zMjUiIGlkPSJGaWxsLTMiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMjAyLDkwLjU0NSBDMTIuMDI5LDkwLjU0NSAxMS44NjIsOTAuNDU1IDExLjc2OSw5MC4yOTUgQzExLjYzMiw5MC4wNTcgMTEuNzEzLDg5Ljc1MiAxMS45NTIsODkuNjE0IEwzMC4zODksNzguOTY5IEMzMC42MjgsNzguODMxIDMwLjkzMyw3OC45MTMgMzEuMDcxLDc5LjE1MiBDMzEuMjA4LDc5LjM5IDMxLjEyNyw3OS42OTYgMzAuODg4LDc5LjgzMyBMMTIuNDUxLDkwLjQ3OCBMMTIuMjAyLDkwLjU0NSIgaWQ9IkZpbGwtNCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMy43NjQsNDIuNjU0IEwxMy42NTYsNDIuNTkyIEwxMy43MDIsNDIuNDIxIEwxOC44MzcsMzkuNDU3IEwxOS4wMDcsMzkuNTAyIEwxOC45NjIsMzkuNjczIEwxMy44MjcsNDIuNjM3IEwxMy43NjQsNDIuNjU0IiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTguNTIsOTAuMzc1IEw4LjUyLDQ2LjQyMSBMOC41ODMsNDYuMzg1IEw3NS44NCw3LjU1NCBMNzUuODQsNTEuNTA4IEw3NS43NzgsNTEuNTQ0IEw4LjUyLDkwLjM3NSBMOC41Miw5MC4zNzUgWiBNOC43Nyw0Ni41NjQgTDguNzcsODkuOTQ0IEw3NS41OTEsNTEuMzY1IEw3NS41OTEsNy45ODUgTDguNzcsNDYuNTY0IEw4Ljc3LDQ2LjU2NCBaIiBpZD0iRmlsbC02IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTI0Ljk4Niw4My4xODIgQzI0Ljc1Niw4My4zMzEgMjQuMzc0LDgzLjU2NiAyNC4xMzcsODMuNzA1IEwxMi42MzIsOTAuNDA2IEMxMi4zOTUsOTAuNTQ1IDEyLjQyNiw5MC42NTggMTIuNyw5MC42NTggTDEzLjI2NSw5MC42NTggQzEzLjU0LDkwLjY1OCAxMy45NTgsOTAuNTQ1IDE0LjE5NSw5MC40MDYgTDI1LjcsODMuNzA1IEMyNS45MzcsODMuNTY2IDI2LjEyOCw4My40NTIgMjYuMTI1LDgzLjQ0OSBDMjYuMTIyLDgzLjQ0NyAyNi4xMTksODMuMjIgMjYuMTE5LDgyLjk0NiBDMjYuMTE5LDgyLjY3MiAyNS45MzEsODIuNTY5IDI1LjcwMSw4Mi43MTkgTDI0Ljk4Niw4My4xODIiIGlkPSJGaWxsLTciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTMuMjY2LDkwLjc4MiBMMTIuNyw5MC43ODIgQzEyLjUsOTAuNzgyIDEyLjM4NCw5MC43MjYgMTIuMzU0LDkwLjYxNiBDMTIuMzI0LDkwLjUwNiAxMi4zOTcsOTAuMzk5IDEyLjU2OSw5MC4yOTkgTDI0LjA3NCw4My41OTcgQzI0LjMxLDgzLjQ1OSAyNC42ODksODMuMjI2IDI0LjkxOCw4My4wNzggTDI1LjYzMyw4Mi42MTQgQzI1LjcyMyw4Mi41NTUgMjUuODEzLDgyLjUyNSAyNS44OTksODIuNTI1IEMyNi4wNzEsODIuNTI1IDI2LjI0NCw4Mi42NTUgMjYuMjQ0LDgyLjk0NiBDMjYuMjQ0LDgzLjE2IDI2LjI0NSw4My4zMDkgMjYuMjQ3LDgzLjM4MyBMMjYuMjUzLDgzLjM4NyBMMjYuMjQ5LDgzLjQ1NiBDMjYuMjQ2LDgzLjUzMSAyNi4yNDYsODMuNTMxIDI1Ljc2Myw4My44MTIgTDE0LjI1OCw5MC41MTQgQzE0LDkwLjY2NSAxMy41NjQsOTAuNzgyIDEzLjI2Niw5MC43ODIgTDEzLjI2Niw5MC43ODIgWiBNMTIuNjY2LDkwLjUzMiBMMTIuNyw5MC41MzMgTDEzLjI2Niw5MC41MzMgQzEzLjUxOCw5MC41MzMgMTMuOTE1LDkwLjQyNSAxNC4xMzIsOTAuMjk5IEwyNS42MzcsODMuNTk3IEMyNS44MDUsODMuNDk5IDI1LjkzMSw4My40MjQgMjUuOTk4LDgzLjM4MyBDMjUuOTk0LDgzLjI5OSAyNS45OTQsODMuMTY1IDI1Ljk5NCw4Mi45NDYgTDI1Ljg5OSw4Mi43NzUgTDI1Ljc2OCw4Mi44MjQgTDI1LjA1NCw4My4yODcgQzI0LjgyMiw4My40MzcgMjQuNDM4LDgzLjY3MyAyNC4yLDgzLjgxMiBMMTIuNjk1LDkwLjUxNCBMMTIuNjY2LDkwLjUzMiBMMTIuNjY2LDkwLjUzMiBaIiBpZD0iRmlsbC04IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEzLjI2Niw4OS44NzEgTDEyLjcsODkuODcxIEMxMi41LDg5Ljg3MSAxMi4zODQsODkuODE1IDEyLjM1NCw4OS43MDUgQzEyLjMyNCw4OS41OTUgMTIuMzk3LDg5LjQ4OCAxMi41NjksODkuMzg4IEwyNC4wNzQsODIuNjg2IEMyNC4zMzIsODIuNTM1IDI0Ljc2OCw4Mi40MTggMjUuMDY3LDgyLjQxOCBMMjUuNjMyLDgyLjQxOCBDMjUuODMyLDgyLjQxOCAyNS45NDgsODIuNDc0IDI1Ljk3OCw4Mi41ODQgQzI2LjAwOCw4Mi42OTQgMjUuOTM1LDgyLjgwMSAyNS43NjMsODIuOTAxIEwxNC4yNTgsODkuNjAzIEMxNCw4OS43NTQgMTMuNTY0LDg5Ljg3MSAxMy4yNjYsODkuODcxIEwxMy4yNjYsODkuODcxIFogTTEyLjY2Niw4OS42MjEgTDEyLjcsODkuNjIyIEwxMy4yNjYsODkuNjIyIEMxMy41MTgsODkuNjIyIDEzLjkxNSw4OS41MTUgMTQuMTMyLDg5LjM4OCBMMjUuNjM3LDgyLjY4NiBMMjUuNjY3LDgyLjY2OCBMMjUuNjMyLDgyLjY2NyBMMjUuMDY3LDgyLjY2NyBDMjQuODE1LDgyLjY2NyAyNC40MTgsODIuNzc1IDI0LjIsODIuOTAxIEwxMi42OTUsODkuNjAzIEwxMi42NjYsODkuNjIxIEwxMi42NjYsODkuNjIxIFoiIGlkPSJGaWxsLTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMzcsOTAuODAxIEwxMi4zNyw4OS41NTQgTDEyLjM3LDkwLjgwMSIgaWQ9IkZpbGwtMTAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNi4xMyw5My45MDEgQzUuMzc5LDkzLjgwOCA0LjgxNiw5My4xNjQgNC42OTEsOTIuNTI1IEMzLjg2LDg4LjI4NyAzLjU0LDgzLjc0MyAzLjUyNiw3MS4xNzMgQzMuNTExLDU4LjM4OSA0LjQyMyw1MS40MjggNC40MjMsNTEuNDI4IEM1LjEzNCw0Ny4yODIgNy4yMSw0Ni4yMzYgNy4yMSw0Ni4yMzYgQzcuMjEsNDYuMjM2IDgxLjY2NywzLjI1IDgyLjA2OSwzLjAxNyBDODIuMjkyLDIuODg4IDg0LjU1NiwxLjQzMyA4NS4yNjQsMy45NCBDODcuMjE0LDEwLjg0IDg2Ljc1MiwzNS44MjcgODUuNTM5LDQzLjgxOCBDODUuMTUsNDYuMzgzIDg0LjI5MSw0OS4wMzMgODIuNDgzLDUwLjEwMSBMNy4yMSw5My42NTMgQzYuODI4LDkzLjg3NCA2LjQ2MSw5My45NDEgNi4xMyw5My45MDEgQzYuMTMsOTMuOTAxIDMuMzQ5LDkzLjQ2IDMuMTI5LDkxLjc3NiBDMi41NjgsODcuNDk1IDEuOTc3LDgyLjk5NSAxLjk2Miw3MC40MjUgQzEuOTQ4LDU3LjY0MSAyLjg2LDUwLjY4IDIuODYsNTAuNjggQzMuNTcsNDYuNTM0IDUuNjQ3LDQ1LjQ4OSA1LjY0Nyw0NS40ODkgQzUuNjQ2LDQ1LjQ4OSA4LjA2NSw0NC4wOTIgMTIuMjQ1LDQxLjY3OSBMMTMuMTE2LDQxLjU2IEwxOS43MTUsMzcuNzMgTDE5Ljc2MSwzNy4yNjkgTDYuMTMsOTMuOTAxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjMxNyw5NC4xNjEgTDYuMTAyLDk0LjE0OCBMNi4xMDEsOTQuMTQ4IEw1Ljg1Nyw5NC4xMDEgQzUuMTM4LDkzLjk0NSAzLjA4NSw5My4zNjUgMi44ODEsOTEuODA5IEMyLjMxMyw4Ny40NjkgMS43MjcsODIuOTk2IDEuNzEzLDcwLjQyNSBDMS42OTksNTcuNzcxIDIuNjA0LDUwLjcxOCAyLjYxMyw1MC42NDggQzMuMzM4LDQ2LjQxNyA1LjQ0NSw0NS4zMSA1LjUzNSw0NS4yNjYgTDEyLjE2Myw0MS40MzkgTDEzLjAzMyw0MS4zMiBMMTkuNDc5LDM3LjU3OCBMMTkuNTEzLDM3LjI0NCBDMTkuNTI2LDM3LjEwNyAxOS42NDcsMzcuMDA4IDE5Ljc4NiwzNy4wMjEgQzE5LjkyMiwzNy4wMzQgMjAuMDIzLDM3LjE1NiAyMC4wMDksMzcuMjkzIEwxOS45NSwzNy44ODIgTDEzLjE5OCw0MS44MDEgTDEyLjMyOCw0MS45MTkgTDUuNzcyLDQ1LjcwNCBDNS43NDEsNDUuNzIgMy43ODIsNDYuNzcyIDMuMTA2LDUwLjcyMiBDMy4wOTksNTAuNzgyIDIuMTk4LDU3LjgwOCAyLjIxMiw3MC40MjQgQzIuMjI2LDgyLjk2MyAyLjgwOSw4Ny40MiAzLjM3Myw5MS43MjkgQzMuNDY0LDkyLjQyIDQuMDYyLDkyLjg4MyA0LjY4Miw5My4xODEgQzQuNTY2LDkyLjk4NCA0LjQ4Niw5Mi43NzYgNC40NDYsOTIuNTcyIEMzLjY2NSw4OC41ODggMy4yOTEsODQuMzcgMy4yNzYsNzEuMTczIEMzLjI2Miw1OC41MiA0LjE2Nyw1MS40NjYgNC4xNzYsNTEuMzk2IEM0LjkwMSw0Ny4xNjUgNy4wMDgsNDYuMDU5IDcuMDk4LDQ2LjAxNCBDNy4wOTQsNDYuMDE1IDgxLjU0MiwzLjAzNCA4MS45NDQsMi44MDIgTDgxLjk3MiwyLjc4NSBDODIuODc2LDIuMjQ3IDgzLjY5MiwyLjA5NyA4NC4zMzIsMi4zNTIgQzg0Ljg4NywyLjU3MyA4NS4yODEsMy4wODUgODUuNTA0LDMuODcyIEM4Ny41MTgsMTEgODYuOTY0LDM2LjA5MSA4NS43ODUsNDMuODU1IEM4NS4yNzgsNDcuMTk2IDg0LjIxLDQ5LjM3IDgyLjYxLDUwLjMxNyBMNy4zMzUsOTMuODY5IEM2Ljk5OSw5NC4wNjMgNi42NTgsOTQuMTYxIDYuMzE3LDk0LjE2MSBMNi4zMTcsOTQuMTYxIFogTTYuMTcsOTMuNjU0IEM2LjQ2Myw5My42OSA2Ljc3NCw5My42MTcgNy4wODUsOTMuNDM3IEw4Mi4zNTgsNDkuODg2IEM4NC4xODEsNDguODA4IDg0Ljk2LDQ1Ljk3MSA4NS4yOTIsNDMuNzggQzg2LjQ2NiwzNi4wNDkgODcuMDIzLDExLjA4NSA4NS4wMjQsNC4wMDggQzg0Ljg0NiwzLjM3NyA4NC41NTEsMi45NzYgODQuMTQ4LDIuODE2IEM4My42NjQsMi42MjMgODIuOTgyLDIuNzY0IDgyLjIyNywzLjIxMyBMODIuMTkzLDMuMjM0IEM4MS43OTEsMy40NjYgNy4zMzUsNDYuNDUyIDcuMzM1LDQ2LjQ1MiBDNy4zMDQsNDYuNDY5IDUuMzQ2LDQ3LjUyMSA0LjY2OSw1MS40NzEgQzQuNjYyLDUxLjUzIDMuNzYxLDU4LjU1NiAzLjc3NSw3MS4xNzMgQzMuNzksODQuMzI4IDQuMTYxLDg4LjUyNCA0LjkzNiw5Mi40NzYgQzUuMDI2LDkyLjkzNyA1LjQxMiw5My40NTkgNS45NzMsOTMuNjE1IEM2LjA4Nyw5My42NCA2LjE1OCw5My42NTIgNi4xNjksOTMuNjU0IEw2LjE3LDkzLjY1NCBMNi4xNyw5My42NTQgWiIgaWQ9IkZpbGwtMTIiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4zMTcsNjguOTgyIEM3LjgwNiw2OC43MDEgOC4yMDIsNjguOTI2IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNi44MjksNzEuMjk0IDYuNDMzLDcxLjA2OSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIiBpZD0iRmlsbC0xMyIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjkyLDcxLjEzMyBDNi42MzEsNzEuMTMzIDYuNDMzLDcwLjkwNSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIEM3LjQ2LDY4LjkgNy41OTUsNjguODYxIDcuNzE0LDY4Ljg2MSBDOC4wMDMsNjguODYxIDguMjAyLDY5LjA5IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNy4xNzQsNzEuMDk0IDcuMDM5LDcxLjEzMyA2LjkyLDcxLjEzMyBNNy43MTQsNjguNjc0IEM3LjU1Nyw2OC42NzQgNy4zOTIsNjguNzIzIDcuMjI0LDY4LjgyMSBDNi42NzYsNjkuMTM4IDYuMjQ2LDY5Ljg3OSA2LjI0Niw3MC41MDggQzYuMjQ2LDcwLjk5NCA2LjUxNyw3MS4zMiA2LjkyLDcxLjMyIEM3LjA3OCw3MS4zMiA3LjI0Myw3MS4yNzEgNy40MTEsNzEuMTc0IEM3Ljk1OSw3MC44NTcgOC4zODksNzAuMTE3IDguMzg5LDY5LjQ4NyBDOC4zODksNjkuMDAxIDguMTE3LDY4LjY3NCA3LjcxNCw2OC42NzQiIGlkPSJGaWxsLTE0IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYuOTIsNzAuOTQ3IEM2LjY0OSw3MC45NDcgNi42MjEsNzAuNjQgNi42MjEsNzAuNTA4IEM2LjYyMSw3MC4wMTcgNi45ODIsNjkuMzkyIDcuNDExLDY5LjE0NSBDNy41MjEsNjkuMDgyIDcuNjI1LDY5LjA0OSA3LjcxNCw2OS4wNDkgQzcuOTg2LDY5LjA0OSA4LjAxNSw2OS4zNTUgOC4wMTUsNjkuNDg3IEM4LjAxNSw2OS45NzggNy42NTIsNzAuNjAzIDcuMjI0LDcwLjg1MSBDNy4xMTUsNzAuOTE0IDcuMDEsNzAuOTQ3IDYuOTIsNzAuOTQ3IE03LjcxNCw2OC44NjEgQzcuNTk1LDY4Ljg2MSA3LjQ2LDY4LjkgNy4zMTcsNjguOTgyIEM2LjgyOSw2OS4yNjUgNi40MzMsNjkuOTQ4IDYuNDMzLDcwLjUwOCBDNi40MzMsNzAuOTA1IDYuNjMxLDcxLjEzMyA2LjkyLDcxLjEzMyBDNy4wMzksNzEuMTMzIDcuMTc0LDcxLjA5NCA3LjMxNyw3MS4wMTIgQzcuODA2LDcwLjczIDguMjAyLDcwLjA0NyA4LjIwMiw2OS40ODcgQzguMjAyLDY5LjA5IDguMDAzLDY4Ljg2MSA3LjcxNCw2OC44NjEiIGlkPSJGaWxsLTE1IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTcuNDQ0LDg1LjM1IEM3LjcwOCw4NS4xOTggNy45MjEsODUuMzE5IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuOTI1IDcuNzA4LDg2LjI5MiA3LjQ0NCw4Ni40NDQgQzcuMTgxLDg2LjU5NyA2Ljk2Nyw4Ni40NzUgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IiBpZD0iRmlsbC0xNiIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik03LjIzLDg2LjUxIEM3LjA3NCw4Ni41MSA2Ljk2Nyw4Ni4zODcgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IEM3LjUyMSw4NS4zMDUgNy41OTQsODUuMjg0IDcuNjU4LDg1LjI4NCBDNy44MTQsODUuMjg0IDcuOTIxLDg1LjQwOCA3LjkyMSw4NS42MjIgQzcuOTIxLDg1LjkyNSA3LjcwOCw4Ni4yOTIgNy40NDQsODYuNDQ0IEM3LjM2Nyw4Ni40ODkgNy4yOTQsODYuNTEgNy4yMyw4Ni41MSBNNy42NTgsODUuMDk4IEM3LjU1OCw4NS4wOTggNy40NTUsODUuMTI3IDcuMzUxLDg1LjE4OCBDNy4wMzEsODUuMzczIDYuNzgxLDg1LjgwNiA2Ljc4MSw4Ni4xNzMgQzYuNzgxLDg2LjQ4MiA2Ljk2Niw4Ni42OTcgNy4yMyw4Ni42OTcgQzcuMzMsODYuNjk3IDcuNDMzLDg2LjY2NiA3LjUzOCw4Ni42MDcgQzcuODU4LDg2LjQyMiA4LjEwOCw4NS45ODkgOC4xMDgsODUuNjIyIEM4LjEwOCw4NS4zMTMgNy45MjMsODUuMDk4IDcuNjU4LDg1LjA5OCIgaWQ9IkZpbGwtMTciIGZpbGw9IiM4MDk3QTIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4yMyw4Ni4zMjIgTDcuMTU0LDg2LjE3MyBDNy4xNTQsODUuOTM4IDcuMzMzLDg1LjYyOSA3LjUzOCw4NS41MTIgTDcuNjU4LDg1LjQ3MSBMNy43MzQsODUuNjIyIEM3LjczNCw4NS44NTYgNy41NTUsODYuMTY0IDcuMzUxLDg2LjI4MiBMNy4yMyw4Ni4zMjIgTTcuNjU4LDg1LjI4NCBDNy41OTQsODUuMjg0IDcuNTIxLDg1LjMwNSA3LjQ0NCw4NS4zNSBDNy4xODEsODUuNTAyIDYuOTY3LDg1Ljg3MSA2Ljk2Nyw4Ni4xNzMgQzYuOTY3LDg2LjM4NyA3LjA3NCw4Ni41MSA3LjIzLDg2LjUxIEM3LjI5NCw4Ni41MSA3LjM2Nyw4Ni40ODkgNy40NDQsODYuNDQ0IEM3LjcwOCw4Ni4yOTIgNy45MjEsODUuOTI1IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuNDA4IDcuODE0LDg1LjI4NCA3LjY1OCw4NS4yODQiIGlkPSJGaWxsLTE4IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTc3LjI3OCw3Ljc2OSBMNzcuMjc4LDUxLjQzNiBMMTAuMjA4LDkwLjE2IEwxMC4yMDgsNDYuNDkzIEw3Ny4yNzgsNy43NjkiIGlkPSJGaWxsLTE5IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEwLjA4Myw5MC4zNzUgTDEwLjA4Myw0Ni40MjEgTDEwLjE0Niw0Ni4zODUgTDc3LjQwMyw3LjU1NCBMNzcuNDAzLDUxLjUwOCBMNzcuMzQxLDUxLjU0NCBMMTAuMDgzLDkwLjM3NSBMMTAuMDgzLDkwLjM3NSBaIE0xMC4zMzMsNDYuNTY0IEwxMC4zMzMsODkuOTQ0IEw3Ny4xNTQsNTEuMzY1IEw3Ny4xNTQsNy45ODUgTDEwLjMzMyw0Ni41NjQgTDEwLjMzMyw0Ni41NjQgWiIgaWQ9IkZpbGwtMjAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMjUuNzM3LDg4LjY0NyBMMTE4LjA5OCw5MS45ODEgTDExOC4wOTgsODQgTDEwNi42MzksODguNzEzIEwxMDYuNjM5LDk2Ljk4MiBMOTksMTAwLjMxNSBMMTEyLjM2OSwxMDMuOTYxIEwxMjUuNzM3LDg4LjY0NyIgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTIiIGZpbGw9IiM0NTVBNjQiIHNrZXRjaDp0eXBlPSJNU1NoYXBlR3JvdXAiPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+');
};

module.exports = RotateInstructions;

},{"./util.js":23}],18:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * TODO: Fix up all "new THREE" instantiations to improve performance.
 */
var SensorSample = _dereq_('./sensor-sample.js');
var MathUtil = _dereq_('../math-util.js');
var Util = _dereq_('../util.js');

var DEBUG = false;

/**
 * An implementation of a simple complementary filter, which fuses gyroscope and
 * accelerometer data from the 'devicemotion' event.
 *
 * Accelerometer data is very noisy, but stable over the long term.
 * Gyroscope data is smooth, but tends to drift over the long term.
 *
 * This fusion is relatively simple:
 * 1. Get orientation estimates from accelerometer by applying a low-pass filter
 *    on that data.
 * 2. Get orientation estimates from gyroscope by integrating over time.
 * 3. Combine the two estimates, weighing (1) in the long term, but (2) for the
 *    short term.
 */
function ComplementaryFilter(kFilter) {
  this.kFilter = kFilter;

  // Raw sensor measurements.
  this.currentAccelMeasurement = new SensorSample();
  this.currentGyroMeasurement = new SensorSample();
  this.previousGyroMeasurement = new SensorSample();

  // Current filter orientation
  this.filterQ = new MathUtil.Quaternion();
  this.previousFilterQ = new MathUtil.Quaternion();

  // Orientation based on the accelerometer.
  this.accelQ = new MathUtil.Quaternion();
  // Whether or not the orientation has been initialized.
  this.isOrientationInitialized = false;
  // Running estimate of gravity based on the current orientation.
  this.estimatedGravity = new MathUtil.Vector3();
  // Measured gravity based on accelerometer.
  this.measuredGravity = new MathUtil.Vector3();

  // Debug only quaternion of gyro-based orientation.
  this.gyroIntegralQ = new MathUtil.Quaternion();
}

ComplementaryFilter.prototype.addAccelMeasurement = function(vector, timestampS) {
  this.currentAccelMeasurement.set(vector, timestampS);
};

ComplementaryFilter.prototype.addGyroMeasurement = function(vector, timestampS) {
  this.currentGyroMeasurement.set(vector, timestampS);

  var deltaT = timestampS - this.previousGyroMeasurement.timestampS;
  if (Util.isTimestampDeltaValid(deltaT)) {
    this.run_();
  }

  this.previousGyroMeasurement.copy(this.currentGyroMeasurement);
};

ComplementaryFilter.prototype.run_ = function() {

  if (!this.isOrientationInitialized) {
    this.accelQ = this.accelToQuaternion_(this.currentAccelMeasurement.sample);
    this.previousFilterQ.copy(this.accelQ);
    this.isOrientationInitialized = true;
    return;
  }

  var deltaT = this.currentGyroMeasurement.timestampS -
      this.previousGyroMeasurement.timestampS;

  // Convert gyro rotation vector to a quaternion delta.
  var gyroDeltaQ = this.gyroToQuaternionDelta_(this.currentGyroMeasurement.sample, deltaT);
  this.gyroIntegralQ.multiply(gyroDeltaQ);

  // filter_1 = K * (filter_0 + gyro * dT) + (1 - K) * accel.
  this.filterQ.copy(this.previousFilterQ);
  this.filterQ.multiply(gyroDeltaQ);

  // Calculate the delta between the current estimated gravity and the real
  // gravity vector from accelerometer.
  var invFilterQ = new MathUtil.Quaternion();
  invFilterQ.copy(this.filterQ);
  invFilterQ.inverse();

  this.estimatedGravity.set(0, 0, -1);
  this.estimatedGravity.applyQuaternion(invFilterQ);
  this.estimatedGravity.normalize();

  this.measuredGravity.copy(this.currentAccelMeasurement.sample);
  this.measuredGravity.normalize();

  // Compare estimated gravity with measured gravity, get the delta quaternion
  // between the two.
  var deltaQ = new MathUtil.Quaternion();
  deltaQ.setFromUnitVectors(this.estimatedGravity, this.measuredGravity);
  deltaQ.inverse();

  if (DEBUG) {
    console.log('Delta: %d deg, G_est: (%s, %s, %s), G_meas: (%s, %s, %s)',
                MathUtil.radToDeg * Util.getQuaternionAngle(deltaQ),
                (this.estimatedGravity.x).toFixed(1),
                (this.estimatedGravity.y).toFixed(1),
                (this.estimatedGravity.z).toFixed(1),
                (this.measuredGravity.x).toFixed(1),
                (this.measuredGravity.y).toFixed(1),
                (this.measuredGravity.z).toFixed(1));
  }

  // Calculate the SLERP target: current orientation plus the measured-estimated
  // quaternion delta.
  var targetQ = new MathUtil.Quaternion();
  targetQ.copy(this.filterQ);
  targetQ.multiply(deltaQ);

  // SLERP factor: 0 is pure gyro, 1 is pure accel.
  this.filterQ.slerp(targetQ, 1 - this.kFilter);

  this.previousFilterQ.copy(this.filterQ);
};

ComplementaryFilter.prototype.getOrientation = function() {
  return this.filterQ;
};

ComplementaryFilter.prototype.accelToQuaternion_ = function(accel) {
  var normAccel = new MathUtil.Vector3();
  normAccel.copy(accel);
  normAccel.normalize();
  var quat = new MathUtil.Quaternion();
  quat.setFromUnitVectors(new MathUtil.Vector3(0, 0, -1), normAccel);
  quat.inverse();
  return quat;
};

ComplementaryFilter.prototype.gyroToQuaternionDelta_ = function(gyro, dt) {
  // Extract axis and angle from the gyroscope data.
  var quat = new MathUtil.Quaternion();
  var axis = new MathUtil.Vector3();
  axis.copy(gyro);
  axis.normalize();
  quat.setFromAxisAngle(axis, gyro.length() * dt);
  return quat;
};


module.exports = ComplementaryFilter;

},{"../math-util.js":15,"../util.js":23,"./sensor-sample.js":21}],19:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var ComplementaryFilter = _dereq_('./complementary-filter.js');
var PosePredictor = _dereq_('./pose-predictor.js');
var TouchPanner = _dereq_('../touch-panner.js');
var MathUtil = _dereq_('../math-util.js');
var Util = _dereq_('../util.js');

/**
 * The pose sensor, implemented using DeviceMotion APIs.
 */
function FusionPoseSensor() {
  this.deviceId = 'webvr-polyfill:fused';
  this.deviceName = 'VR Position Device (webvr-polyfill:fused)';

  this.accelerometer = new MathUtil.Vector3();
  this.gyroscope = new MathUtil.Vector3();

  window.addEventListener('devicemotion', this.onDeviceMotionChange_.bind(this));
  window.addEventListener('orientationchange', this.onScreenOrientationChange_.bind(this));

  this.filter = new ComplementaryFilter(WebVRConfig.K_FILTER);
  this.posePredictor = new PosePredictor(WebVRConfig.PREDICTION_TIME_S);
  this.touchPanner = new TouchPanner();

  this.filterToWorldQ = new MathUtil.Quaternion();

  // Set the filter to world transform, depending on OS.
  if (Util.isIOS()) {
    this.filterToWorldQ.setFromAxisAngle(new MathUtil.Vector3(1, 0, 0), Math.PI/2);
  } else {
    this.filterToWorldQ.setFromAxisAngle(new MathUtil.Vector3(1, 0, 0), -Math.PI/2);
  }

  this.landscapeAdjustQ = new MathUtil.Quaternion();
  this.landscapeAdjustQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1),
      (window.orientation / Math.PI) / 2);

  // Adjust this filter for being in landscape mode.
  if (Util.isLandscapeMode()) {
    this.filterToWorldQ.multiply(this.landscapeAdjustQ);
  }
  this.worldToScreenQ = new MathUtil.Quaternion();

  this.setScreenTransform_();

  // Keep track of a reset transform for resetSensor.
  this.resetQ = new MathUtil.Quaternion();

  this.isFirefoxAndroid = Util.isFirefoxAndroid();
  this.isIOS = Util.isIOS();

  this.orientationOut_ = new Float32Array(4);
}

FusionPoseSensor.prototype.getPosition = function() {
  // This PoseSensor doesn't support position
  return null;
};

FusionPoseSensor.prototype.getOrientation = function() {
  // Convert from filter space to the the same system used by the
  // deviceorientation event.
  var orientation = this.filter.getOrientation();

  // Predict orientation.
  this.predictedQ = this.posePredictor.getPrediction(orientation, this.gyroscope, this.previousTimestampS);

  // Convert to THREE coordinate system: -Z forward, Y up, X right.
  var out = new MathUtil.Quaternion();
  out.copy(this.filterToWorldQ);
  out.multiply(this.resetQ);
  if (!WebVRConfig.TOUCH_PANNER_DISABLED) {
    out.multiply(this.touchPanner.getOrientation());
  }
  out.multiply(this.predictedQ);
  out.multiply(this.worldToScreenQ);

  // Handle the yaw-only case.
  if (WebVRConfig.YAW_ONLY) {
    // Make a quaternion that only turns around the Y-axis.
    out.x = 0;
    out.z = 0;
    out.normalize();
  }

  this.orientationOut_[0] = out.x;
  this.orientationOut_[1] = out.y;
  this.orientationOut_[2] = out.z;
  this.orientationOut_[3] = out.w;
  return this.orientationOut_;
};

FusionPoseSensor.prototype.resetPose = function() {
  if (!Util.isLandscapeMode()) {
    this.resetQ.multiply(this.landscapeAdjustQ);
  }

  // Reduce to inverted yaw-only.
  this.resetQ.copy(this.filter.getOrientation());
  this.resetQ.x = 0;
  this.resetQ.y = 0;
  this.resetQ.z *= -1;
  this.resetQ.normalize();

  if (!WebVRConfig.TOUCH_PANNER_DISABLED) {
    this.touchPanner.resetSensor();
  }
};

FusionPoseSensor.prototype.onDeviceMotionChange_ = function(deviceMotion) {
  var accGravity = deviceMotion.accelerationIncludingGravity;
  var rotRate = deviceMotion.rotationRate;
  var timestampS = deviceMotion.timeStamp / 1000;

  // Firefox Android timeStamp returns one thousandth of a millisecond.
  if (this.isFirefoxAndroid) {
    timestampS /= 1000;
  }

  var deltaS = timestampS - this.previousTimestampS;
  if (deltaS <= Util.MIN_TIMESTEP || deltaS > Util.MAX_TIMESTEP) {
    console.warn('Invalid timestamps detected. Time step between successive ' +
                 'gyroscope sensor samples is very small or not monotonic');
    this.previousTimestampS = timestampS;
    return;
  }
  this.accelerometer.set(-accGravity.x, -accGravity.y, -accGravity.z);
  this.gyroscope.set(rotRate.alpha, rotRate.beta, rotRate.gamma);

  // With iOS and Firefox Android, rotationRate is reported in degrees,
  // so we first convert to radians.
  if (this.isIOS || this.isFirefoxAndroid) {
    this.gyroscope.multiplyScalar(Math.PI / 180);
  }

  this.filter.addAccelMeasurement(this.accelerometer, timestampS);
  this.filter.addGyroMeasurement(this.gyroscope, timestampS);

  this.previousTimestampS = timestampS;
};

FusionPoseSensor.prototype.onScreenOrientationChange_ =
    function(screenOrientation) {
  this.setScreenTransform_();
};

FusionPoseSensor.prototype.setScreenTransform_ = function() {
  this.worldToScreenQ.set(0, 0, 0, 1);
  switch (window.orientation) {
    case 0:
      break;
    case 90:
      this.worldToScreenQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1), -Math.PI/2);
      break;
    case -90:
      this.worldToScreenQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1), Math.PI/2);
      break;
    case 180:
      // TODO.
      break;
  }
};


module.exports = FusionPoseSensor;

},{"../math-util.js":15,"../touch-panner.js":22,"../util.js":23,"./complementary-filter.js":18,"./pose-predictor.js":20}],20:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MathUtil = _dereq_('../math-util.js');
var DEBUG = false;

/**
 * Given an orientation and the gyroscope data, predicts the future orientation
 * of the head. This makes rendering appear faster.
 *
 * Also see: http://msl.cs.uiuc.edu/~lavalle/papers/LavYerKatAnt14.pdf
 *
 * @param {Number} predictionTimeS time from head movement to the appearance of
 * the corresponding image.
 */
function PosePredictor(predictionTimeS) {
  this.predictionTimeS = predictionTimeS;

  // The quaternion corresponding to the previous state.
  this.previousQ = new MathUtil.Quaternion();
  // Previous time a prediction occurred.
  this.previousTimestampS = null;

  // The delta quaternion that adjusts the current pose.
  this.deltaQ = new MathUtil.Quaternion();
  // The output quaternion.
  this.outQ = new MathUtil.Quaternion();
}

PosePredictor.prototype.getPrediction = function(currentQ, gyro, timestampS) {
  if (!this.previousTimestampS) {
    this.previousQ.copy(currentQ);
    this.previousTimestampS = timestampS;
    return currentQ;
  }

  // Calculate axis and angle based on gyroscope rotation rate data.
  var axis = new MathUtil.Vector3();
  axis.copy(gyro);
  axis.normalize();

  var angularSpeed = gyro.length();

  // If we're rotating slowly, don't do prediction.
  if (angularSpeed < MathUtil.degToRad * 20) {
    if (DEBUG) {
      console.log('Moving slowly, at %s deg/s: no prediction',
                  (MathUtil.radToDeg * angularSpeed).toFixed(1));
    }
    this.outQ.copy(currentQ);
    this.previousQ.copy(currentQ);
    return this.outQ;
  }

  // Get the predicted angle based on the time delta and latency.
  var deltaT = timestampS - this.previousTimestampS;
  var predictAngle = angularSpeed * this.predictionTimeS;

  this.deltaQ.setFromAxisAngle(axis, predictAngle);
  this.outQ.copy(this.previousQ);
  this.outQ.multiply(this.deltaQ);

  this.previousQ.copy(currentQ);

  return this.outQ;
};


module.exports = PosePredictor;

},{"../math-util.js":15}],21:[function(_dereq_,module,exports){
function SensorSample(sample, timestampS) {
  this.set(sample, timestampS);
};

SensorSample.prototype.set = function(sample, timestampS) {
  this.sample = sample;
  this.timestampS = timestampS;
};

SensorSample.prototype.copy = function(sensorSample) {
  this.set(sensorSample.sample, sensorSample.timestampS);
};

module.exports = SensorSample;

},{}],22:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MathUtil = _dereq_('./math-util.js');
var Util = _dereq_('./util.js');

var ROTATE_SPEED = 0.5;
/**
 * Provides a quaternion responsible for pre-panning the scene before further
 * transformations due to device sensors.
 */
function TouchPanner() {
  window.addEventListener('touchstart', this.onTouchStart_.bind(this));
  window.addEventListener('touchmove', this.onTouchMove_.bind(this));
  window.addEventListener('touchend', this.onTouchEnd_.bind(this));

  this.isTouching = false;
  this.rotateStart = new MathUtil.Vector2();
  this.rotateEnd = new MathUtil.Vector2();
  this.rotateDelta = new MathUtil.Vector2();

  this.theta = 0;
  this.orientation = new MathUtil.Quaternion();
}

TouchPanner.prototype.getOrientation = function() {
  this.orientation.setFromEulerXYZ(0, 0, this.theta);
  return this.orientation;
};

TouchPanner.prototype.resetSensor = function() {
  this.theta = 0;
};

TouchPanner.prototype.onTouchStart_ = function(e) {
  // Only respond if there is exactly one touch.
  if (e.touches.length != 1) {
    return;
  }
  this.rotateStart.set(e.touches[0].pageX, e.touches[0].pageY);
  this.isTouching = true;
};

TouchPanner.prototype.onTouchMove_ = function(e) {
  if (!this.isTouching) {
    return;
  }
  this.rotateEnd.set(e.touches[0].pageX, e.touches[0].pageY);
  this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
  this.rotateStart.copy(this.rotateEnd);

  // On iOS, direction is inverted.
  if (Util.isIOS()) {
    this.rotateDelta.x *= -1;
  }

  var element = document.body;
  this.theta += 2 * Math.PI * this.rotateDelta.x / element.clientWidth * ROTATE_SPEED;
};

TouchPanner.prototype.onTouchEnd_ = function(e) {
  this.isTouching = false;
};

module.exports = TouchPanner;

},{"./math-util.js":15,"./util.js":23}],23:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var objectAssign = _dereq_('object-assign');

var Util = window.Util || {};

Util.MIN_TIMESTEP = 0.001;
Util.MAX_TIMESTEP = 1;

Util.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Util.clamp = function(value, min, max) {
  return Math.min(Math.max(min, value), max);
};

Util.lerp = function(a, b, t) {
  return a + ((b - a) * t);
};

Util.isIOS = (function() {
  var isIOS = /iPad|iPhone|iPod/.test(navigator.platform);
  return function() {
    return isIOS;
  };
})();

Util.isSafari = (function() {
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return function() {
    return isSafari;
  };
})();

Util.isFirefoxAndroid = (function() {
  var isFirefoxAndroid = navigator.userAgent.indexOf('Firefox') !== -1 &&
      navigator.userAgent.indexOf('Android') !== -1;
  return function() {
    return isFirefoxAndroid;
  };
})();

Util.isLandscapeMode = function() {
  return (window.orientation == 90 || window.orientation == -90);
};

// Helper method to validate the time steps of sensor timestamps.
Util.isTimestampDeltaValid = function(timestampDeltaS) {
  if (isNaN(timestampDeltaS)) {
    return false;
  }
  if (timestampDeltaS <= Util.MIN_TIMESTEP) {
    return false;
  }
  if (timestampDeltaS > Util.MAX_TIMESTEP) {
    return false;
  }
  return true;
};

Util.getScreenWidth = function() {
  return Math.max(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.getScreenHeight = function() {
  return Math.min(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.requestFullscreen = function(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else {
    return false;
  }

  return true;
};

Util.exitFullscreen = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  } else {
    return false;
  }

  return true;
};

Util.getFullscreenElement = function() {
  return document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;
};

Util.linkProgram = function(gl, vertexSource, fragmentSource, attribLocationMap) {
  // No error checking for brevity.
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(fragmentShader);

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  for (var attribName in attribLocationMap)
    gl.bindAttribLocation(program, attribLocationMap[attribName], attribName);

  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
};

Util.getProgramUniforms = function(gl, program) {
  var uniforms = {};
  var uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  var uniformName = '';
  for (var i = 0; i < uniformCount; i++) {
    var uniformInfo = gl.getActiveUniform(program, i);
    uniformName = uniformInfo.name.replace('[0]', '');
    uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
  }
  return uniforms;
};

Util.orthoMatrix = function (out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right),
      bt = 1 / (bottom - top),
      nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.extend = objectAssign;

module.exports = Util;

},{"object-assign":2}],24:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Emitter = _dereq_('./emitter.js');
var Util = _dereq_('./util.js');
var DeviceInfo = _dereq_('./device-info.js');

var DEFAULT_VIEWER = 'CardboardV1';
var VIEWER_KEY = 'WEBVR_CARDBOARD_VIEWER';
var CLASS_NAME = 'webvr-polyfill-viewer-selector';

/**
 * Creates a viewer selector with the options specified. Supports being shown
 * and hidden. Generates events when viewer parameters change. Also supports
 * saving the currently selected index in localStorage.
 */
function ViewerSelector() {
  // Try to load the selected key from local storage. If none exists, use the
  // default key.
  try {
    this.selectedKey = localStorage.getItem(VIEWER_KEY) || DEFAULT_VIEWER;
  } catch (error) {
    console.error('Failed to load viewer profile: %s', error);
  }
  this.dialog = this.createDialog_(DeviceInfo.Viewers);
  this.root = null;
}
ViewerSelector.prototype = new Emitter();

ViewerSelector.prototype.show = function(root) {
  this.root = root;

  root.appendChild(this.dialog);
  //console.log('ViewerSelector.show');

  // Ensure the currently selected item is checked.
  var selected = this.dialog.querySelector('#' + this.selectedKey);
  selected.checked = true;

  // Show the UI.
  this.dialog.style.display = 'block';
};

ViewerSelector.prototype.hide = function() {
  if (this.root && this.root.contains(this.dialog)) {
    this.root.removeChild(this.dialog);
  }
  //console.log('ViewerSelector.hide');
  this.dialog.style.display = 'none';
};

ViewerSelector.prototype.getCurrentViewer = function() {
  return DeviceInfo.Viewers[this.selectedKey];
};

ViewerSelector.prototype.getSelectedKey_ = function() {
  var input = this.dialog.querySelector('input[name=field]:checked');
  if (input) {
    return input.id;
  }
  return null;
};

ViewerSelector.prototype.onSave_ = function() {
  this.selectedKey = this.getSelectedKey_();
  if (!this.selectedKey || !DeviceInfo.Viewers[this.selectedKey]) {
    console.error('ViewerSelector.onSave_: this should never happen!');
    return;
  }

  this.emit('change', DeviceInfo.Viewers[this.selectedKey]);

  // Attempt to save the viewer profile, but fails in private mode.
  try {
    localStorage.setItem(VIEWER_KEY, this.selectedKey);
  } catch(error) {
    console.error('Failed to save viewer profile: %s', error);
  }
  this.hide();
};

/**
 * Creates the dialog.
 */
ViewerSelector.prototype.createDialog_ = function(options) {
  var container = document.createElement('div');
  container.classList.add(CLASS_NAME);
  container.style.display = 'none';
  // Create an overlay that dims the background, and which goes away when you
  // tap it.
  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.left = 0;
  s.top = 0;
  s.width = '100%';
  s.height = '100%';
  s.background = 'rgba(0, 0, 0, 0.3)';
  overlay.addEventListener('click', this.hide.bind(this));

  var width = 280;
  var dialog = document.createElement('div');
  var s = dialog.style;
  s.boxSizing = 'border-box';
  s.position = 'fixed';
  s.top = '24px';
  s.left = '50%';
  s.marginLeft = (-width/2) + 'px';
  s.width = width + 'px';
  s.padding = '24px';
  s.overflow = 'hidden';
  s.background = '#fafafa';
  s.fontFamily = "'Roboto', sans-serif";
  s.boxShadow = '0px 5px 20px #666';

  dialog.appendChild(this.createH1_('Select your viewer'));
  for (var id in options) {
    dialog.appendChild(this.createChoice_(id, options[id].label));
  }
  dialog.appendChild(this.createButton_('Save', this.onSave_.bind(this)));

  container.appendChild(overlay);
  container.appendChild(dialog);

  return container;
};

ViewerSelector.prototype.createH1_ = function(name) {
  var h1 = document.createElement('h1');
  var s = h1.style;
  s.color = 'black';
  s.fontSize = '20px';
  s.fontWeight = 'bold';
  s.marginTop = 0;
  s.marginBottom = '24px';
  h1.innerHTML = name;
  return h1;
};

ViewerSelector.prototype.createChoice_ = function(id, name) {
  /*
  <div class="choice">
  <input id="v1" type="radio" name="field" value="v1">
  <label for="v1">Cardboard V1</label>
  </div>
  */
  var div = document.createElement('div');
  div.style.marginTop = '8px';
  div.style.color = 'black';

  var input = document.createElement('input');
  input.style.fontSize = '30px';
  input.setAttribute('id', id);
  input.setAttribute('type', 'radio');
  input.setAttribute('value', id);
  input.setAttribute('name', 'field');

  var label = document.createElement('label');
  label.style.marginLeft = '4px';
  label.setAttribute('for', id);
  label.innerHTML = name;

  div.appendChild(input);
  div.appendChild(label);

  return div;
};

ViewerSelector.prototype.createButton_ = function(label, onclick) {
  var button = document.createElement('button');
  button.innerHTML = label;
  var s = button.style;
  s.float = 'right';
  s.textTransform = 'uppercase';
  s.color = '#1094f7';
  s.fontSize = '14px';
  s.letterSpacing = 0;
  s.border = 0;
  s.background = 'none';
  s.marginTop = '16px';

  button.addEventListener('click', onclick);

  return button;
};

module.exports = ViewerSelector;

},{"./device-info.js":8,"./emitter.js":13,"./util.js":23}],25:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');

/**
 * Android and iOS compatible wakelock implementation.
 *
 * Refactored thanks to dkovalev@.
 */
function AndroidWakeLock() {
  var video = document.createElement('video');

  video.addEventListener('ended', function() {
    video.play();
  });

  this.request = function() {
    if (video.paused) {
      // Base64 version of videos_src/no-sleep-120s.mp4.
      video.src = Util.base64('video/mp4', 'AAAAGGZ0eXBpc29tAAAAAG1wNDFhdmMxAAAIA21vb3YAAABsbXZoZAAAAADSa9v60mvb+gABX5AAlw/gAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAdkdHJhawAAAFx0a2hkAAAAAdJr2/rSa9v6AAAAAQAAAAAAlw/gAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAQAAAAHAAAAAAAJGVkdHMAAAAcZWxzdAAAAAAAAAABAJcP4AAAAAAAAQAAAAAG3G1kaWEAAAAgbWRoZAAAAADSa9v60mvb+gAPQkAGjneAFccAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAABodtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAZHc3RibAAAAJdzdHNkAAAAAAAAAAEAAACHYXZjMQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAMABwASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAADFhdmNDAWQAC//hABlnZAALrNlfllw4QAAAAwBAAAADAKPFCmWAAQAFaOvssiwAAAAYc3R0cwAAAAAAAAABAAAAbgAPQkAAAAAUc3RzcwAAAAAAAAABAAAAAQAAA4BjdHRzAAAAAAAAAG4AAAABAD0JAAAAAAEAehIAAAAAAQA9CQAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEALcbAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAABuAAAAAQAAAcxzdHN6AAAAAAAAAAAAAABuAAADCQAAABgAAAAOAAAADgAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABMAAAAUc3RjbwAAAAAAAAABAAAIKwAAACt1ZHRhAAAAI6llbmMAFwAAdmxjIDIuMi4xIHN0cmVhbSBvdXRwdXQAAAAId2lkZQAACRRtZGF0AAACrgX//6vcRem95tlIt5Ys2CDZI+7veDI2NCAtIGNvcmUgMTQyIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDEzIG1lPWhleCBzdWJtZT03IHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0xIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MTIgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTEgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1hYnIgbWJ0cmVlPTEgYml0cmF0ZT0xMDAgcmF0ZXRvbD0xLjAgcWNvbXA9MC42MCBxcG1pbj0xMCBxcG1heD01MSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAU2WIhAAQ/8ltlOe+cTZuGkKg+aRtuivcDZ0pBsfsEi9p/i1yU9DxS2lq4dXTinViF1URBKXgnzKBd/Uh1bkhHtMrwrRcOJslD01UB+fyaL6ef+DBAAAAFEGaJGxBD5B+v+a+4QqF3MgBXz9MAAAACkGeQniH/+94r6EAAAAKAZ5hdEN/8QytwAAAAAgBnmNqQ3/EgQAAAA5BmmhJqEFomUwIIf/+4QAAAApBnoZFESw//76BAAAACAGepXRDf8SBAAAACAGep2pDf8SAAAAADkGarEmoQWyZTAgh//7gAAAACkGeykUVLD//voEAAAAIAZ7pdEN/xIAAAAAIAZ7rakN/xIAAAAAOQZrwSahBbJlMCCH//uEAAAAKQZ8ORRUsP/++gQAAAAgBny10Q3/EgQAAAAgBny9qQ3/EgAAAAA5BmzRJqEFsmUwIIf/+4AAAAApBn1JFFSw//76BAAAACAGfcXRDf8SAAAAACAGfc2pDf8SAAAAADkGbeEmoQWyZTAgh//7hAAAACkGflkUVLD//voAAAAAIAZ+1dEN/xIEAAAAIAZ+3akN/xIEAAAAOQZu8SahBbJlMCCH//uAAAAAKQZ/aRRUsP/++gQAAAAgBn/l0Q3/EgAAAAAgBn/tqQ3/EgQAAAA5Bm+BJqEFsmUwIIf/+4QAAAApBnh5FFSw//76AAAAACAGePXRDf8SAAAAACAGeP2pDf8SBAAAADkGaJEmoQWyZTAgh//7gAAAACkGeQkUVLD//voEAAAAIAZ5hdEN/xIAAAAAIAZ5jakN/xIEAAAAOQZpoSahBbJlMCCH//uEAAAAKQZ6GRRUsP/++gQAAAAgBnqV0Q3/EgQAAAAgBnqdqQ3/EgAAAAA5BmqxJqEFsmUwIIf/+4AAAAApBnspFFSw//76BAAAACAGe6XRDf8SAAAAACAGe62pDf8SAAAAADkGa8EmoQWyZTAgh//7hAAAACkGfDkUVLD//voEAAAAIAZ8tdEN/xIEAAAAIAZ8vakN/xIAAAAAOQZs0SahBbJlMCCH//uAAAAAKQZ9SRRUsP/++gQAAAAgBn3F0Q3/EgAAAAAgBn3NqQ3/EgAAAAA5Bm3hJqEFsmUwIIf/+4QAAAApBn5ZFFSw//76AAAAACAGftXRDf8SBAAAACAGft2pDf8SBAAAADkGbvEmoQWyZTAgh//7gAAAACkGf2kUVLD//voEAAAAIAZ/5dEN/xIAAAAAIAZ/7akN/xIEAAAAOQZvgSahBbJlMCCH//uEAAAAKQZ4eRRUsP/++gAAAAAgBnj10Q3/EgAAAAAgBnj9qQ3/EgQAAAA5BmiRJqEFsmUwIIf/+4AAAAApBnkJFFSw//76BAAAACAGeYXRDf8SAAAAACAGeY2pDf8SBAAAADkGaaEmoQWyZTAgh//7hAAAACkGehkUVLD//voEAAAAIAZ6ldEN/xIEAAAAIAZ6nakN/xIAAAAAOQZqsSahBbJlMCCH//uAAAAAKQZ7KRRUsP/++gQAAAAgBnul0Q3/EgAAAAAgBnutqQ3/EgAAAAA5BmvBJqEFsmUwIIf/+4QAAAApBnw5FFSw//76BAAAACAGfLXRDf8SBAAAACAGfL2pDf8SAAAAADkGbNEmoQWyZTAgh//7gAAAACkGfUkUVLD//voEAAAAIAZ9xdEN/xIAAAAAIAZ9zakN/xIAAAAAOQZt4SahBbJlMCCH//uEAAAAKQZ+WRRUsP/++gAAAAAgBn7V0Q3/EgQAAAAgBn7dqQ3/EgQAAAA5Bm7xJqEFsmUwIIf/+4AAAAApBn9pFFSw//76BAAAACAGf+XRDf8SAAAAACAGf+2pDf8SBAAAADkGb4EmoQWyZTAgh//7hAAAACkGeHkUVLD//voAAAAAIAZ49dEN/xIAAAAAIAZ4/akN/xIEAAAAOQZokSahBbJlMCCH//uAAAAAKQZ5CRRUsP/++gQAAAAgBnmF0Q3/EgAAAAAgBnmNqQ3/EgQAAAA5BmmhJqEFsmUwIIf/+4QAAAApBnoZFFSw//76BAAAACAGepXRDf8SBAAAACAGep2pDf8SAAAAADkGarEmoQWyZTAgh//7gAAAACkGeykUVLD//voEAAAAIAZ7pdEN/xIAAAAAIAZ7rakN/xIAAAAAPQZruSahBbJlMFEw3//7B');
      video.play();
    }
  };

  this.release = function() {
    video.pause();
    video.src = '';
  };
}

function iOSWakeLock() {
  var timer = null;

  this.request = function() {
    if (!timer) {
      timer = setInterval(function() {
        window.location = window.location;
        setTimeout(window.stop, 0);
      }, 30000);
    }
  }

  this.release = function() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
}


function getWakeLock() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
    return iOSWakeLock;
  } else {
    return AndroidWakeLock;
  }
}

module.exports = getWakeLock();
},{"./util.js":23}],26:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Polyfill ES6 Promises (mostly for IE 11).
_dereq_('es6-promise').polyfill();

var CardboardVRDisplay = _dereq_('./cardboard-vr-display.js');
var MouseKeyboardVRDisplay = _dereq_('./mouse-keyboard-vr-display.js');
// Uncomment to add positional tracking via webcam.
//var WebcamPositionSensorVRDevice = require('./webcam-position-sensor-vr-device.js');
var VRDisplay = _dereq_('./base.js').VRDisplay;
var HMDVRDevice = _dereq_('./base.js').HMDVRDevice;
var PositionSensorVRDevice = _dereq_('./base.js').PositionSensorVRDevice;
var VRDisplayHMDDevice = _dereq_('./display-wrappers.js').VRDisplayHMDDevice;
var VRDisplayPositionSensorDevice = _dereq_('./display-wrappers.js').VRDisplayPositionSensorDevice;

function WebVRPolyfill() {
  this.displays = [];
  this.devices = []; // For deprecated objects
  this.devicesPopulated = false;
  this.nativeWebVRAvailable = this.isWebVRAvailable();
  this.nativeLegacyWebVRAvailable = this.isDeprecatedWebVRAvailable();

  if (!this.nativeLegacyWebVRAvailable) {
    if (!this.nativeWebVRAvailable) {
      this.enablePolyfill();
    }
    if (WebVRConfig.ENABLE_DEPRECATED_API) {
      this.enableDeprecatedPolyfill();
    }
  }
}

WebVRPolyfill.prototype.isWebVRAvailable = function() {
  return ('getVRDisplays' in navigator);
};

WebVRPolyfill.prototype.isDeprecatedWebVRAvailable = function() {
  return ('getVRDevices' in navigator) || ('mozGetVRDevices' in navigator);
};

WebVRPolyfill.prototype.populateDevices = function() {
  if (this.devicesPopulated) {
    return;
  }

  // Initialize our virtual VR devices.
  var vrDisplay = null;

  // Add a Cardboard VRDisplay on compatible mobile devices
  if (this.isCardboardCompatible()) {
    vrDisplay = new CardboardVRDisplay();
    this.displays.push(vrDisplay);

    // For backwards compatibility
    if (WebVRConfig.ENABLE_DEPRECATED_API) {
      this.devices.push(new VRDisplayHMDDevice(vrDisplay));
      this.devices.push(new VRDisplayPositionSensorDevice(vrDisplay));
    }
  }

  // Add a Mouse and Keyboard driven VRDisplay for desktops/laptops
  if (!this.isMobile() && !WebVRConfig.MOUSE_KEYBOARD_CONTROLS_DISABLED) {
    vrDisplay = new MouseKeyboardVRDisplay();
    this.displays.push(vrDisplay);

    // For backwards compatibility
    if (WebVRConfig.ENABLE_DEPRECATED_API) {
      this.devices.push(new VRDisplayHMDDevice(vrDisplay));
      this.devices.push(new VRDisplayPositionSensorDevice(vrDisplay));
    }
  }

  // Uncomment to add positional tracking via webcam.
  //if (!this.isMobile() && WebVRConfig.ENABLE_DEPRECATED_API) {
  //  positionDevice = new WebcamPositionSensorVRDevice();
  //  this.devices.push(positionDevice);
  //}

  this.devicesPopulated = true;
};

WebVRPolyfill.prototype.enablePolyfill = function() {
  // Provide navigator.getVRDisplays.
  navigator.getVRDisplays = this.getVRDisplays.bind(this);

  // Provide the VRDisplay object.
  window.VRDisplay = VRDisplay;
};

WebVRPolyfill.prototype.enableDeprecatedPolyfill = function() {
  // Provide navigator.getVRDevices.
  navigator.getVRDevices = this.getVRDevices.bind(this);

  // Provide the CardboardHMDVRDevice and PositionSensorVRDevice objects.
  window.HMDVRDevice = HMDVRDevice;
  window.PositionSensorVRDevice = PositionSensorVRDevice;
};

WebVRPolyfill.prototype.getVRDisplays = function() {
  this.populateDevices();
  var displays = this.displays;
  return new Promise(function(resolve, reject) {
    try {
      resolve(displays);
    } catch (e) {
      reject(e);
    }
  });
};

WebVRPolyfill.prototype.getVRDevices = function() {
  console.warn('getVRDevices is deprecated. Please update your code to use getVRDisplays instead.');
  var self = this;
  return new Promise(function(resolve, reject) {
    try {
      if (!self.devicesPopulated) {
        if (self.nativeWebVRAvailable) {
          return navigator.getVRDisplays(function(displays) {
            for (var i = 0; i < displays.length; ++i) {
              self.devices.push(new VRDisplayHMDDevice(displays[i]));
              self.devices.push(new VRDisplayPositionSensorDevice(displays[i]));
            }
            self.devicesPopulated = true;
            resolve(self.devices);
          }, reject);
        }

        if (self.nativeLegacyWebVRAvailable) {
          return (navigator.getVRDDevices || navigator.mozGetVRDevices)(function(devices) {
            for (var i = 0; i < devices.length; ++i) {
              if (devices[i] instanceof HMDVRDevice) {
                self.devices.push(devices[i]);
              }
              if (devices[i] instanceof PositionSensorVRDevice) {
                self.devices.push(devices[i]);
              }
            }
            self.devicesPopulated = true;
            resolve(self.devices);
          }, reject);
        }
      }

      self.populateDevices();
      resolve(self.devices);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Determine if a device is mobile.
 */
WebVRPolyfill.prototype.isMobile = function() {
  return /Android/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

WebVRPolyfill.prototype.isCardboardCompatible = function() {
  // For now, support all iOS and Android devices.
  // Also enable the WebVRConfig.FORCE_VR flag for debugging.
  return this.isMobile() || WebVRConfig.FORCE_ENABLE_VR;
};

module.exports = WebVRPolyfill;

},{"./base.js":3,"./cardboard-vr-display.js":6,"./display-wrappers.js":9,"./mouse-keyboard-vr-display.js":16,"es6-promise":1}],27:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[14])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWVicmV3L2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2VzNi1wcm9taXNlLmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1hc3NpZ24vaW5kZXguanMiLCJzcmMvYmFzZS5qcyIsInNyYy9jYXJkYm9hcmQtZGlzdG9ydGVyLmpzIiwic3JjL2NhcmRib2FyZC11aS5qcyIsInNyYy9jYXJkYm9hcmQtdnItZGlzcGxheS5qcyIsInNyYy9kZXBzL3dnbHUtcHJlc2VydmUtc3RhdGUuanMiLCJzcmMvZGV2aWNlLWluZm8uanMiLCJzcmMvZGlzcGxheS13cmFwcGVycy5qcyIsInNyYy9kaXN0b3J0aW9uL2Rpc3RvcnRpb24uanMiLCJzcmMvZHBkYi9kcGRiLWNhY2hlLmpzIiwic3JjL2RwZGIvZHBkYi5qcyIsInNyYy9lbWl0dGVyLmpzIiwic3JjL21haW4uanMiLCJzcmMvbWF0aC11dGlsLmpzIiwic3JjL21vdXNlLWtleWJvYXJkLXZyLWRpc3BsYXkuanMiLCJzcmMvcm90YXRlLWluc3RydWN0aW9ucy5qcyIsInNyYy9zZW5zb3ItZnVzaW9uL2NvbXBsZW1lbnRhcnktZmlsdGVyLmpzIiwic3JjL3NlbnNvci1mdXNpb24vZnVzaW9uLXBvc2Utc2Vuc29yLmpzIiwic3JjL3NlbnNvci1mdXNpb24vcG9zZS1wcmVkaWN0b3IuanMiLCJzcmMvc2Vuc29yLWZ1c2lvbi9zZW5zb3Itc2FtcGxlLmpzIiwic3JjL3RvdWNoLXBhbm5lci5qcyIsInNyYy91dGlsLmpzIiwic3JjL3ZpZXdlci1zZWxlY3Rvci5qcyIsInNyYy93YWtlbG9jay5qcyIsInNyYy93ZWJ2ci1wb2x5ZmlsbC5qcyIsIi4uLy4uL2hvbWVicmV3L2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzE3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDejhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBAb3ZlcnZpZXcgZXM2LXByb21pc2UgLSBhIHRpbnkgaW1wbGVtZW50YXRpb24gb2YgUHJvbWlzZXMvQSsuXG4gKiBAY29weXJpZ2h0IENvcHlyaWdodCAoYykgMjAxNCBZZWh1ZGEgS2F0eiwgVG9tIERhbGUsIFN0ZWZhbiBQZW5uZXIgYW5kIGNvbnRyaWJ1dG9ycyAoQ29udmVyc2lvbiB0byBFUzYgQVBJIGJ5IEpha2UgQXJjaGliYWxkKVxuICogQGxpY2Vuc2UgICBMaWNlbnNlZCB1bmRlciBNSVQgbGljZW5zZVxuICogICAgICAgICAgICBTZWUgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2pha2VhcmNoaWJhbGQvZXM2LXByb21pc2UvbWFzdGVyL0xJQ0VOU0VcbiAqIEB2ZXJzaW9uICAgMy4xLjJcbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRvYmplY3RPckZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJyB8fCAodHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGwpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc01heWJlVGhlbmFibGUoeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnb2JqZWN0JyAmJiB4ICE9PSBudWxsO1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5O1xuICAgIGlmICghQXJyYXkuaXNBcnJheSkge1xuICAgICAgbGliJGVzNiRwcm9taXNlJHV0aWxzJCRfaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0FycmF5ID0gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRfaXNBcnJheTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiA9IDA7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQ7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbjtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcCA9IGZ1bmN0aW9uIGFzYXAoY2FsbGJhY2ssIGFyZykge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2xpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW5dID0gY2FsbGJhY2s7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiArIDFdID0gYXJnO1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiArPSAyO1xuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPT09IDIpIHtcbiAgICAgICAgLy8gSWYgbGVuIGlzIDIsIHRoYXQgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIHNjaGVkdWxlIGFuIGFzeW5jIGZsdXNoLlxuICAgICAgICAvLyBJZiBhZGRpdGlvbmFsIGNhbGxiYWNrcyBhcmUgcXVldWVkIGJlZm9yZSB0aGUgcXVldWUgaXMgZmx1c2hlZCwgdGhleVxuICAgICAgICAvLyB3aWxsIGJlIHByb2Nlc3NlZCBieSB0aGlzIGZsdXNoIHRoYXQgd2UgYXJlIHNjaGVkdWxpbmcuXG4gICAgICAgIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkY3VzdG9tU2NoZWR1bGVyRm4pIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkY3VzdG9tU2NoZWR1bGVyRm4obGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldFNjaGVkdWxlcihzY2hlZHVsZUZuKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkY3VzdG9tU2NoZWR1bGVyRm4gPSBzY2hlZHVsZUZuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzZXRBc2FwKGFzYXBGbikge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAgPSBhc2FwRm47XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyV2luZG93ID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IHVuZGVmaW5lZDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJHbG9iYWwgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3NlcldpbmRvdyB8fCB7fTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJHbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbC5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNOb2RlID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHt9LnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJztcblxuICAgIC8vIHRlc3QgZm9yIHdlYiB3b3JrZXIgYnV0IG5vdCBpbiBJRTEwXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc1dvcmtlciA9IHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIHR5cGVvZiBpbXBvcnRTY3JpcHRzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgdHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJztcblxuICAgIC8vIG5vZGVcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKSB7XG4gICAgICAvLyBub2RlIHZlcnNpb24gMC4xMC54IGRpc3BsYXlzIGEgZGVwcmVjYXRpb24gd2FybmluZyB3aGVuIG5leHRUaWNrIGlzIHVzZWQgcmVjdXJzaXZlbHlcbiAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vY3Vqb2pzL3doZW4vaXNzdWVzLzQxMCBmb3IgZGV0YWlsc1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHZlcnR4XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgbGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIG5vZGUuZGF0YSA9IChpdGVyYXRpb25zID0gKytpdGVyYXRpb25zICUgMik7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHdlYiB3b3JrZXJcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTWVzc2FnZUNoYW5uZWwoKSB7XG4gICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2g7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gsIDEpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlID0gbmV3IEFycmF5KDEwMDApO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbjsgaSs9Mikge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaV07XG4gICAgICAgIHZhciBhcmcgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaSsxXTtcblxuICAgICAgICBjYWxsYmFjayhhcmcpO1xuXG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2krMV0gPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhdHRlbXB0VmVydHgoKSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgciA9IHJlcXVpcmU7XG4gICAgICAgIHZhciB2ZXJ0eCA9IHIoJ3ZlcnR4Jyk7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQgPSB2ZXJ0eC5ydW5Pbkxvb3AgfHwgdmVydHgucnVuT25Db250ZXh0O1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2g7XG4gICAgLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbiAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzTm9kZSkge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKTtcbiAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTXV0YXRpb25PYnNlcnZlcigpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzV29ya2VyKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNZXNzYWdlQ2hhbm5lbCgpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXR0ZW1wdFZlcnR4KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHRoZW4kJHRoZW4ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgIHZhciBwYXJlbnQgPSB0aGlzO1xuICAgICAgdmFyIHN0YXRlID0gcGFyZW50Ll9zdGF0ZTtcblxuICAgICAgaWYgKHN0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQgJiYgIW9uRnVsZmlsbG1lbnQgfHwgc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEICYmICFvblJlamVjdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgdmFyIGNoaWxkID0gbmV3IHRoaXMuY29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICB2YXIgcmVzdWx0ID0gcGFyZW50Ll9yZXN1bHQ7XG5cbiAgICAgIGlmIChzdGF0ZSkge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmd1bWVudHNbc3RhdGUgLSAxXTtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAoZnVuY3Rpb24oKXtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbnZva2VDYWxsYmFjayhzdGF0ZSwgY2hpbGQsIGNhbGxiYWNrLCByZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjaGlsZDtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR0aGVuJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHRoZW4kJHRoZW47XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkcmVzb2x2ZShvYmplY3QpIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmIG9iamVjdC5jb25zdHJ1Y3RvciA9PT0gQ29uc3RydWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgIH1cblxuICAgICAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIG9iamVjdCk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRyZXNvbHZlO1xuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCgpIHt9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORyAgID0gdm9pZCAwO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQgPSAxO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCAgPSAyO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SID0gbmV3IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEVycm9yT2JqZWN0KCk7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzZWxmRnVsZmlsbG1lbnQoKSB7XG4gICAgICByZXR1cm4gbmV3IFR5cGVFcnJvcihcIllvdSBjYW5ub3QgcmVzb2x2ZSBhIHByb21pc2Ugd2l0aCBpdHNlbGZcIik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkY2Fubm90UmV0dXJuT3duKCkge1xuICAgICAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoJ0EgcHJvbWlzZXMgY2FsbGJhY2sgY2Fubm90IHJldHVybiB0aGF0IHNhbWUgcHJvbWlzZS4nKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRnZXRUaGVuKHByb21pc2UpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLnRoZW47XG4gICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SLmVycm9yID0gZXJyb3I7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlUaGVuKHRoZW4sIHZhbHVlLCBmdWxmaWxsbWVudEhhbmRsZXIsIHJlamVjdGlvbkhhbmRsZXIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoZW4uY2FsbCh2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVGb3JlaWduVGhlbmFibGUocHJvbWlzZSwgdGhlbmFibGUsIHRoZW4pIHtcbiAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChmdW5jdGlvbihwcm9taXNlKSB7XG4gICAgICAgIHZhciBzZWFsZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIGVycm9yID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5VGhlbih0aGVuLCB0aGVuYWJsZSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBpZiAoc2VhbGVkKSB7IHJldHVybjsgfVxuICAgICAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICAgICAgaWYgKHRoZW5hYmxlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgICAgaWYgKHNlYWxlZCkgeyByZXR1cm47IH1cbiAgICAgICAgICBzZWFsZWQgPSB0cnVlO1xuXG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0sICdTZXR0bGU6ICcgKyAocHJvbWlzZS5fbGFiZWwgfHwgJyB1bmtub3duIHByb21pc2UnKSk7XG5cbiAgICAgICAgaWYgKCFzZWFsZWQgJiYgZXJyb3IpIHtcbiAgICAgICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0sIHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU93blRoZW5hYmxlKHByb21pc2UsIHRoZW5hYmxlKSB7XG4gICAgICBpZiAodGhlbmFibGUuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgICAgIH0gZWxzZSBpZiAodGhlbmFibGUuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdGhlbmFibGUuX3Jlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUodGhlbmFibGUsIHVuZGVmaW5lZCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSwgdGhlbikge1xuICAgICAgaWYgKG1heWJlVGhlbmFibGUuY29uc3RydWN0b3IgPT09IHByb21pc2UuY29uc3RydWN0b3IgJiZcbiAgICAgICAgICB0aGVuID09PSBsaWIkZXM2JHByb21pc2UkdGhlbiQkZGVmYXVsdCAmJlxuICAgICAgICAgIGNvbnN0cnVjdG9yLnJlc29sdmUgPT09IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhlbiA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IuZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHRoZW4pKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlRm9yZWlnblRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUsIHRoZW4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKSB7XG4gICAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHNlbGZGdWxmaWxsbWVudCgpKTtcbiAgICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJHV0aWxzJCRvYmplY3RPckZ1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlLCBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRnZXRUaGVuKHZhbHVlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoUmVqZWN0aW9uKHByb21pc2UpIHtcbiAgICAgIGlmIChwcm9taXNlLl9vbmVycm9yKSB7XG4gICAgICAgIHByb21pc2UuX29uZXJyb3IocHJvbWlzZS5fcmVzdWx0KTtcbiAgICAgIH1cblxuICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaChwcm9taXNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHZhbHVlKSB7XG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcpIHsgcmV0dXJuOyB9XG5cbiAgICAgIHByb21pc2UuX3Jlc3VsdCA9IHZhbHVlO1xuICAgICAgcHJvbWlzZS5fc3RhdGUgPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQ7XG5cbiAgICAgIGlmIChwcm9taXNlLl9zdWJzY3JpYmVycy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaCwgcHJvbWlzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbikge1xuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7IHJldHVybjsgfVxuICAgICAgcHJvbWlzZS5fc3RhdGUgPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRDtcbiAgICAgIHByb21pc2UuX3Jlc3VsdCA9IHJlYXNvbjtcblxuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaFJlamVjdGlvbiwgcHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHBhcmVudCwgY2hpbGQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKSB7XG4gICAgICB2YXIgc3Vic2NyaWJlcnMgPSBwYXJlbnQuX3N1YnNjcmliZXJzO1xuICAgICAgdmFyIGxlbmd0aCA9IHN1YnNjcmliZXJzLmxlbmd0aDtcblxuICAgICAgcGFyZW50Ll9vbmVycm9yID0gbnVsbDtcblxuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoXSA9IGNoaWxkO1xuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEXSA9IG9uRnVsZmlsbG1lbnQ7XG4gICAgICBzdWJzY3JpYmVyc1tsZW5ndGggKyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRF0gID0gb25SZWplY3Rpb247XG5cbiAgICAgIGlmIChsZW5ndGggPT09IDAgJiYgcGFyZW50Ll9zdGF0ZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoLCBwYXJlbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gocHJvbWlzZSkge1xuICAgICAgdmFyIHN1YnNjcmliZXJzID0gcHJvbWlzZS5fc3Vic2NyaWJlcnM7XG4gICAgICB2YXIgc2V0dGxlZCA9IHByb21pc2UuX3N0YXRlO1xuXG4gICAgICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoID09PSAwKSB7IHJldHVybjsgfVxuXG4gICAgICB2YXIgY2hpbGQsIGNhbGxiYWNrLCBkZXRhaWwgPSBwcm9taXNlLl9yZXN1bHQ7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgY2hpbGQgPSBzdWJzY3JpYmVyc1tpXTtcbiAgICAgICAgY2FsbGJhY2sgPSBzdWJzY3JpYmVyc1tpICsgc2V0dGxlZF07XG5cbiAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgY2hpbGQsIGNhbGxiYWNrLCBkZXRhaWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhbGxiYWNrKGRldGFpbCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoID0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRFcnJvck9iamVjdCgpIHtcbiAgICAgIHRoaXMuZXJyb3IgPSBudWxsO1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IgPSBuZXcgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKTtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeUNhdGNoKGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhkZXRhaWwpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFRSWV9DQVRDSF9FUlJPUi5lcnJvciA9IGU7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1I7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgcHJvbWlzZSwgY2FsbGJhY2ssIGRldGFpbCkge1xuICAgICAgdmFyIGhhc0NhbGxiYWNrID0gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKGNhbGxiYWNrKSxcbiAgICAgICAgICB2YWx1ZSwgZXJyb3IsIHN1Y2NlZWRlZCwgZmFpbGVkO1xuXG4gICAgICBpZiAoaGFzQ2FsbGJhY2spIHtcbiAgICAgICAgdmFsdWUgPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKTtcblxuICAgICAgICBpZiAodmFsdWUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFRSWV9DQVRDSF9FUlJPUikge1xuICAgICAgICAgIGZhaWxlZCA9IHRydWU7XG4gICAgICAgICAgZXJyb3IgPSB2YWx1ZS5lcnJvcjtcbiAgICAgICAgICB2YWx1ZSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRjYW5ub3RSZXR1cm5Pd24oKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gZGV0YWlsO1xuICAgICAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcpIHtcbiAgICAgICAgLy8gbm9vcFxuICAgICAgfSBlbHNlIGlmIChoYXNDYWxsYmFjayAmJiBzdWNjZWVkZWQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKGZhaWxlZCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICAgICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW5pdGlhbGl6ZVByb21pc2UocHJvbWlzZSwgcmVzb2x2ZXIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmVyKGZ1bmN0aW9uIHJlc29sdmVQcm9taXNlKHZhbHVlKXtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gcmVqZWN0UHJvbWlzZShyZWFzb24pIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsKGVudHJpZXMpIHtcbiAgICAgIHJldHVybiBuZXcgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJGRlZmF1bHQodGhpcywgZW50cmllcykucHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJHJhY2UoZW50cmllcykge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgICAgIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuXG4gICAgICBpZiAoIWxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNBcnJheShlbnRyaWVzKSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byByYWNlLicpKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIHZhciBsZW5ndGggPSBlbnRyaWVzLmxlbmd0aDtcblxuICAgICAgZnVuY3Rpb24gb25GdWxmaWxsbWVudCh2YWx1ZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25SZWplY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgcHJvbWlzZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgJiYgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShDb25zdHJ1Y3Rvci5yZXNvbHZlKGVudHJpZXNbaV0pLCB1bmRlZmluZWQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmFjZSQkcmFjZTtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJHJlamVjdChyZWFzb24pIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuICAgICAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRyZWplY3Q7XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGNvdW50ZXIgPSAwO1xuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzUmVzb2x2ZXIoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgcmVzb2x2ZXIgZnVuY3Rpb24gYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzTmV3KCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBjb25zdHJ1Y3QgJ1Byb21pc2UnOiBQbGVhc2UgdXNlIHRoZSAnbmV3JyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZTtcbiAgICAvKipcbiAgICAgIFByb21pc2Ugb2JqZWN0cyByZXByZXNlbnQgdGhlIGV2ZW50dWFsIHJlc3VsdCBvZiBhbiBhc3luY2hyb25vdXMgb3BlcmF0aW9uLiBUaGVcbiAgICAgIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsIHdoaWNoXG4gICAgICByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZSByZWFzb25cbiAgICAgIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBUZXJtaW5vbG9neVxuICAgICAgLS0tLS0tLS0tLS1cblxuICAgICAgLSBgcHJvbWlzZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHdpdGggYSBgdGhlbmAgbWV0aG9kIHdob3NlIGJlaGF2aW9yIGNvbmZvcm1zIHRvIHRoaXMgc3BlY2lmaWNhdGlvbi5cbiAgICAgIC0gYHRoZW5hYmxlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gdGhhdCBkZWZpbmVzIGEgYHRoZW5gIG1ldGhvZC5cbiAgICAgIC0gYHZhbHVlYCBpcyBhbnkgbGVnYWwgSmF2YVNjcmlwdCB2YWx1ZSAoaW5jbHVkaW5nIHVuZGVmaW5lZCwgYSB0aGVuYWJsZSwgb3IgYSBwcm9taXNlKS5cbiAgICAgIC0gYGV4Y2VwdGlvbmAgaXMgYSB2YWx1ZSB0aGF0IGlzIHRocm93biB1c2luZyB0aGUgdGhyb3cgc3RhdGVtZW50LlxuICAgICAgLSBgcmVhc29uYCBpcyBhIHZhbHVlIHRoYXQgaW5kaWNhdGVzIHdoeSBhIHByb21pc2Ugd2FzIHJlamVjdGVkLlxuICAgICAgLSBgc2V0dGxlZGAgdGhlIGZpbmFsIHJlc3Rpbmcgc3RhdGUgb2YgYSBwcm9taXNlLCBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG5cbiAgICAgIEEgcHJvbWlzZSBjYW4gYmUgaW4gb25lIG9mIHRocmVlIHN0YXRlczogcGVuZGluZywgZnVsZmlsbGVkLCBvciByZWplY3RlZC5cblxuICAgICAgUHJvbWlzZXMgdGhhdCBhcmUgZnVsZmlsbGVkIGhhdmUgYSBmdWxmaWxsbWVudCB2YWx1ZSBhbmQgYXJlIGluIHRoZSBmdWxmaWxsZWRcbiAgICAgIHN0YXRlLiAgUHJvbWlzZXMgdGhhdCBhcmUgcmVqZWN0ZWQgaGF2ZSBhIHJlamVjdGlvbiByZWFzb24gYW5kIGFyZSBpbiB0aGVcbiAgICAgIHJlamVjdGVkIHN0YXRlLiAgQSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZXZlciBhIHRoZW5hYmxlLlxuXG4gICAgICBQcm9taXNlcyBjYW4gYWxzbyBiZSBzYWlkIHRvICpyZXNvbHZlKiBhIHZhbHVlLiAgSWYgdGhpcyB2YWx1ZSBpcyBhbHNvIGFcbiAgICAgIHByb21pc2UsIHRoZW4gdGhlIG9yaWdpbmFsIHByb21pc2UncyBzZXR0bGVkIHN0YXRlIHdpbGwgbWF0Y2ggdGhlIHZhbHVlJ3NcbiAgICAgIHNldHRsZWQgc3RhdGUuICBTbyBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMgd2lsbFxuICAgICAgaXRzZWxmIHJlamVjdCwgYW5kIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgZnVsZmlsbHMgd2lsbFxuICAgICAgaXRzZWxmIGZ1bGZpbGwuXG5cblxuICAgICAgQmFzaWMgVXNhZ2U6XG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgYGBganNcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIG9uIHN1Y2Nlc3NcbiAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG5cbiAgICAgICAgLy8gb24gZmFpbHVyZVxuICAgICAgICByZWplY3QocmVhc29uKTtcbiAgICAgIH0pO1xuXG4gICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgLy8gb24gZnVsZmlsbG1lbnRcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAvLyBvbiByZWplY3Rpb25cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIFVzYWdlOlxuICAgICAgLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFByb21pc2VzIHNoaW5lIHdoZW4gYWJzdHJhY3RpbmcgYXdheSBhc3luY2hyb25vdXMgaW50ZXJhY3Rpb25zIHN1Y2ggYXNcbiAgICAgIGBYTUxIdHRwUmVxdWVzdGBzLlxuXG4gICAgICBgYGBqc1xuICAgICAgZnVuY3Rpb24gZ2V0SlNPTih1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGhhbmRsZXI7XG4gICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdqc29uJztcbiAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICB4aHIuc2VuZCgpO1xuXG4gICAgICAgICAgZnVuY3Rpb24gaGFuZGxlcigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IHRoaXMuRE9ORSkge1xuICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5yZXNwb25zZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignZ2V0SlNPTjogYCcgKyB1cmwgKyAnYCBmYWlsZWQgd2l0aCBzdGF0dXM6IFsnICsgdGhpcy5zdGF0dXMgKyAnXScpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBnZXRKU09OKCcvcG9zdHMuanNvbicpLnRoZW4oZnVuY3Rpb24oanNvbikge1xuICAgICAgICAvLyBvbiBmdWxmaWxsbWVudFxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIC8vIG9uIHJlamVjdGlvblxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgVW5saWtlIGNhbGxiYWNrcywgcHJvbWlzZXMgYXJlIGdyZWF0IGNvbXBvc2FibGUgcHJpbWl0aXZlcy5cblxuICAgICAgYGBganNcbiAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgZ2V0SlNPTignL3Bvc3RzJyksXG4gICAgICAgIGdldEpTT04oJy9jb21tZW50cycpXG4gICAgICBdKS50aGVuKGZ1bmN0aW9uKHZhbHVlcyl7XG4gICAgICAgIHZhbHVlc1swXSAvLyA9PiBwb3N0c0pTT05cbiAgICAgICAgdmFsdWVzWzFdIC8vID0+IGNvbW1lbnRzSlNPTlxuXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAY2xhc3MgUHJvbWlzZVxuICAgICAgQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZXJcbiAgICAgIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgICAgIEBjb25zdHJ1Y3RvclxuICAgICovXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UocmVzb2x2ZXIpIHtcbiAgICAgIHRoaXMuX2lkID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGNvdW50ZXIrKztcbiAgICAgIHRoaXMuX3N0YXRlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fcmVzdWx0ID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fc3Vic2NyaWJlcnMgPSBbXTtcblxuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3AgIT09IHJlc29sdmVyKSB7XG4gICAgICAgIHR5cGVvZiByZXNvbHZlciAhPT0gJ2Z1bmN0aW9uJyAmJiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNSZXNvbHZlcigpO1xuICAgICAgICB0aGlzIGluc3RhbmNlb2YgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UgPyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbml0aWFsaXplUHJvbWlzZSh0aGlzLCByZXNvbHZlcikgOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNOZXcoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5hbGwgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmFjZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVzb2x2ZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVqZWN0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRkZWZhdWx0O1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLl9zZXRTY2hlZHVsZXIgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0U2NoZWR1bGVyO1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLl9zZXRBc2FwID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldEFzYXA7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UuX2FzYXAgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcDtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgICAgIGNvbnN0cnVjdG9yOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZSxcblxuICAgIC8qKlxuICAgICAgVGhlIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsXG4gICAgICB3aGljaCByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZVxuICAgICAgcmVhc29uIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICAvLyB1c2VyIGlzIGF2YWlsYWJsZVxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gdXNlciBpcyB1bmF2YWlsYWJsZSwgYW5kIHlvdSBhcmUgZ2l2ZW4gdGhlIHJlYXNvbiB3aHlcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIENoYWluaW5nXG4gICAgICAtLS0tLS0tLVxuXG4gICAgICBUaGUgcmV0dXJuIHZhbHVlIG9mIGB0aGVuYCBpcyBpdHNlbGYgYSBwcm9taXNlLiAgVGhpcyBzZWNvbmQsICdkb3duc3RyZWFtJ1xuICAgICAgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZpcnN0IHByb21pc2UncyBmdWxmaWxsbWVudFxuICAgICAgb3IgcmVqZWN0aW9uIGhhbmRsZXIsIG9yIHJlamVjdGVkIGlmIHRoZSBoYW5kbGVyIHRocm93cyBhbiBleGNlcHRpb24uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIHVzZXIubmFtZTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgcmV0dXJuICdkZWZhdWx0IG5hbWUnO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodXNlck5hbWUpIHtcbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGB1c2VyTmFtZWAgd2lsbCBiZSB0aGUgdXNlcidzIG5hbWUsIG90aGVyd2lzZSBpdFxuICAgICAgICAvLyB3aWxsIGJlIGAnZGVmYXVsdCBuYW1lJ2BcbiAgICAgIH0pO1xuXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScpO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BmaW5kVXNlcmAgcmVqZWN0ZWQgYW5kIHdlJ3JlIHVuaGFwcHknKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gaWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGByZWFzb25gIHdpbGwgYmUgJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jy5cbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCByZWplY3RlZCwgYHJlYXNvbmAgd2lsbCBiZSAnYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScuXG4gICAgICB9KTtcbiAgICAgIGBgYFxuICAgICAgSWYgdGhlIGRvd25zdHJlYW0gcHJvbWlzZSBkb2VzIG5vdCBzcGVjaWZ5IGEgcmVqZWN0aW9uIGhhbmRsZXIsIHJlamVjdGlvbiByZWFzb25zIHdpbGwgYmUgcHJvcGFnYXRlZCBmdXJ0aGVyIGRvd25zdHJlYW0uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFBlZGFnb2dpY2FsRXhjZXB0aW9uKCdVcHN0cmVhbSBlcnJvcicpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBUaGUgYFBlZGdhZ29jaWFsRXhjZXB0aW9uYCBpcyBwcm9wYWdhdGVkIGFsbCB0aGUgd2F5IGRvd24gdG8gaGVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQXNzaW1pbGF0aW9uXG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgU29tZXRpbWVzIHRoZSB2YWx1ZSB5b3Ugd2FudCB0byBwcm9wYWdhdGUgdG8gYSBkb3duc3RyZWFtIHByb21pc2UgY2FuIG9ubHkgYmVcbiAgICAgIHJldHJpZXZlZCBhc3luY2hyb25vdXNseS4gVGhpcyBjYW4gYmUgYWNoaWV2ZWQgYnkgcmV0dXJuaW5nIGEgcHJvbWlzZSBpbiB0aGVcbiAgICAgIGZ1bGZpbGxtZW50IG9yIHJlamVjdGlvbiBoYW5kbGVyLiBUaGUgZG93bnN0cmVhbSBwcm9taXNlIHdpbGwgdGhlbiBiZSBwZW5kaW5nXG4gICAgICB1bnRpbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBzZXR0bGVkLiBUaGlzIGlzIGNhbGxlZCAqYXNzaW1pbGF0aW9uKi5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBUaGUgdXNlcidzIGNvbW1lbnRzIGFyZSBub3cgYXZhaWxhYmxlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBJZiB0aGUgYXNzaW1saWF0ZWQgcHJvbWlzZSByZWplY3RzLCB0aGVuIHRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCBhbHNvIHJlamVjdC5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIGZ1bGZpbGxzLCB3ZSdsbCBoYXZlIHRoZSB2YWx1ZSBoZXJlXG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgcmVqZWN0cywgd2UnbGwgaGF2ZSB0aGUgcmVhc29uIGhlcmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFNpbXBsZSBFeGFtcGxlXG4gICAgICAtLS0tLS0tLS0tLS0tLVxuXG4gICAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IGZpbmRSZXN1bHQoKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFJlc3VsdChmdW5jdGlvbihyZXN1bHQsIGVycil7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRSZXN1bHQoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIEV4YW1wbGVcbiAgICAgIC0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIGF1dGhvciwgYm9va3M7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF1dGhvciA9IGZpbmRBdXRob3IoKTtcbiAgICAgICAgYm9va3MgID0gZmluZEJvb2tzQnlBdXRob3IoYXV0aG9yKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuXG4gICAgICBmdW5jdGlvbiBmb3VuZEJvb2tzKGJvb2tzKSB7XG5cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZmFpbHVyZShyZWFzb24pIHtcblxuICAgICAgfVxuXG4gICAgICBmaW5kQXV0aG9yKGZ1bmN0aW9uKGF1dGhvciwgZXJyKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZpbmRCb29va3NCeUF1dGhvcihhdXRob3IsIGZ1bmN0aW9uKGJvb2tzLCBlcnIpIHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgZm91bmRCb29rcyhib29rcyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgIGZhaWx1cmUocmVhc29uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRBdXRob3IoKS5cbiAgICAgICAgdGhlbihmaW5kQm9va3NCeUF1dGhvcikuXG4gICAgICAgIHRoZW4oZnVuY3Rpb24oYm9va3Mpe1xuICAgICAgICAgIC8vIGZvdW5kIGJvb2tzXG4gICAgICB9KS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQG1ldGhvZCB0aGVuXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvbkZ1bGZpbGxlZFxuICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3RlZFxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgdGhlbjogbGliJGVzNiRwcm9taXNlJHRoZW4kJGRlZmF1bHQsXG5cbiAgICAvKipcbiAgICAgIGBjYXRjaGAgaXMgc2ltcGx5IHN1Z2FyIGZvciBgdGhlbih1bmRlZmluZWQsIG9uUmVqZWN0aW9uKWAgd2hpY2ggbWFrZXMgaXQgdGhlIHNhbWVcbiAgICAgIGFzIHRoZSBjYXRjaCBibG9jayBvZiBhIHRyeS9jYXRjaCBzdGF0ZW1lbnQuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmdW5jdGlvbiBmaW5kQXV0aG9yKCl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGRuJ3QgZmluZCB0aGF0IGF1dGhvcicpO1xuICAgICAgfVxuXG4gICAgICAvLyBzeW5jaHJvbm91c1xuICAgICAgdHJ5IHtcbiAgICAgICAgZmluZEF1dGhvcigpO1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICAgIH1cblxuICAgICAgLy8gYXN5bmMgd2l0aCBwcm9taXNlc1xuICAgICAgZmluZEF1dGhvcigpLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAbWV0aG9kIGNhdGNoXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGlvblxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgJ2NhdGNoJzogZnVuY3Rpb24ob25SZWplY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGlvbik7XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvcjtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvcihDb25zdHJ1Y3RvciwgaW5wdXQpIHtcbiAgICAgIHRoaXMuX2luc3RhbmNlQ29uc3RydWN0b3IgPSBDb25zdHJ1Y3RvcjtcbiAgICAgIHRoaXMucHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKSB7XG4gICAgICAgIHRoaXMuX2lucHV0ICAgICA9IGlucHV0O1xuICAgICAgICB0aGlzLmxlbmd0aCAgICAgPSBpbnB1dC5sZW5ndGg7XG4gICAgICAgIHRoaXMuX3JlbWFpbmluZyA9IGlucHV0Lmxlbmd0aDtcblxuICAgICAgICB0aGlzLl9yZXN1bHQgPSBuZXcgQXJyYXkodGhpcy5sZW5ndGgpO1xuXG4gICAgICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwodGhpcy5wcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5sZW5ndGggfHwgMDtcbiAgICAgICAgICB0aGlzLl9lbnVtZXJhdGUoKTtcbiAgICAgICAgICBpZiAodGhpcy5fcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHRoaXMucHJvbWlzZSwgdGhpcy5fcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdCh0aGlzLnByb21pc2UsIHRoaXMuX3ZhbGlkYXRpb25FcnJvcigpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3ZhbGlkYXRpb25FcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcignQXJyYXkgTWV0aG9kcyBtdXN0IGJlIHByb3ZpZGVkIGFuIEFycmF5Jyk7XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fZW51bWVyYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGVuZ3RoICA9IHRoaXMubGVuZ3RoO1xuICAgICAgdmFyIGlucHV0ICAgPSB0aGlzLl9pbnB1dDtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IHRoaXMuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICYmIGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLl9lYWNoRW50cnkoaW5wdXRbaV0sIGkpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX2VhY2hFbnRyeSA9IGZ1bmN0aW9uKGVudHJ5LCBpKSB7XG4gICAgICB2YXIgYyA9IHRoaXMuX2luc3RhbmNlQ29uc3RydWN0b3I7XG4gICAgICB2YXIgcmVzb2x2ZSA9IGMucmVzb2x2ZTtcblxuICAgICAgaWYgKHJlc29sdmUgPT09IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQpIHtcbiAgICAgICAgdmFyIHRoZW4gPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRnZXRUaGVuKGVudHJ5KTtcblxuICAgICAgICBpZiAodGhlbiA9PT0gbGliJGVzNiRwcm9taXNlJHRoZW4kJGRlZmF1bHQgJiZcbiAgICAgICAgICAgIGVudHJ5Ll9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykge1xuICAgICAgICAgIHRoaXMuX3NldHRsZWRBdChlbnRyeS5fc3RhdGUsIGksIGVudHJ5Ll9yZXN1bHQpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGVuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdGhpcy5fcmVtYWluaW5nLS07XG4gICAgICAgICAgdGhpcy5fcmVzdWx0W2ldID0gZW50cnk7XG4gICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQpIHtcbiAgICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBjKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgZW50cnksIHRoZW4pO1xuICAgICAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChwcm9taXNlLCBpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl93aWxsU2V0dGxlQXQobmV3IGMoZnVuY3Rpb24ocmVzb2x2ZSkgeyByZXNvbHZlKGVudHJ5KTsgfSksIGkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl93aWxsU2V0dGxlQXQocmVzb2x2ZShlbnRyeSksIGkpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3NldHRsZWRBdCA9IGZ1bmN0aW9uKHN0YXRlLCBpLCB2YWx1ZSkge1xuICAgICAgdmFyIHByb21pc2UgPSB0aGlzLnByb21pc2U7XG5cbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykge1xuICAgICAgICB0aGlzLl9yZW1haW5pbmctLTtcblxuICAgICAgICBpZiAoc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9yZXN1bHRbaV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdGhpcy5fcmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl93aWxsU2V0dGxlQXQgPSBmdW5jdGlvbihwcm9taXNlLCBpKSB7XG4gICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwcm9taXNlLCB1bmRlZmluZWQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3NldHRsZWRBdChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQsIGksIHZhbHVlKTtcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICBlbnVtZXJhdG9yLl9zZXR0bGVkQXQobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQsIGksIHJlYXNvbik7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkcG9seWZpbGwoKSB7XG4gICAgICB2YXIgbG9jYWw7XG5cbiAgICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGxvY2FsID0gZ2xvYmFsO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBsb2NhbCA9IHNlbGY7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGxvY2FsID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncG9seWZpbGwgZmFpbGVkIGJlY2F1c2UgZ2xvYmFsIG9iamVjdCBpcyB1bmF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50Jyk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgUCA9IGxvY2FsLlByb21pc2U7XG5cbiAgICAgIGlmIChQICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChQLnJlc29sdmUoKSkgPT09ICdbb2JqZWN0IFByb21pc2VdJyAmJiAhUC5jYXN0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbG9jYWwuUHJvbWlzZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0O1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRwb2x5ZmlsbDtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlID0ge1xuICAgICAgJ1Byb21pc2UnOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCxcbiAgICAgICdwb2x5ZmlsbCc6IGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkZGVmYXVsdFxuICAgIH07XG5cbiAgICAvKiBnbG9iYWwgZGVmaW5lOnRydWUgbW9kdWxlOnRydWUgd2luZG93OiB0cnVlICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lWydhbWQnXSkge1xuICAgICAgZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gbGliJGVzNiRwcm9taXNlJHVtZCQkRVM2UHJvbWlzZTsgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGVbJ2V4cG9ydHMnXSkge1xuICAgICAgbW9kdWxlWydleHBvcnRzJ10gPSBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzWydFUzZQcm9taXNlJ10gPSBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlO1xuICAgIH1cblxuICAgIGxpYiRlczYkcHJvbWlzZSRwb2x5ZmlsbCQkZGVmYXVsdCgpO1xufSkuY2FsbCh0aGlzKTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgcHJvcElzRW51bWVyYWJsZSA9IE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbmZ1bmN0aW9uIHRvT2JqZWN0KHZhbCkge1xuXHRpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignT2JqZWN0LmFzc2lnbiBjYW5ub3QgYmUgY2FsbGVkIHdpdGggbnVsbCBvciB1bmRlZmluZWQnKTtcblx0fVxuXG5cdHJldHVybiBPYmplY3QodmFsKTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkVXNlTmF0aXZlKCkge1xuXHR0cnkge1xuXHRcdGlmICghT2JqZWN0LmFzc2lnbikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIERldGVjdCBidWdneSBwcm9wZXJ0eSBlbnVtZXJhdGlvbiBvcmRlciBpbiBvbGRlciBWOCB2ZXJzaW9ucy5cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTQxMThcblx0XHR2YXIgdGVzdDEgPSBuZXcgU3RyaW5nKCdhYmMnKTsgIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblx0XHR0ZXN0MVs1XSA9ICdkZSc7XG5cdFx0aWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QxKVswXSA9PT0gJzUnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MiA9IHt9O1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKykge1xuXHRcdFx0dGVzdDJbJ18nICsgU3RyaW5nLmZyb21DaGFyQ29kZShpKV0gPSBpO1xuXHRcdH1cblx0XHR2YXIgb3JkZXIyID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDIpLm1hcChmdW5jdGlvbiAobikge1xuXHRcdFx0cmV0dXJuIHRlc3QyW25dO1xuXHRcdH0pO1xuXHRcdGlmIChvcmRlcjIuam9pbignJykgIT09ICcwMTIzNDU2Nzg5Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDMgPSB7fTtcblx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnLnNwbGl0KCcnKS5mb3JFYWNoKGZ1bmN0aW9uIChsZXR0ZXIpIHtcblx0XHRcdHRlc3QzW2xldHRlcl0gPSBsZXR0ZXI7XG5cdFx0fSk7XG5cdFx0aWYgKE9iamVjdC5rZXlzKE9iamVjdC5hc3NpZ24oe30sIHRlc3QzKSkuam9pbignJykgIT09XG5cdFx0XHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdC8vIFdlIGRvbid0IGV4cGVjdCBhbnkgb2YgdGhlIGFib3ZlIHRvIHRocm93LCBidXQgYmV0dGVyIHRvIGJlIHNhZmUuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2hvdWxkVXNlTmF0aXZlKCkgPyBPYmplY3QuYXNzaWduIDogZnVuY3Rpb24gKHRhcmdldCwgc291cmNlKSB7XG5cdHZhciBmcm9tO1xuXHR2YXIgdG8gPSB0b09iamVjdCh0YXJnZXQpO1xuXHR2YXIgc3ltYm9scztcblxuXHRmb3IgKHZhciBzID0gMTsgcyA8IGFyZ3VtZW50cy5sZW5ndGg7IHMrKykge1xuXHRcdGZyb20gPSBPYmplY3QoYXJndW1lbnRzW3NdKTtcblxuXHRcdGZvciAodmFyIGtleSBpbiBmcm9tKSB7XG5cdFx0XHRpZiAoaGFzT3duUHJvcGVydHkuY2FsbChmcm9tLCBrZXkpKSB7XG5cdFx0XHRcdHRvW2tleV0gPSBmcm9tW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcblx0XHRcdHN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGZyb20pO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzeW1ib2xzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChwcm9wSXNFbnVtZXJhYmxlLmNhbGwoZnJvbSwgc3ltYm9sc1tpXSkpIHtcblx0XHRcdFx0XHR0b1tzeW1ib2xzW2ldXSA9IGZyb21bc3ltYm9sc1tpXV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdG87XG59O1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBXYWtlTG9jayA9IHJlcXVpcmUoJy4vd2FrZWxvY2suanMnKTtcblxuLy8gU3RhcnQgYXQgYSBoaWdoZXIgbnVtYmVyIHRvIHJlZHVjZSBjaGFuY2Ugb2YgY29uZmxpY3QuXG52YXIgbmV4dERpc3BsYXlJZCA9IDEwMDA7XG52YXIgaGFzU2hvd0RlcHJlY2F0aW9uV2FybmluZyA9IGZhbHNlO1xuXG4vKipcbiAqIFRoZSBiYXNlIGNsYXNzIGZvciBhbGwgVlIgZGlzcGxheXMuXG4gKi9cbmZ1bmN0aW9uIFZSRGlzcGxheSgpIHtcbiAgdGhpcy5pc1BvbHlmaWxsZWQgPSB0cnVlO1xuICB0aGlzLmRpc3BsYXlJZCA9IG5leHREaXNwbGF5SWQrKztcbiAgdGhpcy5kaXNwbGF5TmFtZSA9ICd3ZWJ2ci1wb2x5ZmlsbCBkaXNwbGF5TmFtZSc7XG5cbiAgdGhpcy5pc0Nvbm5lY3RlZCA9IHRydWU7XG4gIHRoaXMuaXNQcmVzZW50aW5nID0gZmFsc2U7XG4gIHRoaXMuY2FwYWJpbGl0aWVzID0ge1xuICAgIGhhc1Bvc2l0aW9uOiBmYWxzZSxcbiAgICBoYXNPcmllbnRhdGlvbjogZmFsc2UsXG4gICAgaGFzRXh0ZXJuYWxEaXNwbGF5OiBmYWxzZSxcbiAgICBjYW5QcmVzZW50OiBmYWxzZSxcbiAgICBtYXhMYXllcnM6IDFcbiAgfTtcbiAgdGhpcy5zdGFnZVBhcmFtZXRlcnMgPSBudWxsO1xuXG4gIC8vIFwiUHJpdmF0ZVwiIG1lbWJlcnMuXG4gIHRoaXMud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gIHRoaXMubGF5ZXJfID0gbnVsbDtcblxuICB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfID0gbnVsbDtcblxuICB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8gPSBudWxsO1xuXG4gIHRoaXMud2FrZWxvY2tfID0gbmV3IFdha2VMb2NrKCk7XG59XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZ2V0UG9zZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBUT0RPOiBUZWNobmljYWxseSB0aGlzIHNob3VsZCByZXRhaW4gaXQncyB2YWx1ZSBmb3IgdGhlIGR1cmF0aW9uIG9mIGEgZnJhbWVcbiAgLy8gYnV0IEkgZG91YnQgdGhhdCdzIHByYWN0aWNhbCB0byBkbyBpbiBqYXZhc2NyaXB0LlxuICByZXR1cm4gdGhpcy5nZXRJbW1lZGlhdGVQb3NlKCk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHJldHVybiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNhbGxiYWNrKTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihpZCkge1xuICByZXR1cm4gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUud3JhcEZvckZ1bGxzY3JlZW4gPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gIGlmIChVdGlsLmlzSU9TKCkpXG4gICAgcmV0dXJuIGVsZW1lbnQ7XG5cbiAgaWYgKCF0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXykge1xuICAgIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8uY2xhc3NMaXN0LmFkZCgnd2VidnItcG9seWZpbGwtZnVsbHNjcmVlbi13cmFwcGVyJyk7XG4gICAgLy8gTWFrZSBzdXJlIHRoZSB3cmFwcGVyIHRha2VzIHRoZSBmdWxsIHNjcmVlbi4gV2l0aG91dCB0aGlzLCB0aGVyZSBpcyBhXG4gICAgLy8gd2hpdGUgbGluZSBhdCB0aGUgYm90dG9tLlxuICAgIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbiAgfVxuXG4gIGlmICh0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XyA9PSBlbGVtZW50KVxuICAgIHJldHVybiB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXztcblxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzbHkgYXBwbGllZCB3cmFwcGVyc1xuICB0aGlzLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyKCk7XG5cbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8gPSBlbGVtZW50O1xuICB2YXIgcGFyZW50ID0gdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8ucGFyZW50RWxlbWVudDtcbiAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXywgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8pO1xuICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcy5mdWxsc2NyZWVuRWxlbWVudF8pO1xuICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5pbnNlcnRCZWZvcmUodGhpcy5mdWxsc2NyZWVuRWxlbWVudF8sIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLmZpcnN0Q2hpbGQpO1xuXG4gIHJldHVybiB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXztcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUucmVtb3ZlRnVsbHNjcmVlbldyYXBwZXIgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XylcbiAgICByZXR1cm47XG5cbiAgdmFyIGVsZW1lbnQgPSB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XztcbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8gPSBudWxsO1xuXG4gIHZhciBwYXJlbnQgPSB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5wYXJlbnRFbGVtZW50O1xuICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5yZW1vdmVDaGlsZChlbGVtZW50KTtcbiAgcGFyZW50Lmluc2VydEJlZm9yZShlbGVtZW50LCB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXyk7XG4gIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXyk7XG5cbiAgcmV0dXJuIGVsZW1lbnQ7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnJlcXVlc3RQcmVzZW50ID0gZnVuY3Rpb24obGF5ZXJzKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBpZiAoIShsYXllcnMgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICBpZiAoIWhhc1Nob3dEZXByZWNhdGlvbldhcm5pbmcpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIlVzaW5nIGEgZGVwcmVjYXRlZCBmb3JtIG9mIHJlcXVlc3RQcmVzZW50LiBTaG91bGQgcGFzcyBpbiBhbiBhcnJheSBvZiBWUkxheWVycy5cIik7XG4gICAgICBoYXNTaG93RGVwcmVjYXRpb25XYXJuaW5nID0gdHJ1ZTtcbiAgICB9XG4gICAgbGF5ZXJzID0gW2xheWVyc107XG4gIH1cblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgaWYgKCFzZWxmLmNhcGFiaWxpdGllcy5jYW5QcmVzZW50KSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdWUkRpc3BsYXkgaXMgbm90IGNhcGFibGUgb2YgcHJlc2VudGluZy4nKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGxheWVycy5sZW5ndGggPT0gMCB8fCBsYXllcnMubGVuZ3RoID4gc2VsZi5jYXBhYmlsaXRpZXMubWF4TGF5ZXJzKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdJbnZhbGlkIG51bWJlciBvZiBsYXllcnMuJykpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYubGF5ZXJfID0gbGF5ZXJzWzBdO1xuXG4gICAgc2VsZi53YWl0aW5nRm9yUHJlc2VudF8gPSBmYWxzZTtcbiAgICBpZiAoc2VsZi5sYXllcl8gJiYgc2VsZi5sYXllcl8uc291cmNlKSB7XG4gICAgICB2YXIgZnVsbHNjcmVlbkVsZW1lbnQgPSBzZWxmLndyYXBGb3JGdWxsc2NyZWVuKHNlbGYubGF5ZXJfLnNvdXJjZSk7XG5cbiAgICAgIGZ1bmN0aW9uIG9uRnVsbHNjcmVlbkNoYW5nZSgpIHtcbiAgICAgICAgdmFyIGFjdHVhbEZ1bGxzY3JlZW5FbGVtZW50ID0gVXRpbC5nZXRGdWxsc2NyZWVuRWxlbWVudCgpO1xuXG4gICAgICAgIHNlbGYuaXNQcmVzZW50aW5nID0gKGZ1bGxzY3JlZW5FbGVtZW50ID09PSBhY3R1YWxGdWxsc2NyZWVuRWxlbWVudCk7XG4gICAgICAgIGlmIChzZWxmLmlzUHJlc2VudGluZykge1xuICAgICAgICAgIGlmIChzY3JlZW4ub3JpZW50YXRpb24gJiYgc2NyZWVuLm9yaWVudGF0aW9uLmxvY2spIHtcbiAgICAgICAgICAgIHNjcmVlbi5vcmllbnRhdGlvbi5sb2NrKCdsYW5kc2NhcGUtcHJpbWFyeScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZWxmLndhaXRpbmdGb3JQcmVzZW50XyA9IGZhbHNlO1xuICAgICAgICAgIHNlbGYuYmVnaW5QcmVzZW50XygpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoc2NyZWVuLm9yaWVudGF0aW9uICYmIHNjcmVlbi5vcmllbnRhdGlvbi51bmxvY2spIHtcbiAgICAgICAgICAgIHNjcmVlbi5vcmllbnRhdGlvbi51bmxvY2soKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2VsZi5yZW1vdmVGdWxsc2NyZWVuV3JhcHBlcigpO1xuICAgICAgICAgIHNlbGYud2FrZWxvY2tfLnJlbGVhc2UoKTtcbiAgICAgICAgICBzZWxmLmVuZFByZXNlbnRfKCk7XG4gICAgICAgICAgc2VsZi5yZW1vdmVGdWxsc2NyZWVuTGlzdGVuZXJzXygpO1xuICAgICAgICB9XG4gICAgICAgIHNlbGYuZmlyZVZSRGlzcGxheVByZXNlbnRDaGFuZ2VfKCk7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBvbkZ1bGxzY3JlZW5FcnJvcigpIHtcbiAgICAgICAgaWYgKCFzZWxmLndhaXRpbmdGb3JQcmVzZW50Xykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbldyYXBwZXIoKTtcbiAgICAgICAgc2VsZi5yZW1vdmVGdWxsc2NyZWVuTGlzdGVuZXJzXygpO1xuXG4gICAgICAgIHNlbGYud2FrZWxvY2tfLnJlbGVhc2UoKTtcbiAgICAgICAgc2VsZi53YWl0aW5nRm9yUHJlc2VudF8gPSBmYWxzZTtcbiAgICAgICAgc2VsZi5pc1ByZXNlbnRpbmcgPSBmYWxzZTtcblxuICAgICAgICByZWplY3QobmV3IEVycm9yKCdVbmFibGUgdG8gcHJlc2VudC4nKSk7XG4gICAgICB9XG5cbiAgICAgIHNlbGYuYWRkRnVsbHNjcmVlbkxpc3RlbmVyc18oZnVsbHNjcmVlbkVsZW1lbnQsXG4gICAgICAgICAgb25GdWxsc2NyZWVuQ2hhbmdlLCBvbkZ1bGxzY3JlZW5FcnJvcik7XG5cbiAgICAgIGlmIChVdGlsLnJlcXVlc3RGdWxsc2NyZWVuKGZ1bGxzY3JlZW5FbGVtZW50KSkge1xuICAgICAgICBzZWxmLndha2Vsb2NrXy5yZXF1ZXN0KCk7XG4gICAgICAgIHNlbGYud2FpdGluZ0ZvclByZXNlbnRfID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgICAgIC8vICpzaWdoKiBKdXN0IGZha2UgaXQuXG4gICAgICAgIHNlbGYud2FrZWxvY2tfLnJlcXVlc3QoKTtcbiAgICAgICAgc2VsZi5pc1ByZXNlbnRpbmcgPSB0cnVlO1xuICAgICAgICBzZWxmLmJlZ2luUHJlc2VudF8oKTtcbiAgICAgICAgc2VsZi5maXJlVlJEaXNwbGF5UHJlc2VudENoYW5nZV8oKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghc2VsZi53YWl0aW5nRm9yUHJlc2VudF8gJiYgIVV0aWwuaXNJT1MoKSkge1xuICAgICAgVXRpbC5leGl0RnVsbHNjcmVlbigpO1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcignVW5hYmxlIHRvIHByZXNlbnQuJykpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmV4aXRQcmVzZW50ID0gZnVuY3Rpb24oKSB7XG4gIHZhciB3YXNQcmVzZW50aW5nID0gdGhpcy5pc1ByZXNlbnRpbmc7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5pc1ByZXNlbnRpbmcgPSBmYWxzZTtcbiAgdGhpcy5sYXllcl8gPSBudWxsO1xuICB0aGlzLndha2Vsb2NrXy5yZWxlYXNlKCk7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmICh3YXNQcmVzZW50aW5nKSB7XG4gICAgICBpZiAoIVV0aWwuZXhpdEZ1bGxzY3JlZW4oKSAmJiBVdGlsLmlzSU9TKCkpIHtcbiAgICAgICAgc2VsZi5lbmRQcmVzZW50XygpO1xuICAgICAgICBzZWxmLmZpcmVWUkRpc3BsYXlQcmVzZW50Q2hhbmdlXygpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyKCk7XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcignV2FzIG5vdCBwcmVzZW50aW5nIHRvIFZSRGlzcGxheS4nKSk7XG4gICAgfVxuICB9KTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZ2V0TGF5ZXJzID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmxheWVyXykge1xuICAgIHJldHVybiBbdGhpcy5sYXllcl9dO1xuICB9XG4gIHJldHVybiBbXTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZmlyZVZSRGlzcGxheVByZXNlbnRDaGFuZ2VfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudCgndnJkaXNwbGF5cHJlc2VudGNoYW5nZScsIHtkZXRhaWw6IHt2cmRpc3BsYXk6IHRoaXN9fSk7XG4gIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuYWRkRnVsbHNjcmVlbkxpc3RlbmVyc18gPSBmdW5jdGlvbihlbGVtZW50LCBjaGFuZ2VIYW5kbGVyLCBlcnJvckhhbmRsZXIpIHtcbiAgdGhpcy5yZW1vdmVGdWxsc2NyZWVuTGlzdGVuZXJzXygpO1xuXG4gIHRoaXMuZnVsbHNjcmVlbkV2ZW50VGFyZ2V0XyA9IGVsZW1lbnQ7XG4gIHRoaXMuZnVsbHNjcmVlbkNoYW5nZUhhbmRsZXJfID0gY2hhbmdlSGFuZGxlcjtcbiAgdGhpcy5mdWxsc2NyZWVuRXJyb3JIYW5kbGVyXyA9IGVycm9ySGFuZGxlcjtcblxuICBpZiAoY2hhbmdlSGFuZGxlcikge1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdGZ1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21zZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgfVxuXG4gIGlmIChlcnJvckhhbmRsZXIpIHtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0ZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICB9XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnJlbW92ZUZ1bGxzY3JlZW5MaXN0ZW5lcnNfID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5mdWxsc2NyZWVuRXZlbnRUYXJnZXRfKVxuICAgIHJldHVybjtcblxuICB2YXIgZWxlbWVudCA9IHRoaXMuZnVsbHNjcmVlbkV2ZW50VGFyZ2V0XztcblxuICBpZiAodGhpcy5mdWxsc2NyZWVuQ2hhbmdlSGFuZGxlcl8pIHtcbiAgICB2YXIgY2hhbmdlSGFuZGxlciA9IHRoaXMuZnVsbHNjcmVlbkNoYW5nZUhhbmRsZXJfO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3dlYmtpdGZ1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21zZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgfVxuXG4gIGlmICh0aGlzLmZ1bGxzY3JlZW5FcnJvckhhbmRsZXJfKSB7XG4gICAgdmFyIGVycm9ySGFuZGxlciA9IHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl87XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3dlYmtpdGZ1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbXNmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgfVxuXG4gIHRoaXMuZnVsbHNjcmVlbkV2ZW50VGFyZ2V0XyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbkNoYW5nZUhhbmRsZXJfID0gbnVsbDtcbiAgdGhpcy5mdWxsc2NyZWVuRXJyb3JIYW5kbGVyXyA9IG51bGw7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmJlZ2luUHJlc2VudF8gPSBmdW5jdGlvbigpIHtcbiAgLy8gT3ZlcnJpZGUgdG8gYWRkIGN1c3RvbSBiZWhhdmlvciB3aGVuIHByZXNlbnRhdGlvbiBiZWdpbnMuXG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmVuZFByZXNlbnRfID0gZnVuY3Rpb24oKSB7XG4gIC8vIE92ZXJyaWRlIHRvIGFkZCBjdXN0b20gYmVoYXZpb3Igd2hlbiBwcmVzZW50YXRpb24gZW5kcy5cbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuc3VibWl0RnJhbWUgPSBmdW5jdGlvbihwb3NlKSB7XG4gIC8vIE92ZXJyaWRlIHRvIGFkZCBjdXN0b20gYmVoYXZpb3IgZm9yIGZyYW1lIHN1Ym1pc3Npb24uXG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmdldEV5ZVBhcmFtZXRlcnMgPSBmdW5jdGlvbih3aGljaEV5ZSkge1xuICAvLyBPdmVycmlkZSB0byByZXR1cm4gYWNjdXJhdGUgZXllIHBhcmFtZXRlcnMgaXMgY2FuUHJlc2VudCBpcyB0cnVlLlxuICByZXR1cm4gbnVsbDtcbn07XG5cbi8qXG4gKiBEZXByZWNhdGVkIGNsYXNzZXNcbiAqL1xuXG4vKipcbiAqIFRoZSBiYXNlIGNsYXNzIGZvciBhbGwgVlIgZGV2aWNlcy4gKERlcHJlY2F0ZWQpXG4gKi9cbmZ1bmN0aW9uIFZSRGV2aWNlKCkge1xuICB0aGlzLmlzUG9seWZpbGxlZCA9IHRydWU7XG4gIHRoaXMuaGFyZHdhcmVVbml0SWQgPSAnd2VidnItcG9seWZpbGwgaGFyZHdhcmVVbml0SWQnO1xuICB0aGlzLmRldmljZUlkID0gJ3dlYnZyLXBvbHlmaWxsIGRldmljZUlkJztcbiAgdGhpcy5kZXZpY2VOYW1lID0gJ3dlYnZyLXBvbHlmaWxsIGRldmljZU5hbWUnO1xufVxuXG4vKipcbiAqIFRoZSBiYXNlIGNsYXNzIGZvciBhbGwgVlIgSE1EIGRldmljZXMuIChEZXByZWNhdGVkKVxuICovXG5mdW5jdGlvbiBITURWUkRldmljZSgpIHtcbn1cbkhNRFZSRGV2aWNlLnByb3RvdHlwZSA9IG5ldyBWUkRldmljZSgpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGNsYXNzIGZvciBhbGwgVlIgcG9zaXRpb24gc2Vuc29yIGRldmljZXMuIChEZXByZWNhdGVkKVxuICovXG5mdW5jdGlvbiBQb3NpdGlvblNlbnNvclZSRGV2aWNlKCkge1xufVxuUG9zaXRpb25TZW5zb3JWUkRldmljZS5wcm90b3R5cGUgPSBuZXcgVlJEZXZpY2UoKTtcblxubW9kdWxlLmV4cG9ydHMuVlJEaXNwbGF5ID0gVlJEaXNwbGF5O1xubW9kdWxlLmV4cG9ydHMuVlJEZXZpY2UgPSBWUkRldmljZTtcbm1vZHVsZS5leHBvcnRzLkhNRFZSRGV2aWNlID0gSE1EVlJEZXZpY2U7XG5tb2R1bGUuZXhwb3J0cy5Qb3NpdGlvblNlbnNvclZSRGV2aWNlID0gUG9zaXRpb25TZW5zb3JWUkRldmljZTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBDYXJkYm9hcmRVSSA9IHJlcXVpcmUoJy4vY2FyZGJvYXJkLXVpLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xudmFyIFdHTFVQcmVzZXJ2ZUdMU3RhdGUgPSByZXF1aXJlKCcuL2RlcHMvd2dsdS1wcmVzZXJ2ZS1zdGF0ZS5qcycpO1xuXG52YXIgZGlzdG9ydGlvblZTID0gW1xuICAnYXR0cmlidXRlIHZlYzIgcG9zaXRpb247JyxcbiAgJ2F0dHJpYnV0ZSB2ZWMzIHRleENvb3JkOycsXG5cbiAgJ3ZhcnlpbmcgdmVjMiB2VGV4Q29vcmQ7JyxcblxuICAndW5pZm9ybSB2ZWM0IHZpZXdwb3J0T2Zmc2V0U2NhbGVbMl07JyxcblxuICAndm9pZCBtYWluKCkgeycsXG4gICcgIHZlYzQgdmlld3BvcnQgPSB2aWV3cG9ydE9mZnNldFNjYWxlW2ludCh0ZXhDb29yZC56KV07JyxcbiAgJyAgdlRleENvb3JkID0gKHRleENvb3JkLnh5ICogdmlld3BvcnQuencpICsgdmlld3BvcnQueHk7JyxcbiAgJyAgZ2xfUG9zaXRpb24gPSB2ZWM0KCBwb3NpdGlvbiwgMS4wLCAxLjAgKTsnLFxuICAnfScsXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgZGlzdG9ydGlvbkZTID0gW1xuICAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7JyxcbiAgJ3VuaWZvcm0gc2FtcGxlcjJEIGRpZmZ1c2U7JyxcblxuICAndmFyeWluZyB2ZWMyIHZUZXhDb29yZDsnLFxuXG4gICd2b2lkIG1haW4oKSB7JyxcbiAgJyAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKGRpZmZ1c2UsIHZUZXhDb29yZCk7JyxcbiAgJ30nLFxuXS5qb2luKCdcXG4nKTtcblxuLyoqXG4gKiBBIG1lc2gtYmFzZWQgZGlzdG9ydGVyLlxuICovXG5mdW5jdGlvbiBDYXJkYm9hcmREaXN0b3J0ZXIoZ2wpIHtcbiAgdGhpcy5nbCA9IGdsO1xuICB0aGlzLmN0eEF0dHJpYnMgPSBnbC5nZXRDb250ZXh0QXR0cmlidXRlcygpO1xuXG4gIHRoaXMubWVzaFdpZHRoID0gMjA7XG4gIHRoaXMubWVzaEhlaWdodCA9IDIwO1xuXG4gIHRoaXMuYnVmZmVyU2NhbGUgPSBXZWJWUkNvbmZpZy5CVUZGRVJfU0NBTEU7XG5cbiAgdGhpcy5idWZmZXJXaWR0aCA9IGdsLmRyYXdpbmdCdWZmZXJXaWR0aDtcbiAgdGhpcy5idWZmZXJIZWlnaHQgPSBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0O1xuXG4gIC8vIFBhdGNoaW5nIHN1cHBvcnRcbiAgdGhpcy5yZWFsQmluZEZyYW1lYnVmZmVyID0gZ2wuYmluZEZyYW1lYnVmZmVyO1xuICB0aGlzLnJlYWxFbmFibGUgPSBnbC5lbmFibGU7XG4gIHRoaXMucmVhbERpc2FibGUgPSBnbC5kaXNhYmxlO1xuICB0aGlzLnJlYWxDb2xvck1hc2sgPSBnbC5jb2xvck1hc2s7XG4gIHRoaXMucmVhbENsZWFyQ29sb3IgPSBnbC5jbGVhckNvbG9yO1xuICB0aGlzLnJlYWxWaWV3cG9ydCA9IGdsLnZpZXdwb3J0O1xuXG4gIGlmICghVXRpbC5pc0lPUygpKSB7XG4gICAgdGhpcy5yZWFsQ2FudmFzV2lkdGggPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGdsLmNhbnZhcy5fX3Byb3RvX18sICd3aWR0aCcpO1xuICAgIHRoaXMucmVhbENhbnZhc0hlaWdodCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZ2wuY2FudmFzLl9fcHJvdG9fXywgJ2hlaWdodCcpO1xuICB9XG5cbiAgdGhpcy5pc1BhdGNoZWQgPSBmYWxzZTtcblxuICAvLyBTdGF0ZSB0cmFja2luZ1xuICB0aGlzLmxhc3RCb3VuZEZyYW1lYnVmZmVyID0gbnVsbDtcbiAgdGhpcy5jdWxsRmFjZSA9IGZhbHNlO1xuICB0aGlzLmRlcHRoVGVzdCA9IGZhbHNlO1xuICB0aGlzLmJsZW5kID0gZmFsc2U7XG4gIHRoaXMuc2Npc3NvclRlc3QgPSBmYWxzZTtcbiAgdGhpcy5zdGVuY2lsVGVzdCA9IGZhbHNlO1xuICB0aGlzLnZpZXdwb3J0ID0gWzAsIDAsIDAsIDBdO1xuICB0aGlzLmNvbG9yTWFzayA9IFt0cnVlLCB0cnVlLCB0cnVlLCB0cnVlXTtcbiAgdGhpcy5jbGVhckNvbG9yID0gWzAsIDAsIDAsIDBdO1xuXG4gIHRoaXMuYXR0cmlicyA9IHtcbiAgICBwb3NpdGlvbjogMCxcbiAgICB0ZXhDb29yZDogMVxuICB9O1xuICB0aGlzLnByb2dyYW0gPSBVdGlsLmxpbmtQcm9ncmFtKGdsLCBkaXN0b3J0aW9uVlMsIGRpc3RvcnRpb25GUywgdGhpcy5hdHRyaWJzKTtcbiAgdGhpcy51bmlmb3JtcyA9IFV0aWwuZ2V0UHJvZ3JhbVVuaWZvcm1zKGdsLCB0aGlzLnByb2dyYW0pO1xuXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZSA9IG5ldyBGbG9hdDMyQXJyYXkoOCk7XG4gIHRoaXMuc2V0VGV4dHVyZUJvdW5kcygpO1xuXG4gIHRoaXMudmVydGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gIHRoaXMuaW5kZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgdGhpcy5pbmRleENvdW50ID0gMDtcblxuICB0aGlzLnJlbmRlclRhcmdldCA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcbiAgdGhpcy5mcmFtZWJ1ZmZlciA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG5cbiAgdGhpcy5kZXB0aFN0ZW5jaWxCdWZmZXIgPSBudWxsO1xuICB0aGlzLmRlcHRoQnVmZmVyID0gbnVsbDtcbiAgdGhpcy5zdGVuY2lsQnVmZmVyID0gbnVsbDtcblxuICBpZiAodGhpcy5jdHhBdHRyaWJzLmRlcHRoICYmIHRoaXMuY3R4QXR0cmlicy5zdGVuY2lsKSB7XG4gICAgdGhpcy5kZXB0aFN0ZW5jaWxCdWZmZXIgPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgfSBlbHNlIGlmICh0aGlzLmN0eEF0dHJpYnMuZGVwdGgpIHtcbiAgICB0aGlzLmRlcHRoQnVmZmVyID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gIH0gZWxzZSBpZiAodGhpcy5jdHhBdHRyaWJzLnN0ZW5jaWwpIHtcbiAgICB0aGlzLnN0ZW5jaWxCdWZmZXIgPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgfVxuXG4gIHRoaXMucGF0Y2goKTtcblxuICB0aGlzLm9uUmVzaXplKCk7XG5cbiAgdGhpcy5jYXJkYm9hcmRVSSA9IG5ldyBDYXJkYm9hcmRVSShnbCk7XG59O1xuXG4vKipcbiAqIFRlYXJzIGRvd24gYWxsIHRoZSByZXNvdXJjZXMgY3JlYXRlZCBieSB0aGUgZGlzdG9ydGVyIGFuZCByZW1vdmVzIGFueVxuICogcGF0Y2hlcy5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG5cbiAgdGhpcy51bnBhdGNoKCk7XG5cbiAgZ2wuZGVsZXRlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xuICBnbC5kZWxldGVCdWZmZXIodGhpcy52ZXJ0ZXhCdWZmZXIpO1xuICBnbC5kZWxldGVCdWZmZXIodGhpcy5pbmRleEJ1ZmZlcik7XG4gIGdsLmRlbGV0ZVRleHR1cmUodGhpcy5yZW5kZXJUYXJnZXQpO1xuICBnbC5kZWxldGVGcmFtZWJ1ZmZlcih0aGlzLmZyYW1lYnVmZmVyKTtcbiAgaWYgKHRoaXMuZGVwdGhTdGVuY2lsQnVmZmVyKSB7XG4gICAgZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMuZGVwdGhTdGVuY2lsQnVmZmVyKTtcbiAgfVxuICBpZiAodGhpcy5kZXB0aEJ1ZmZlcikge1xuICAgIGdsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLmRlcHRoQnVmZmVyKTtcbiAgfVxuICBpZiAodGhpcy5zdGVuY2lsQnVmZmVyKSB7XG4gICAgZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMuc3RlbmNpbEJ1ZmZlcik7XG4gIH1cblxuICB0aGlzLmNhcmRib2FyZFVJLmRlc3Ryb3koKTtcbn07XG5cblxuLyoqXG4gKiBSZXNpemVzIHRoZSBiYWNrYnVmZmVyIHRvIG1hdGNoIHRoZSBjYW52YXMgd2lkdGggYW5kIGhlaWdodC5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5vblJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbXG4gICAgZ2wuUkVOREVSQlVGRkVSX0JJTkRJTkcsXG4gICAgZ2wuVEVYVFVSRV9CSU5ESU5HXzJELCBnbC5URVhUVVJFMFxuICBdO1xuXG4gIFdHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIGdsU3RhdGUsIGZ1bmN0aW9uKGdsKSB7XG4gICAgLy8gQmluZCByZWFsIGJhY2tidWZmZXIgYW5kIGNsZWFyIGl0IG9uY2UuIFdlIGRvbid0IG5lZWQgdG8gY2xlYXIgaXQgYWdhaW5cbiAgICAvLyBhZnRlciB0aGF0IGJlY2F1c2Ugd2UncmUgb3ZlcndyaXRpbmcgdGhlIHNhbWUgYXJlYSBldmVyeSBmcmFtZS5cbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuXG4gICAgLy8gUHV0IHRoaW5ncyBpbiBhIGdvb2Qgc3RhdGVcbiAgICBpZiAoc2VsZi5zY2lzc29yVGVzdCkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLlNDSVNTT1JfVEVTVCk7IH1cbiAgICBzZWxmLnJlYWxDb2xvck1hc2suY2FsbChnbCwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuY2FsbChnbCwgMCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcbiAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmNhbGwoZ2wsIDAsIDAsIDAsIDEpO1xuXG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG5cbiAgICAvLyBOb3cgYmluZCBhbmQgcmVzaXplIHRoZSBmYWtlIGJhY2tidWZmZXJcbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIHNlbGYuZnJhbWVidWZmZXIpO1xuXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgc2VsZi5yZW5kZXJUYXJnZXQpO1xuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgc2VsZi5jdHhBdHRyaWJzLmFscGhhID8gZ2wuUkdCQSA6IGdsLlJHQixcbiAgICAgICAgc2VsZi5idWZmZXJXaWR0aCwgc2VsZi5idWZmZXJIZWlnaHQsIDAsXG4gICAgICAgIHNlbGYuY3R4QXR0cmlicy5hbHBoYSA/IGdsLlJHQkEgOiBnbC5SR0IsIGdsLlVOU0lHTkVEX0JZVEUsIG51bGwpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5MSU5FQVIpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgc2VsZi5yZW5kZXJUYXJnZXQsIDApO1xuXG4gICAgaWYgKHNlbGYuY3R4QXR0cmlicy5kZXB0aCAmJiBzZWxmLmN0eEF0dHJpYnMuc3RlbmNpbCkge1xuICAgICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIHNlbGYuZGVwdGhTdGVuY2lsQnVmZmVyKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoZ2wuUkVOREVSQlVGRkVSLCBnbC5ERVBUSF9TVEVOQ0lMLFxuICAgICAgICAgIHNlbGYuYnVmZmVyV2lkdGgsIHNlbGYuYnVmZmVySGVpZ2h0KTtcbiAgICAgIGdsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9TVEVOQ0lMX0FUVEFDSE1FTlQsXG4gICAgICAgICAgZ2wuUkVOREVSQlVGRkVSLCBzZWxmLmRlcHRoU3RlbmNpbEJ1ZmZlcik7XG4gICAgfSBlbHNlIGlmIChzZWxmLmN0eEF0dHJpYnMuZGVwdGgpIHtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBzZWxmLmRlcHRoQnVmZmVyKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoZ2wuUkVOREVSQlVGRkVSLCBnbC5ERVBUSF9DT01QT05FTlQxNixcbiAgICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoLCBzZWxmLmJ1ZmZlckhlaWdodCk7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZ2wuREVQVEhfQVRUQUNITUVOVCxcbiAgICAgICAgICBnbC5SRU5ERVJCVUZGRVIsIHNlbGYuZGVwdGhCdWZmZXIpO1xuICAgIH0gZWxzZSBpZiAoc2VsZi5jdHhBdHRyaWJzLnN0ZW5jaWwpIHtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBzZWxmLnN0ZW5jaWxCdWZmZXIpO1xuICAgICAgZ2wucmVuZGVyYnVmZmVyU3RvcmFnZShnbC5SRU5ERVJCVUZGRVIsIGdsLlNURU5DSUxfSU5ERVg4LFxuICAgICAgICAgIHNlbGYuYnVmZmVyV2lkdGgsIHNlbGYuYnVmZmVySGVpZ2h0KTtcbiAgICAgIGdsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBnbC5TVEVOQ0lMX0FUVEFDSE1FTlQsXG4gICAgICAgICAgZ2wuUkVOREVSQlVGRkVSLCBzZWxmLnN0ZW5jaWxCdWZmZXIpO1xuICAgIH1cblxuICAgIGlmICghZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhnbC5GUkFNRUJVRkZFUikgPT09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdGcmFtZWJ1ZmZlciBpbmNvbXBsZXRlIScpO1xuICAgIH1cblxuICAgIHNlbGYucmVhbEJpbmRGcmFtZWJ1ZmZlci5jYWxsKGdsLCBnbC5GUkFNRUJVRkZFUiwgc2VsZi5sYXN0Qm91bmRGcmFtZWJ1ZmZlcik7XG5cbiAgICBpZiAoc2VsZi5zY2lzc29yVGVzdCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuU0NJU1NPUl9URVNUKTsgfVxuXG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmFwcGx5KGdsLCBzZWxmLmNvbG9yTWFzayk7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuYXBwbHkoZ2wsIHNlbGYudmlld3BvcnQpO1xuICAgIHNlbGYucmVhbENsZWFyQ29sb3IuYXBwbHkoZ2wsIHNlbGYuY2xlYXJDb2xvcik7XG4gIH0pO1xuXG4gIGlmICh0aGlzLmNhcmRib2FyZFVJKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSS5vblJlc2l6ZSgpO1xuICB9XG59O1xuXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLnBhdGNoID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmlzUGF0Y2hlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGNhbnZhcyA9IHRoaXMuZ2wuY2FudmFzO1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gIGlmICghVXRpbC5pc0lPUygpKSB7XG4gICAgY2FudmFzLndpZHRoID0gVXRpbC5nZXRTY3JlZW5XaWR0aCgpICogdGhpcy5idWZmZXJTY2FsZTtcbiAgICBjYW52YXMuaGVpZ2h0ID0gVXRpbC5nZXRTY3JlZW5IZWlnaHQoKSAqIHRoaXMuYnVmZmVyU2NhbGU7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FudmFzLCAnd2lkdGgnLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuYnVmZmVyV2lkdGg7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoID0gdmFsdWU7XG4gICAgICAgIHNlbGYub25SZXNpemUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjYW52YXMsICdoZWlnaHQnLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuYnVmZmVySGVpZ2h0O1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgc2VsZi5idWZmZXJIZWlnaHQgPSB2YWx1ZTtcbiAgICAgICAgc2VsZi5vblJlc2l6ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9IGdsLmdldFBhcmFtZXRlcihnbC5GUkFNRUJVRkZFUl9CSU5ESU5HKTtcblxuICBpZiAodGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9PSBudWxsKSB7XG4gICAgdGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9IHRoaXMuZnJhbWVidWZmZXI7XG4gICAgdGhpcy5nbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHRoaXMuZnJhbWVidWZmZXIpO1xuICB9XG5cbiAgdGhpcy5nbC5iaW5kRnJhbWVidWZmZXIgPSBmdW5jdGlvbih0YXJnZXQsIGZyYW1lYnVmZmVyKSB7XG4gICAgc2VsZi5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9IGZyYW1lYnVmZmVyID8gZnJhbWVidWZmZXIgOiBzZWxmLmZyYW1lYnVmZmVyO1xuICAgIC8vIFNpbGVudGx5IG1ha2UgY2FsbHMgdG8gYmluZCB0aGUgZGVmYXVsdCBmcmFtZWJ1ZmZlciBiaW5kIG91cnMgaW5zdGVhZC5cbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgdGFyZ2V0LCBzZWxmLmxhc3RCb3VuZEZyYW1lYnVmZmVyKTtcbiAgfTtcblxuICB0aGlzLmN1bGxGYWNlID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkNVTExfRkFDRSk7XG4gIHRoaXMuZGVwdGhUZXN0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkRFUFRIX1RFU1QpO1xuICB0aGlzLmJsZW5kID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkJMRU5EKTtcbiAgdGhpcy5zY2lzc29yVGVzdCA9IGdsLmdldFBhcmFtZXRlcihnbC5TQ0lTU09SX1RFU1QpO1xuICB0aGlzLnN0ZW5jaWxUZXN0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlNURU5DSUxfVEVTVCk7XG5cbiAgZ2wuZW5hYmxlID0gZnVuY3Rpb24ocG5hbWUpIHtcbiAgICBzd2l0Y2ggKHBuYW1lKSB7XG4gICAgICBjYXNlIGdsLkNVTExfRkFDRTogc2VsZi5jdWxsRmFjZSA9IHRydWU7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5ERVBUSF9URVNUOiBzZWxmLmRlcHRoVGVzdCA9IHRydWU7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5CTEVORDogc2VsZi5ibGVuZCA9IHRydWU7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5TQ0lTU09SX1RFU1Q6IHNlbGYuc2Npc3NvclRlc3QgPSB0cnVlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuU1RFTkNJTF9URVNUOiBzZWxmLnN0ZW5jaWxUZXN0ID0gdHJ1ZTsgYnJlYWs7XG4gICAgfVxuICAgIHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBwbmFtZSk7XG4gIH07XG5cbiAgZ2wuZGlzYWJsZSA9IGZ1bmN0aW9uKHBuYW1lKSB7XG4gICAgc3dpdGNoIChwbmFtZSkge1xuICAgICAgY2FzZSBnbC5DVUxMX0ZBQ0U6IHNlbGYuY3VsbEZhY2UgPSBmYWxzZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLkRFUFRIX1RFU1Q6IHNlbGYuZGVwdGhUZXN0ID0gZmFsc2U7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5CTEVORDogc2VsZi5ibGVuZCA9IGZhbHNlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuU0NJU1NPUl9URVNUOiBzZWxmLnNjaXNzb3JUZXN0ID0gZmFsc2U7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5TVEVOQ0lMX1RFU1Q6IHNlbGYuc3RlbmNpbFRlc3QgPSBmYWxzZTsgYnJlYWs7XG4gICAgfVxuICAgIHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgcG5hbWUpO1xuICB9O1xuXG4gIHRoaXMuY29sb3JNYXNrID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkNPTE9SX1dSSVRFTUFTSyk7XG4gIGdsLmNvbG9yTWFzayA9IGZ1bmN0aW9uKHIsIGcsIGIsIGEpIHtcbiAgICBzZWxmLmNvbG9yTWFza1swXSA9IHI7XG4gICAgc2VsZi5jb2xvck1hc2tbMV0gPSBnO1xuICAgIHNlbGYuY29sb3JNYXNrWzJdID0gYjtcbiAgICBzZWxmLmNvbG9yTWFza1szXSA9IGE7XG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmNhbGwoZ2wsIHIsIGcsIGIsIGEpO1xuICB9O1xuXG4gIHRoaXMuY2xlYXJDb2xvciA9IGdsLmdldFBhcmFtZXRlcihnbC5DT0xPUl9DTEVBUl9WQUxVRSk7XG4gIGdsLmNsZWFyQ29sb3IgPSBmdW5jdGlvbihyLCBnLCBiLCBhKSB7XG4gICAgc2VsZi5jbGVhckNvbG9yWzBdID0gcjtcbiAgICBzZWxmLmNsZWFyQ29sb3JbMV0gPSBnO1xuICAgIHNlbGYuY2xlYXJDb2xvclsyXSA9IGI7XG4gICAgc2VsZi5jbGVhckNvbG9yWzNdID0gYTtcbiAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmNhbGwoZ2wsIHIsIGcsIGIsIGEpO1xuICB9O1xuXG4gIHRoaXMudmlld3BvcnQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuVklFV1BPUlQpO1xuICBnbC52aWV3cG9ydCA9IGZ1bmN0aW9uKHgsIHksIHcsIGgpIHtcbiAgICBzZWxmLnZpZXdwb3J0WzBdID0geDtcbiAgICBzZWxmLnZpZXdwb3J0WzFdID0geTtcbiAgICBzZWxmLnZpZXdwb3J0WzJdID0gdztcbiAgICBzZWxmLnZpZXdwb3J0WzNdID0gaDtcbiAgICBzZWxmLnJlYWxWaWV3cG9ydC5jYWxsKGdsLCB4LCB5LCB3LCBoKTtcbiAgfTtcblxuICB0aGlzLmlzUGF0Y2hlZCA9IHRydWU7XG59O1xuXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLnVucGF0Y2ggPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmlzUGF0Y2hlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBnbCA9IHRoaXMuZ2w7XG4gIHZhciBjYW52YXMgPSB0aGlzLmdsLmNhbnZhcztcblxuICBpZiAoIVV0aWwuaXNJT1MoKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjYW52YXMsICd3aWR0aCcsIHRoaXMucmVhbENhbnZhc1dpZHRoKTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FudmFzLCAnaGVpZ2h0JywgdGhpcy5yZWFsQ2FudmFzSGVpZ2h0KTtcbiAgfVxuICBjYW52YXMud2lkdGggPSB0aGlzLmJ1ZmZlcldpZHRoO1xuICBjYW52YXMuaGVpZ2h0ID0gdGhpcy5idWZmZXJIZWlnaHQ7XG5cbiAgZ2wuYmluZEZyYW1lYnVmZmVyID0gdGhpcy5yZWFsQmluZEZyYW1lYnVmZmVyO1xuICBnbC5lbmFibGUgPSB0aGlzLnJlYWxFbmFibGU7XG4gIGdsLmRpc2FibGUgPSB0aGlzLnJlYWxEaXNhYmxlO1xuICBnbC5jb2xvck1hc2sgPSB0aGlzLnJlYWxDb2xvck1hc2s7XG4gIGdsLmNsZWFyQ29sb3IgPSB0aGlzLnJlYWxDbGVhckNvbG9yO1xuICBnbC52aWV3cG9ydCA9IHRoaXMucmVhbFZpZXdwb3J0O1xuXG4gIC8vIENoZWNrIHRvIHNlZSBpZiBvdXIgZmFrZSBiYWNrYnVmZmVyIGlzIGJvdW5kIGFuZCBiaW5kIHRoZSByZWFsIGJhY2tidWZmZXJcbiAgLy8gaWYgdGhhdCdzIHRoZSBjYXNlLlxuICBpZiAodGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9PSB0aGlzLmZyYW1lYnVmZmVyKSB7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgfVxuXG4gIHRoaXMuaXNQYXRjaGVkID0gZmFsc2U7XG59O1xuXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLnNldFRleHR1cmVCb3VuZHMgPSBmdW5jdGlvbihsZWZ0Qm91bmRzLCByaWdodEJvdW5kcykge1xuICBpZiAoIWxlZnRCb3VuZHMpIHtcbiAgICBsZWZ0Qm91bmRzID0gWzAsIDAsIDAuNSwgMV07XG4gIH1cblxuICBpZiAoIXJpZ2h0Qm91bmRzKSB7XG4gICAgcmlnaHRCb3VuZHMgPSBbMC41LCAwLCAwLjUsIDFdO1xuICB9XG5cbiAgLy8gTGVmdCBleWVcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzBdID0gbGVmdEJvdW5kc1swXTsgLy8gWFxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbMV0gPSBsZWZ0Qm91bmRzWzFdOyAvLyBZXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVsyXSA9IGxlZnRCb3VuZHNbMl07IC8vIFdpZHRoXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVszXSA9IGxlZnRCb3VuZHNbM107IC8vIEhlaWdodFxuXG4gIC8vIFJpZ2h0IGV5ZVxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbNF0gPSByaWdodEJvdW5kc1swXTsgLy8gWFxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbNV0gPSByaWdodEJvdW5kc1sxXTsgLy8gWVxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbNl0gPSByaWdodEJvdW5kc1syXTsgLy8gV2lkdGhcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzddID0gcmlnaHRCb3VuZHNbM107IC8vIEhlaWdodFxufTtcblxuLyoqXG4gKiBQZXJmb3JtcyBkaXN0b3J0aW9uIHBhc3Mgb24gdGhlIGluamVjdGVkIGJhY2tidWZmZXIsIHJlbmRlcmluZyBpdCB0byB0aGUgcmVhbFxuICogYmFja2J1ZmZlci5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5zdWJtaXRGcmFtZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbXTtcblxuICBpZiAoIVdlYlZSQ29uZmlnLkRJUlRZX1NVQk1JVF9GUkFNRV9CSU5ESU5HUykge1xuICAgIGdsU3RhdGUucHVzaChcbiAgICAgIGdsLkNVUlJFTlRfUFJPR1JBTSxcbiAgICAgIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HLFxuICAgICAgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVJfQklORElORyxcbiAgICAgIGdsLlRFWFRVUkVfQklORElOR18yRCwgZ2wuVEVYVFVSRTBcbiAgICApO1xuICB9XG5cbiAgV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgZ2xTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgICAvLyBCaW5kIHRoZSByZWFsIGRlZmF1bHQgZnJhbWVidWZmZXJcbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuXG4gICAgLy8gTWFrZSBzdXJlIHRoZSBHTCBzdGF0ZSBpcyBpbiBhIGdvb2QgcGxhY2VcbiAgICBpZiAoc2VsZi5jdWxsRmFjZSkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLkNVTExfRkFDRSk7IH1cbiAgICBpZiAoc2VsZi5kZXB0aFRlc3QpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5ERVBUSF9URVNUKTsgfVxuICAgIGlmIChzZWxmLmJsZW5kKSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuQkxFTkQpOyB9XG4gICAgaWYgKHNlbGYuc2Npc3NvclRlc3QpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5TQ0lTU09SX1RFU1QpOyB9XG4gICAgaWYgKHNlbGYuc3RlbmNpbFRlc3QpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5TVEVOQ0lMX1RFU1QpOyB9XG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmNhbGwoZ2wsIHRydWUsIHRydWUsIHRydWUsIHRydWUpO1xuICAgIHNlbGYucmVhbFZpZXdwb3J0LmNhbGwoZ2wsIDAsIDAsIGdsLmRyYXdpbmdCdWZmZXJXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG5cbiAgICAvLyBJZiB0aGUgYmFja2J1ZmZlciBoYXMgYW4gYWxwaGEgY2hhbm5lbCBjbGVhciBldmVyeSBmcmFtZSBzbyB0aGUgcGFnZVxuICAgIC8vIGRvZXNuJ3Qgc2hvdyB0aHJvdWdoLlxuICAgIGlmIChzZWxmLmN0eEF0dHJpYnMuYWxwaGEgfHwgVXRpbC5pc0lPUygpKSB7XG4gICAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmNhbGwoZ2wsIDAsIDAsIDAsIDEpO1xuICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgfVxuXG4gICAgLy8gQmluZCBkaXN0b3J0aW9uIHByb2dyYW0gYW5kIG1lc2hcbiAgICBnbC51c2VQcm9ncmFtKHNlbGYucHJvZ3JhbSk7XG5cbiAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBzZWxmLmluZGV4QnVmZmVyKTtcblxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBzZWxmLnZlcnRleEJ1ZmZlcik7XG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2VsZi5hdHRyaWJzLnBvc2l0aW9uKTtcbiAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzZWxmLmF0dHJpYnMudGV4Q29vcmQpO1xuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2VsZi5hdHRyaWJzLnBvc2l0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDIwLCAwKTtcbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNlbGYuYXR0cmlicy50ZXhDb29yZCwgMywgZ2wuRkxPQVQsIGZhbHNlLCAyMCwgOCk7XG5cbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcbiAgICBnbC51bmlmb3JtMWkoc2VsZi51bmlmb3Jtcy5kaWZmdXNlLCAwKTtcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBzZWxmLnJlbmRlclRhcmdldCk7XG5cbiAgICBnbC51bmlmb3JtNGZ2KHNlbGYudW5pZm9ybXMudmlld3BvcnRPZmZzZXRTY2FsZSwgc2VsZi52aWV3cG9ydE9mZnNldFNjYWxlKTtcblxuICAgIC8vIERyYXdzIGJvdGggZXllc1xuICAgIGdsLmRyYXdFbGVtZW50cyhnbC5UUklBTkdMRVMsIHNlbGYuaW5kZXhDb3VudCwgZ2wuVU5TSUdORURfU0hPUlQsIDApO1xuXG4gICAgc2VsZi5jYXJkYm9hcmRVSS5yZW5kZXJOb1N0YXRlKCk7XG5cbiAgICAvLyBCaW5kIHRoZSBmYWtlIGRlZmF1bHQgZnJhbWVidWZmZXIgYWdhaW5cbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChzZWxmLmdsLCBnbC5GUkFNRUJVRkZFUiwgc2VsZi5mcmFtZWJ1ZmZlcik7XG5cbiAgICAvLyBJZiBwcmVzZXJ2ZURyYXdpbmdCdWZmZXIgPT0gZmFsc2UgY2xlYXIgdGhlIGZyYW1lYnVmZmVyXG4gICAgaWYgKCFzZWxmLmN0eEF0dHJpYnMucHJlc2VydmVEcmF3aW5nQnVmZmVyKSB7XG4gICAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmNhbGwoZ2wsIDAsIDAsIDAsIDApO1xuICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgfVxuXG4gICAgaWYgKCFXZWJWUkNvbmZpZy5ESVJUWV9TVUJNSVRfRlJBTUVfQklORElOR1MpIHtcbiAgICAgIHNlbGYucmVhbEJpbmRGcmFtZWJ1ZmZlci5jYWxsKGdsLCBnbC5GUkFNRUJVRkZFUiwgc2VsZi5sYXN0Qm91bmRGcmFtZWJ1ZmZlcik7XG4gICAgfVxuXG4gICAgLy8gUmVzdG9yZSBzdGF0ZVxuICAgIGlmIChzZWxmLmN1bGxGYWNlKSB7IHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBnbC5DVUxMX0ZBQ0UpOyB9XG4gICAgaWYgKHNlbGYuZGVwdGhUZXN0KSB7IHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBnbC5ERVBUSF9URVNUKTsgfVxuICAgIGlmIChzZWxmLmJsZW5kKSB7IHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBnbC5CTEVORCk7IH1cbiAgICBpZiAoc2VsZi5zY2lzc29yVGVzdCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuU0NJU1NPUl9URVNUKTsgfVxuICAgIGlmIChzZWxmLnN0ZW5jaWxUZXN0KSB7IHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBnbC5TVEVOQ0lMX1RFU1QpOyB9XG5cbiAgICBzZWxmLnJlYWxDb2xvck1hc2suYXBwbHkoZ2wsIHNlbGYuY29sb3JNYXNrKTtcbiAgICBzZWxmLnJlYWxWaWV3cG9ydC5hcHBseShnbCwgc2VsZi52aWV3cG9ydCk7XG4gICAgaWYgKHNlbGYuY3R4QXR0cmlicy5hbHBoYSB8fCAhc2VsZi5jdHhBdHRyaWJzLnByZXNlcnZlRHJhd2luZ0J1ZmZlcikge1xuICAgICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5hcHBseShnbCwgc2VsZi5jbGVhckNvbG9yKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFdvcmthcm91bmQgZm9yIHRoZSBmYWN0IHRoYXQgU2FmYXJpIGRvZXNuJ3QgYWxsb3cgdXMgdG8gcGF0Y2ggdGhlIGNhbnZhc1xuICAvLyB3aWR0aCBhbmQgaGVpZ2h0IGNvcnJlY3RseS4gQWZ0ZXIgZWFjaCBzdWJtaXQgZnJhbWUgY2hlY2sgdG8gc2VlIHdoYXQgdGhlXG4gIC8vIHJlYWwgYmFja2J1ZmZlciBzaXplIGhhcyBiZWVuIHNldCB0byBhbmQgcmVzaXplIHRoZSBmYWtlIGJhY2tidWZmZXIgc2l6ZVxuICAvLyB0byBtYXRjaC5cbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHZhciBjYW52YXMgPSBnbC5jYW52YXM7XG4gICAgaWYgKGNhbnZhcy53aWR0aCAhPSBzZWxmLmJ1ZmZlcldpZHRoIHx8IGNhbnZhcy5oZWlnaHQgIT0gc2VsZi5idWZmZXJIZWlnaHQpIHtcbiAgICAgIHNlbGYuYnVmZmVyV2lkdGggPSBjYW52YXMud2lkdGg7XG4gICAgICBzZWxmLmJ1ZmZlckhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG4gICAgICBzZWxmLm9uUmVzaXplKCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENhbGwgd2hlbiB0aGUgZGV2aWNlSW5mbyBoYXMgY2hhbmdlZC4gQXQgdGhpcyBwb2ludCB3ZSBuZWVkXG4gKiB0byByZS1jYWxjdWxhdGUgdGhlIGRpc3RvcnRpb24gbWVzaC5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS51cGRhdGVEZXZpY2VJbmZvID0gZnVuY3Rpb24oZGV2aWNlSW5mbykge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkcsIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSX0JJTkRJTkddO1xuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIHZhciB2ZXJ0aWNlcyA9IHNlbGYuY29tcHV0ZU1lc2hWZXJ0aWNlc18oc2VsZi5tZXNoV2lkdGgsIHNlbGYubWVzaEhlaWdodCwgZGV2aWNlSW5mbyk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHNlbGYudmVydGV4QnVmZmVyKTtcbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdmVydGljZXMsIGdsLlNUQVRJQ19EUkFXKTtcblxuICAgIC8vIEluZGljZXMgZG9uJ3QgY2hhbmdlIGJhc2VkIG9uIGRldmljZSBwYXJhbWV0ZXJzLCBzbyBvbmx5IGNvbXB1dGUgb25jZS5cbiAgICBpZiAoIXNlbGYuaW5kZXhDb3VudCkge1xuICAgICAgdmFyIGluZGljZXMgPSBzZWxmLmNvbXB1dGVNZXNoSW5kaWNlc18oc2VsZi5tZXNoV2lkdGgsIHNlbGYubWVzaEhlaWdodCk7XG4gICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBzZWxmLmluZGV4QnVmZmVyKTtcbiAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGluZGljZXMsIGdsLlNUQVRJQ19EUkFXKTtcbiAgICAgIHNlbGYuaW5kZXhDb3VudCA9IGluZGljZXMubGVuZ3RoO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiAqIEJ1aWxkIHRoZSBkaXN0b3J0aW9uIG1lc2ggdmVydGljZXMuXG4gKiBCYXNlZCBvbiBjb2RlIGZyb20gdGhlIFVuaXR5IGNhcmRib2FyZCBwbHVnaW4uXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuY29tcHV0ZU1lc2hWZXJ0aWNlc18gPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBkZXZpY2VJbmZvKSB7XG4gIHZhciB2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoMiAqIHdpZHRoICogaGVpZ2h0ICogNSk7XG5cbiAgdmFyIGxlbnNGcnVzdHVtID0gZGV2aWNlSW5mby5nZXRMZWZ0RXllVmlzaWJsZVRhbkFuZ2xlcygpO1xuICB2YXIgbm9MZW5zRnJ1c3R1bSA9IGRldmljZUluZm8uZ2V0TGVmdEV5ZU5vTGVuc1RhbkFuZ2xlcygpO1xuICB2YXIgdmlld3BvcnQgPSBkZXZpY2VJbmZvLmdldExlZnRFeWVWaXNpYmxlU2NyZWVuUmVjdChub0xlbnNGcnVzdHVtKTtcbiAgdmFyIHZpZHggPSAwO1xuICB2YXIgaWlkeCA9IDA7XG4gIGZvciAodmFyIGUgPSAwOyBlIDwgMjsgZSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBoZWlnaHQ7IGorKykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3aWR0aDsgaSsrLCB2aWR4KyspIHtcbiAgICAgICAgdmFyIHUgPSBpIC8gKHdpZHRoIC0gMSk7XG4gICAgICAgIHZhciB2ID0gaiAvIChoZWlnaHQgLSAxKTtcblxuICAgICAgICAvLyBHcmlkIHBvaW50cyByZWd1bGFybHkgc3BhY2VkIGluIFN0cmVvU2NyZWVuLCBhbmQgYmFycmVsIGRpc3RvcnRlZCBpblxuICAgICAgICAvLyB0aGUgbWVzaC5cbiAgICAgICAgdmFyIHMgPSB1O1xuICAgICAgICB2YXIgdCA9IHY7XG4gICAgICAgIHZhciB4ID0gVXRpbC5sZXJwKGxlbnNGcnVzdHVtWzBdLCBsZW5zRnJ1c3R1bVsyXSwgdSk7XG4gICAgICAgIHZhciB5ID0gVXRpbC5sZXJwKGxlbnNGcnVzdHVtWzNdLCBsZW5zRnJ1c3R1bVsxXSwgdik7XG4gICAgICAgIHZhciBkID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkpO1xuICAgICAgICB2YXIgciA9IGRldmljZUluZm8uZGlzdG9ydGlvbi5kaXN0b3J0SW52ZXJzZShkKTtcbiAgICAgICAgdmFyIHAgPSB4ICogciAvIGQ7XG4gICAgICAgIHZhciBxID0geSAqIHIgLyBkO1xuICAgICAgICB1ID0gKHAgLSBub0xlbnNGcnVzdHVtWzBdKSAvIChub0xlbnNGcnVzdHVtWzJdIC0gbm9MZW5zRnJ1c3R1bVswXSk7XG4gICAgICAgIHYgPSAocSAtIG5vTGVuc0ZydXN0dW1bM10pIC8gKG5vTGVuc0ZydXN0dW1bMV0gLSBub0xlbnNGcnVzdHVtWzNdKTtcblxuICAgICAgICAvLyBDb252ZXJ0IHUsdiB0byBtZXNoIHNjcmVlbiBjb29yZGluYXRlcy5cbiAgICAgICAgdmFyIGFzcGVjdCA9IGRldmljZUluZm8uZGV2aWNlLndpZHRoTWV0ZXJzIC8gZGV2aWNlSW5mby5kZXZpY2UuaGVpZ2h0TWV0ZXJzO1xuXG4gICAgICAgIC8vIEZJWE1FOiBUaGUgb3JpZ2luYWwgVW5pdHkgcGx1Z2luIG11bHRpcGxpZWQgVSBieSB0aGUgYXNwZWN0IHJhdGlvXG4gICAgICAgIC8vIGFuZCBkaWRuJ3QgbXVsdGlwbHkgZWl0aGVyIHZhbHVlIGJ5IDIsIGJ1dCB0aGF0IHNlZW1zIHRvIGdldCBpdFxuICAgICAgICAvLyByZWFsbHkgY2xvc2UgdG8gY29ycmVjdCBsb29raW5nIGZvciBtZS4gSSBoYXRlIHRoaXMga2luZCBvZiBcIkRvbid0XG4gICAgICAgIC8vIGtub3cgd2h5IGl0IHdvcmtzXCIgY29kZSB0aG91Z2gsIGFuZCB3b2xkIGxvdmUgYSBtb3JlIGxvZ2ljYWxcbiAgICAgICAgLy8gZXhwbGFuYXRpb24gb2Ygd2hhdCBuZWVkcyB0byBoYXBwZW4gaGVyZS5cbiAgICAgICAgdSA9ICh2aWV3cG9ydC54ICsgdSAqIHZpZXdwb3J0LndpZHRoIC0gMC41KSAqIDIuMDsgLy8qIGFzcGVjdDtcbiAgICAgICAgdiA9ICh2aWV3cG9ydC55ICsgdiAqIHZpZXdwb3J0LmhlaWdodCAtIDAuNSkgKiAyLjA7XG5cbiAgICAgICAgdmVydGljZXNbKHZpZHggKiA1KSArIDBdID0gdTsgLy8gcG9zaXRpb24ueFxuICAgICAgICB2ZXJ0aWNlc1sodmlkeCAqIDUpICsgMV0gPSB2OyAvLyBwb3NpdGlvbi55XG4gICAgICAgIHZlcnRpY2VzWyh2aWR4ICogNSkgKyAyXSA9IHM7IC8vIHRleENvb3JkLnhcbiAgICAgICAgdmVydGljZXNbKHZpZHggKiA1KSArIDNdID0gdDsgLy8gdGV4Q29vcmQueVxuICAgICAgICB2ZXJ0aWNlc1sodmlkeCAqIDUpICsgNF0gPSBlOyAvLyB0ZXhDb29yZC56ICh2aWV3cG9ydCBpbmRleClcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHcgPSBsZW5zRnJ1c3R1bVsyXSAtIGxlbnNGcnVzdHVtWzBdO1xuICAgIGxlbnNGcnVzdHVtWzBdID0gLSh3ICsgbGVuc0ZydXN0dW1bMF0pO1xuICAgIGxlbnNGcnVzdHVtWzJdID0gdyAtIGxlbnNGcnVzdHVtWzJdO1xuICAgIHcgPSBub0xlbnNGcnVzdHVtWzJdIC0gbm9MZW5zRnJ1c3R1bVswXTtcbiAgICBub0xlbnNGcnVzdHVtWzBdID0gLSh3ICsgbm9MZW5zRnJ1c3R1bVswXSk7XG4gICAgbm9MZW5zRnJ1c3R1bVsyXSA9IHcgLSBub0xlbnNGcnVzdHVtWzJdO1xuICAgIHZpZXdwb3J0LnggPSAxIC0gKHZpZXdwb3J0LnggKyB2aWV3cG9ydC53aWR0aCk7XG4gIH1cbiAgcmV0dXJuIHZlcnRpY2VzO1xufVxuXG4vKipcbiAqIEJ1aWxkIHRoZSBkaXN0b3J0aW9uIG1lc2ggaW5kaWNlcy5cbiAqIEJhc2VkIG9uIGNvZGUgZnJvbSB0aGUgVW5pdHkgY2FyZGJvYXJkIHBsdWdpbi5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5jb21wdXRlTWVzaEluZGljZXNfID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuICB2YXIgaW5kaWNlcyA9IG5ldyBVaW50MTZBcnJheSgyICogKHdpZHRoIC0gMSkgKiAoaGVpZ2h0IC0gMSkgKiA2KTtcbiAgdmFyIGhhbGZ3aWR0aCA9IHdpZHRoIC8gMjtcbiAgdmFyIGhhbGZoZWlnaHQgPSBoZWlnaHQgLyAyO1xuICB2YXIgdmlkeCA9IDA7XG4gIHZhciBpaWR4ID0gMDtcbiAgZm9yICh2YXIgZSA9IDA7IGUgPCAyOyBlKyspIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGhlaWdodDsgaisrKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdpZHRoOyBpKyssIHZpZHgrKykge1xuICAgICAgICBpZiAoaSA9PSAwIHx8IGogPT0gMClcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgLy8gQnVpbGQgYSBxdWFkLiAgTG93ZXIgcmlnaHQgYW5kIHVwcGVyIGxlZnQgcXVhZHJhbnRzIGhhdmUgcXVhZHMgd2l0aFxuICAgICAgICAvLyB0aGUgdHJpYW5nbGUgZGlhZ29uYWwgZmxpcHBlZCB0byBnZXQgdGhlIHZpZ25ldHRlIHRvIGludGVycG9sYXRlXG4gICAgICAgIC8vIGNvcnJlY3RseS5cbiAgICAgICAgaWYgKChpIDw9IGhhbGZ3aWR0aCkgPT0gKGogPD0gaGFsZmhlaWdodCkpIHtcbiAgICAgICAgICAvLyBRdWFkIGRpYWdvbmFsIGxvd2VyIGxlZnQgdG8gdXBwZXIgcmlnaHQuXG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGggLSAxO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSB3aWR0aDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGggLSAxO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gUXVhZCBkaWFnb25hbCB1cHBlciBsZWZ0IHRvIGxvd2VyIHJpZ2h0LlxuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSAxO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSB3aWR0aDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4O1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSB3aWR0aDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gMTtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGggLSAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBpbmRpY2VzO1xufTtcblxuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JfID0gZnVuY3Rpb24ocHJvdG8sIGF0dHJOYW1lKSB7XG4gIHZhciBkZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm90bywgYXR0ck5hbWUpO1xuICAvLyBJbiBzb21lIGNhc2VzIChhaGVtLi4uIFNhZmFyaSksIHRoZSBkZXNjcmlwdG9yIHJldHVybnMgdW5kZWZpbmVkIGdldCBhbmRcbiAgLy8gc2V0IGZpZWxkcy4gSW4gdGhpcyBjYXNlLCB3ZSBuZWVkIHRvIGNyZWF0ZSBhIHN5bnRoZXRpYyBwcm9wZXJ0eVxuICAvLyBkZXNjcmlwdG9yLiBUaGlzIHdvcmtzIGFyb3VuZCBzb21lIG9mIHRoZSBpc3N1ZXMgaW5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JvcmlzbXVzL3dlYnZyLXBvbHlmaWxsL2lzc3Vlcy80NlxuICBpZiAoZGVzY3JpcHRvci5nZXQgPT09IHVuZGVmaW5lZCB8fCBkZXNjcmlwdG9yLnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlO1xuICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IHRydWU7XG4gICAgZGVzY3JpcHRvci5nZXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShhdHRyTmFtZSk7XG4gICAgfTtcbiAgICBkZXNjcmlwdG9yLnNldCA9IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIHZhbCk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gZGVzY3JpcHRvcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FyZGJvYXJkRGlzdG9ydGVyO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBXR0xVUHJlc2VydmVHTFN0YXRlID0gcmVxdWlyZSgnLi9kZXBzL3dnbHUtcHJlc2VydmUtc3RhdGUuanMnKTtcblxudmFyIHVpVlMgPSBbXG4gICdhdHRyaWJ1dGUgdmVjMiBwb3NpdGlvbjsnLFxuXG4gICd1bmlmb3JtIG1hdDQgcHJvamVjdGlvbk1hdDsnLFxuXG4gICd2b2lkIG1haW4oKSB7JyxcbiAgJyAgZ2xfUG9zaXRpb24gPSBwcm9qZWN0aW9uTWF0ICogdmVjNCggcG9zaXRpb24sIC0xLjAsIDEuMCApOycsXG4gICd9Jyxcbl0uam9pbignXFxuJyk7XG5cbnZhciB1aUZTID0gW1xuICAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7JyxcblxuICAndW5pZm9ybSB2ZWM0IGNvbG9yOycsXG5cbiAgJ3ZvaWQgbWFpbigpIHsnLFxuICAnICBnbF9GcmFnQ29sb3IgPSBjb2xvcjsnLFxuICAnfScsXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgREVHMlJBRCA9IE1hdGguUEkvMTgwLjA7XG5cbi8vIFRoZSBnZWFyIGhhcyA2IGlkZW50aWNhbCBzZWN0aW9ucywgZWFjaCBzcGFubmluZyA2MCBkZWdyZWVzLlxudmFyIGtBbmdsZVBlckdlYXJTZWN0aW9uID0gNjA7XG5cbi8vIEhhbGYtYW5nbGUgb2YgdGhlIHNwYW4gb2YgdGhlIG91dGVyIHJpbS5cbnZhciBrT3V0ZXJSaW1FbmRBbmdsZSA9IDEyO1xuXG4vLyBBbmdsZSBiZXR3ZWVuIHRoZSBtaWRkbGUgb2YgdGhlIG91dGVyIHJpbSBhbmQgdGhlIHN0YXJ0IG9mIHRoZSBpbm5lciByaW0uXG52YXIga0lubmVyUmltQmVnaW5BbmdsZSA9IDIwO1xuXG4vLyBEaXN0YW5jZSBmcm9tIGNlbnRlciB0byBvdXRlciByaW0sIG5vcm1hbGl6ZWQgc28gdGhhdCB0aGUgZW50aXJlIG1vZGVsXG4vLyBmaXRzIGluIGEgWy0xLCAxXSB4IFstMSwgMV0gc3F1YXJlLlxudmFyIGtPdXRlclJhZGl1cyA9IDE7XG5cbi8vIERpc3RhbmNlIGZyb20gY2VudGVyIHRvIGRlcHJlc3NlZCByaW0sIGluIG1vZGVsIHVuaXRzLlxudmFyIGtNaWRkbGVSYWRpdXMgPSAwLjc1O1xuXG4vLyBSYWRpdXMgb2YgdGhlIGlubmVyIGhvbGxvdyBjaXJjbGUsIGluIG1vZGVsIHVuaXRzLlxudmFyIGtJbm5lclJhZGl1cyA9IDAuMzEyNTtcblxuLy8gQ2VudGVyIGxpbmUgdGhpY2tuZXNzIGluIERQLlxudmFyIGtDZW50ZXJMaW5lVGhpY2tuZXNzRHAgPSA0O1xuXG4vLyBCdXR0b24gd2lkdGggaW4gRFAuXG52YXIga0J1dHRvbldpZHRoRHAgPSAyODtcblxuLy8gRmFjdG9yIHRvIHNjYWxlIHRoZSB0b3VjaCBhcmVhIHRoYXQgcmVzcG9uZHMgdG8gdGhlIHRvdWNoLlxudmFyIGtUb3VjaFNsb3BGYWN0b3IgPSAxLjU7XG5cbnZhciBBbmdsZXMgPSBbXG4gIDAsIGtPdXRlclJpbUVuZEFuZ2xlLCBrSW5uZXJSaW1CZWdpbkFuZ2xlLFxuICBrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtJbm5lclJpbUJlZ2luQW5nbGUsXG4gIGtBbmdsZVBlckdlYXJTZWN0aW9uIC0ga091dGVyUmltRW5kQW5nbGVcbl07XG5cbi8qKlxuICogUmVuZGVycyB0aGUgYWxpZ25tZW50IGxpbmUgYW5kIFwib3B0aW9uc1wiIGdlYXIuIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgY2FudmFzXG4gKiB0aGlzIGlzIHJlbmRlcmVkIGludG8gY292ZXJzIHRoZSBlbnRpcmUgc2NyZWVuIChvciBjbG9zZSB0byBpdC4pXG4gKi9cbmZ1bmN0aW9uIENhcmRib2FyZFVJKGdsKSB7XG4gIHRoaXMuZ2wgPSBnbDtcblxuICB0aGlzLmF0dHJpYnMgPSB7XG4gICAgcG9zaXRpb246IDBcbiAgfTtcbiAgdGhpcy5wcm9ncmFtID0gVXRpbC5saW5rUHJvZ3JhbShnbCwgdWlWUywgdWlGUywgdGhpcy5hdHRyaWJzKTtcbiAgdGhpcy51bmlmb3JtcyA9IFV0aWwuZ2V0UHJvZ3JhbVVuaWZvcm1zKGdsLCB0aGlzLnByb2dyYW0pO1xuXG4gIHRoaXMudmVydGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gIHRoaXMuZ2Vhck9mZnNldCA9IDA7XG4gIHRoaXMuZ2VhclZlcnRleENvdW50ID0gMDtcbiAgdGhpcy5hcnJvd09mZnNldCA9IDA7XG4gIHRoaXMuYXJyb3dWZXJ0ZXhDb3VudCA9IDA7XG5cbiAgdGhpcy5wcm9qTWF0ID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG5cbiAgdGhpcy5saXN0ZW5lciA9IG51bGw7XG5cbiAgdGhpcy5vblJlc2l6ZSgpO1xufTtcblxuLyoqXG4gKiBUZWFycyBkb3duIGFsbCB0aGUgcmVzb3VyY2VzIGNyZWF0ZWQgYnkgdGhlIFVJIHJlbmRlcmVyLlxuICovXG5DYXJkYm9hcmRVSS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gIGlmICh0aGlzLmxpc3RlbmVyKSB7XG4gICAgZ2wuY2FudmFzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5saXN0ZW5lciwgZmFsc2UpO1xuICB9XG5cbiAgZ2wuZGVsZXRlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xuICBnbC5kZWxldGVCdWZmZXIodGhpcy52ZXJ0ZXhCdWZmZXIpO1xufTtcblxuLyoqXG4gKiBBZGRzIGEgbGlzdGVuZXIgdG8gY2xpY2tzIG9uIHRoZSBnZWFyIGFuZCBiYWNrIGljb25zXG4gKi9cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5saXN0ZW4gPSBmdW5jdGlvbihvcHRpb25zQ2FsbGJhY2ssIGJhY2tDYWxsYmFjaykge1xuICB2YXIgY2FudmFzID0gdGhpcy5nbC5jYW52YXM7XG4gIHRoaXMubGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBtaWRsaW5lID0gY2FudmFzLmNsaWVudFdpZHRoIC8gMjtcbiAgICB2YXIgYnV0dG9uU2l6ZSA9IGtCdXR0b25XaWR0aERwICoga1RvdWNoU2xvcEZhY3RvcjtcbiAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIHVzZXIgY2xpY2tlZCBvbiAob3IgYXJvdW5kKSB0aGUgZ2VhciBpY29uXG4gICAgaWYgKGV2ZW50LmNsaWVudFggPiBtaWRsaW5lIC0gYnV0dG9uU2l6ZSAmJlxuICAgICAgICBldmVudC5jbGllbnRYIDwgbWlkbGluZSArIGJ1dHRvblNpemUgJiZcbiAgICAgICAgZXZlbnQuY2xpZW50WSA+IGNhbnZhcy5jbGllbnRIZWlnaHQgLSBidXR0b25TaXplKSB7XG4gICAgICBvcHRpb25zQ2FsbGJhY2soZXZlbnQpO1xuICAgIH1cbiAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIHVzZXIgY2xpY2tlZCBvbiAob3IgYXJvdW5kKSB0aGUgYmFjayBpY29uXG4gICAgZWxzZSBpZiAoZXZlbnQuY2xpZW50WCA8IGJ1dHRvblNpemUgJiYgZXZlbnQuY2xpZW50WSA8IGJ1dHRvblNpemUpIHtcbiAgICAgIGJhY2tDYWxsYmFjayhldmVudCk7XG4gICAgfVxuICB9O1xuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmxpc3RlbmVyLCBmYWxzZSk7XG59O1xuXG4vKipcbiAqIEJ1aWxkcyB0aGUgVUkgbWVzaC5cbiAqL1xuQ2FyZGJvYXJkVUkucHJvdG90eXBlLm9uUmVzaXplID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgZ2xTdGF0ZSA9IFtcbiAgICBnbC5BUlJBWV9CVUZGRVJfQklORElOR1xuICBdO1xuXG4gIFdHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIGdsU3RhdGUsIGZ1bmN0aW9uKGdsKSB7XG4gICAgdmFyIHZlcnRpY2VzID0gW107XG5cbiAgICB2YXIgbWlkbGluZSA9IGdsLmRyYXdpbmdCdWZmZXJXaWR0aCAvIDI7XG5cbiAgICAvLyBBc3N1bWVzIHlvdXIgY2FudmFzIHdpZHRoIGFuZCBoZWlnaHQgaXMgc2NhbGVkIHByb3BvcnRpb25hdGVseS5cbiAgICAvLyBUT0RPKHNtdXMpOiBUaGUgZm9sbG93aW5nIGNhdXNlcyBidXR0b25zIHRvIGJlY29tZSBodWdlIG9uIGlPUywgYnV0IHNlZW1zXG4gICAgLy8gbGlrZSB0aGUgcmlnaHQgdGhpbmcgdG8gZG8uIEZvciBub3csIGFkZGVkIGEgaGFjay4gQnV0IHJlYWxseSwgaW52ZXN0aWdhdGUgd2h5LlxuICAgIHZhciBkcHMgPSAoZ2wuZHJhd2luZ0J1ZmZlcldpZHRoIC8gKHNjcmVlbi53aWR0aCAqIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKSk7XG4gICAgaWYgKCFVdGlsLmlzSU9TKCkpIHtcbiAgICAgIGRwcyAqPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbiAgICB9XG5cbiAgICB2YXIgbGluZVdpZHRoID0ga0NlbnRlckxpbmVUaGlja25lc3NEcCAqIGRwcyAvIDI7XG4gICAgdmFyIGJ1dHRvblNpemUgPSBrQnV0dG9uV2lkdGhEcCAqIGtUb3VjaFNsb3BGYWN0b3IgKiBkcHM7XG4gICAgdmFyIGJ1dHRvblNjYWxlID0ga0J1dHRvbldpZHRoRHAgKiBkcHMgLyAyO1xuICAgIHZhciBidXR0b25Cb3JkZXIgPSAoKGtCdXR0b25XaWR0aERwICoga1RvdWNoU2xvcEZhY3RvcikgLSBrQnV0dG9uV2lkdGhEcCkgKiBkcHM7XG5cbiAgICAvLyBCdWlsZCBjZW50ZXJsaW5lXG4gICAgdmVydGljZXMucHVzaChtaWRsaW5lIC0gbGluZVdpZHRoLCBidXR0b25TaXplKTtcbiAgICB2ZXJ0aWNlcy5wdXNoKG1pZGxpbmUgLSBsaW5lV2lkdGgsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQpO1xuICAgIHZlcnRpY2VzLnB1c2gobWlkbGluZSArIGxpbmVXaWR0aCwgYnV0dG9uU2l6ZSk7XG4gICAgdmVydGljZXMucHVzaChtaWRsaW5lICsgbGluZVdpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcblxuICAgIC8vIEJ1aWxkIGdlYXJcbiAgICBzZWxmLmdlYXJPZmZzZXQgPSAodmVydGljZXMubGVuZ3RoIC8gMik7XG5cbiAgICBmdW5jdGlvbiBhZGRHZWFyU2VnbWVudCh0aGV0YSwgcikge1xuICAgICAgdmFyIGFuZ2xlID0gKDkwIC0gdGhldGEpICogREVHMlJBRDtcbiAgICAgIHZhciB4ID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgdmFyIHkgPSBNYXRoLnNpbihhbmdsZSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKGtJbm5lclJhZGl1cyAqIHggKiBidXR0b25TY2FsZSArIG1pZGxpbmUsIGtJbm5lclJhZGl1cyAqIHkgKiBidXR0b25TY2FsZSArIGJ1dHRvblNjYWxlKTtcbiAgICAgIHZlcnRpY2VzLnB1c2gociAqIHggKiBidXR0b25TY2FsZSArIG1pZGxpbmUsIHIgKiB5ICogYnV0dG9uU2NhbGUgKyBidXR0b25TY2FsZSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gNjsgaSsrKSB7XG4gICAgICB2YXIgc2VnbWVudFRoZXRhID0gaSAqIGtBbmdsZVBlckdlYXJTZWN0aW9uO1xuXG4gICAgICBhZGRHZWFyU2VnbWVudChzZWdtZW50VGhldGEsIGtPdXRlclJhZGl1cyk7XG4gICAgICBhZGRHZWFyU2VnbWVudChzZWdtZW50VGhldGEgKyBrT3V0ZXJSaW1FbmRBbmdsZSwga091dGVyUmFkaXVzKTtcbiAgICAgIGFkZEdlYXJTZWdtZW50KHNlZ21lbnRUaGV0YSArIGtJbm5lclJpbUJlZ2luQW5nbGUsIGtNaWRkbGVSYWRpdXMpO1xuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhICsgKGtBbmdsZVBlckdlYXJTZWN0aW9uIC0ga0lubmVyUmltQmVnaW5BbmdsZSksIGtNaWRkbGVSYWRpdXMpO1xuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhICsgKGtBbmdsZVBlckdlYXJTZWN0aW9uIC0ga091dGVyUmltRW5kQW5nbGUpLCBrT3V0ZXJSYWRpdXMpO1xuICAgIH1cblxuICAgIHNlbGYuZ2VhclZlcnRleENvdW50ID0gKHZlcnRpY2VzLmxlbmd0aCAvIDIpIC0gc2VsZi5nZWFyT2Zmc2V0O1xuXG4gICAgLy8gQnVpbGQgYmFjayBhcnJvd1xuICAgIHNlbGYuYXJyb3dPZmZzZXQgPSAodmVydGljZXMubGVuZ3RoIC8gMik7XG5cbiAgICBmdW5jdGlvbiBhZGRBcnJvd1ZlcnRleCh4LCB5KSB7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKGJ1dHRvbkJvcmRlciArIHgsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQgLSBidXR0b25Cb3JkZXIgLSB5KTtcbiAgICB9XG5cbiAgICB2YXIgYW5nbGVkTGluZVdpZHRoID0gbGluZVdpZHRoIC8gTWF0aC5zaW4oNDUgKiBERUcyUkFEKTtcblxuICAgIGFkZEFycm93VmVydGV4KDAsIGJ1dHRvblNjYWxlKTtcbiAgICBhZGRBcnJvd1ZlcnRleChidXR0b25TY2FsZSwgMCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYnV0dG9uU2NhbGUgKyBhbmdsZWRMaW5lV2lkdGgsIGFuZ2xlZExpbmVXaWR0aCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYW5nbGVkTGluZVdpZHRoLCBidXR0b25TY2FsZSArIGFuZ2xlZExpbmVXaWR0aCk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleChhbmdsZWRMaW5lV2lkdGgsIGJ1dHRvblNjYWxlIC0gYW5nbGVkTGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleCgwLCBidXR0b25TY2FsZSk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYnV0dG9uU2NhbGUsIGJ1dHRvblNjYWxlICogMik7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYnV0dG9uU2NhbGUgKyBhbmdsZWRMaW5lV2lkdGgsIChidXR0b25TY2FsZSAqIDIpIC0gYW5nbGVkTGluZVdpZHRoKTtcblxuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgLSBhbmdsZWRMaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KDAsIGJ1dHRvblNjYWxlKTtcblxuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgLSBsaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGtCdXR0b25XaWR0aERwICogZHBzLCBidXR0b25TY2FsZSAtIGxpbmVXaWR0aCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYW5nbGVkTGluZVdpZHRoLCBidXR0b25TY2FsZSArIGxpbmVXaWR0aCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoa0J1dHRvbldpZHRoRHAgKiBkcHMsIGJ1dHRvblNjYWxlICsgbGluZVdpZHRoKTtcblxuICAgIHNlbGYuYXJyb3dWZXJ0ZXhDb3VudCA9ICh2ZXJ0aWNlcy5sZW5ndGggLyAyKSAtIHNlbGYuYXJyb3dPZmZzZXQ7XG5cbiAgICAvLyBCdWZmZXIgZGF0YVxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBzZWxmLnZlcnRleEJ1ZmZlcik7XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodmVydGljZXMpLCBnbC5TVEFUSUNfRFJBVyk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBQZXJmb3JtcyBkaXN0b3J0aW9uIHBhc3Mgb24gdGhlIGluamVjdGVkIGJhY2tidWZmZXIsIHJlbmRlcmluZyBpdCB0byB0aGUgcmVhbFxuICogYmFja2J1ZmZlci5cbiAqL1xuQ2FyZGJvYXJkVUkucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbXG4gICAgZ2wuQ1VMTF9GQUNFLFxuICAgIGdsLkRFUFRIX1RFU1QsXG4gICAgZ2wuQkxFTkQsXG4gICAgZ2wuU0NJU1NPUl9URVNULFxuICAgIGdsLlNURU5DSUxfVEVTVCxcbiAgICBnbC5DT0xPUl9XUklURU1BU0ssXG4gICAgZ2wuVklFV1BPUlQsXG5cbiAgICBnbC5DVVJSRU5UX1BST0dSQU0sXG4gICAgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkdcbiAgXTtcblxuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIC8vIE1ha2Ugc3VyZSB0aGUgR0wgc3RhdGUgaXMgaW4gYSBnb29kIHBsYWNlXG4gICAgZ2wuZGlzYWJsZShnbC5DVUxMX0ZBQ0UpO1xuICAgIGdsLmRpc2FibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgZ2wuZGlzYWJsZShnbC5CTEVORCk7XG4gICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGdsLmRpc2FibGUoZ2wuU1RFTkNJTF9URVNUKTtcbiAgICBnbC5jb2xvck1hc2sodHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZ2wudmlld3BvcnQoMCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcblxuICAgIHNlbGYucmVuZGVyTm9TdGF0ZSgpO1xuICB9KTtcbn07XG5cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5yZW5kZXJOb1N0YXRlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG5cbiAgLy8gQmluZCBkaXN0b3J0aW9uIHByb2dyYW0gYW5kIG1lc2hcbiAgZ2wudXNlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xuXG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleEJ1ZmZlcik7XG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHRoaXMuYXR0cmlicy5wb3NpdGlvbik7XG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIodGhpcy5hdHRyaWJzLnBvc2l0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDgsIDApO1xuXG4gIGdsLnVuaWZvcm00Zih0aGlzLnVuaWZvcm1zLmNvbG9yLCAxLjAsIDEuMCwgMS4wLCAxLjApO1xuXG4gIFV0aWwub3J0aG9NYXRyaXgodGhpcy5wcm9qTWF0LCAwLCBnbC5kcmF3aW5nQnVmZmVyV2lkdGgsIDAsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQsIDAuMSwgMTAyNC4wKTtcbiAgZ2wudW5pZm9ybU1hdHJpeDRmdih0aGlzLnVuaWZvcm1zLnByb2plY3Rpb25NYXQsIGZhbHNlLCB0aGlzLnByb2pNYXQpO1xuXG4gIC8vIERyYXdzIFVJIGVsZW1lbnRcbiAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRV9TVFJJUCwgMCwgNCk7XG4gIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVfU1RSSVAsIHRoaXMuZ2Vhck9mZnNldCwgdGhpcy5nZWFyVmVydGV4Q291bnQpO1xuICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFX1NUUklQLCB0aGlzLmFycm93T2Zmc2V0LCB0aGlzLmFycm93VmVydGV4Q291bnQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYXJkYm9hcmRVSTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBDYXJkYm9hcmREaXN0b3J0ZXIgPSByZXF1aXJlKCcuL2NhcmRib2FyZC1kaXN0b3J0ZXIuanMnKTtcbnZhciBDYXJkYm9hcmRVSSA9IHJlcXVpcmUoJy4vY2FyZGJvYXJkLXVpLmpzJyk7XG52YXIgRGV2aWNlSW5mbyA9IHJlcXVpcmUoJy4vZGV2aWNlLWluZm8uanMnKTtcbnZhciBEcGRiID0gcmVxdWlyZSgnLi9kcGRiL2RwZGIuanMnKTtcbnZhciBGdXNpb25Qb3NlU2Vuc29yID0gcmVxdWlyZSgnLi9zZW5zb3ItZnVzaW9uL2Z1c2lvbi1wb3NlLXNlbnNvci5qcycpO1xudmFyIFJvdGF0ZUluc3RydWN0aW9ucyA9IHJlcXVpcmUoJy4vcm90YXRlLWluc3RydWN0aW9ucy5qcycpO1xudmFyIFZpZXdlclNlbGVjdG9yID0gcmVxdWlyZSgnLi92aWV3ZXItc2VsZWN0b3IuanMnKTtcbnZhciBWUkRpc3BsYXkgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5WUkRpc3BsYXk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG52YXIgRXllID0ge1xuICBMRUZUOiAnbGVmdCcsXG4gIFJJR0hUOiAncmlnaHQnXG59O1xuXG4vKipcbiAqIFZSRGlzcGxheSBiYXNlZCBvbiBtb2JpbGUgZGV2aWNlIHBhcmFtZXRlcnMgYW5kIERldmljZU1vdGlvbiBBUElzLlxuICovXG5mdW5jdGlvbiBDYXJkYm9hcmRWUkRpc3BsYXkoKSB7XG4gIHRoaXMuZGlzcGxheU5hbWUgPSAnQ2FyZGJvYXJkIFZSRGlzcGxheSAod2VidnItcG9seWZpbGwpJztcblxuICB0aGlzLmNhcGFiaWxpdGllcy5oYXNPcmllbnRhdGlvbiA9IHRydWU7XG4gIHRoaXMuY2FwYWJpbGl0aWVzLmNhblByZXNlbnQgPSB0cnVlO1xuXG4gIC8vIFwiUHJpdmF0ZVwiIG1lbWJlcnMuXG4gIHRoaXMuYnVmZmVyU2NhbGVfID0gV2ViVlJDb25maWcuQlVGRkVSX1NDQUxFO1xuICB0aGlzLnBvc2VTZW5zb3JfID0gbmV3IEZ1c2lvblBvc2VTZW5zb3IoKTtcbiAgdGhpcy5kaXN0b3J0ZXJfID0gbnVsbDtcbiAgdGhpcy5jYXJkYm9hcmRVSV8gPSBudWxsO1xuXG4gIHRoaXMuZHBkYl8gPSBuZXcgRHBkYih0cnVlLCB0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZF8uYmluZCh0aGlzKSk7XG4gIHRoaXMuZGV2aWNlSW5mb18gPSBuZXcgRGV2aWNlSW5mbyh0aGlzLmRwZGJfLmdldERldmljZVBhcmFtcygpKTtcblxuICB0aGlzLnZpZXdlclNlbGVjdG9yXyA9IG5ldyBWaWV3ZXJTZWxlY3RvcigpO1xuICB0aGlzLnZpZXdlclNlbGVjdG9yXy5vbignY2hhbmdlJywgdGhpcy5vblZpZXdlckNoYW5nZWRfLmJpbmQodGhpcykpO1xuXG4gIC8vIFNldCB0aGUgY29ycmVjdCBpbml0aWFsIHZpZXdlci5cbiAgdGhpcy5kZXZpY2VJbmZvXy5zZXRWaWV3ZXIodGhpcy52aWV3ZXJTZWxlY3Rvcl8uZ2V0Q3VycmVudFZpZXdlcigpKTtcblxuICB0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18gPSBuZXcgUm90YXRlSW5zdHJ1Y3Rpb25zKCk7XG59XG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlID0gbmV3IFZSRGlzcGxheSgpO1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmdldEltbWVkaWF0ZVBvc2UgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbjogdGhpcy5wb3NlU2Vuc29yXy5nZXRQb3NpdGlvbigpLFxuICAgIG9yaWVudGF0aW9uOiB0aGlzLnBvc2VTZW5zb3JfLmdldE9yaWVudGF0aW9uKCksXG4gICAgbGluZWFyVmVsb2NpdHk6IG51bGwsXG4gICAgbGluZWFyQWNjZWxlcmF0aW9uOiBudWxsLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbnVsbCxcbiAgICBhbmd1bGFyQWNjZWxlcmF0aW9uOiBudWxsXG4gIH07XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLnJlc2V0UG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBvc2VTZW5zb3JfLnJlc2V0UG9zZSgpO1xufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRFeWVQYXJhbWV0ZXJzID0gZnVuY3Rpb24od2hpY2hFeWUpIHtcbiAgdmFyIG9mZnNldCA9IFt0aGlzLmRldmljZUluZm9fLnZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSAqIDAuNSwgMC4wLCAwLjBdO1xuICB2YXIgZmllbGRPZlZpZXc7XG5cbiAgLy8gVE9ETzogRm9WIGNhbiBiZSBhIGxpdHRsZSBleHBlbnNpdmUgdG8gY29tcHV0ZS4gQ2FjaGUgd2hlbiBkZXZpY2UgcGFyYW1zIGNoYW5nZS5cbiAgaWYgKHdoaWNoRXllID09IEV5ZS5MRUZUKSB7XG4gICAgb2Zmc2V0WzBdICo9IC0xLjA7XG4gICAgZmllbGRPZlZpZXcgPSB0aGlzLmRldmljZUluZm9fLmdldEZpZWxkT2ZWaWV3TGVmdEV5ZSgpO1xuICB9IGVsc2UgaWYgKHdoaWNoRXllID09IEV5ZS5SSUdIVCkge1xuICAgIGZpZWxkT2ZWaWV3ID0gdGhpcy5kZXZpY2VJbmZvXy5nZXRGaWVsZE9mVmlld1JpZ2h0RXllKCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcignSW52YWxpZCBleWUgcHJvdmlkZWQ6ICVzJywgd2hpY2hFeWUpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBmaWVsZE9mVmlldzogZmllbGRPZlZpZXcsXG4gICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgLy8gVE9ETzogU2hvdWxkIGJlIGFibGUgdG8gcHJvdmlkZSBiZXR0ZXIgdmFsdWVzIHRoYW4gdGhlc2UuXG4gICAgcmVuZGVyV2lkdGg6IHRoaXMuZGV2aWNlSW5mb18uZGV2aWNlLndpZHRoICogMC41ICogdGhpcy5idWZmZXJTY2FsZV8sXG4gICAgcmVuZGVySGVpZ2h0OiB0aGlzLmRldmljZUluZm9fLmRldmljZS5oZWlnaHQgKiB0aGlzLmJ1ZmZlclNjYWxlXyxcbiAgfTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25EZXZpY2VQYXJhbXNVcGRhdGVkXyA9IGZ1bmN0aW9uKG5ld1BhcmFtcykge1xuICBjb25zb2xlLmxvZygnRFBEQiByZXBvcnRlZCB0aGF0IGRldmljZSBwYXJhbXMgd2VyZSB1cGRhdGVkLicpO1xuICB0aGlzLmRldmljZUluZm9fLnVwZGF0ZURldmljZVBhcmFtcyhuZXdQYXJhbXMpO1xuXG4gIGlmICh0aGlzLmRpc3RvcnRlcl8pIHtcbiAgICB0aGlzLmRpc3RvcnRlci51cGRhdGVEZXZpY2VJbmZvKHRoaXMuZGV2aWNlSW5mb18pO1xuICB9XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmJlZ2luUHJlc2VudF8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ3dlYmdsJyk7XG4gIGlmICghZ2wpXG4gICAgZ2wgPSB0aGlzLmxheWVyXy5zb3VyY2UuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJyk7XG4gIGlmICghZ2wpXG4gICAgZ2wgPSB0aGlzLmxheWVyXy5zb3VyY2UuZ2V0Q29udGV4dCgnd2ViZ2wyJyk7XG5cbiAgaWYgKCFnbClcbiAgICByZXR1cm47IC8vIENhbid0IGRvIGRpc3RvcnRpb24gd2l0aG91dCBhIFdlYkdMIGNvbnRleHQuXG5cbiAgLy8gUHJvdmlkZXMgYSB3YXkgdG8gb3B0IG91dCBvZiBkaXN0b3J0aW9uXG4gIGlmICh0aGlzLmxheWVyXy5wcmVkaXN0b3J0ZWQpIHtcbiAgICB0aGlzLmNhcmRib2FyZFVJXyA9IG5ldyBDYXJkYm9hcmRVSShnbCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQ3JlYXRlIGEgbmV3IGRpc3RvcnRlciBmb3IgdGhlIHRhcmdldCBjb250ZXh0XG4gICAgdGhpcy5kaXN0b3J0ZXJfID0gbmV3IENhcmRib2FyZERpc3RvcnRlcihnbCk7XG4gICAgdGhpcy5kaXN0b3J0ZXJfLnVwZGF0ZURldmljZUluZm8odGhpcy5kZXZpY2VJbmZvXyk7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8gPSB0aGlzLmRpc3RvcnRlcl8uY2FyZGJvYXJkVUk7XG5cbiAgICBpZiAodGhpcy5sYXllcl8ubGVmdEJvdW5kcyB8fCB0aGlzLmxheWVyXy5yaWdodEJvdW5kcykge1xuICAgICAgdGhpcy5kaXN0b3J0ZXJfLnNldFRleHR1cmVCb3VuZHModGhpcy5sYXllcl8ubGVmdEJvdW5kcywgdGhpcy5sYXllcl8ucmlnaHRCb3VuZHMpO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuY2FyZGJvYXJkVUlfLmxpc3RlbihmdW5jdGlvbigpIHtcbiAgICAvLyBPcHRpb25zIGNsaWNrZWRcbiAgICB0aGlzLnZpZXdlclNlbGVjdG9yXy5zaG93KHRoaXMubGF5ZXJfLnNvdXJjZS5wYXJlbnRFbGVtZW50KTtcbiAgfS5iaW5kKHRoaXMpLCBmdW5jdGlvbigpIHtcbiAgICAvLyBCYWNrIGNsaWNrZWRcbiAgICB0aGlzLmV4aXRQcmVzZW50KCk7XG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgaWYgKFV0aWwuaXNMYW5kc2NhcGVNb2RlKCkgJiYgVXRpbC5pc01vYmlsZSgpKSB7XG4gICAgLy8gSW4gbGFuZHNjYXBlIG1vZGUsIHRlbXBvcmFyaWx5IHNob3cgdGhlIFwicHV0IGludG8gQ2FyZGJvYXJkXCJcbiAgICAvLyBpbnRlcnN0aXRpYWwuIE90aGVyd2lzZSwgZG8gdGhlIGRlZmF1bHQgdGhpbmcuXG4gICAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfLnNob3dUZW1wb3JhcmlseSgzMDAwLCB0aGlzLmxheWVyXy5zb3VyY2UucGFyZW50RWxlbWVudCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfLnVwZGF0ZSgpO1xuICB9XG5cbiAgLy8gTGlzdGVuIGZvciBvcmllbnRhdGlvbiBjaGFuZ2UgZXZlbnRzIGluIG9yZGVyIHRvIHNob3cgaW50ZXJzdGl0aWFsLlxuICB0aGlzLm9yaWVudGF0aW9uSGFuZGxlciA9IHRoaXMub25PcmllbnRhdGlvbkNoYW5nZV8uYmluZCh0aGlzKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgdGhpcy5vcmllbnRhdGlvbkhhbmRsZXIpO1xuXG4gIC8vIEZpcmUgdGhpcyBldmVudCBpbml0aWFsbHksIHRvIGdpdmUgZ2VvbWV0cnktZGlzdG9ydGlvbiBjbGllbnRzIHRoZSBjaGFuY2VcbiAgLy8gdG8gZG8gc29tZXRoaW5nIGN1c3RvbS5cbiAgdGhpcy5maXJlVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXygpO1xufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5lbmRQcmVzZW50XyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5kaXN0b3J0ZXJfKSB7XG4gICAgdGhpcy5kaXN0b3J0ZXJfLmRlc3Ryb3koKTtcbiAgICB0aGlzLmRpc3RvcnRlcl8gPSBudWxsO1xuICB9XG4gIGlmICh0aGlzLmNhcmRib2FyZFVJXykge1xuICAgIHRoaXMuY2FyZGJvYXJkVUlfLmRlc3Ryb3koKTtcbiAgICB0aGlzLmNhcmRib2FyZFVJXyA9IG51bGw7XG4gIH1cblxuICB0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18uaGlkZSgpO1xuICB0aGlzLnZpZXdlclNlbGVjdG9yXy5oaWRlKCk7XG5cbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgdGhpcy5vcmllbnRhdGlvbkhhbmRsZXIpO1xufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5zdWJtaXRGcmFtZSA9IGZ1bmN0aW9uKHBvc2UpIHtcbiAgaWYgKHRoaXMuZGlzdG9ydGVyXykge1xuICAgIHRoaXMuZGlzdG9ydGVyXy5zdWJtaXRGcmFtZSgpO1xuICB9IGVsc2UgaWYgKHRoaXMuY2FyZGJvYXJkVUlfKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8ucmVuZGVyKCk7XG4gIH1cbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25PcmllbnRhdGlvbkNoYW5nZV8gPSBmdW5jdGlvbihlKSB7XG4gIGNvbnNvbGUubG9nKCdvbk9yaWVudGF0aW9uQ2hhbmdlXycpO1xuXG4gIC8vIEhpZGUgdGhlIHZpZXdlciBzZWxlY3Rvci5cbiAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8uaGlkZSgpO1xuXG4gIC8vIFVwZGF0ZSB0aGUgcm90YXRlIGluc3RydWN0aW9ucy5cbiAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfLnVwZGF0ZSgpO1xufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vblZpZXdlckNoYW5nZWRfID0gZnVuY3Rpb24odmlld2VyKSB7XG4gIHRoaXMuZGV2aWNlSW5mb18uc2V0Vmlld2VyKHZpZXdlcik7XG5cbiAgLy8gVXBkYXRlIHRoZSBkaXN0b3J0aW9uIGFwcHJvcHJpYXRlbHkuXG4gIHRoaXMuZGlzdG9ydGVyXy51cGRhdGVEZXZpY2VJbmZvKHRoaXMuZGV2aWNlSW5mb18pO1xuXG4gIC8vIEZpcmUgYSBuZXcgZXZlbnQgY29udGFpbmluZyB2aWV3ZXIgYW5kIGRldmljZSBwYXJhbWV0ZXJzIGZvciBjbGllbnRzIHRoYXRcbiAgLy8gd2FudCB0byBpbXBsZW1lbnQgdGhlaXIgb3duIGdlb21ldHJ5LWJhc2VkIGRpc3RvcnRpb24uXG4gIHRoaXMuZmlyZVZSRGlzcGxheURldmljZVBhcmFtc0NoYW5nZV8oKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuZmlyZVZSRGlzcGxheURldmljZVBhcmFtc0NoYW5nZV8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCd2cmRpc3BsYXlkZXZpY2VwYXJhbXNjaGFuZ2UnLCB7XG4gICAgZGV0YWlsOiB7XG4gICAgICB2cmRpc3BsYXk6IHRoaXMsXG4gICAgICBkZXZpY2VJbmZvOiB0aGlzLmRldmljZUluZm9fLFxuICAgIH1cbiAgfSk7XG4gIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FyZGJvYXJkVlJEaXNwbGF5O1xuIiwiLypcbkNvcHlyaWdodCAoYykgMjAxNiwgQnJhbmRvbiBKb25lcy5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLlxuKi9cblxuLypcbkNhY2hlcyBzcGVjaWZpZWQgR0wgc3RhdGUsIHJ1bnMgYSBjYWxsYmFjaywgYW5kIHJlc3RvcmVzIHRoZSBjYWNoZWQgc3RhdGUgd2hlblxuZG9uZS5cblxuRXhhbXBsZSB1c2FnZTpcblxudmFyIHNhdmVkU3RhdGUgPSBbXG4gIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HLFxuXG4gIC8vIFRFWFRVUkVfQklORElOR18yRCBvciBfQ1VCRV9NQVAgbXVzdCBhbHdheXMgYmUgZm9sbG93ZWQgYnkgdGhlIHRleHVyZSB1bml0LlxuICBnbC5URVhUVVJFX0JJTkRJTkdfMkQsIGdsLlRFWFRVUkUwLFxuXG4gIGdsLkNMRUFSX0NPTE9SLFxuXTtcbi8vIEFmdGVyIHRoaXMgY2FsbCB0aGUgYXJyYXkgYnVmZmVyLCB0ZXh0dXJlIHVuaXQgMCwgYWN0aXZlIHRleHR1cmUsIGFuZCBjbGVhclxuLy8gY29sb3Igd2lsbCBiZSByZXN0b3JlZC4gVGhlIHZpZXdwb3J0IHdpbGwgcmVtYWluIGNoYW5nZWQsIGhvd2V2ZXIsIGJlY2F1c2Vcbi8vIGdsLlZJRVdQT1JUIHdhcyBub3QgaW5jbHVkZWQgaW4gdGhlIHNhdmVkU3RhdGUgbGlzdC5cbldHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIHNhdmVkU3RhdGUsIGZ1bmN0aW9uKGdsKSB7XG4gIGdsLnZpZXdwb3J0KDAsIDAsIGdsLmRyYXdpbmdCdWZmZXJXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG5cbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlcik7XG4gIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCAuLi4uKTtcblxuICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSk7XG4gIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgLi4uKTtcblxuICBnbC5jbGVhckNvbG9yKDEsIDAsIDAsIDEpO1xuICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbn0pO1xuXG5Ob3RlIHRoYXQgdGhpcyBpcyBub3QgaW50ZW5kZWQgdG8gYmUgZmFzdC4gTWFuYWdpbmcgc3RhdGUgaW4geW91ciBvd24gY29kZSB0b1xuYXZvaWQgcmVkdW5kYW50IHN0YXRlIHNldHRpbmcgYW5kIHF1ZXJ5aW5nIHdpbGwgYWx3YXlzIGJlIGZhc3Rlci4gVGhpcyBmdW5jdGlvblxuaXMgbW9zdCB1c2VmdWwgZm9yIGNhc2VzIHdoZXJlIHlvdSBtYXkgbm90IGhhdmUgZnVsbCBjb250cm9sIG92ZXIgdGhlIFdlYkdMXG5jYWxscyBiZWluZyBtYWRlLCBzdWNoIGFzIHRvb2xpbmcgb3IgZWZmZWN0IGluamVjdG9ycy5cbiovXG5cbmZ1bmN0aW9uIFdHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIGJpbmRpbmdzLCBjYWxsYmFjaykge1xuICBpZiAoIWJpbmRpbmdzKSB7XG4gICAgY2FsbGJhY2soZ2wpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBib3VuZFZhbHVlcyA9IFtdO1xuXG4gIHZhciBhY3RpdmVUZXh0dXJlID0gbnVsbDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBiaW5kaW5ncy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBiaW5kaW5nID0gYmluZGluZ3NbaV07XG4gICAgc3dpdGNoIChiaW5kaW5nKSB7XG4gICAgICBjYXNlIGdsLlRFWFRVUkVfQklORElOR18yRDpcbiAgICAgIGNhc2UgZ2wuVEVYVFVSRV9CSU5ESU5HX0NVQkVfTUFQOlxuICAgICAgICB2YXIgdGV4dHVyZVVuaXQgPSBiaW5kaW5nc1srK2ldO1xuICAgICAgICBpZiAodGV4dHVyZVVuaXQgPCBnbC5URVhUVVJFMCB8fCB0ZXh0dXJlVW5pdCA+IGdsLlRFWFRVUkUzMSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJURVhUVVJFX0JJTkRJTkdfMkQgb3IgVEVYVFVSRV9CSU5ESU5HX0NVQkVfTUFQIG11c3QgYmUgZm9sbG93ZWQgYnkgYSB2YWxpZCB0ZXh0dXJlIHVuaXRcIik7XG4gICAgICAgICAgYm91bmRWYWx1ZXMucHVzaChudWxsLCBudWxsKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFjdGl2ZVRleHR1cmUpIHtcbiAgICAgICAgICBhY3RpdmVUZXh0dXJlID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFDVElWRV9URVhUVVJFKTtcbiAgICAgICAgfVxuICAgICAgICBnbC5hY3RpdmVUZXh0dXJlKHRleHR1cmVVbml0KTtcbiAgICAgICAgYm91bmRWYWx1ZXMucHVzaChnbC5nZXRQYXJhbWV0ZXIoYmluZGluZyksIG51bGwpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuQUNUSVZFX1RFWFRVUkU6XG4gICAgICAgIGFjdGl2ZVRleHR1cmUgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQUNUSVZFX1RFWFRVUkUpO1xuICAgICAgICBib3VuZFZhbHVlcy5wdXNoKG51bGwpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJvdW5kVmFsdWVzLnB1c2goZ2wuZ2V0UGFyYW1ldGVyKGJpbmRpbmcpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgY2FsbGJhY2soZ2wpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYmluZGluZ3MubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYmluZGluZyA9IGJpbmRpbmdzW2ldO1xuICAgIHZhciBib3VuZFZhbHVlID0gYm91bmRWYWx1ZXNbaV07XG4gICAgc3dpdGNoIChiaW5kaW5nKSB7XG4gICAgICBjYXNlIGdsLkFDVElWRV9URVhUVVJFOlxuICAgICAgICBicmVhazsgLy8gSWdub3JlIHRoaXMgYmluZGluZywgc2luY2Ugd2Ugc3BlY2lhbC1jYXNlIGl0IHRvIGhhcHBlbiBsYXN0LlxuICAgICAgY2FzZSBnbC5BUlJBWV9CVUZGRVJfQklORElORzpcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuQ09MT1JfQ0xFQVJfVkFMVUU6XG4gICAgICAgIGdsLmNsZWFyQ29sb3IoYm91bmRWYWx1ZVswXSwgYm91bmRWYWx1ZVsxXSwgYm91bmRWYWx1ZVsyXSwgYm91bmRWYWx1ZVszXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5DT0xPUl9XUklURU1BU0s6XG4gICAgICAgIGdsLmNvbG9yTWFzayhib3VuZFZhbHVlWzBdLCBib3VuZFZhbHVlWzFdLCBib3VuZFZhbHVlWzJdLCBib3VuZFZhbHVlWzNdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkNVUlJFTlRfUFJPR1JBTTpcbiAgICAgICAgZ2wudXNlUHJvZ3JhbShib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSX0JJTkRJTkc6XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuRlJBTUVCVUZGRVJfQklORElORzpcbiAgICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLlJFTkRFUkJVRkZFUl9CSU5ESU5HOlxuICAgICAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5URVhUVVJFX0JJTkRJTkdfMkQ6XG4gICAgICAgIHZhciB0ZXh0dXJlVW5pdCA9IGJpbmRpbmdzWysraV07XG4gICAgICAgIGlmICh0ZXh0dXJlVW5pdCA8IGdsLlRFWFRVUkUwIHx8IHRleHR1cmVVbml0ID4gZ2wuVEVYVFVSRTMxKVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBnbC5hY3RpdmVUZXh0dXJlKHRleHR1cmVVbml0KTtcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5URVhUVVJFX0JJTkRJTkdfQ1VCRV9NQVA6XG4gICAgICAgIHZhciB0ZXh0dXJlVW5pdCA9IGJpbmRpbmdzWysraV07XG4gICAgICAgIGlmICh0ZXh0dXJlVW5pdCA8IGdsLlRFWFRVUkUwIHx8IHRleHR1cmVVbml0ID4gZ2wuVEVYVFVSRTMxKVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBnbC5hY3RpdmVUZXh0dXJlKHRleHR1cmVVbml0KTtcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5WSUVXUE9SVDpcbiAgICAgICAgZ2wudmlld3BvcnQoYm91bmRWYWx1ZVswXSwgYm91bmRWYWx1ZVsxXSwgYm91bmRWYWx1ZVsyXSwgYm91bmRWYWx1ZVszXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5CTEVORDpcbiAgICAgIGNhc2UgZ2wuQ1VMTF9GQUNFOlxuICAgICAgY2FzZSBnbC5ERVBUSF9URVNUOlxuICAgICAgY2FzZSBnbC5TQ0lTU09SX1RFU1Q6XG4gICAgICBjYXNlIGdsLlNURU5DSUxfVEVTVDpcbiAgICAgICAgaWYgKGJvdW5kVmFsdWUpIHtcbiAgICAgICAgICBnbC5lbmFibGUoYmluZGluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ2wuZGlzYWJsZShiaW5kaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTm8gR0wgcmVzdG9yZSBiZWhhdmlvciBmb3IgMHhcIiArIGJpbmRpbmcudG9TdHJpbmcoMTYpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKGFjdGl2ZVRleHR1cmUpIHtcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUoYWN0aXZlVGV4dHVyZSk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gV0dMVVByZXNlcnZlR0xTdGF0ZTsiLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgRGlzdG9ydGlvbiA9IHJlcXVpcmUoJy4vZGlzdG9ydGlvbi9kaXN0b3J0aW9uLmpzJyk7XG52YXIgTWF0aFV0aWwgPSByZXF1aXJlKCcuL21hdGgtdXRpbC5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gRGV2aWNlKHBhcmFtcykge1xuICB0aGlzLndpZHRoID0gcGFyYW1zLndpZHRoIHx8IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKTtcbiAgdGhpcy5oZWlnaHQgPSBwYXJhbXMuaGVpZ2h0IHx8IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCk7XG4gIHRoaXMud2lkdGhNZXRlcnMgPSBwYXJhbXMud2lkdGhNZXRlcnM7XG4gIHRoaXMuaGVpZ2h0TWV0ZXJzID0gcGFyYW1zLmhlaWdodE1ldGVycztcbiAgdGhpcy5iZXZlbE1ldGVycyA9IHBhcmFtcy5iZXZlbE1ldGVycztcbn1cblxuXG4vLyBGYWxsYmFjayBBbmRyb2lkIGRldmljZSAoYmFzZWQgb24gTmV4dXMgNSBtZWFzdXJlbWVudHMpIGZvciB1c2Ugd2hlblxuLy8gd2UgY2FuJ3QgcmVjb2duaXplIGFuIEFuZHJvaWQgZGV2aWNlLlxudmFyIERFRkFVTFRfQU5EUk9JRCA9IG5ldyBEZXZpY2Uoe1xuICB3aWR0aE1ldGVyczogMC4xMTAsXG4gIGhlaWdodE1ldGVyczogMC4wNjIsXG4gIGJldmVsTWV0ZXJzOiAwLjAwNFxufSk7XG5cbi8vIEZhbGxiYWNrIGlPUyBkZXZpY2UgKGJhc2VkIG9uIGlQaG9uZTYpIGZvciB1c2Ugd2hlblxuLy8gd2UgY2FuJ3QgcmVjb2duaXplIGFuIEFuZHJvaWQgZGV2aWNlLlxudmFyIERFRkFVTFRfSU9TID0gbmV3IERldmljZSh7XG4gIHdpZHRoTWV0ZXJzOiAwLjEwMzgsXG4gIGhlaWdodE1ldGVyczogMC4wNTg0LFxuICBiZXZlbE1ldGVyczogMC4wMDRcbn0pO1xuXG5cbnZhciBWaWV3ZXJzID0ge1xuICBDYXJkYm9hcmRWMTogbmV3IENhcmRib2FyZFZpZXdlcih7XG4gICAgaWQ6ICdDYXJkYm9hcmRWMScsXG4gICAgbGFiZWw6ICdDYXJkYm9hcmQgSS9PIDIwMTQnLFxuICAgIGZvdjogNDAsXG4gICAgaW50ZXJMZW5zRGlzdGFuY2U6IDAuMDYwLFxuICAgIGJhc2VsaW5lTGVuc0Rpc3RhbmNlOiAwLjAzNSxcbiAgICBzY3JlZW5MZW5zRGlzdGFuY2U6IDAuMDQyLFxuICAgIGRpc3RvcnRpb25Db2VmZmljaWVudHM6IFswLjQ0MSwgMC4xNTZdLFxuICAgIGludmVyc2VDb2VmZmljaWVudHM6IFstMC40NDEwMDM1LCAwLjQyNzU2MTU1LCAtMC40ODA0NDM5LCAwLjU0NjAxMzksXG4gICAgICAtMC41ODgyMTE4MywgMC41NzMzOTM4LCAtMC40ODMwMzIwMiwgMC4zMzI5OTA4MywgLTAuMTc1NzM4NDEsXG4gICAgICAwLjA2NTE3NzIsIC0wLjAxNDg4OTYzLCAwLjAwMTU1OTgzNF1cbiAgfSksXG4gIENhcmRib2FyZFYyOiBuZXcgQ2FyZGJvYXJkVmlld2VyKHtcbiAgICBpZDogJ0NhcmRib2FyZFYyJyxcbiAgICBsYWJlbDogJ0NhcmRib2FyZCBJL08gMjAxNScsXG4gICAgZm92OiA2MCxcbiAgICBpbnRlckxlbnNEaXN0YW5jZTogMC4wNjQsXG4gICAgYmFzZWxpbmVMZW5zRGlzdGFuY2U6IDAuMDM1LFxuICAgIHNjcmVlbkxlbnNEaXN0YW5jZTogMC4wMzksXG4gICAgZGlzdG9ydGlvbkNvZWZmaWNpZW50czogWzAuMzQsIDAuNTVdLFxuICAgIGludmVyc2VDb2VmZmljaWVudHM6IFstMC4zMzgzNjcwNCwgLTAuMTgxNjIxODUsIDAuODYyNjU1LCAtMS4yNDYyMDUxLFxuICAgICAgMS4wNTYwNjAyLCAtMC41ODIwODMxNywgMC4yMTYwOTA3OCwgLTAuMDU0NDQ4MjMsIDAuMDA5MTc3OTU2LFxuICAgICAgLTkuOTA0MTY5RS00LCA2LjE4MzUzNUUtNSwgLTEuNjk4MTgwM0UtNl1cbiAgfSlcbn07XG5cblxudmFyIERFRkFVTFRfTEVGVF9DRU5URVIgPSB7eDogMC41LCB5OiAwLjV9O1xudmFyIERFRkFVTFRfUklHSFRfQ0VOVEVSID0ge3g6IDAuNSwgeTogMC41fTtcblxuLyoqXG4gKiBNYW5hZ2VzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBkZXZpY2UgYW5kIHRoZSB2aWV3ZXIuXG4gKlxuICogZGV2aWNlUGFyYW1zIGluZGljYXRlcyB0aGUgcGFyYW1ldGVycyBvZiB0aGUgZGV2aWNlIHRvIHVzZSAoZ2VuZXJhbGx5XG4gKiBvYnRhaW5lZCBmcm9tIGRwZGIuZ2V0RGV2aWNlUGFyYW1zKCkpLiBDYW4gYmUgbnVsbCB0byBtZWFuIG5vIGRldmljZVxuICogcGFyYW1zIHdlcmUgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIERldmljZUluZm8oZGV2aWNlUGFyYW1zKSB7XG4gIHRoaXMudmlld2VyID0gVmlld2Vycy5DYXJkYm9hcmRWMjtcbiAgdGhpcy51cGRhdGVEZXZpY2VQYXJhbXMoZGV2aWNlUGFyYW1zKTtcbiAgdGhpcy5kaXN0b3J0aW9uID0gbmV3IERpc3RvcnRpb24odGhpcy52aWV3ZXIuZGlzdG9ydGlvbkNvZWZmaWNpZW50cyk7XG59XG5cbkRldmljZUluZm8ucHJvdG90eXBlLnVwZGF0ZURldmljZVBhcmFtcyA9IGZ1bmN0aW9uKGRldmljZVBhcmFtcykge1xuICB0aGlzLmRldmljZSA9IHRoaXMuZGV0ZXJtaW5lRGV2aWNlXyhkZXZpY2VQYXJhbXMpIHx8IHRoaXMuZGV2aWNlO1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0RGV2aWNlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmRldmljZTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLnNldFZpZXdlciA9IGZ1bmN0aW9uKHZpZXdlcikge1xuICB0aGlzLnZpZXdlciA9IHZpZXdlcjtcbiAgdGhpcy5kaXN0b3J0aW9uID0gbmV3IERpc3RvcnRpb24odGhpcy52aWV3ZXIuZGlzdG9ydGlvbkNvZWZmaWNpZW50cyk7XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5kZXRlcm1pbmVEZXZpY2VfID0gZnVuY3Rpb24oZGV2aWNlUGFyYW1zKSB7XG4gIGlmICghZGV2aWNlUGFyYW1zKSB7XG4gICAgLy8gTm8gcGFyYW1ldGVycywgc28gdXNlIGEgZGVmYXVsdC5cbiAgICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1VzaW5nIGZhbGxiYWNrIEFuZHJvaWQgZGV2aWNlIG1lYXN1cmVtZW50cy4nKTtcbiAgICAgIHJldHVybiBERUZBVUxUX0lPUztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKCdVc2luZyBmYWxsYmFjayBpT1MgZGV2aWNlIG1lYXN1cmVtZW50cy4nKTtcbiAgICAgIHJldHVybiBERUZBVUxUX0FORFJPSUQ7XG4gICAgfVxuICB9XG5cbiAgLy8gQ29tcHV0ZSBkZXZpY2Ugc2NyZWVuIGRpbWVuc2lvbnMgYmFzZWQgb24gZGV2aWNlUGFyYW1zLlxuICB2YXIgTUVURVJTX1BFUl9JTkNIID0gMC4wMjU0O1xuICB2YXIgbWV0ZXJzUGVyUGl4ZWxYID0gTUVURVJTX1BFUl9JTkNIIC8gZGV2aWNlUGFyYW1zLnhkcGk7XG4gIHZhciBtZXRlcnNQZXJQaXhlbFkgPSBNRVRFUlNfUEVSX0lOQ0ggLyBkZXZpY2VQYXJhbXMueWRwaTtcbiAgdmFyIHdpZHRoID0gVXRpbC5nZXRTY3JlZW5XaWR0aCgpO1xuICB2YXIgaGVpZ2h0ID0gVXRpbC5nZXRTY3JlZW5IZWlnaHQoKTtcbiAgcmV0dXJuIG5ldyBEZXZpY2Uoe1xuICAgIHdpZHRoTWV0ZXJzOiBtZXRlcnNQZXJQaXhlbFggKiB3aWR0aCxcbiAgICBoZWlnaHRNZXRlcnM6IG1ldGVyc1BlclBpeGVsWSAqIGhlaWdodCxcbiAgICBiZXZlbE1ldGVyczogZGV2aWNlUGFyYW1zLmJldmVsTW0gKiAwLjAwMSxcbiAgfSk7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgZmllbGQgb2YgdmlldyBmb3IgdGhlIGxlZnQgZXllLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXREaXN0b3J0ZWRGaWVsZE9mVmlld0xlZnRFeWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHZpZXdlciA9IHRoaXMudmlld2VyO1xuICB2YXIgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG4gIHZhciBkaXN0b3J0aW9uID0gdGhpcy5kaXN0b3J0aW9uO1xuXG4gIC8vIERldmljZS5oZWlnaHQgYW5kIGRldmljZS53aWR0aCBmb3IgZGV2aWNlIGluIHBvcnRyYWl0IG1vZGUsIHNvIHRyYW5zcG9zZS5cbiAgdmFyIGV5ZVRvU2NyZWVuRGlzdGFuY2UgPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuXG4gIHZhciBvdXRlckRpc3QgPSAoZGV2aWNlLndpZHRoTWV0ZXJzIC0gdmlld2VyLmludGVyTGVuc0Rpc3RhbmNlKSAvIDI7XG4gIHZhciBpbm5lckRpc3QgPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyO1xuICB2YXIgYm90dG9tRGlzdCA9IHZpZXdlci5iYXNlbGluZUxlbnNEaXN0YW5jZSAtIGRldmljZS5iZXZlbE1ldGVycztcbiAgdmFyIHRvcERpc3QgPSBkZXZpY2UuaGVpZ2h0TWV0ZXJzIC0gYm90dG9tRGlzdDtcblxuICB2YXIgb3V0ZXJBbmdsZSA9IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKFxuICAgICAgZGlzdG9ydGlvbi5kaXN0b3J0KG91dGVyRGlzdCAvIGV5ZVRvU2NyZWVuRGlzdGFuY2UpKTtcbiAgdmFyIGlubmVyQW5nbGUgPSBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihcbiAgICAgIGRpc3RvcnRpb24uZGlzdG9ydChpbm5lckRpc3QgLyBleWVUb1NjcmVlbkRpc3RhbmNlKSk7XG4gIHZhciBib3R0b21BbmdsZSA9IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKFxuICAgICAgZGlzdG9ydGlvbi5kaXN0b3J0KGJvdHRvbURpc3QgLyBleWVUb1NjcmVlbkRpc3RhbmNlKSk7XG4gIHZhciB0b3BBbmdsZSA9IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKFxuICAgICAgZGlzdG9ydGlvbi5kaXN0b3J0KHRvcERpc3QgLyBleWVUb1NjcmVlbkRpc3RhbmNlKSk7XG5cbiAgcmV0dXJuIHtcbiAgICBsZWZ0RGVncmVlczogTWF0aC5taW4ob3V0ZXJBbmdsZSwgdmlld2VyLmZvdiksXG4gICAgcmlnaHREZWdyZWVzOiBNYXRoLm1pbihpbm5lckFuZ2xlLCB2aWV3ZXIuZm92KSxcbiAgICBkb3duRGVncmVlczogTWF0aC5taW4oYm90dG9tQW5nbGUsIHZpZXdlci5mb3YpLFxuICAgIHVwRGVncmVlczogTWF0aC5taW4odG9wQW5nbGUsIHZpZXdlci5mb3YpXG4gIH07XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHRhbi1hbmdsZXMgZnJvbSB0aGUgbWF4aW11bSBGT1YgZm9yIHRoZSBsZWZ0IGV5ZSBmb3IgdGhlXG4gKiBjdXJyZW50IGRldmljZSBhbmQgc2NyZWVuIHBhcmFtZXRlcnMuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldExlZnRFeWVWaXNpYmxlVGFuQW5nbGVzID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICAvLyBUYW4tYW5nbGVzIGZyb20gdGhlIG1heCBGT1YuXG4gIHZhciBmb3ZMZWZ0ID0gTWF0aC50YW4oLU1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdik7XG4gIHZhciBmb3ZUb3AgPSBNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpO1xuICB2YXIgZm92UmlnaHQgPSBNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpO1xuICB2YXIgZm92Qm90dG9tID0gTWF0aC50YW4oLU1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdik7XG4gIC8vIFZpZXdwb3J0IHNpemUuXG4gIHZhciBoYWxmV2lkdGggPSBkZXZpY2Uud2lkdGhNZXRlcnMgLyA0O1xuICB2YXIgaGFsZkhlaWdodCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLyAyO1xuICAvLyBWaWV3cG9ydCBjZW50ZXIsIG1lYXN1cmVkIGZyb20gbGVmdCBsZW5zIHBvc2l0aW9uLlxuICB2YXIgdmVydGljYWxMZW5zT2Zmc2V0ID0gKHZpZXdlci5iYXNlbGluZUxlbnNEaXN0YW5jZSAtIGRldmljZS5iZXZlbE1ldGVycyAtIGhhbGZIZWlnaHQpO1xuICB2YXIgY2VudGVyWCA9IHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSAvIDIgLSBoYWxmV2lkdGg7XG4gIHZhciBjZW50ZXJZID0gLXZlcnRpY2FsTGVuc09mZnNldDtcbiAgdmFyIGNlbnRlclogPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuICAvLyBUYW4tYW5nbGVzIG9mIHRoZSB2aWV3cG9ydCBlZGdlcywgYXMgc2VlbiB0aHJvdWdoIHRoZSBsZW5zLlxuICB2YXIgc2NyZWVuTGVmdCA9IGRpc3RvcnRpb24uZGlzdG9ydCgoY2VudGVyWCAtIGhhbGZXaWR0aCkgLyBjZW50ZXJaKTtcbiAgdmFyIHNjcmVlblRvcCA9IGRpc3RvcnRpb24uZGlzdG9ydCgoY2VudGVyWSArIGhhbGZIZWlnaHQpIC8gY2VudGVyWik7XG4gIHZhciBzY3JlZW5SaWdodCA9IGRpc3RvcnRpb24uZGlzdG9ydCgoY2VudGVyWCArIGhhbGZXaWR0aCkgLyBjZW50ZXJaKTtcbiAgdmFyIHNjcmVlbkJvdHRvbSA9IGRpc3RvcnRpb24uZGlzdG9ydCgoY2VudGVyWSAtIGhhbGZIZWlnaHQpIC8gY2VudGVyWik7XG4gIC8vIENvbXBhcmUgdGhlIHR3byBzZXRzIG9mIHRhbi1hbmdsZXMgYW5kIHRha2UgdGhlIHZhbHVlIGNsb3NlciB0byB6ZXJvIG9uIGVhY2ggc2lkZS5cbiAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gIHJlc3VsdFswXSA9IE1hdGgubWF4KGZvdkxlZnQsIHNjcmVlbkxlZnQpO1xuICByZXN1bHRbMV0gPSBNYXRoLm1pbihmb3ZUb3AsIHNjcmVlblRvcCk7XG4gIHJlc3VsdFsyXSA9IE1hdGgubWluKGZvdlJpZ2h0LCBzY3JlZW5SaWdodCk7XG4gIHJlc3VsdFszXSA9IE1hdGgubWF4KGZvdkJvdHRvbSwgc2NyZWVuQm90dG9tKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgdGFuLWFuZ2xlcyBmcm9tIHRoZSBtYXhpbXVtIEZPViBmb3IgdGhlIGxlZnQgZXllIGZvciB0aGVcbiAqIGN1cnJlbnQgZGV2aWNlIGFuZCBzY3JlZW4gcGFyYW1ldGVycywgYXNzdW1pbmcgbm8gbGVuc2VzLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRMZWZ0RXllTm9MZW5zVGFuQW5nbGVzID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICB2YXIgcmVzdWx0ID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgLy8gVGFuLWFuZ2xlcyBmcm9tIHRoZSBtYXggRk9WLlxuICB2YXIgZm92TGVmdCA9IGRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoTWF0aC50YW4oLU1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdikpO1xuICB2YXIgZm92VG9wID0gZGlzdG9ydGlvbi5kaXN0b3J0SW52ZXJzZShNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpKTtcbiAgdmFyIGZvdlJpZ2h0ID0gZGlzdG9ydGlvbi5kaXN0b3J0SW52ZXJzZShNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpKTtcbiAgdmFyIGZvdkJvdHRvbSA9IGRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoTWF0aC50YW4oLU1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdikpO1xuICAvLyBWaWV3cG9ydCBzaXplLlxuICB2YXIgaGFsZldpZHRoID0gZGV2aWNlLndpZHRoTWV0ZXJzIC8gNDtcbiAgdmFyIGhhbGZIZWlnaHQgPSBkZXZpY2UuaGVpZ2h0TWV0ZXJzIC8gMjtcbiAgLy8gVmlld3BvcnQgY2VudGVyLCBtZWFzdXJlZCBmcm9tIGxlZnQgbGVucyBwb3NpdGlvbi5cbiAgdmFyIHZlcnRpY2FsTGVuc09mZnNldCA9ICh2aWV3ZXIuYmFzZWxpbmVMZW5zRGlzdGFuY2UgLSBkZXZpY2UuYmV2ZWxNZXRlcnMgLSBoYWxmSGVpZ2h0KTtcbiAgdmFyIGNlbnRlclggPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyIC0gaGFsZldpZHRoO1xuICB2YXIgY2VudGVyWSA9IC12ZXJ0aWNhbExlbnNPZmZzZXQ7XG4gIHZhciBjZW50ZXJaID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgLy8gVGFuLWFuZ2xlcyBvZiB0aGUgdmlld3BvcnQgZWRnZXMsIGFzIHNlZW4gdGhyb3VnaCB0aGUgbGVucy5cbiAgdmFyIHNjcmVlbkxlZnQgPSAoY2VudGVyWCAtIGhhbGZXaWR0aCkgLyBjZW50ZXJaO1xuICB2YXIgc2NyZWVuVG9wID0gKGNlbnRlclkgKyBoYWxmSGVpZ2h0KSAvIGNlbnRlclo7XG4gIHZhciBzY3JlZW5SaWdodCA9IChjZW50ZXJYICsgaGFsZldpZHRoKSAvIGNlbnRlclo7XG4gIHZhciBzY3JlZW5Cb3R0b20gPSAoY2VudGVyWSAtIGhhbGZIZWlnaHQpIC8gY2VudGVyWjtcbiAgLy8gQ29tcGFyZSB0aGUgdHdvIHNldHMgb2YgdGFuLWFuZ2xlcyBhbmQgdGFrZSB0aGUgdmFsdWUgY2xvc2VyIHRvIHplcm8gb24gZWFjaCBzaWRlLlxuICByZXN1bHRbMF0gPSBNYXRoLm1heChmb3ZMZWZ0LCBzY3JlZW5MZWZ0KTtcbiAgcmVzdWx0WzFdID0gTWF0aC5taW4oZm92VG9wLCBzY3JlZW5Ub3ApO1xuICByZXN1bHRbMl0gPSBNYXRoLm1pbihmb3ZSaWdodCwgc2NyZWVuUmlnaHQpO1xuICByZXN1bHRbM10gPSBNYXRoLm1heChmb3ZCb3R0b20sIHNjcmVlbkJvdHRvbSk7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNjcmVlbiByZWN0YW5nbGUgdmlzaWJsZSBmcm9tIHRoZSBsZWZ0IGV5ZSBmb3IgdGhlXG4gKiBjdXJyZW50IGRldmljZSBhbmQgc2NyZWVuIHBhcmFtZXRlcnMuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldExlZnRFeWVWaXNpYmxlU2NyZWVuUmVjdCA9IGZ1bmN0aW9uKHVuZGlzdG9ydGVkRnJ1c3R1bSkge1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcblxuICB2YXIgZGlzdCA9IHZpZXdlci5zY3JlZW5MZW5zRGlzdGFuY2U7XG4gIHZhciBleWVYID0gKGRldmljZS53aWR0aE1ldGVycyAtIHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSkgLyAyO1xuICB2YXIgZXllWSA9IHZpZXdlci5iYXNlbGluZUxlbnNEaXN0YW5jZSAtIGRldmljZS5iZXZlbE1ldGVycztcbiAgdmFyIGxlZnQgPSAodW5kaXN0b3J0ZWRGcnVzdHVtWzBdICogZGlzdCArIGV5ZVgpIC8gZGV2aWNlLndpZHRoTWV0ZXJzO1xuICB2YXIgdG9wID0gKHVuZGlzdG9ydGVkRnJ1c3R1bVsxXSAqIGRpc3QgKyBleWVZKSAvIGRldmljZS5oZWlnaHRNZXRlcnM7XG4gIHZhciByaWdodCA9ICh1bmRpc3RvcnRlZEZydXN0dW1bMl0gKiBkaXN0ICsgZXllWCkgLyBkZXZpY2Uud2lkdGhNZXRlcnM7XG4gIHZhciBib3R0b20gPSAodW5kaXN0b3J0ZWRGcnVzdHVtWzNdICogZGlzdCArIGV5ZVkpIC8gZGV2aWNlLmhlaWdodE1ldGVycztcbiAgcmV0dXJuIHtcbiAgICB4OiBsZWZ0LFxuICAgIHk6IGJvdHRvbSxcbiAgICB3aWR0aDogcmlnaHQgLSBsZWZ0LFxuICAgIGhlaWdodDogdG9wIC0gYm90dG9tXG4gIH07XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRGaWVsZE9mVmlld0xlZnRFeWUgPSBmdW5jdGlvbihvcHRfaXNVbmRpc3RvcnRlZCkge1xuICByZXR1cm4gb3B0X2lzVW5kaXN0b3J0ZWQgPyB0aGlzLmdldFVuZGlzdG9ydGVkRmllbGRPZlZpZXdMZWZ0RXllKCkgOlxuICAgICAgdGhpcy5nZXREaXN0b3J0ZWRGaWVsZE9mVmlld0xlZnRFeWUoKTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLmdldEZpZWxkT2ZWaWV3UmlnaHRFeWUgPSBmdW5jdGlvbihvcHRfaXNVbmRpc3RvcnRlZCkge1xuICB2YXIgZm92ID0gdGhpcy5nZXRGaWVsZE9mVmlld0xlZnRFeWUob3B0X2lzVW5kaXN0b3J0ZWQpO1xuICByZXR1cm4ge1xuICAgIGxlZnREZWdyZWVzOiBmb3YucmlnaHREZWdyZWVzLFxuICAgIHJpZ2h0RGVncmVlczogZm92LmxlZnREZWdyZWVzLFxuICAgIHVwRGVncmVlczogZm92LnVwRGVncmVlcyxcbiAgICBkb3duRGVncmVlczogZm92LmRvd25EZWdyZWVzXG4gIH07XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdW5kaXN0b3J0ZWQgZmllbGQgb2YgdmlldyBmb3IgdGhlIGxlZnQgZXllLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRVbmRpc3RvcnRlZEZpZWxkT2ZWaWV3TGVmdEV5ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcCA9IHRoaXMuZ2V0VW5kaXN0b3J0ZWRQYXJhbXNfKCk7XG5cbiAgcmV0dXJuIHtcbiAgICBsZWZ0RGVncmVlczogTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4ocC5vdXRlckRpc3QpLFxuICAgIHJpZ2h0RGVncmVlczogTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4ocC5pbm5lckRpc3QpLFxuICAgIGRvd25EZWdyZWVzOiBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihwLmJvdHRvbURpc3QpLFxuICAgIHVwRGVncmVlczogTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4ocC50b3BEaXN0KVxuICB9O1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0VW5kaXN0b3J0ZWRQYXJhbXNfID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICAvLyBNb3N0IG9mIHRoZXNlIHZhcmlhYmxlcyBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gIHZhciBleWVUb1NjcmVlbkRpc3RhbmNlID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgdmFyIGhhbGZMZW5zRGlzdGFuY2UgPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcbiAgdmFyIHNjcmVlbldpZHRoID0gZGV2aWNlLndpZHRoTWV0ZXJzIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcbiAgdmFyIHNjcmVlbkhlaWdodCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuXG4gIHZhciBleWVQb3NYID0gc2NyZWVuV2lkdGggLyAyIC0gaGFsZkxlbnNEaXN0YW5jZTtcbiAgdmFyIGV5ZVBvc1kgPSAodmlld2VyLmJhc2VsaW5lTGVuc0Rpc3RhbmNlIC0gZGV2aWNlLmJldmVsTWV0ZXJzKSAvIGV5ZVRvU2NyZWVuRGlzdGFuY2U7XG5cbiAgdmFyIG1heEZvdiA9IHZpZXdlci5mb3Y7XG4gIHZhciB2aWV3ZXJNYXggPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKE1hdGhVdGlsLmRlZ1RvUmFkICogbWF4Rm92KSk7XG4gIHZhciBvdXRlckRpc3QgPSBNYXRoLm1pbihleWVQb3NYLCB2aWV3ZXJNYXgpO1xuICB2YXIgaW5uZXJEaXN0ID0gTWF0aC5taW4oaGFsZkxlbnNEaXN0YW5jZSwgdmlld2VyTWF4KTtcbiAgdmFyIGJvdHRvbURpc3QgPSBNYXRoLm1pbihleWVQb3NZLCB2aWV3ZXJNYXgpO1xuICB2YXIgdG9wRGlzdCA9IE1hdGgubWluKHNjcmVlbkhlaWdodCAtIGV5ZVBvc1ksIHZpZXdlck1heCk7XG5cbiAgcmV0dXJuIHtcbiAgICBvdXRlckRpc3Q6IG91dGVyRGlzdCxcbiAgICBpbm5lckRpc3Q6IGlubmVyRGlzdCxcbiAgICB0b3BEaXN0OiB0b3BEaXN0LFxuICAgIGJvdHRvbURpc3Q6IGJvdHRvbURpc3QsXG4gICAgZXllUG9zWDogZXllUG9zWCxcbiAgICBleWVQb3NZOiBleWVQb3NZXG4gIH07XG59O1xuXG5cbmZ1bmN0aW9uIENhcmRib2FyZFZpZXdlcihwYXJhbXMpIHtcbiAgLy8gQSBtYWNoaW5lIHJlYWRhYmxlIElELlxuICB0aGlzLmlkID0gcGFyYW1zLmlkO1xuICAvLyBBIGh1bWFuIHJlYWRhYmxlIGxhYmVsLlxuICB0aGlzLmxhYmVsID0gcGFyYW1zLmxhYmVsO1xuXG4gIC8vIEZpZWxkIG9mIHZpZXcgaW4gZGVncmVlcyAocGVyIHNpZGUpLlxuICB0aGlzLmZvdiA9IHBhcmFtcy5mb3Y7XG5cbiAgLy8gRGlzdGFuY2UgYmV0d2VlbiBsZW5zIGNlbnRlcnMgaW4gbWV0ZXJzLlxuICB0aGlzLmludGVyTGVuc0Rpc3RhbmNlID0gcGFyYW1zLmludGVyTGVuc0Rpc3RhbmNlO1xuICAvLyBEaXN0YW5jZSBiZXR3ZWVuIHZpZXdlciBiYXNlbGluZSBhbmQgbGVucyBjZW50ZXIgaW4gbWV0ZXJzLlxuICB0aGlzLmJhc2VsaW5lTGVuc0Rpc3RhbmNlID0gcGFyYW1zLmJhc2VsaW5lTGVuc0Rpc3RhbmNlO1xuICAvLyBTY3JlZW4tdG8tbGVucyBkaXN0YW5jZSBpbiBtZXRlcnMuXG4gIHRoaXMuc2NyZWVuTGVuc0Rpc3RhbmNlID0gcGFyYW1zLnNjcmVlbkxlbnNEaXN0YW5jZTtcblxuICAvLyBEaXN0b3J0aW9uIGNvZWZmaWNpZW50cy5cbiAgdGhpcy5kaXN0b3J0aW9uQ29lZmZpY2llbnRzID0gcGFyYW1zLmRpc3RvcnRpb25Db2VmZmljaWVudHM7XG4gIC8vIEludmVyc2UgZGlzdG9ydGlvbiBjb2VmZmljaWVudHMuXG4gIC8vIFRPRE86IENhbGN1bGF0ZSB0aGVzZSBmcm9tIGRpc3RvcnRpb25Db2VmZmljaWVudHMgaW4gdGhlIGZ1dHVyZS5cbiAgdGhpcy5pbnZlcnNlQ29lZmZpY2llbnRzID0gcGFyYW1zLmludmVyc2VDb2VmZmljaWVudHM7XG59XG5cbi8vIEV4cG9ydCB2aWV3ZXIgaW5mb3JtYXRpb24uXG5EZXZpY2VJbmZvLlZpZXdlcnMgPSBWaWV3ZXJzO1xubW9kdWxlLmV4cG9ydHMgPSBEZXZpY2VJbmZvOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgVlJEaXNwbGF5ID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuVlJEaXNwbGF5O1xudmFyIEhNRFZSRGV2aWNlID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuSE1EVlJEZXZpY2U7XG52YXIgUG9zaXRpb25TZW5zb3JWUkRldmljZSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlBvc2l0aW9uU2Vuc29yVlJEZXZpY2U7XG5cbi8qKlxuICogV3JhcHMgYSBWUkRpc3BsYXkgYW5kIGV4cG9zZXMgaXQgYXMgYSBITURWUkRldmljZVxuICovXG5mdW5jdGlvbiBWUkRpc3BsYXlITUREZXZpY2UoZGlzcGxheSkge1xuICB0aGlzLmRpc3BsYXkgPSBkaXNwbGF5O1xuXG4gIHRoaXMuaGFyZHdhcmVVbml0SWQgPSBkaXNwbGF5LmRpc3BsYXlJZDtcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2x5ZmlsbDpITUQ6JyArIGRpc3BsYXkuZGlzcGxheUlkO1xuICB0aGlzLmRldmljZU5hbWUgPSBkaXNwbGF5LmRpc3BsYXlOYW1lICsgJyAoSE1EKSc7XG59XG5WUkRpc3BsYXlITUREZXZpY2UucHJvdG90eXBlID0gbmV3IEhNRFZSRGV2aWNlKCk7XG5cblZSRGlzcGxheUhNRERldmljZS5wcm90b3R5cGUuZ2V0RXllUGFyYW1ldGVycyA9IGZ1bmN0aW9uKHdoaWNoRXllKSB7XG4gIHZhciBleWVQYXJhbWV0ZXJzID0gdGhpcy5kaXNwbGF5LmdldEV5ZVBhcmFtZXRlcnMod2hpY2hFeWUpO1xuXG4gIHJldHVybiB7XG4gICAgY3VycmVudEZpZWxkT2ZWaWV3OiBleWVQYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3LFxuICAgIG1heGltdW1GaWVsZE9mVmlldzogZXllUGFyYW1ldGVycy5maWVsZE9mVmlldyxcbiAgICBtaW5pbXVtRmllbGRPZlZpZXc6IGV5ZVBhcmFtZXRlcnMuZmllbGRPZlZpZXcsXG4gICAgcmVjb21tZW5kZWRGaWVsZE9mVmlldzogZXllUGFyYW1ldGVycy5maWVsZE9mVmlldyxcbiAgICBleWVUcmFuc2xhdGlvbjogeyB4OiBleWVQYXJhbWV0ZXJzLm9mZnNldFswXSwgeTogZXllUGFyYW1ldGVycy5vZmZzZXRbMV0sIHo6IGV5ZVBhcmFtZXRlcnMub2Zmc2V0WzJdIH0sXG4gICAgcmVuZGVyUmVjdDoge1xuICAgICAgeDogKHdoaWNoRXllID09ICdyaWdodCcpID8gZXllUGFyYW1ldGVycy5yZW5kZXJXaWR0aCA6IDAsXG4gICAgICB5OiAwLFxuICAgICAgd2lkdGg6IGV5ZVBhcmFtZXRlcnMucmVuZGVyV2lkdGgsXG4gICAgICBoZWlnaHQ6IGV5ZVBhcmFtZXRlcnMucmVuZGVySGVpZ2h0XG4gICAgfVxuICB9O1xufTtcblxuVlJEaXNwbGF5SE1ERGV2aWNlLnByb3RvdHlwZS5zZXRGaWVsZE9mVmlldyA9XG4gICAgZnVuY3Rpb24ob3B0X2ZvdkxlZnQsIG9wdF9mb3ZSaWdodCwgb3B0X3pOZWFyLCBvcHRfekZhcikge1xuICAvLyBOb3Qgc3VwcG9ydGVkLiBnZXRFeWVQYXJhbWV0ZXJzIHJlcG9ydHMgdGhhdCB0aGUgbWluLCBtYXgsIGFuZCByZWNvbW1lbmRlZFxuICAvLyBGb1YgaXMgYWxsIHRoZSBzYW1lLCBzbyBubyBhZGp1c3RtZW50IGNhbiBiZSBtYWRlLlxufTtcblxuLy8gVE9ETzogTmVlZCB0byBob29rIHJlcXVlc3RGdWxsc2NyZWVuIHRvIHNlZSBpZiBhIHdyYXBwZWQgVlJEaXNwbGF5IHdhcyBwYXNzZWRcbi8vIGluIGFzIGFuIG9wdGlvbi4gSWYgc28gd2Ugc2hvdWxkIHByZXZlbnQgdGhlIGRlZmF1bHQgZnVsbHNjcmVlbiBiZWhhdmlvciBhbmRcbi8vIGNhbGwgVlJEaXNwbGF5LnJlcXVlc3RQcmVzZW50IGluc3RlYWQuXG5cbi8qKlxuICogV3JhcHMgYSBWUkRpc3BsYXkgYW5kIGV4cG9zZXMgaXQgYXMgYSBQb3NpdGlvblNlbnNvclZSRGV2aWNlXG4gKi9cbmZ1bmN0aW9uIFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlKGRpc3BsYXkpIHtcbiAgdGhpcy5kaXNwbGF5ID0gZGlzcGxheTtcblxuICB0aGlzLmhhcmR3YXJlVW5pdElkID0gZGlzcGxheS5kaXNwbGF5SWQ7XG4gIHRoaXMuZGV2aWNlSWQgPSAnd2VidnItcG9seWZpbGw6UG9zaXRpb25TZW5zb3I6ICcgKyBkaXNwbGF5LmRpc3BsYXlJZDtcbiAgdGhpcy5kZXZpY2VOYW1lID0gZGlzcGxheS5kaXNwbGF5TmFtZSArICcgKFBvc2l0aW9uU2Vuc29yKSc7XG59XG5WUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZS5wcm90b3R5cGUgPSBuZXcgUG9zaXRpb25TZW5zb3JWUkRldmljZSgpO1xuXG5WUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZS5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBvc2UgPSB0aGlzLmRpc3BsYXkuZ2V0UG9zZSgpO1xuICByZXR1cm4ge1xuICAgIHBvc2l0aW9uOiBwb3NlLnBvc2l0aW9uID8geyB4OiBwb3NlLnBvc2l0aW9uWzBdLCB5OiBwb3NlLnBvc2l0aW9uWzFdLCB6OiBwb3NlLnBvc2l0aW9uWzJdIH0gOiBudWxsLFxuICAgIG9yaWVudGF0aW9uOiBwb3NlLm9yaWVudGF0aW9uID8geyB4OiBwb3NlLm9yaWVudGF0aW9uWzBdLCB5OiBwb3NlLm9yaWVudGF0aW9uWzFdLCB6OiBwb3NlLm9yaWVudGF0aW9uWzJdLCB3OiBwb3NlLm9yaWVudGF0aW9uWzNdIH0gOiBudWxsLFxuICAgIGxpbmVhclZlbG9jaXR5OiBudWxsLFxuICAgIGxpbmVhckFjY2VsZXJhdGlvbjogbnVsbCxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG51bGwsXG4gICAgYW5ndWxhckFjY2VsZXJhdGlvbjogbnVsbFxuICB9O1xufTtcblxuVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UucHJvdG90eXBlLnJlc2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMucG9zaXRpb25EZXZpY2UucmVzZXRQb3NlKCk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzLlZSRGlzcGxheUhNRERldmljZSA9IFZSRGlzcGxheUhNRERldmljZTtcbm1vZHVsZS5leHBvcnRzLlZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlID0gVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2U7XG5cbiIsIi8qKlxuICogVE9ETyhzbXVzKTogSW1wbGVtZW50IGNvZWZmaWNpZW50IGludmVyc2lvbi5cbiAqL1xuZnVuY3Rpb24gRGlzdG9ydGlvbihjb2VmZmljaWVudHMpIHtcbiAgdGhpcy5jb2VmZmljaWVudHMgPSBjb2VmZmljaWVudHM7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgaW52ZXJzZSBkaXN0b3J0aW9uIGZvciBhIHJhZGl1cy5cbiAqIDwvcD48cD5cbiAqIEFsbG93cyB0byBjb21wdXRlIHRoZSBvcmlnaW5hbCB1bmRpc3RvcnRlZCByYWRpdXMgZnJvbSBhIGRpc3RvcnRlZCBvbmUuXG4gKiBTZWUgYWxzbyBnZXRBcHByb3hpbWF0ZUludmVyc2VEaXN0b3J0aW9uKCkgZm9yIGEgZmFzdGVyIGJ1dCBwb3RlbnRpYWxseVxuICogbGVzcyBhY2N1cmF0ZSBtZXRob2QuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZGl1cyBEaXN0b3J0ZWQgcmFkaXVzIGZyb20gdGhlIGxlbnMgY2VudGVyIGluIHRhbi1hbmdsZSB1bml0cy5cbiAqIEByZXR1cm4ge051bWJlcn0gVGhlIHVuZGlzdG9ydGVkIHJhZGl1cyBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gKi9cbkRpc3RvcnRpb24ucHJvdG90eXBlLmRpc3RvcnRJbnZlcnNlID0gZnVuY3Rpb24ocmFkaXVzKSB7XG4gIC8vIFNlY2FudCBtZXRob2QuXG4gIHZhciByMCA9IDA7XG4gIHZhciByMSA9IDE7XG4gIHZhciBkcjAgPSByYWRpdXMgLSB0aGlzLmRpc3RvcnQocjApO1xuICB3aGlsZSAoTWF0aC5hYnMocjEgLSByMCkgPiAwLjAwMDEgLyoqIDAuMW1tICovKSB7XG4gICAgdmFyIGRyMSA9IHJhZGl1cyAtIHRoaXMuZGlzdG9ydChyMSk7XG4gICAgdmFyIHIyID0gcjEgLSBkcjEgKiAoKHIxIC0gcjApIC8gKGRyMSAtIGRyMCkpO1xuICAgIHIwID0gcjE7XG4gICAgcjEgPSByMjtcbiAgICBkcjAgPSBkcjE7XG4gIH1cbiAgcmV0dXJuIHIxO1xufTtcblxuLyoqXG4gKiBEaXN0b3J0cyBhIHJhZGl1cyBieSBpdHMgZGlzdG9ydGlvbiBmYWN0b3IgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBsZW5zZXMuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZGl1cyBSYWRpdXMgZnJvbSB0aGUgbGVucyBjZW50ZXIgaW4gdGFuLWFuZ2xlIHVuaXRzLlxuICogQHJldHVybiB7TnVtYmVyfSBUaGUgZGlzdG9ydGVkIHJhZGl1cyBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gKi9cbkRpc3RvcnRpb24ucHJvdG90eXBlLmRpc3RvcnQgPSBmdW5jdGlvbihyYWRpdXMpIHtcbiAgdmFyIHIyID0gcmFkaXVzICogcmFkaXVzO1xuICB2YXIgcmV0ID0gMDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvZWZmaWNpZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHJldCA9IHIyICogKHJldCArIHRoaXMuY29lZmZpY2llbnRzW2ldKTtcbiAgfVxuICByZXR1cm4gKHJldCArIDEpICogcmFkaXVzO1xufTtcblxuLy8gRnVuY3Rpb25zIGJlbG93IHJvdWdobHkgcG9ydGVkIGZyb21cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGVzYW1wbGVzL2NhcmRib2FyZC11bml0eS9ibG9iL21hc3Rlci9DYXJkYm9hcmQvU2NyaXB0cy9DYXJkYm9hcmRQcm9maWxlLmNzI0w0MTJcblxuLy8gU29sdmVzIGEgc21hbGwgbGluZWFyIGVxdWF0aW9uIHZpYSBkZXN0cnVjdGl2ZSBnYXVzc2lhblxuLy8gZWxpbWluYXRpb24gYW5kIGJhY2sgc3Vic3RpdHV0aW9uLiAgVGhpcyBpc24ndCBnZW5lcmljIG51bWVyaWNcbi8vIGNvZGUsIGl0J3MganVzdCBhIHF1aWNrIGhhY2sgdG8gd29yayB3aXRoIHRoZSBnZW5lcmFsbHlcbi8vIHdlbGwtYmVoYXZlZCBzeW1tZXRyaWMgbWF0cmljZXMgZm9yIGxlYXN0LXNxdWFyZXMgZml0dGluZy5cbi8vIE5vdCBpbnRlbmRlZCBmb3IgcmV1c2UuXG4vL1xuLy8gQHBhcmFtIGEgSW5wdXQgcG9zaXRpdmUgZGVmaW5pdGUgc3ltbWV0cmljYWwgbWF0cml4LiBEZXN0cm95ZWRcbi8vICAgICBkdXJpbmcgY2FsY3VsYXRpb24uXG4vLyBAcGFyYW0geSBJbnB1dCByaWdodC1oYW5kLXNpZGUgdmFsdWVzLiBEZXN0cm95ZWQgZHVyaW5nIGNhbGN1bGF0aW9uLlxuLy8gQHJldHVybiBSZXN1bHRpbmcgeCB2YWx1ZSB2ZWN0b3IuXG4vL1xuRGlzdG9ydGlvbi5wcm90b3R5cGUuc29sdmVMaW5lYXJfID0gZnVuY3Rpb24oYSwgeSkge1xuICB2YXIgbiA9IGEubGVuZ3RoO1xuXG4gIC8vIEdhdXNzaWFuIGVsaW1pbmF0aW9uIChubyByb3cgZXhjaGFuZ2UpIHRvIHRyaWFuZ3VsYXIgbWF0cml4LlxuICAvLyBUaGUgaW5wdXQgbWF0cml4IGlzIGEgQV5UIEEgcHJvZHVjdCB3aGljaCBzaG91bGQgYmUgYSBwb3NpdGl2ZVxuICAvLyBkZWZpbml0ZSBzeW1tZXRyaWNhbCBtYXRyaXgsIGFuZCBpZiBJIHJlbWVtYmVyIG15IGxpbmVhclxuICAvLyBhbGdlYnJhIHJpZ2h0IHRoaXMgaW1wbGllcyB0aGF0IHRoZSBwaXZvdHMgd2lsbCBiZSBub256ZXJvIGFuZFxuICAvLyBjYWxjdWxhdGlvbnMgc3VmZmljaWVudGx5IGFjY3VyYXRlIHdpdGhvdXQgbmVlZGluZyByb3dcbiAgLy8gZXhjaGFuZ2UuXG4gIGZvciAodmFyIGogPSAwOyBqIDwgbiAtIDE7ICsraikge1xuICAgIGZvciAodmFyIGsgPSBqICsgMTsgayA8IG47ICsraykge1xuICAgICAgdmFyIHAgPSBhW2pdW2tdIC8gYVtqXVtqXTtcbiAgICAgIGZvciAodmFyIGkgPSBqICsgMTsgaSA8IG47ICsraSkge1xuICAgICAgICBhW2ldW2tdIC09IHAgKiBhW2ldW2pdO1xuICAgICAgfVxuICAgICAgeVtrXSAtPSBwICogeVtqXTtcbiAgICB9XG4gIH1cbiAgLy8gRnJvbSB0aGlzIHBvaW50IG9uLCBvbmx5IHRoZSBtYXRyaXggZWxlbWVudHMgYVtqXVtpXSB3aXRoIGk+PWogYXJlXG4gIC8vIHZhbGlkLiBUaGUgZWxpbWluYXRpb24gZG9lc24ndCBmaWxsIGluIGVsaW1pbmF0ZWQgMCB2YWx1ZXMuXG5cbiAgdmFyIHggPSBuZXcgQXJyYXkobik7XG5cbiAgLy8gQmFjayBzdWJzdGl0dXRpb24uXG4gIGZvciAodmFyIGogPSBuIC0gMTsgaiA+PSAwOyAtLWopIHtcbiAgICB2YXIgdiA9IHlbal07XG4gICAgZm9yICh2YXIgaSA9IGogKyAxOyBpIDwgbjsgKytpKSB7XG4gICAgICB2IC09IGFbaV1bal0gKiB4W2ldO1xuICAgIH1cbiAgICB4W2pdID0gdiAvIGFbal1bal07XG4gIH1cblxuICByZXR1cm4geDtcbn07XG5cbi8vIFNvbHZlcyBhIGxlYXN0LXNxdWFyZXMgbWF0cml4IGVxdWF0aW9uLiAgR2l2ZW4gdGhlIGVxdWF0aW9uIEEgKiB4ID0geSwgY2FsY3VsYXRlIHRoZVxuLy8gbGVhc3Qtc3F1YXJlIGZpdCB4ID0gaW52ZXJzZShBICogdHJhbnNwb3NlKEEpKSAqIHRyYW5zcG9zZShBKSAqIHkuICBUaGUgd2F5IHRoaXMgd29ya3Ncbi8vIGlzIHRoYXQsIHdoaWxlIEEgaXMgdHlwaWNhbGx5IG5vdCBhIHNxdWFyZSBtYXRyaXggKGFuZCBoZW5jZSBub3QgaW52ZXJ0aWJsZSksIEEgKiB0cmFuc3Bvc2UoQSlcbi8vIGlzIGFsd2F5cyBzcXVhcmUuICBUaGF0IGlzOlxuLy8gICBBICogeCA9IHlcbi8vICAgdHJhbnNwb3NlKEEpICogKEEgKiB4KSA9IHRyYW5zcG9zZShBKSAqIHkgICA8LSBtdWx0aXBseSBib3RoIHNpZGVzIGJ5IHRyYW5zcG9zZShBKVxuLy8gICAodHJhbnNwb3NlKEEpICogQSkgKiB4ID0gdHJhbnNwb3NlKEEpICogeSAgIDwtIGFzc29jaWF0aXZpdHlcbi8vICAgeCA9IGludmVyc2UodHJhbnNwb3NlKEEpICogQSkgKiB0cmFuc3Bvc2UoQSkgKiB5ICA8LSBzb2x2ZSBmb3IgeFxuLy8gTWF0cml4IEEncyByb3cgY291bnQgKGZpcnN0IGluZGV4KSBtdXN0IG1hdGNoIHkncyB2YWx1ZSBjb3VudC4gIEEncyBjb2x1bW4gY291bnQgKHNlY29uZCBpbmRleClcbi8vIGRldGVybWluZXMgdGhlIGxlbmd0aCBvZiB0aGUgcmVzdWx0IHZlY3RvciB4LlxuRGlzdG9ydGlvbi5wcm90b3R5cGUuc29sdmVMZWFzdFNxdWFyZXNfID0gZnVuY3Rpb24obWF0QSwgdmVjWSkge1xuICB2YXIgaSwgaiwgaywgc3VtO1xuICB2YXIgbnVtU2FtcGxlcyA9IG1hdEEubGVuZ3RoO1xuICB2YXIgbnVtQ29lZmZpY2llbnRzID0gbWF0QVswXS5sZW5ndGg7XG4gIGlmIChudW1TYW1wbGVzICE9IHZlY1kuTGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTWF0cml4IC8gdmVjdG9yIGRpbWVuc2lvbiBtaXNtYXRjaFwiKTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZSB0cmFuc3Bvc2UoQSkgKiBBXG4gIHZhciBtYXRBVEEgPSBuZXcgQXJyYXkobnVtQ29lZmZpY2llbnRzKTtcbiAgZm9yIChrID0gMDsgayA8IG51bUNvZWZmaWNpZW50czsgKytrKSB7XG4gICAgbWF0QVRBW2tdID0gbmV3IEFycmF5KG51bUNvZWZmaWNpZW50cyk7XG4gICAgZm9yIChqID0gMDsgaiA8IG51bUNvZWZmaWNpZW50czsgKytqKSB7XG4gICAgICBzdW0gPSAwO1xuICAgICAgZm9yIChpID0gMDsgaSA8IG51bVNhbXBsZXM7ICsraSkge1xuICAgICAgICBzdW0gKz0gbWF0QVtqXVtpXSAqIG1hdEFba11baV07XG4gICAgICB9XG4gICAgICBtYXRBVEFba11bal0gPSBzdW07XG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIHRyYW5zcG9zZShBKSAqIHlcbiAgdmFyIHZlY0FUWSA9IG5ldyBBcnJheShudW1Db2VmZmljaWVudHMpO1xuICBmb3IgKGogPSAwOyBqIDwgbnVtQ29lZmZpY2llbnRzOyArK2opIHtcbiAgICBzdW0gPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCBudW1TYW1wbGVzOyArK2kpIHtcbiAgICAgIHN1bSArPSBtYXRBW2pdW2ldICogdmVjWVtpXTtcbiAgICB9XG4gICAgdmVjQVRZW2pdID0gc3VtO1xuICB9XG5cbiAgLy8gTm93IHNvbHZlIChBICogdHJhbnNwb3NlKEEpKSAqIHggPSB0cmFuc3Bvc2UoQSkgKiB5LlxuICByZXR1cm4gdGhpcy5zb2x2ZUxpbmVhcl8obWF0QVRBLCB2ZWNBVFkpO1xufTtcblxuLy8vIENhbGN1bGF0ZXMgYW4gYXBwcm94aW1hdGUgaW52ZXJzZSB0byB0aGUgZ2l2ZW4gcmFkaWFsIGRpc3RvcnRpb24gcGFyYW1ldGVycy5cbkRpc3RvcnRpb24ucHJvdG90eXBlLmFwcHJveGltYXRlSW52ZXJzZSA9IGZ1bmN0aW9uKG1heFJhZGl1cywgbnVtU2FtcGxlcykge1xuICBtYXhSYWRpdXMgPSBtYXhSYWRpdXMgfHwgMTtcbiAgbnVtU2FtcGxlcyA9IG51bVNhbXBsZXMgfHwgMTAwO1xuICB2YXIgbnVtQ29lZmZpY2llbnRzID0gNjtcbiAgdmFyIGksIGo7XG5cbiAgLy8gUiArIEsxKlJeMyArIEsyKlJeNSA9IHIsIHdpdGggUiA9IHJwID0gZGlzdG9ydChyKVxuICAvLyBSZXBlYXRpbmcgZm9yIG51bVNhbXBsZXM6XG4gIC8vICAgWyBSMF4zLCBSMF41IF0gKiBbIEsxIF0gPSBbIHIwIC0gUjAgXVxuICAvLyAgIFsgUjFeMywgUjFeNSBdICAgWyBLMiBdICAgWyByMSAtIFIxIF1cbiAgLy8gICBbIFIyXjMsIFIyXjUgXSAgICAgICAgICAgIFsgcjIgLSBSMiBdXG4gIC8vICAgWyBldGMuLi4gXSAgICAgICAgICAgICAgICBbIGV0Yy4uLiBdXG4gIC8vIFRoYXQgaXM6XG4gIC8vICAgbWF0QSAqIFtLMSwgSzJdID0geVxuICAvLyBTb2x2ZTpcbiAgLy8gICBbSzEsIEsyXSA9IGludmVyc2UodHJhbnNwb3NlKG1hdEEpICogbWF0QSkgKiB0cmFuc3Bvc2UobWF0QSkgKiB5XG4gIHZhciBtYXRBID0gbmV3IEFycmF5KG51bUNvZWZmaWNpZW50cyk7XG4gIGZvciAoaiA9IDA7IGogPCBudW1Db2VmZmljaWVudHM7ICsraikge1xuICAgIG1hdEFbal0gPSBuZXcgQXJyYXkobnVtU2FtcGxlcyk7XG4gIH1cbiAgdmFyIHZlY1kgPSBuZXcgQXJyYXkobnVtU2FtcGxlcyk7XG5cbiAgZm9yIChpID0gMDsgaSA8IG51bVNhbXBsZXM7ICsraSkge1xuICAgIHZhciByID0gbWF4UmFkaXVzICogKGkgKyAxKSAvIG51bVNhbXBsZXM7XG4gICAgdmFyIHJwID0gdGhpcy5kaXN0b3J0KHIpO1xuICAgIHZhciB2ID0gcnA7XG4gICAgZm9yIChqID0gMDsgaiA8IG51bUNvZWZmaWNpZW50czsgKytqKSB7XG4gICAgICB2ICo9IHJwICogcnA7XG4gICAgICBtYXRBW2pdW2ldID0gdjtcbiAgICB9XG4gICAgdmVjWVtpXSA9IHIgLSBycDtcbiAgfVxuXG4gIHZhciBpbnZlcnNlQ29lZmZpY2llbnRzID0gdGhpcy5zb2x2ZUxlYXN0U3F1YXJlc18obWF0QSwgdmVjWSk7XG5cbiAgcmV0dXJuIG5ldyBEaXN0b3J0aW9uKGludmVyc2VDb2VmZmljaWVudHMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEaXN0b3J0aW9uO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBEUERCIGNhY2hlLlxuICovXG52YXIgRFBEQl9DQUNIRSA9IHtcbiAgXCJmb3JtYXRcIjogMSxcbiAgXCJsYXN0X3VwZGF0ZWRcIjogXCIyMDE2LTAxLTIwVDAwOjE4OjM1WlwiLFxuICBcImRldmljZXNcIjogW1xuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcImFzdXMvKi9OZXh1cyA3LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTmV4dXMgN1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzIwLjgsIDMyMy4wIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiYXN1cy8qL0FTVVNfWjAwQUQvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJBU1VTX1owMEFEXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MDMuMCwgNDA0LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiSFRDLyovSFRDNjQzNUxWVy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkhUQzY0MzVMVldcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0OS43LCA0NDMuMyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIVEMvKi9IVEMgT25lIFhMLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiSFRDIE9uZSBYTFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzE1LjMsIDMxNC42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcImh0Yy8qL05leHVzIDkvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA5XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjg5LjAsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiSFRDLyovSFRDIE9uZSBNOS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkhUQyBPbmUgTTlcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0Mi41LCA0NDMuMyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkhUQy8qL0hUQyBPbmVfTTgvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJIVEMgT25lX004XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0NDkuNywgNDQ3LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIVEMvKi9IVEMgT25lLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiSFRDIE9uZVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDQ3Mi44LFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIdWF3ZWkvKi9OZXh1cyA2UC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk5leHVzIDZQXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MTUuMSwgNTE4LjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTmV4dXMgNVgvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA1WFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDIyLjAsIDQxOS45IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL0xHTVMzNDUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJMR01TMzQ1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMjEuNywgMjE5LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9MRy1EODAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTEctRDgwMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDIyLjAsIDQyNC4xIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTEctRDg1MC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkxHLUQ4NTBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUzNy45LCA1NDEuOSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL1ZTOTg1IDRHLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiVlM5ODUgNEdcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUzNy45LCA1MzUuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9OZXh1cyA1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTmV4dXMgNSBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0Mi40LCA0NDQuOCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9OZXh1cyA0LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTmV4dXMgNFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzE5LjgsIDMxOC40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL0xHLVA3NjkvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJMRy1QNzY5XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyNDAuNiwgMjQ3LjUgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTEdNUzMyMy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkxHTVMzMjNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDIwNi42LCAyMDQuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9MR0xTOTk2LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTEdMUzk5NlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDAzLjQsIDQwMS41IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk1pY3JvbWF4LyovNDU2ME1NWC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIjQ1NjBNTVhcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI0MC4wLCAyMTkuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJNaWNyb21heC8qL0EyNTAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJNaWNyb21heCBBMjUwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0ODAuMCwgNDQ2LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTWljcm9tYXgvKi9NaWNyb21heCBBUTQ1MDEvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJNaWNyb21heCBBUTQ1MDFcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyNDAuMCxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL0RST0lEIFJBWlIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJEUk9JRCBSQVpSXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzNjguMSwgMjU2LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDgzMEMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDgzMENcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI1NC4wLCAyNTUuOSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTAyMS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTAyMVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjU0LjAsIDI1Ni43IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwMjMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwMjNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI1NC4wLCAyNTYuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDI4LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDI4XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMjYuNiwgMzI3LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwMzQvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwMzRcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMyNi42LCAzMjguNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDUzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDUzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMTUuMywgMzE2LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDE1NjIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDE1NjJcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQwMy40LCA0MDIuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL05leHVzIDYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA2IFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDk0LjMsIDQ4OS43IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDYzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDYzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyOTUuMCwgMjk2LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwNjQvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwNjRcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI5NS4wLCAyOTUuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDkyLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDkyXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjIuMCwgNDI0LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTA5NS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTA5NVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDIyLjAsIDQyMy40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk9uZVBsdXMvKi9BMDAwMS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkEwMDAxXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MDMuNCwgNDAxLjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiT25lUGx1cy8qL09ORSBFMTAwNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk9ORSBFMTAwNVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQyLjQsIDQ0MS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk9uZVBsdXMvKi9PTkUgQTIwMDUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJPTkUgQTIwMDVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDM5MS45LCA0MDUuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJPUFBPLyovWDkwOS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlg5MDlcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0Mi40LCA0NDQuMSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkwODIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHVC1JOTA4MlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMTg0LjcsIDE4NS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HMzYwUC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUczNjBQXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAxOTYuNywgMjA1LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL05leHVzIFMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyBTXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMzQuNSwgMjI5LjggXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MzAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTkzMDBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMwNC44LCAzMDMuOSBdLFxuICAgIFwiYndcIjogNSxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1UMjMwTlUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1UMjMwTlVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyMTYuMCxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU0dILVQzOTkvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTR0gtVDM5OVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjE3LjcsIDIzMS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTAwNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLU45MDA1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzODYuNCwgMzg3LjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU0FNU1VORy1TTS1OOTAwQS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNBTVNVTkctU00tTjkwMEFcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDM4Ni40LCAzODcuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTk1MDAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHVC1JOTUwMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQyLjUsIDQ0My4zIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5NTA1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTk1MDVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiA0MzkuNCxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MDBGLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkwMEZcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQxNS42LCA0MzEuNiBdLFxuICAgIFwiYndcIjogNSxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkwME0vKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTAwTVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDE1LjYsIDQzMS42IF0sXG4gICAgXCJid1wiOiA1LFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HODAwRi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc4MDBGXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMzI2LjgsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTA2Uy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc5MDZTXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1NjIuNywgNTcyLjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MzAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTkzMDBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMwNi43LCAzMDQuOCBdLFxuICAgIFwiYndcIjogNSxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tVDUzNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLVQ1MzVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDE0Mi42LCAxMzYuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTIwQy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLU45MjBDXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MTUuMSwgNTE4LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MzAwSS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULUk5MzAwSVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzA0LjgsIDMwNS44IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1JOTE5NS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULUk5MTk1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyNDkuNCwgMjU2LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU1BILUw1MjAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTUEgtTDUyMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjQ5LjQsIDI1NS45IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TQU1TVU5HLVNHSC1JNzE3LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU0FNU1VORy1TR0gtSTcxN1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDI4NS44LFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU1BILUQ3MTAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTUEgtRDcxMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjE3LjcsIDIwNC4yIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1ONzEwMC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULU43MTAwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjY1LjEsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TQ0gtSTYwNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNDSC1JNjA1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjY1LjEsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HYWxheHkgTmV4dXMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHYWxheHkgTmV4dXNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMxNS4zLCAzMTQuMiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tTjkxMEgvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1OOTEwSFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNTE1LjEsIDUxOC4wIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTEwQy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLU45MTBDXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MTUuMiwgNTIwLjIgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzEzME0vKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HMTMwTVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMTY1LjksIDE2NC44IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MjhJLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkyOElcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUxNS4xLCA1MTguNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkyMEYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTIwRlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDU4MC42LFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTIwUC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc5MjBQXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MjIuNSwgNTc3LjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MjVGLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkyNUZcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiA1ODAuNixcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkyNVYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTI1VlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNTIyLjUsIDU3Ni42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlNvbnkvKi9DNjkwMy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkM2OTAzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0NDIuNSwgNDQzLjMgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJTb255LyovRDY2NTMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJENjY1M1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDI4LjYsIDQyNy42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlNvbnkvKi9FNjY1My8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkU2NjUzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjguNiwgNDI1LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiU29ueS8qL0U2ODUzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiRTY4NTNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQwMy40LCA0MDEuOSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJTb255LyovU0dQMzIxLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU0dQMzIxXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMjQuNywgMjI0LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJUQ1QvKi9BTENBVEVMIE9ORSBUT1VDSCBGaWVyY2UvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJBTENBVEVMIE9ORSBUT1VDSCBGaWVyY2VcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI0MC4wLCAyNDcuNSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJUSEwvKi90aGwgNTAwMC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcInRobCA1MDAwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0ODAuMCwgNDQzLjMgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiWlRFLyovWlRFIEJsYWRlIEwyLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWlRFIEJsYWRlIEwyXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjQwLjAsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNjQwLCA5NjAgXSB9IF0sXG4gICAgXCJkcGlcIjogWyAzMjUuMSwgMzI4LjQgXSxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNjQwLCA5NjAgXSB9IF0sXG4gICAgXCJkcGlcIjogWyAzMjUuMSwgMzI4LjQgXSxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNjQwLCAxMTM2IF0gfSBdLFxuICAgIFwiZHBpXCI6IFsgMzE3LjEsIDMyMC4yIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICBcInJ1bGVzXCI6IFsgeyBcInJlc1wiOiBbIDY0MCwgMTEzNiBdIH0gXSxcbiAgICBcImRwaVwiOiBbIDMxNy4xLCAzMjAuMiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyA3NTAsIDEzMzQgXSB9IF0sXG4gICAgXCJkcGlcIjogMzI2LjQsXG4gICAgXCJid1wiOiA0LFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICBcInJ1bGVzXCI6IFsgeyBcInJlc1wiOiBbIDc1MCwgMTMzNCBdIH0gXSxcbiAgICBcImRwaVwiOiAzMjYuNCxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgMTI0MiwgMjIwOCBdIH0gXSxcbiAgICBcImRwaVwiOiBbIDQ1My42LCA0NTguNCBdLFxuICAgIFwiYndcIjogNCxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyAxMjQyLCAyMjA4IF0gfSBdLFxuICAgIFwiZHBpXCI6IFsgNDUzLjYsIDQ1OC40IF0sXG4gICAgXCJid1wiOiA0LFxuICAgIFwiYWNcIjogMTAwMFxuICB9XG5dfTtcblxubW9kdWxlLmV4cG9ydHMgPSBEUERCX0NBQ0hFO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gT2ZmbGluZSBjYWNoZSBvZiB0aGUgRFBEQiwgdG8gYmUgdXNlZCB1bnRpbCB3ZSBsb2FkIHRoZSBvbmxpbmUgb25lIChhbmRcbi8vIGFzIGEgZmFsbGJhY2sgaW4gY2FzZSB3ZSBjYW4ndCBsb2FkIHRoZSBvbmxpbmUgb25lKS5cbnZhciBEUERCX0NBQ0hFID0gcmVxdWlyZSgnLi9kcGRiLWNhY2hlLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxuLy8gT25saW5lIERQREIgVVJMLlxudmFyIE9OTElORV9EUERCX1VSTCA9ICdodHRwczovL3N0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vY2FyZGJvYXJkLWRwZGIvZHBkYi5qc29uJztcblxuLyoqXG4gKiBDYWxjdWxhdGVzIGRldmljZSBwYXJhbWV0ZXJzIGJhc2VkIG9uIHRoZSBEUERCIChEZXZpY2UgUGFyYW1ldGVyIERhdGFiYXNlKS5cbiAqIEluaXRpYWxseSwgdXNlcyB0aGUgY2FjaGVkIERQREIgdmFsdWVzLlxuICpcbiAqIElmIGZldGNoT25saW5lID09IHRydWUsIHRoZW4gdGhpcyBvYmplY3QgdHJpZXMgdG8gZmV0Y2ggdGhlIG9ubGluZSB2ZXJzaW9uXG4gKiBvZiB0aGUgRFBEQiBhbmQgdXBkYXRlcyB0aGUgZGV2aWNlIGluZm8gaWYgYSBiZXR0ZXIgbWF0Y2ggaXMgZm91bmQuXG4gKiBDYWxscyB0aGUgb25EZXZpY2VQYXJhbXNVcGRhdGVkIGNhbGxiYWNrIHdoZW4gdGhlcmUgaXMgYW4gdXBkYXRlIHRvIHRoZVxuICogZGV2aWNlIGluZm9ybWF0aW9uLlxuICovXG5mdW5jdGlvbiBEcGRiKGZldGNoT25saW5lLCBvbkRldmljZVBhcmFtc1VwZGF0ZWQpIHtcbiAgLy8gU3RhcnQgd2l0aCB0aGUgb2ZmbGluZSBEUERCIGNhY2hlIHdoaWxlIHdlIGFyZSBsb2FkaW5nIHRoZSByZWFsIG9uZS5cbiAgdGhpcy5kcGRiID0gRFBEQl9DQUNIRTtcblxuICAvLyBDYWxjdWxhdGUgZGV2aWNlIHBhcmFtcyBiYXNlZCBvbiB0aGUgb2ZmbGluZSB2ZXJzaW9uIG9mIHRoZSBEUERCLlxuICB0aGlzLnJlY2FsY3VsYXRlRGV2aWNlUGFyYW1zXygpO1xuXG4gIC8vIFhIUiB0byBmZXRjaCBvbmxpbmUgRFBEQiBmaWxlLCBpZiByZXF1ZXN0ZWQuXG4gIGlmIChmZXRjaE9ubGluZSkge1xuICAgIC8vIFNldCB0aGUgY2FsbGJhY2suXG4gICAgdGhpcy5vbkRldmljZVBhcmFtc1VwZGF0ZWQgPSBvbkRldmljZVBhcmFtc1VwZGF0ZWQ7XG5cbiAgICBjb25zb2xlLmxvZygnRmV0Y2hpbmcgRFBEQi4uLicpO1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB2YXIgb2JqID0gdGhpcztcbiAgICB4aHIub3BlbignR0VUJywgT05MSU5FX0RQREJfVVJMLCB0cnVlKTtcbiAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgb2JqLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDw9IDI5OSkge1xuICAgICAgICAvLyBTdWNjZXNzLlxuICAgICAgICBjb25zb2xlLmxvZygnU3VjY2Vzc2Z1bGx5IGxvYWRlZCBvbmxpbmUgRFBEQi4nKTtcbiAgICAgICAgb2JqLmRwZGIgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZSk7XG4gICAgICAgIG9iai5yZWNhbGN1bGF0ZURldmljZVBhcmFtc18oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEVycm9yIGxvYWRpbmcgdGhlIERQREIuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgb25saW5lIERQREIhJyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgeGhyLnNlbmQoKTtcbiAgfVxufVxuXG4vLyBSZXR1cm5zIHRoZSBjdXJyZW50IGRldmljZSBwYXJhbWV0ZXJzLlxuRHBkYi5wcm90b3R5cGUuZ2V0RGV2aWNlUGFyYW1zID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmRldmljZVBhcmFtcztcbn07XG5cbi8vIFJlY2FsY3VsYXRlcyB0aGlzIGRldmljZSdzIHBhcmFtZXRlcnMgYmFzZWQgb24gdGhlIERQREIuXG5EcGRiLnByb3RvdHlwZS5yZWNhbGN1bGF0ZURldmljZVBhcmFtc18gPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJ1JlY2FsY3VsYXRpbmcgZGV2aWNlIHBhcmFtcy4nKTtcbiAgdmFyIG5ld0RldmljZVBhcmFtcyA9IHRoaXMuY2FsY0RldmljZVBhcmFtc18oKTtcbiAgY29uc29sZS5sb2coJ05ldyBkZXZpY2UgcGFyYW1ldGVyczonKTtcbiAgY29uc29sZS5sb2cobmV3RGV2aWNlUGFyYW1zKTtcbiAgaWYgKG5ld0RldmljZVBhcmFtcykge1xuICAgIHRoaXMuZGV2aWNlUGFyYW1zID0gbmV3RGV2aWNlUGFyYW1zO1xuICAgIC8vIEludm9rZSBjYWxsYmFjaywgaWYgaXQgaXMgc2V0LlxuICAgIGlmICh0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZCkge1xuICAgICAgdGhpcy5vbkRldmljZVBhcmFtc1VwZGF0ZWQodGhpcy5kZXZpY2VQYXJhbXMpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcmVjYWxjdWxhdGUgZGV2aWNlIHBhcmFtZXRlcnMuJyk7XG4gIH1cbn07XG5cbi8vIFJldHVybnMgYSBEZXZpY2VQYXJhbXMgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgYmVzdCBndWVzcyBhcyB0byB0aGlzXG4vLyBkZXZpY2UncyBwYXJhbWV0ZXJzLiBDYW4gcmV0dXJuIG51bGwgaWYgdGhlIGRldmljZSBkb2VzIG5vdCBtYXRjaCBhbnlcbi8vIGtub3duIGRldmljZXMuXG5EcGRiLnByb3RvdHlwZS5jYWxjRGV2aWNlUGFyYW1zXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZGIgPSB0aGlzLmRwZGI7IC8vIHNob3J0aGFuZFxuICBpZiAoIWRiKSB7XG4gICAgY29uc29sZS5lcnJvcignRFBEQiBub3QgYXZhaWxhYmxlLicpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGlmIChkYi5mb3JtYXQgIT0gMSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0RQREIgaGFzIHVuZXhwZWN0ZWQgZm9ybWF0IHZlcnNpb24uJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKCFkYi5kZXZpY2VzIHx8ICFkYi5kZXZpY2VzLmxlbmd0aCkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0RQREIgZG9lcyBub3QgaGF2ZSBhIGRldmljZXMgc2VjdGlvbi4nKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIEdldCB0aGUgYWN0dWFsIHVzZXIgYWdlbnQgYW5kIHNjcmVlbiBkaW1lbnNpb25zIGluIHBpeGVscy5cbiAgdmFyIHVzZXJBZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQgfHwgbmF2aWdhdG9yLnZlbmRvciB8fCB3aW5kb3cub3BlcmE7XG4gIHZhciB3aWR0aCA9IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKTtcbiAgdmFyIGhlaWdodCA9IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCk7XG4gIGNvbnNvbGUubG9nKCdVc2VyIGFnZW50OiAnICsgdXNlckFnZW50KTtcbiAgY29uc29sZS5sb2coJ1BpeGVsIHdpZHRoOiAnICsgd2lkdGgpO1xuICBjb25zb2xlLmxvZygnUGl4ZWwgaGVpZ2h0OiAnICsgaGVpZ2h0KTtcblxuICBpZiAoIWRiLmRldmljZXMpIHtcbiAgICBjb25zb2xlLmVycm9yKCdEUERCIGhhcyBubyBkZXZpY2VzIHNlY3Rpb24uJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGRiLmRldmljZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZGV2aWNlID0gZGIuZGV2aWNlc1tpXTtcbiAgICBpZiAoIWRldmljZS5ydWxlcykge1xuICAgICAgY29uc29sZS53YXJuKCdEZXZpY2VbJyArIGkgKyAnXSBoYXMgbm8gcnVsZXMgc2VjdGlvbi4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChkZXZpY2UudHlwZSAhPSAnaW9zJyAmJiBkZXZpY2UudHlwZSAhPSAnYW5kcm9pZCcpIHtcbiAgICAgIGNvbnNvbGUud2FybignRGV2aWNlWycgKyBpICsgJ10gaGFzIGludmFsaWQgdHlwZS4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFNlZSBpZiB0aGlzIGRldmljZSBpcyBvZiB0aGUgYXBwcm9wcmlhdGUgdHlwZS5cbiAgICBpZiAoVXRpbC5pc0lPUygpICE9IChkZXZpY2UudHlwZSA9PSAnaW9zJykpIGNvbnRpbnVlO1xuXG4gICAgLy8gU2VlIGlmIHRoaXMgZGV2aWNlIG1hdGNoZXMgYW55IG9mIHRoZSBydWxlczpcbiAgICB2YXIgbWF0Y2hlZCA9IGZhbHNlO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGV2aWNlLnJ1bGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICB2YXIgcnVsZSA9IGRldmljZS5ydWxlc1tqXTtcbiAgICAgIGlmICh0aGlzLm1hdGNoUnVsZV8ocnVsZSwgdXNlckFnZW50LCB3aWR0aCwgaGVpZ2h0KSkge1xuICAgICAgICBjb25zb2xlLmxvZygnUnVsZSBtYXRjaGVkOicpO1xuICAgICAgICBjb25zb2xlLmxvZyhydWxlKTtcbiAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIW1hdGNoZWQpIGNvbnRpbnVlO1xuXG4gICAgLy8gZGV2aWNlLmRwaSBtaWdodCBiZSBhbiBhcnJheSBvZiBbIHhkcGksIHlkcGldIG9yIGp1c3QgYSBzY2FsYXIuXG4gICAgdmFyIHhkcGkgPSBkZXZpY2UuZHBpWzBdIHx8IGRldmljZS5kcGk7XG4gICAgdmFyIHlkcGkgPSBkZXZpY2UuZHBpWzFdIHx8IGRldmljZS5kcGk7XG5cbiAgICByZXR1cm4gbmV3IERldmljZVBhcmFtcyh7IHhkcGk6IHhkcGksIHlkcGk6IHlkcGksIGJldmVsTW06IGRldmljZS5idyB9KTtcbiAgfVxuXG4gIGNvbnNvbGUud2FybignTm8gRFBEQiBkZXZpY2UgbWF0Y2guJyk7XG4gIHJldHVybiBudWxsO1xufTtcblxuRHBkYi5wcm90b3R5cGUubWF0Y2hSdWxlXyA9IGZ1bmN0aW9uKHJ1bGUsIHVhLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSB7XG4gIC8vIFdlIGNhbiBvbmx5IG1hdGNoICd1YScgYW5kICdyZXMnIHJ1bGVzLCBub3Qgb3RoZXIgdHlwZXMgbGlrZSAnbWRtaCdcbiAgLy8gKHdoaWNoIGFyZSBtZWFudCBmb3IgbmF0aXZlIHBsYXRmb3JtcykuXG4gIGlmICghcnVsZS51YSAmJiAhcnVsZS5yZXMpIHJldHVybiBmYWxzZTtcblxuICAvLyBJZiBvdXIgdXNlciBhZ2VudCBzdHJpbmcgZG9lc24ndCBjb250YWluIHRoZSBpbmRpY2F0ZWQgdXNlciBhZ2VudCBzdHJpbmcsXG4gIC8vIHRoZSBtYXRjaCBmYWlscy5cbiAgaWYgKHJ1bGUudWEgJiYgdWEuaW5kZXhPZihydWxlLnVhKSA8IDApIHJldHVybiBmYWxzZTtcblxuICAvLyBJZiB0aGUgcnVsZSBzcGVjaWZpZXMgc2NyZWVuIGRpbWVuc2lvbnMgdGhhdCBkb24ndCBjb3JyZXNwb25kIHRvIG91cnMsXG4gIC8vIHRoZSBtYXRjaCBmYWlscy5cbiAgaWYgKHJ1bGUucmVzKSB7XG4gICAgaWYgKCFydWxlLnJlc1swXSB8fCAhcnVsZS5yZXNbMV0pIHJldHVybiBmYWxzZTtcbiAgICB2YXIgcmVzWCA9IHJ1bGUucmVzWzBdO1xuICAgIHZhciByZXNZID0gcnVsZS5yZXNbMV07XG4gICAgLy8gQ29tcGFyZSBtaW4gYW5kIG1heCBzbyBhcyB0byBtYWtlIHRoZSBvcmRlciBub3QgbWF0dGVyLCBpLmUuLCBpdCBzaG91bGRcbiAgICAvLyBiZSB0cnVlIHRoYXQgNjQweDQ4MCA9PSA0ODB4NjQwLlxuICAgIGlmIChNYXRoLm1pbihzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSAhPSBNYXRoLm1pbihyZXNYLCByZXNZKSB8fFxuICAgICAgICAoTWF0aC5tYXgoc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCkgIT0gTWF0aC5tYXgocmVzWCwgcmVzWSkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIERldmljZVBhcmFtcyhwYXJhbXMpIHtcbiAgdGhpcy54ZHBpID0gcGFyYW1zLnhkcGk7XG4gIHRoaXMueWRwaSA9IHBhcmFtcy55ZHBpO1xuICB0aGlzLmJldmVsTW0gPSBwYXJhbXMuYmV2ZWxNbTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEcGRiOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmZ1bmN0aW9uIEVtaXR0ZXIoKSB7XG4gIHRoaXMuY2FsbGJhY2tzID0ge307XG59XG5cbkVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV07XG4gIGlmICghY2FsbGJhY2tzKSB7XG4gICAgLy9jb25zb2xlLmxvZygnTm8gdmFsaWQgY2FsbGJhY2sgc3BlY2lmaWVkLicpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgLy8gRWxpbWluYXRlIHRoZSBmaXJzdCBwYXJhbSAodGhlIGNhbGxiYWNrKS5cbiAgYXJncy5zaGlmdCgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxufTtcblxuRW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gIGlmIChldmVudE5hbWUgaW4gdGhpcy5jYWxsYmFja3MpIHtcbiAgICB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0gPSBbY2FsbGJhY2tdO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXI7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBXZWJWUlBvbHlmaWxsID0gcmVxdWlyZSgnLi93ZWJ2ci1wb2x5ZmlsbC5qcycpO1xuXG4vLyBJbml0aWFsaXplIGEgV2ViVlJDb25maWcganVzdCBpbiBjYXNlLlxud2luZG93LldlYlZSQ29uZmlnID0gVXRpbC5leHRlbmQoe1xuICAvLyBGb3JjZXMgYXZhaWxhYmlsaXR5IG9mIFZSIG1vZGUsIGV2ZW4gZm9yIG5vbi1tb2JpbGUgZGV2aWNlcy5cbiAgRk9SQ0VfRU5BQkxFX1ZSOiBmYWxzZSxcblxuICAvLyBDb21wbGVtZW50YXJ5IGZpbHRlciBjb2VmZmljaWVudC4gMCBmb3IgYWNjZWxlcm9tZXRlciwgMSBmb3IgZ3lyby5cbiAgS19GSUxURVI6IDAuOTgsXG5cbiAgLy8gSG93IGZhciBpbnRvIHRoZSBmdXR1cmUgdG8gcHJlZGljdCBkdXJpbmcgZmFzdCBtb3Rpb24gKGluIHNlY29uZHMpLlxuICBQUkVESUNUSU9OX1RJTUVfUzogMC4wNDAsXG5cbiAgLy8gRmxhZyB0byBkaXNhYmxlIHRvdWNoIHBhbm5lci4gSW4gY2FzZSB5b3UgaGF2ZSB5b3VyIG93biB0b3VjaCBjb250cm9scy5cbiAgVE9VQ0hfUEFOTkVSX0RJU0FCTEVEOiBmYWxzZSxcblxuICAvLyBFbmFibGUgeWF3IHBhbm5pbmcgb25seSwgZGlzYWJsaW5nIHJvbGwgYW5kIHBpdGNoLiBUaGlzIGNhbiBiZSB1c2VmdWxcbiAgLy8gZm9yIHBhbm9yYW1hcyB3aXRoIG5vdGhpbmcgaW50ZXJlc3RpbmcgYWJvdmUgb3IgYmVsb3cuXG4gIFlBV19PTkxZOiBmYWxzZSxcblxuICAvLyBUbyBkaXNhYmxlIGtleWJvYXJkIGFuZCBtb3VzZSBjb250cm9scywgaWYgeW91IHdhbnQgdG8gdXNlIHlvdXIgb3duXG4gIC8vIGltcGxlbWVudGF0aW9uLlxuICBNT1VTRV9LRVlCT0FSRF9DT05UUk9MU19ESVNBQkxFRDogZmFsc2UsXG5cbiAgLy8gUHJldmVudCB0aGUgcG9seWZpbGwgZnJvbSBpbml0aWFsaXppbmcgaW1tZWRpYXRlbHkuIFJlcXVpcmVzIHRoZSBhcHBcbiAgLy8gdG8gY2FsbCBJbml0aWFsaXplV2ViVlJQb2x5ZmlsbCgpIGJlZm9yZSBpdCBjYW4gYmUgdXNlZC5cbiAgREVGRVJfSU5JVElBTElaQVRJT046IGZhbHNlLFxuXG4gIC8vIEVuYWJsZSB0aGUgZGVwcmVjYXRlZCB2ZXJzaW9uIG9mIHRoZSBBUEkgKG5hdmlnYXRvci5nZXRWUkRldmljZXMpLlxuICBFTkFCTEVfREVQUkVDQVRFRF9BUEk6IGZhbHNlLFxuXG4gIC8vIFNjYWxlcyB0aGUgcmVjb21tZW5kZWQgYnVmZmVyIHNpemUgcmVwb3J0ZWQgYnkgV2ViVlIsIHdoaWNoIGNhbiBpbXByb3ZlXG4gIC8vIHBlcmZvcm1hbmNlLlxuICAvLyBVUERBVEUoMjAxNi0wNS0wMyk6IFNldHRpbmcgdGhpcyB0byAwLjUgYnkgZGVmYXVsdCBzaW5jZSAxLjAgZG9lcyBub3RcbiAgLy8gcGVyZm9ybSB3ZWxsIG9uIG1hbnkgbW9iaWxlIGRldmljZXMuXG4gIEJVRkZFUl9TQ0FMRTogMC41LFxuXG4gIC8vIEFsbG93IFZSRGlzcGxheS5zdWJtaXRGcmFtZSB0byBjaGFuZ2UgZ2wgYmluZGluZ3MsIHdoaWNoIGlzIG1vcmVcbiAgLy8gZWZmaWNpZW50IGlmIHRoZSBhcHBsaWNhdGlvbiBjb2RlIHdpbGwgcmUtYmluZCBpdHMgcmVzb3VyY2VzIG9uIHRoZVxuICAvLyBuZXh0IGZyYW1lIGFueXdheS4gVGhpcyBoYXMgYmVlbiBzZWVuIHRvIGNhdXNlIHJlbmRlcmluZyBnbGl0Y2hlcyB3aXRoXG4gIC8vIFRIUkVFLmpzLlxuICAvLyBEaXJ0eSBiaW5kaW5ncyBpbmNsdWRlOiBnbC5GUkFNRUJVRkZFUl9CSU5ESU5HLCBnbC5DVVJSRU5UX1BST0dSQU0sXG4gIC8vIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HLCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HLFxuICAvLyBhbmQgZ2wuVEVYVFVSRV9CSU5ESU5HXzJEIGZvciB0ZXh0dXJlIHVuaXQgMC5cbiAgRElSVFlfU1VCTUlUX0ZSQU1FX0JJTkRJTkdTOiBmYWxzZVxufSwgd2luZG93LldlYlZSQ29uZmlnKTtcblxuaWYgKCF3aW5kb3cuV2ViVlJDb25maWcuREVGRVJfSU5JVElBTElaQVRJT04pIHtcbiAgbmV3IFdlYlZSUG9seWZpbGwoKTtcbn0gZWxzZSB7XG4gIHdpbmRvdy5Jbml0aWFsaXplV2ViVlJQb2x5ZmlsbCA9IGZ1bmN0aW9uKCkge1xuICAgIG5ldyBXZWJWUlBvbHlmaWxsKCk7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBNYXRoVXRpbCA9IHdpbmRvdy5NYXRoVXRpbCB8fCB7fTtcblxuTWF0aFV0aWwuZGVnVG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuTWF0aFV0aWwucmFkVG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuXG4vLyBTb21lIG1pbmltYWwgbWF0aCBmdW5jdGlvbmFsaXR5IGJvcnJvd2VkIGZyb20gVEhSRUUuTWF0aCBhbmQgc3RyaXBwZWQgZG93blxuLy8gZm9yIHRoZSBwdXJwb3NlcyBvZiB0aGlzIGxpYnJhcnkuXG5cblxuTWF0aFV0aWwuVmVjdG9yMiA9IGZ1bmN0aW9uICggeCwgeSApIHtcbiAgdGhpcy54ID0geCB8fCAwO1xuICB0aGlzLnkgPSB5IHx8IDA7XG59O1xuXG5NYXRoVXRpbC5WZWN0b3IyLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IE1hdGhVdGlsLlZlY3RvcjIsXG5cbiAgc2V0OiBmdW5jdGlvbiAoIHgsIHkgKSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29weTogZnVuY3Rpb24gKCB2ICkge1xuICAgIHRoaXMueCA9IHYueDtcbiAgICB0aGlzLnkgPSB2Lnk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzdWJWZWN0b3JzOiBmdW5jdGlvbiAoIGEsIGIgKSB7XG4gICAgdGhpcy54ID0gYS54IC0gYi54O1xuICAgIHRoaXMueSA9IGEueSAtIGIueTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxufTtcblxuTWF0aFV0aWwuVmVjdG9yMyA9IGZ1bmN0aW9uICggeCwgeSwgeiApIHtcbiAgdGhpcy54ID0geCB8fCAwO1xuICB0aGlzLnkgPSB5IHx8IDA7XG4gIHRoaXMueiA9IHogfHwgMDtcbn07XG5cbk1hdGhVdGlsLlZlY3RvcjMucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogTWF0aFV0aWwuVmVjdG9yMyxcblxuICBzZXQ6IGZ1bmN0aW9uICggeCwgeSwgeiApIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy56ID0gejtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGNvcHk6IGZ1bmN0aW9uICggdiApIHtcbiAgICB0aGlzLnggPSB2Lng7XG4gICAgdGhpcy55ID0gdi55O1xuICAgIHRoaXMueiA9IHYuejtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGxlbmd0aDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBNYXRoLnNxcnQoIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueiApO1xuICB9LFxuXG4gIG5vcm1hbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzY2FsYXIgPSB0aGlzLmxlbmd0aCgpO1xuXG4gICAgaWYgKCBzY2FsYXIgIT09IDAgKSB7XG4gICAgICB2YXIgaW52U2NhbGFyID0gMSAvIHNjYWxhcjtcblxuICAgICAgdGhpcy5tdWx0aXBseVNjYWxhcihpbnZTY2FsYXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnggPSAwO1xuICAgICAgdGhpcy55ID0gMDtcbiAgICAgIHRoaXMueiA9IDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgbXVsdGlwbHlTY2FsYXI6IGZ1bmN0aW9uICggc2NhbGFyICkge1xuICAgIHRoaXMueCAqPSBzY2FsYXI7XG4gICAgdGhpcy55ICo9IHNjYWxhcjtcbiAgICB0aGlzLnogKj0gc2NhbGFyO1xuICB9LFxuXG4gIGFwcGx5UXVhdGVybmlvbjogZnVuY3Rpb24gKCBxICkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdmFyIHF4ID0gcS54O1xuICAgIHZhciBxeSA9IHEueTtcbiAgICB2YXIgcXogPSBxLno7XG4gICAgdmFyIHF3ID0gcS53O1xuXG4gICAgLy8gY2FsY3VsYXRlIHF1YXQgKiB2ZWN0b3JcbiAgICB2YXIgaXggPSAgcXcgKiB4ICsgcXkgKiB6IC0gcXogKiB5O1xuICAgIHZhciBpeSA9ICBxdyAqIHkgKyBxeiAqIHggLSBxeCAqIHo7XG4gICAgdmFyIGl6ID0gIHF3ICogeiArIHF4ICogeSAtIHF5ICogeDtcbiAgICB2YXIgaXcgPSAtIHF4ICogeCAtIHF5ICogeSAtIHF6ICogejtcblxuICAgIC8vIGNhbGN1bGF0ZSByZXN1bHQgKiBpbnZlcnNlIHF1YXRcbiAgICB0aGlzLnggPSBpeCAqIHF3ICsgaXcgKiAtIHF4ICsgaXkgKiAtIHF6IC0gaXogKiAtIHF5O1xuICAgIHRoaXMueSA9IGl5ICogcXcgKyBpdyAqIC0gcXkgKyBpeiAqIC0gcXggLSBpeCAqIC0gcXo7XG4gICAgdGhpcy56ID0gaXogKiBxdyArIGl3ICogLSBxeiArIGl4ICogLSBxeSAtIGl5ICogLSBxeDtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGRvdDogZnVuY3Rpb24gKCB2ICkge1xuICAgIHJldHVybiB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2LnkgKyB0aGlzLnogKiB2Lno7XG4gIH0sXG5cbiAgY3Jvc3NWZWN0b3JzOiBmdW5jdGlvbiAoIGEsIGIgKSB7XG4gICAgdmFyIGF4ID0gYS54LCBheSA9IGEueSwgYXogPSBhLno7XG4gICAgdmFyIGJ4ID0gYi54LCBieSA9IGIueSwgYnogPSBiLno7XG5cbiAgICB0aGlzLnggPSBheSAqIGJ6IC0gYXogKiBieTtcbiAgICB0aGlzLnkgPSBheiAqIGJ4IC0gYXggKiBiejtcbiAgICB0aGlzLnogPSBheCAqIGJ5IC0gYXkgKiBieDtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxufTtcblxuTWF0aFV0aWwuUXVhdGVybmlvbiA9IGZ1bmN0aW9uICggeCwgeSwgeiwgdyApIHtcbiAgdGhpcy54ID0geCB8fCAwO1xuICB0aGlzLnkgPSB5IHx8IDA7XG4gIHRoaXMueiA9IHogfHwgMDtcbiAgdGhpcy53ID0gKCB3ICE9PSB1bmRlZmluZWQgKSA/IHcgOiAxO1xufTtcblxuTWF0aFV0aWwuUXVhdGVybmlvbi5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBNYXRoVXRpbC5RdWF0ZXJuaW9uLFxuXG4gIHNldDogZnVuY3Rpb24gKCB4LCB5LCB6LCB3ICkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLnogPSB6O1xuICAgIHRoaXMudyA9IHc7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb3B5OiBmdW5jdGlvbiAoIHF1YXRlcm5pb24gKSB7XG4gICAgdGhpcy54ID0gcXVhdGVybmlvbi54O1xuICAgIHRoaXMueSA9IHF1YXRlcm5pb24ueTtcbiAgICB0aGlzLnogPSBxdWF0ZXJuaW9uLno7XG4gICAgdGhpcy53ID0gcXVhdGVybmlvbi53O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2V0RnJvbUV1bGVyWFlaOiBmdW5jdGlvbiggeCwgeSwgeiApIHtcbiAgICB2YXIgYzEgPSBNYXRoLmNvcyggeCAvIDIgKTtcbiAgICB2YXIgYzIgPSBNYXRoLmNvcyggeSAvIDIgKTtcbiAgICB2YXIgYzMgPSBNYXRoLmNvcyggeiAvIDIgKTtcbiAgICB2YXIgczEgPSBNYXRoLnNpbiggeCAvIDIgKTtcbiAgICB2YXIgczIgPSBNYXRoLnNpbiggeSAvIDIgKTtcbiAgICB2YXIgczMgPSBNYXRoLnNpbiggeiAvIDIgKTtcblxuICAgIHRoaXMueCA9IHMxICogYzIgKiBjMyArIGMxICogczIgKiBzMztcbiAgICB0aGlzLnkgPSBjMSAqIHMyICogYzMgLSBzMSAqIGMyICogczM7XG4gICAgdGhpcy56ID0gYzEgKiBjMiAqIHMzICsgczEgKiBzMiAqIGMzO1xuICAgIHRoaXMudyA9IGMxICogYzIgKiBjMyAtIHMxICogczIgKiBzMztcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNldEZyb21FdWxlcllYWjogZnVuY3Rpb24oIHgsIHksIHogKSB7XG4gICAgdmFyIGMxID0gTWF0aC5jb3MoIHggLyAyICk7XG4gICAgdmFyIGMyID0gTWF0aC5jb3MoIHkgLyAyICk7XG4gICAgdmFyIGMzID0gTWF0aC5jb3MoIHogLyAyICk7XG4gICAgdmFyIHMxID0gTWF0aC5zaW4oIHggLyAyICk7XG4gICAgdmFyIHMyID0gTWF0aC5zaW4oIHkgLyAyICk7XG4gICAgdmFyIHMzID0gTWF0aC5zaW4oIHogLyAyICk7XG5cbiAgICB0aGlzLnggPSBzMSAqIGMyICogYzMgKyBjMSAqIHMyICogczM7XG4gICAgdGhpcy55ID0gYzEgKiBzMiAqIGMzIC0gczEgKiBjMiAqIHMzO1xuICAgIHRoaXMueiA9IGMxICogYzIgKiBzMyAtIHMxICogczIgKiBjMztcbiAgICB0aGlzLncgPSBjMSAqIGMyICogYzMgKyBzMSAqIHMyICogczM7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzZXRGcm9tQXhpc0FuZ2xlOiBmdW5jdGlvbiAoIGF4aXMsIGFuZ2xlICkge1xuICAgIC8vIGh0dHA6Ly93d3cuZXVjbGlkZWFuc3BhY2UuY29tL21hdGhzL2dlb21ldHJ5L3JvdGF0aW9ucy9jb252ZXJzaW9ucy9hbmdsZVRvUXVhdGVybmlvbi9pbmRleC5odG1cbiAgICAvLyBhc3N1bWVzIGF4aXMgaXMgbm9ybWFsaXplZFxuXG4gICAgdmFyIGhhbGZBbmdsZSA9IGFuZ2xlIC8gMiwgcyA9IE1hdGguc2luKCBoYWxmQW5nbGUgKTtcblxuICAgIHRoaXMueCA9IGF4aXMueCAqIHM7XG4gICAgdGhpcy55ID0gYXhpcy55ICogcztcbiAgICB0aGlzLnogPSBheGlzLnogKiBzO1xuICAgIHRoaXMudyA9IE1hdGguY29zKCBoYWxmQW5nbGUgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIG11bHRpcGx5OiBmdW5jdGlvbiAoIHEgKSB7XG4gICAgcmV0dXJuIHRoaXMubXVsdGlwbHlRdWF0ZXJuaW9ucyggdGhpcywgcSApO1xuICB9LFxuXG4gIG11bHRpcGx5UXVhdGVybmlvbnM6IGZ1bmN0aW9uICggYSwgYiApIHtcbiAgICAvLyBmcm9tIGh0dHA6Ly93d3cuZXVjbGlkZWFuc3BhY2UuY29tL21hdGhzL2FsZ2VicmEvcmVhbE5vcm1lZEFsZ2VicmEvcXVhdGVybmlvbnMvY29kZS9pbmRleC5odG1cblxuICAgIHZhciBxYXggPSBhLngsIHFheSA9IGEueSwgcWF6ID0gYS56LCBxYXcgPSBhLnc7XG4gICAgdmFyIHFieCA9IGIueCwgcWJ5ID0gYi55LCBxYnogPSBiLnosIHFidyA9IGIudztcblxuICAgIHRoaXMueCA9IHFheCAqIHFidyArIHFhdyAqIHFieCArIHFheSAqIHFieiAtIHFheiAqIHFieTtcbiAgICB0aGlzLnkgPSBxYXkgKiBxYncgKyBxYXcgKiBxYnkgKyBxYXogKiBxYnggLSBxYXggKiBxYno7XG4gICAgdGhpcy56ID0gcWF6ICogcWJ3ICsgcWF3ICogcWJ6ICsgcWF4ICogcWJ5IC0gcWF5ICogcWJ4O1xuICAgIHRoaXMudyA9IHFhdyAqIHFidyAtIHFheCAqIHFieCAtIHFheSAqIHFieSAtIHFheiAqIHFiejtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGludmVyc2U6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnggKj0gLTE7XG4gICAgdGhpcy55ICo9IC0xO1xuICAgIHRoaXMueiAqPSAtMTtcblxuICAgIHRoaXMubm9ybWFsaXplKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBub3JtYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbCA9IE1hdGguc3FydCggdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55ICsgdGhpcy56ICogdGhpcy56ICsgdGhpcy53ICogdGhpcy53ICk7XG5cbiAgICBpZiAoIGwgPT09IDAgKSB7XG4gICAgICB0aGlzLnggPSAwO1xuICAgICAgdGhpcy55ID0gMDtcbiAgICAgIHRoaXMueiA9IDA7XG4gICAgICB0aGlzLncgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBsID0gMSAvIGw7XG5cbiAgICAgIHRoaXMueCA9IHRoaXMueCAqIGw7XG4gICAgICB0aGlzLnkgPSB0aGlzLnkgKiBsO1xuICAgICAgdGhpcy56ID0gdGhpcy56ICogbDtcbiAgICAgIHRoaXMudyA9IHRoaXMudyAqIGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2xlcnA6IGZ1bmN0aW9uICggcWIsIHQgKSB7XG4gICAgaWYgKCB0ID09PSAwICkgcmV0dXJuIHRoaXM7XG4gICAgaWYgKCB0ID09PSAxICkgcmV0dXJuIHRoaXMuY29weSggcWIgKTtcblxuICAgIHZhciB4ID0gdGhpcy54LCB5ID0gdGhpcy55LCB6ID0gdGhpcy56LCB3ID0gdGhpcy53O1xuXG4gICAgLy8gaHR0cDovL3d3dy5ldWNsaWRlYW5zcGFjZS5jb20vbWF0aHMvYWxnZWJyYS9yZWFsTm9ybWVkQWxnZWJyYS9xdWF0ZXJuaW9ucy9zbGVycC9cblxuICAgIHZhciBjb3NIYWxmVGhldGEgPSB3ICogcWIudyArIHggKiBxYi54ICsgeSAqIHFiLnkgKyB6ICogcWIuejtcblxuICAgIGlmICggY29zSGFsZlRoZXRhIDwgMCApIHtcbiAgICAgIHRoaXMudyA9IC0gcWIudztcbiAgICAgIHRoaXMueCA9IC0gcWIueDtcbiAgICAgIHRoaXMueSA9IC0gcWIueTtcbiAgICAgIHRoaXMueiA9IC0gcWIuejtcblxuICAgICAgY29zSGFsZlRoZXRhID0gLSBjb3NIYWxmVGhldGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29weSggcWIgKTtcbiAgICB9XG5cbiAgICBpZiAoIGNvc0hhbGZUaGV0YSA+PSAxLjAgKSB7XG4gICAgICB0aGlzLncgPSB3O1xuICAgICAgdGhpcy54ID0geDtcbiAgICAgIHRoaXMueSA9IHk7XG4gICAgICB0aGlzLnogPSB6O1xuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB2YXIgaGFsZlRoZXRhID0gTWF0aC5hY29zKCBjb3NIYWxmVGhldGEgKTtcbiAgICB2YXIgc2luSGFsZlRoZXRhID0gTWF0aC5zcXJ0KCAxLjAgLSBjb3NIYWxmVGhldGEgKiBjb3NIYWxmVGhldGEgKTtcblxuICAgIGlmICggTWF0aC5hYnMoIHNpbkhhbGZUaGV0YSApIDwgMC4wMDEgKSB7XG4gICAgICB0aGlzLncgPSAwLjUgKiAoIHcgKyB0aGlzLncgKTtcbiAgICAgIHRoaXMueCA9IDAuNSAqICggeCArIHRoaXMueCApO1xuICAgICAgdGhpcy55ID0gMC41ICogKCB5ICsgdGhpcy55ICk7XG4gICAgICB0aGlzLnogPSAwLjUgKiAoIHogKyB0aGlzLnogKTtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIHJhdGlvQSA9IE1hdGguc2luKCAoIDEgLSB0ICkgKiBoYWxmVGhldGEgKSAvIHNpbkhhbGZUaGV0YSxcbiAgICByYXRpb0IgPSBNYXRoLnNpbiggdCAqIGhhbGZUaGV0YSApIC8gc2luSGFsZlRoZXRhO1xuXG4gICAgdGhpcy53ID0gKCB3ICogcmF0aW9BICsgdGhpcy53ICogcmF0aW9CICk7XG4gICAgdGhpcy54ID0gKCB4ICogcmF0aW9BICsgdGhpcy54ICogcmF0aW9CICk7XG4gICAgdGhpcy55ID0gKCB5ICogcmF0aW9BICsgdGhpcy55ICogcmF0aW9CICk7XG4gICAgdGhpcy56ID0gKCB6ICogcmF0aW9BICsgdGhpcy56ICogcmF0aW9CICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzZXRGcm9tVW5pdFZlY3RvcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBodHRwOi8vbG9sZW5naW5lLm5ldC9ibG9nLzIwMTQvMDIvMjQvcXVhdGVybmlvbi1mcm9tLXR3by12ZWN0b3JzLWZpbmFsXG4gICAgLy8gYXNzdW1lcyBkaXJlY3Rpb24gdmVjdG9ycyB2RnJvbSBhbmQgdlRvIGFyZSBub3JtYWxpemVkXG5cbiAgICB2YXIgdjEsIHI7XG4gICAgdmFyIEVQUyA9IDAuMDAwMDAxO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICggdkZyb20sIHZUbyApIHtcbiAgICAgIGlmICggdjEgPT09IHVuZGVmaW5lZCApIHYxID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcblxuICAgICAgciA9IHZGcm9tLmRvdCggdlRvICkgKyAxO1xuXG4gICAgICBpZiAoIHIgPCBFUFMgKSB7XG4gICAgICAgIHIgPSAwO1xuXG4gICAgICAgIGlmICggTWF0aC5hYnMoIHZGcm9tLnggKSA+IE1hdGguYWJzKCB2RnJvbS56ICkgKSB7XG4gICAgICAgICAgdjEuc2V0KCAtIHZGcm9tLnksIHZGcm9tLngsIDAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2MS5zZXQoIDAsIC0gdkZyb20ueiwgdkZyb20ueSApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2MS5jcm9zc1ZlY3RvcnMoIHZGcm9tLCB2VG8gKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy54ID0gdjEueDtcbiAgICAgIHRoaXMueSA9IHYxLnk7XG4gICAgICB0aGlzLnogPSB2MS56O1xuICAgICAgdGhpcy53ID0gcjtcblxuICAgICAgdGhpcy5ub3JtYWxpemUoKTtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9KCksXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdGhVdGlsO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlZSRGlzcGxheTtcbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4vbWF0aC11dGlsLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG4vLyBIb3cgbXVjaCB0byByb3RhdGUgcGVyIGtleSBzdHJva2UuXG52YXIgS0VZX1NQRUVEID0gMC4xNTtcbnZhciBLRVlfQU5JTUFUSU9OX0RVUkFUSU9OID0gODA7XG5cbi8vIEhvdyBtdWNoIHRvIHJvdGF0ZSBmb3IgbW91c2UgZXZlbnRzLlxudmFyIE1PVVNFX1NQRUVEX1ggPSAwLjU7XG52YXIgTU9VU0VfU1BFRURfWSA9IDAuMztcblxuLyoqXG4gKiBWUkRpc3BsYXkgYmFzZWQgb24gbW91c2UgYW5kIGtleWJvYXJkIGlucHV0LiBEZXNpZ25lZCBmb3IgZGVza3RvcHMvbGFwdG9wc1xuICogd2hlcmUgb3JpZW50YXRpb24gZXZlbnRzIGFyZW4ndCBzdXBwb3J0ZWQuIENhbm5vdCBwcmVzZW50LlxuICovXG5mdW5jdGlvbiBNb3VzZUtleWJvYXJkVlJEaXNwbGF5KCkge1xuICB0aGlzLmRpc3BsYXlOYW1lID0gJ01vdXNlIGFuZCBLZXlib2FyZCBWUkRpc3BsYXkgKHdlYnZyLXBvbHlmaWxsKSc7XG5cbiAgdGhpcy5jYXBhYmlsaXRpZXMuaGFzT3JpZW50YXRpb24gPSB0cnVlO1xuXG4gIC8vIEF0dGFjaCB0byBtb3VzZSBhbmQga2V5Ym9hcmQgZXZlbnRzLlxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmVfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlRG93bl8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlVXBfLmJpbmQodGhpcykpO1xuXG4gIC8vIFwiUHJpdmF0ZVwiIG1lbWJlcnMuXG4gIHRoaXMucGhpXyA9IDA7XG4gIHRoaXMudGhldGFfID0gMDtcblxuICAvLyBWYXJpYWJsZXMgZm9yIGtleWJvYXJkLWJhc2VkIHJvdGF0aW9uIGFuaW1hdGlvbi5cbiAgdGhpcy50YXJnZXRBbmdsZV8gPSBudWxsO1xuICB0aGlzLmFuZ2xlQW5pbWF0aW9uXyA9IG51bGw7XG5cbiAgLy8gU3RhdGUgdmFyaWFibGVzIGZvciBjYWxjdWxhdGlvbnMuXG4gIHRoaXMub3JpZW50YXRpb25fID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcblxuICAvLyBWYXJpYWJsZXMgZm9yIG1vdXNlLWJhc2VkIHJvdGF0aW9uLlxuICB0aGlzLnJvdGF0ZVN0YXJ0XyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRW5kXyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRGVsdGFfID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcbiAgdGhpcy5pc0RyYWdnaW5nXyA9IGZhbHNlO1xuXG4gIHRoaXMub3JpZW50YXRpb25PdXRfID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbn1cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlID0gbmV3IFZSRGlzcGxheSgpO1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRJbW1lZGlhdGVQb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub3JpZW50YXRpb25fLnNldEZyb21FdWxlcllYWih0aGlzLnBoaV8sIHRoaXMudGhldGFfLCAwKTtcblxuICB0aGlzLm9yaWVudGF0aW9uT3V0X1swXSA9IHRoaXMub3JpZW50YXRpb25fLng7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzFdID0gdGhpcy5vcmllbnRhdGlvbl8ueTtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMl0gPSB0aGlzLm9yaWVudGF0aW9uXy56O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1szXSA9IHRoaXMub3JpZW50YXRpb25fLnc7XG5cbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbjogbnVsbCxcbiAgICBvcmllbnRhdGlvbjogdGhpcy5vcmllbnRhdGlvbk91dF8sXG4gICAgbGluZWFyVmVsb2NpdHk6IG51bGwsXG4gICAgbGluZWFyQWNjZWxlcmF0aW9uOiBudWxsLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbnVsbCxcbiAgICBhbmd1bGFyQWNjZWxlcmF0aW9uOiBudWxsXG4gIH07XG59O1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vbktleURvd25fID0gZnVuY3Rpb24oZSkge1xuICAvLyBUcmFjayBXQVNEIGFuZCBhcnJvdyBrZXlzLlxuICBpZiAoZS5rZXlDb2RlID09IDM4KSB7IC8vIFVwIGtleS5cbiAgICB0aGlzLmFuaW1hdGVQaGlfKHRoaXMucGhpXyArIEtFWV9TUEVFRCk7XG4gIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM5KSB7IC8vIFJpZ2h0IGtleS5cbiAgICB0aGlzLmFuaW1hdGVUaGV0YV8odGhpcy50aGV0YV8gLSBLRVlfU1BFRUQpO1xuICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSA0MCkgeyAvLyBEb3duIGtleS5cbiAgICB0aGlzLmFuaW1hdGVQaGlfKHRoaXMucGhpXyAtIEtFWV9TUEVFRCk7XG4gIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM3KSB7IC8vIExlZnQga2V5LlxuICAgIHRoaXMuYW5pbWF0ZVRoZXRhXyh0aGlzLnRoZXRhXyArIEtFWV9TUEVFRCk7XG4gIH1cbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVUaGV0YV8gPSBmdW5jdGlvbih0YXJnZXRBbmdsZSkge1xuICB0aGlzLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18oJ3RoZXRhXycsIHRhcmdldEFuZ2xlKTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVQaGlfID0gZnVuY3Rpb24odGFyZ2V0QW5nbGUpIHtcbiAgLy8gUHJldmVudCBsb29raW5nIHRvbyBmYXIgdXAgb3IgZG93bi5cbiAgdGFyZ2V0QW5nbGUgPSBVdGlsLmNsYW1wKHRhcmdldEFuZ2xlLCAtTWF0aC5QSS8yLCBNYXRoLlBJLzIpO1xuICB0aGlzLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18oJ3BoaV8nLCB0YXJnZXRBbmdsZSk7XG59O1xuXG4vKipcbiAqIFN0YXJ0IGFuIGFuaW1hdGlvbiB0byB0cmFuc2l0aW9uIGFuIGFuZ2xlIGZyb20gb25lIHZhbHVlIHRvIGFub3RoZXIuXG4gKi9cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18gPSBmdW5jdGlvbihhbmdsZU5hbWUsIHRhcmdldEFuZ2xlKSB7XG4gIC8vIElmIGFuIGFuaW1hdGlvbiBpcyBjdXJyZW50bHkgcnVubmluZywgY2FuY2VsIGl0LlxuICBpZiAodGhpcy5hbmdsZUFuaW1hdGlvbl8pIHtcbiAgICBjbGVhckludGVydmFsKHRoaXMuYW5nbGVBbmltYXRpb25fKTtcbiAgfVxuICB2YXIgc3RhcnRBbmdsZSA9IHRoaXNbYW5nbGVOYW1lXTtcbiAgdmFyIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG4gIC8vIFNldCB1cCBhbiBpbnRlcnZhbCB0aW1lciB0byBwZXJmb3JtIHRoZSBhbmltYXRpb24uXG4gIHRoaXMuYW5nbGVBbmltYXRpb25fID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgLy8gT25jZSB3ZSdyZSBmaW5pc2hlZCB0aGUgYW5pbWF0aW9uLCB3ZSdyZSBkb25lLlxuICAgIHZhciBlbGFwc2VkID0gbmV3IERhdGUoKSAtIHN0YXJ0VGltZTtcbiAgICBpZiAoZWxhcHNlZCA+PSBLRVlfQU5JTUFUSU9OX0RVUkFUSU9OKSB7XG4gICAgICB0aGlzW2FuZ2xlTmFtZV0gPSB0YXJnZXRBbmdsZTtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5hbmdsZUFuaW1hdGlvbl8pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBMaW5lYXJseSBpbnRlcnBvbGF0ZSB0aGUgYW5nbGUgc29tZSBhbW91bnQuXG4gICAgdmFyIHBlcmNlbnQgPSBlbGFwc2VkIC8gS0VZX0FOSU1BVElPTl9EVVJBVElPTjtcbiAgICB0aGlzW2FuZ2xlTmFtZV0gPSBzdGFydEFuZ2xlICsgKHRhcmdldEFuZ2xlIC0gc3RhcnRBbmdsZSkgKiBwZXJjZW50O1xuICB9LmJpbmQodGhpcyksIDEwMDAvNjApO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25Nb3VzZURvd25fID0gZnVuY3Rpb24oZSkge1xuICB0aGlzLnJvdGF0ZVN0YXJ0Xy5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICB0aGlzLmlzRHJhZ2dpbmdfID0gdHJ1ZTtcbn07XG5cbi8vIFZlcnkgc2ltaWxhciB0byBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9tcmZsaXgvODM1MTAyMFxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25Nb3VzZU1vdmVfID0gZnVuY3Rpb24oZSkge1xuICBpZiAoIXRoaXMuaXNEcmFnZ2luZ18gJiYgIXRoaXMuaXNQb2ludGVyTG9ja2VkXygpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIFN1cHBvcnQgcG9pbnRlciBsb2NrIEFQSS5cbiAgaWYgKHRoaXMuaXNQb2ludGVyTG9ja2VkXygpKSB7XG4gICAgdmFyIG1vdmVtZW50WCA9IGUubW92ZW1lbnRYIHx8IGUubW96TW92ZW1lbnRYIHx8IDA7XG4gICAgdmFyIG1vdmVtZW50WSA9IGUubW92ZW1lbnRZIHx8IGUubW96TW92ZW1lbnRZIHx8IDA7XG4gICAgdGhpcy5yb3RhdGVFbmRfLnNldCh0aGlzLnJvdGF0ZVN0YXJ0Xy54IC0gbW92ZW1lbnRYLCB0aGlzLnJvdGF0ZVN0YXJ0Xy55IC0gbW92ZW1lbnRZKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnJvdGF0ZUVuZF8uc2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgfVxuICAvLyBDYWxjdWxhdGUgaG93IG11Y2ggd2UgbW92ZWQgaW4gbW91c2Ugc3BhY2UuXG4gIHRoaXMucm90YXRlRGVsdGFfLnN1YlZlY3RvcnModGhpcy5yb3RhdGVFbmRfLCB0aGlzLnJvdGF0ZVN0YXJ0Xyk7XG4gIHRoaXMucm90YXRlU3RhcnRfLmNvcHkodGhpcy5yb3RhdGVFbmRfKTtcblxuICAvLyBLZWVwIHRyYWNrIG9mIHRoZSBjdW11bGF0aXZlIGV1bGVyIGFuZ2xlcy5cbiAgdGhpcy5waGlfICs9IDIgKiBNYXRoLlBJICogdGhpcy5yb3RhdGVEZWx0YV8ueSAvIHNjcmVlbi5oZWlnaHQgKiBNT1VTRV9TUEVFRF9ZO1xuICB0aGlzLnRoZXRhXyArPSAyICogTWF0aC5QSSAqIHRoaXMucm90YXRlRGVsdGFfLnggLyBzY3JlZW4ud2lkdGggKiBNT1VTRV9TUEVFRF9YO1xuXG4gIC8vIFByZXZlbnQgbG9va2luZyB0b28gZmFyIHVwIG9yIGRvd24uXG4gIHRoaXMucGhpXyA9IFV0aWwuY2xhbXAodGhpcy5waGlfLCAtTWF0aC5QSS8yLCBNYXRoLlBJLzIpO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25Nb3VzZVVwXyA9IGZ1bmN0aW9uKGUpIHtcbiAgdGhpcy5pc0RyYWdnaW5nXyA9IGZhbHNlO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuaXNQb2ludGVyTG9ja2VkXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZWwgPSBkb2N1bWVudC5wb2ludGVyTG9ja0VsZW1lbnQgfHwgZG9jdW1lbnQubW96UG9pbnRlckxvY2tFbGVtZW50IHx8XG4gICAgICBkb2N1bWVudC53ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQ7XG4gIHJldHVybiBlbCAhPT0gdW5kZWZpbmVkO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUucmVzZXRQb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucGhpXyA9IDA7XG4gIHRoaXMudGhldGFfID0gMDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW91c2VLZXlib2FyZFZSRGlzcGxheTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbmZ1bmN0aW9uIFJvdGF0ZUluc3RydWN0aW9ucygpIHtcbiAgdGhpcy5sb2FkSWNvbl8oKTtcblxuICB2YXIgb3ZlcmxheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IG92ZXJsYXkuc3R5bGU7XG4gIHMucG9zaXRpb24gPSAnZml4ZWQnO1xuICBzLnRvcCA9IDA7XG4gIHMucmlnaHQgPSAwO1xuICBzLmJvdHRvbSA9IDA7XG4gIHMubGVmdCA9IDA7XG4gIHMuYmFja2dyb3VuZENvbG9yID0gJ2dyYXknO1xuICBzLmZvbnRGYW1pbHkgPSAnc2Fucy1zZXJpZic7XG5cbiAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBpbWcuc3JjID0gdGhpcy5pY29uO1xuICB2YXIgcyA9IGltZy5zdHlsZTtcbiAgcy5tYXJnaW5MZWZ0ID0gJzI1JSc7XG4gIHMubWFyZ2luVG9wID0gJzI1JSc7XG4gIHMud2lkdGggPSAnNTAlJztcbiAgb3ZlcmxheS5hcHBlbmRDaGlsZChpbWcpO1xuXG4gIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gdGV4dC5zdHlsZTtcbiAgcy50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgcy5mb250U2l6ZSA9ICcxNnB4JztcbiAgcy5saW5lSGVpZ2h0ID0gJzI0cHgnO1xuICBzLm1hcmdpbiA9ICcyNHB4IDI1JSc7XG4gIHMud2lkdGggPSAnNTAlJztcbiAgdGV4dC5pbm5lckhUTUwgPSAnUGxhY2UgeW91ciBwaG9uZSBpbnRvIHlvdXIgQ2FyZGJvYXJkIHZpZXdlci4nO1xuICBvdmVybGF5LmFwcGVuZENoaWxkKHRleHQpO1xuXG4gIHZhciBzbmFja2JhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IHNuYWNrYmFyLnN0eWxlO1xuICBzLmJhY2tncm91bmRDb2xvciA9ICcjQ0ZEOERDJztcbiAgcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHMuYm90dG9tID0gMDtcbiAgcy53aWR0aCA9ICcxMDAlJztcbiAgcy5oZWlnaHQgPSAnNDhweCc7XG4gIHMucGFkZGluZyA9ICcxNHB4IDI0cHgnO1xuICBzLmJveFNpemluZyA9ICdib3JkZXItYm94JztcbiAgcy5jb2xvciA9ICcjNjU2QTZCJztcbiAgb3ZlcmxheS5hcHBlbmRDaGlsZChzbmFja2Jhcik7XG5cbiAgdmFyIHNuYWNrYmFyVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBzbmFja2JhclRleHQuc3R5bGUuZmxvYXQgPSAnbGVmdCc7XG4gIHNuYWNrYmFyVGV4dC5pbm5lckhUTUwgPSAnTm8gQ2FyZGJvYXJkIHZpZXdlcj8nO1xuXG4gIHZhciBzbmFja2JhckJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgc25hY2tiYXJCdXR0b24uaHJlZiA9ICdodHRwczovL3d3dy5nb29nbGUuY29tL2dldC9jYXJkYm9hcmQvZ2V0LWNhcmRib2FyZC8nO1xuICBzbmFja2JhckJ1dHRvbi5pbm5lckhUTUwgPSAnZ2V0IG9uZSc7XG4gIHNuYWNrYmFyQnV0dG9uLnRhcmdldCA9ICdfYmxhbmsnO1xuICB2YXIgcyA9IHNuYWNrYmFyQnV0dG9uLnN0eWxlO1xuICBzLmZsb2F0ID0gJ3JpZ2h0JztcbiAgcy5mb250V2VpZ2h0ID0gNjAwO1xuICBzLnRleHRUcmFuc2Zvcm0gPSAndXBwZXJjYXNlJztcbiAgcy5ib3JkZXJMZWZ0ID0gJzFweCBzb2xpZCBncmF5JztcbiAgcy5wYWRkaW5nTGVmdCA9ICcyNHB4JztcbiAgcy50ZXh0RGVjb3JhdGlvbiA9ICdub25lJztcbiAgcy5jb2xvciA9ICcjNjU2QTZCJztcblxuICBzbmFja2Jhci5hcHBlbmRDaGlsZChzbmFja2JhclRleHQpO1xuICBzbmFja2Jhci5hcHBlbmRDaGlsZChzbmFja2JhckJ1dHRvbik7XG5cbiAgdGhpcy5vdmVybGF5ID0gb3ZlcmxheTtcbiAgdGhpcy50ZXh0ID0gdGV4dDtcblxuICB0aGlzLmhpZGUoKTtcbn1cblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24ocGFyZW50KSB7XG4gIGlmICghcGFyZW50ICYmICF0aGlzLm92ZXJsYXkucGFyZW50RWxlbWVudCkge1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5vdmVybGF5KTtcbiAgfSBlbHNlIGlmIChwYXJlbnQpIHtcbiAgICBpZiAodGhpcy5vdmVybGF5LnBhcmVudEVsZW1lbnQgJiYgdGhpcy5vdmVybGF5LnBhcmVudEVsZW1lbnQgIT0gcGFyZW50KVxuICAgICAgdGhpcy5vdmVybGF5LnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5vdmVybGF5KTtcblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZCh0aGlzLm92ZXJsYXkpO1xuICB9XG5cbiAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG4gIHZhciBpbWcgPSB0aGlzLm92ZXJsYXkucXVlcnlTZWxlY3RvcignaW1nJyk7XG4gIHZhciBzID0gaW1nLnN0eWxlO1xuXG4gIGlmIChVdGlsLmlzTGFuZHNjYXBlTW9kZSgpKSB7XG4gICAgcy53aWR0aCA9ICcyMCUnO1xuICAgIHMubWFyZ2luTGVmdCA9ICc0MCUnO1xuICAgIHMubWFyZ2luVG9wID0gJzMlJztcbiAgfSBlbHNlIHtcbiAgICBzLndpZHRoID0gJzUwJSc7XG4gICAgcy5tYXJnaW5MZWZ0ID0gJzI1JSc7XG4gICAgcy5tYXJnaW5Ub3AgPSAnMjUlJztcbiAgfVxufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5zaG93VGVtcG9yYXJpbHkgPSBmdW5jdGlvbihtcywgcGFyZW50KSB7XG4gIHRoaXMuc2hvdyhwYXJlbnQpO1xuICB0aGlzLnRpbWVyID0gc2V0VGltZW91dCh0aGlzLmhpZGUuYmluZCh0aGlzKSwgbXMpO1xufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5kaXNhYmxlU2hvd1RlbXBvcmFyaWx5ID0gZnVuY3Rpb24oKSB7XG4gIGNsZWFyVGltZW91dCh0aGlzLnRpbWVyKTtcbn07XG5cblJvdGF0ZUluc3RydWN0aW9ucy5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZGlzYWJsZVNob3dUZW1wb3JhcmlseSgpO1xuICAvLyBJbiBwb3J0cmFpdCBWUiBtb2RlLCB0ZWxsIHRoZSB1c2VyIHRvIHJvdGF0ZSB0byBsYW5kc2NhcGUuIE90aGVyd2lzZSwgaGlkZVxuICAvLyB0aGUgaW5zdHJ1Y3Rpb25zLlxuICBpZiAoIVV0aWwuaXNMYW5kc2NhcGVNb2RlKCkgJiYgVXRpbC5pc01vYmlsZSgpKSB7XG4gICAgdGhpcy5zaG93KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5oaWRlKCk7XG4gIH1cbn07XG5cblJvdGF0ZUluc3RydWN0aW9ucy5wcm90b3R5cGUubG9hZEljb25fID0gZnVuY3Rpb24oKSB7XG4gIC8vIEVuY29kZWQgYXNzZXRfc3JjL3JvdGF0ZS1pbnN0cnVjdGlvbnMuc3ZnXG4gIHRoaXMuaWNvbiA9IFV0aWwuYmFzZTY0KCdpbWFnZS9zdmcreG1sJywgJ1BEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0NqeHpkbWNnZDJsa2RHZzlJakU1T0hCNElpQm9aV2xuYUhROUlqSTBNSEI0SWlCMmFXVjNRbTk0UFNJd0lEQWdNVGs0SURJME1DSWdkbVZ5YzJsdmJqMGlNUzR4SWlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhodGJHNXpPbmhzYVc1clBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHhPVGs1TDNoc2FXNXJJaUI0Yld4dWN6cHphMlYwWTJnOUltaDBkSEE2THk5M2QzY3VZbTlvWlcxcFlXNWpiMlJwYm1jdVkyOXRMM05yWlhSamFDOXVjeUkrQ2lBZ0lDQThJUzB0SUVkbGJtVnlZWFJ2Y2pvZ1UydGxkR05vSURNdU15NHpJQ2d4TWpBNE1Ta2dMU0JvZEhSd09pOHZkM2QzTG1KdmFHVnRhV0Z1WTI5a2FXNW5MbU52YlM5emEyVjBZMmdnTFMwK0NpQWdJQ0E4ZEdsMGJHVStkSEpoYm5OcGRHbHZiand2ZEdsMGJHVStDaUFnSUNBOFpHVnpZejVEY21WaGRHVmtJSGRwZEdnZ1UydGxkR05vTGp3dlpHVnpZejRLSUNBZ0lEeGtaV1p6UGp3dlpHVm1jejRLSUNBZ0lEeG5JR2xrUFNKUVlXZGxMVEVpSUhOMGNtOXJaVDBpYm05dVpTSWdjM1J5YjJ0bExYZHBaSFJvUFNJeElpQm1hV3hzUFNKdWIyNWxJaUJtYVd4c0xYSjFiR1U5SW1WMlpXNXZaR1FpSUhOclpYUmphRHAwZVhCbFBTSk5VMUJoWjJVaVBnb2dJQ0FnSUNBZ0lEeG5JR2xrUFNKMGNtRnVjMmwwYVc5dUlpQnphMlYwWTJnNmRIbHdaVDBpVFZOQmNuUmliMkZ5WkVkeWIzVndJajRLSUNBZ0lDQWdJQ0FnSUNBZ1BHY2dhV1E5SWtsdGNHOXlkR1ZrTFV4aGVXVnljeTFEYjNCNUxUUXRLeTFKYlhCdmNuUmxaQzFNWVhsbGNuTXRRMjl3ZVMwckxVbHRjRzl5ZEdWa0xVeGhlV1Z5Y3kxRGIzQjVMVEl0UTI5d2VTSWdjMnRsZEdOb09uUjVjR1U5SWsxVFRHRjVaWEpIY205MWNDSStDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThaeUJwWkQwaVNXMXdiM0owWldRdFRHRjVaWEp6TFVOdmNIa3ROQ0lnZEhKaGJuTm1iM0p0UFNKMGNtRnVjMnhoZEdVb01DNHdNREF3TURBc0lERXdOeTR3TURBd01EQXBJaUJ6YTJWMFkyZzZkSGx3WlQwaVRWTlRhR0Z3WlVkeWIzVndJajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UUTVMall5TlN3eUxqVXlOeUJETVRRNUxqWXlOU3d5TGpVeU55QXhOVFV1T0RBMUxEWXVNRGsySURFMU5pNHpOaklzTmk0ME1UZ2dUREUxTmk0ek5qSXNOeTR6TURRZ1F6RTFOaTR6TmpJc055NDBPREVnTVRVMkxqTTNOU3czTGpZMk5DQXhOVFl1TkN3M0xqZzFNeUJETVRVMkxqUXhMRGN1T1RNMElERTFOaTQwTWl3NExqQXhOU0F4TlRZdU5ESTNMRGd1TURrMUlFTXhOVFl1TlRZM0xEa3VOVEVnTVRVM0xqUXdNU3d4TVM0d09UTWdNVFU0TGpVek1pd3hNaTR3T1RRZ1RERTJOQzR5TlRJc01UY3VNVFUySUV3eE5qUXVNek16TERFM0xqQTJOaUJETVRZMExqTXpNeXd4Tnk0d05qWWdNVFk0TGpjeE5Td3hOQzQxTXpZZ01UWTVMalUyT0N3eE5DNHdORElnUXpFM01TNHdNalVzTVRRdU9EZ3pJREU1TlM0MU16Z3NNamt1TURNMUlERTVOUzQxTXpnc01qa3VNRE0xSUV3eE9UVXVOVE00TERnekxqQXpOaUJETVRrMUxqVXpPQ3c0TXk0NE1EY2dNVGsxTGpFMU1pdzROQzR5TlRNZ01UazBMalU1TERnMExqSTFNeUJETVRrMExqTTFOeXc0TkM0eU5UTWdNVGswTGpBNU5TdzROQzR4TnpjZ01Ua3pMamd4T0N3NE5DNHdNVGNnVERFMk9TNDROVEVzTnpBdU1UYzVJRXd4TmprdU9ETTNMRGN3TGpJd015Qk1NVFF5TGpVeE5TdzROUzQ1TnpnZ1RERTBNUzQyTmpVc09EUXVOalUxSUVNeE16WXVPVE0wTERnekxqRXlOaUF4TXpFdU9URTNMRGd4TGpreE5TQXhNall1TnpFMExEZ3hMakEwTlNCRE1USTJMamN3T1N3NE1TNHdOaUF4TWpZdU56QTNMRGd4TGpBMk9TQXhNall1TnpBM0xEZ3hMakEyT1NCTU1USXhMalkwTERrNExqQXpJRXd4TVRNdU56UTVMREV3TWk0MU9EWWdUREV4TXk0M01USXNNVEF5TGpVeU15Qk1NVEV6TGpjeE1pd3hNekF1TVRFeklFTXhNVE11TnpFeUxERXpNQzQ0T0RVZ01URXpMak15Tml3eE16RXVNek1nTVRFeUxqYzJOQ3d4TXpFdU16TWdRekV4TWk0MU16SXNNVE14TGpNeklERXhNaTR5Tmprc01UTXhMakkxTkNBeE1URXVPVGt5TERFek1TNHdPVFFnVERZNUxqVXhPU3d4TURZdU5UY3lJRU0yT0M0MU5qa3NNVEEyTGpBeU15QTJOeTQzT1Rrc01UQTBMalk1TlNBMk55NDNPVGtzTVRBekxqWXdOU0JNTmpjdU56azVMREV3TWk0MU55Qk1OamN1TnpjNExERXdNaTQyTVRjZ1F6WTNMakkzTERFd01pNHpPVE1nTmpZdU5qUTRMREV3TWk0eU5Ea2dOalV1T1RZeUxERXdNaTR5TVRnZ1F6WTFMamczTlN3eE1ESXVNakUwSURZMUxqYzRPQ3d4TURJdU1qRXlJRFkxTGpjd01Td3hNREl1TWpFeUlFTTJOUzQyTURZc01UQXlMakl4TWlBMk5TNDFNVEVzTVRBeUxqSXhOU0EyTlM0ME1UWXNNVEF5TGpJeE9TQkROalV1TVRrMUxERXdNaTR5TWprZ05qUXVPVGMwTERFd01pNHlNelVnTmpRdU56VTBMREV3TWk0eU16VWdRelkwTGpNek1Td3hNREl1TWpNMUlEWXpMamt4TVN3eE1ESXVNakUySURZekxqUTVPQ3d4TURJdU1UYzRJRU0yTVM0NE5ETXNNVEF5TGpBeU5TQTJNQzR5T1Rnc01UQXhMalUzT0NBMU9TNHdPVFFzTVRBd0xqZzRNaUJNTVRJdU5URTRMRGN6TGprNU1pQk1NVEl1TlRJekxEYzBMakF3TkNCTU1pNHlORFVzTlRVdU1qVTBJRU14TGpJME5DdzFNeTQwTWpjZ01pNHdNRFFzTlRFdU1ETTRJRE11T1RRekxEUTVMamt4T0NCTU5Ua3VPVFUwTERFM0xqVTNNeUJETmpBdU5qSTJMREUzTGpFNE5TQTJNUzR6TlN3eE55NHdNREVnTmpJdU1EVXpMREUzTGpBd01TQkROak11TXpjNUxERTNMakF3TVNBMk5DNDJNalVzTVRjdU5qWWdOalV1TWpnc01UZ3VPRFUwSUV3Mk5TNHlPRFVzTVRndU9EVXhJRXcyTlM0MU1USXNNVGt1TWpZMElFdzJOUzQxTURZc01Ua3VNalk0SUVNMk5TNDVNRGtzTWpBdU1EQXpJRFkyTGpRd05Td3lNQzQyT0NBMk5pNDVPRE1zTWpFdU1qZzJJRXcyTnk0eU5pd3lNUzQxTlRZZ1F6WTVMakUzTkN3eU15NDBNRFlnTnpFdU56STRMREkwTGpNMU55QTNOQzR6TnpNc01qUXVNelUzSUVNM05pNHpNaklzTWpRdU16VTNJRGM0TGpNeU1Td3lNeTQ0TkNBNE1DNHhORGdzTWpJdU56ZzFJRU00TUM0eE5qRXNNakl1TnpnMUlEZzNMalEyTnl3eE9DNDFOallnT0RjdU5EWTNMREU0TGpVMk5pQkRPRGd1TVRNNUxERTRMakUzT0NBNE9DNDROak1zTVRjdU9UazBJRGc1TGpVMk5pd3hOeTQ1T1RRZ1F6a3dMamc1TWl3eE55NDVPVFFnT1RJdU1UTTRMREU0TGpZMU1pQTVNaTQzT1RJc01Ua3VPRFEzSUV3NU5pNHdORElzTWpVdU56YzFJRXc1Tmk0d05qUXNNalV1TnpVM0lFd3hNREl1T0RRNUxESTVMalkzTkNCTU1UQXlMamMwTkN3eU9TNDBPVElnVERFME9TNDJNalVzTWk0MU1qY2dUVEUwT1M0Mk1qVXNNQzQ0T1RJZ1F6RTBPUzR6TkRNc01DNDRPVElnTVRRNUxqQTJNaXd3TGprMk5TQXhORGd1T0RFc01TNHhNU0JNTVRBeUxqWTBNU3d5Tnk0Mk5qWWdURGszTGpJek1Td3lOQzQxTkRJZ1REazBMakl5Tml3eE9TNHdOakVnUXprekxqTXhNeXd4Tnk0ek9UUWdPVEV1TlRJM0xERTJMak0xT1NBNE9TNDFOallzTVRZdU16VTRJRU00T0M0MU5UVXNNVFl1TXpVNElEZzNMalUwTml3eE5pNDJNeklnT0RZdU5qUTVMREUzTGpFMUlFTTRNeTQ0Tnpnc01UZ3VOelVnTnprdU5qZzNMREl4TGpFMk9TQTNPUzR6TnpRc01qRXVNelExSUVNM09TNHpOVGtzTWpFdU16VXpJRGM1TGpNME5Td3lNUzR6TmpFZ056a3VNek1zTWpFdU16WTVJRU0zTnk0M09UZ3NNakl1TWpVMElEYzJMakE0TkN3eU1pNDNNaklnTnpRdU16Y3pMREl5TGpjeU1pQkROekl1TURneExESXlMamN5TWlBMk9TNDVOVGtzTWpFdU9Ea2dOamd1TXprM0xESXdMak00SUV3Mk9DNHhORFVzTWpBdU1UTTFJRU0yTnk0M01EWXNNVGt1TmpjeUlEWTNMak15TXl3eE9TNHhOVFlnTmpjdU1EQTJMREU0TGpZd01TQkROall1T1RnNExERTRMalUxT1NBMk5pNDVOamdzTVRndU5URTVJRFkyTGprME5pd3hPQzQwTnprZ1REWTJMamN4T1N3eE9DNHdOalVnUXpZMkxqWTVMREU0TGpBeE1pQTJOaTQyTlRnc01UY3VPVFlnTmpZdU5qSTBMREUzTGpreE1TQkROalV1TmpnMkxERTJMak16TnlBMk15NDVOVEVzTVRVdU16WTJJRFl5TGpBMU15d3hOUzR6TmpZZ1F6WXhMakEwTWl3eE5TNHpOallnTmpBdU1ETXpMREUxTGpZMElEVTVMakV6Tml3eE5pNHhOVGdnVERNdU1USTFMRFE0TGpVd01pQkRNQzQwTWpZc05UQXVNRFl4SUMwd0xqWXhNeXcxTXk0ME5ESWdNQzQ0TVRFc05UWXVNRFFnVERFeExqQTRPU3czTkM0M09TQkRNVEV1TWpZMkxEYzFMakV4TXlBeE1TNDFNemNzTnpVdU16VXpJREV4TGpnMUxEYzFMalE1TkNCTU5UZ3VNamMyTERFd01pNHlPVGdnUXpVNUxqWTNPU3d4TURNdU1UQTRJRFl4TGpRek15d3hNRE11TmpNZ05qTXVNelE0TERFd015NDRNRFlnUXpZekxqZ3hNaXd4TURNdU9EUTRJRFkwTGpJNE5Td3hNRE11T0RjZ05qUXVOelUwTERFd015NDROeUJETmpVc01UQXpMamczSURZMUxqSTBPU3d4TURNdU9EWTBJRFkxTGpRNU5Dd3hNRE11T0RVeUlFTTJOUzQxTmpNc01UQXpMamcwT1NBMk5TNDJNeklzTVRBekxqZzBOeUEyTlM0M01ERXNNVEF6TGpnME55QkROalV1TnpZMExERXdNeTQ0TkRjZ05qVXVPREk0TERFd015NDRORGtnTmpVdU9Ea3NNVEF6TGpnMU1pQkROalV1T1RnMkxERXdNeTQ0TlRZZ05qWXVNRGdzTVRBekxqZzJNeUEyTmk0eE56TXNNVEF6TGpnM05DQkROall1TWpneUxERXdOUzQwTmpjZ05qY3VNek15TERFd055NHhPVGNnTmpndU56QXlMREV3Tnk0NU9EZ2dUREV4TVM0eE56UXNNVE15TGpVeElFTXhNVEV1TmprNExERXpNaTQ0TVRJZ01URXlMakl6TWl3eE16SXVPVFkxSURFeE1pNDNOalFzTVRNeUxqazJOU0JETVRFMExqSTJNU3d4TXpJdU9UWTFJREV4TlM0ek5EY3NNVE14TGpjMk5TQXhNVFV1TXpRM0xERXpNQzR4TVRNZ1RERXhOUzR6TkRjc01UQXpMalUxTVNCTU1USXlMalExT0N3NU9TNDBORFlnUXpFeU1pNDRNVGtzT1RrdU1qTTNJREV5TXk0d09EY3NPVGd1T0RrNElERXlNeTR5TURjc09UZ3VORGs0SUV3eE1qY3VPRFkxTERneUxqa3dOU0JETVRNeUxqSTNPU3c0TXk0M01ESWdNVE0yTGpVMU55dzROQzQzTlRNZ01UUXdMall3Tnl3NE5pNHdNek1nVERFME1TNHhOQ3c0Tmk0NE5qSWdRekUwTVM0ME5URXNPRGN1TXpRMklERTBNUzQ1Tnpjc09EY3VOakV6SURFME1pNDFNVFlzT0RjdU5qRXpJRU14TkRJdU56azBMRGczTGpZeE15QXhORE11TURjMkxEZzNMalUwTWlBeE5ETXVNek16TERnM0xqTTVNeUJNTVRZNUxqZzJOU3czTWk0d056WWdUREU1TXl3NE5TNDBNek1nUXpFNU15NDFNak1zT0RVdU56TTFJREU1TkM0d05UZ3NPRFV1T0RnNElERTVOQzQxT1N3NE5TNDRPRGdnUXpFNU5pNHdPRGNzT0RVdU9EZzRJREU1Tnk0eE56TXNPRFF1TmpnNUlERTVOeTR4TnpNc09ETXVNRE0ySUV3eE9UY3VNVGN6TERJNUxqQXpOU0JETVRrM0xqRTNNeXd5T0M0ME5URWdNVGsyTGpnMk1Td3lOeTQ1TVRFZ01UazJMak0xTlN3eU55NDJNVGtnUXpFNU5pNHpOVFVzTWpjdU5qRTVJREUzTVM0NE5ETXNNVE11TkRZM0lERTNNQzR6T0RVc01USXVOakkySUVNeE56QXVNVE15TERFeUxqUTRJREUyT1M0NE5Td3hNaTQwTURjZ01UWTVMalUyT0N3eE1pNDBNRGNnUXpFMk9TNHlPRFVzTVRJdU5EQTNJREUyT1M0d01ESXNNVEl1TkRneElERTJPQzQzTkRrc01USXVOakkzSUVNeE5qZ3VNVFF6TERFeUxqazNPQ0F4TmpVdU56VTJMREUwTGpNMU55QXhOalF1TkRJMExERTFMakV5TlNCTU1UVTVMall4TlN3eE1DNDROeUJETVRVNExqYzVOaXd4TUM0eE5EVWdNVFU0TGpFMU5DdzRMamt6TnlBeE5UZ3VNRFUwTERjdU9UTTBJRU14TlRndU1EUTFMRGN1T0RNM0lERTFPQzR3TXpRc055NDNNemtnTVRVNExqQXlNU3czTGpZMElFTXhOVGd1TURBMUxEY3VOVEl6SURFMU55NDVPVGdzTnk0ME1TQXhOVGN1T1RrNExEY3VNekEwSUV3eE5UY3VPVGs0TERZdU5ERTRJRU14TlRjdU9UazRMRFV1T0RNMElERTFOeTQyT0RZc05TNHlPVFVnTVRVM0xqRTRNU3cxTGpBd01pQkRNVFUyTGpZeU5DdzBMalk0SURFMU1DNDBORElzTVM0eE1URWdNVFV3TGpRME1pd3hMakV4TVNCRE1UVXdMakU0T1N3d0xqazJOU0F4TkRrdU9UQTNMREF1T0RreUlERTBPUzQyTWpVc01DNDRPVElpSUdsa1BTSkdhV3hzTFRFaUlHWnBiR3c5SWlNME5UVkJOalFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk9UWXVNREkzTERJMUxqWXpOaUJNTVRReUxqWXdNeXcxTWk0MU1qY2dRekUwTXk0NE1EY3NOVE11TWpJeUlERTBOQzQxT0RJc05UUXVNVEUwSURFME5DNDRORFVzTlRVdU1EWTRJRXd4TkRRdU9ETTFMRFUxTGpBM05TQk1Oak11TkRZeExERXdNaTR3TlRjZ1REWXpMalEyTERFd01pNHdOVGNnUXpZeExqZ3dOaXd4TURFdU9UQTFJRFl3TGpJMk1Td3hNREV1TkRVM0lEVTVMakExTnl3eE1EQXVOell5SUV3eE1pNDBPREVzTnpNdU9EY3hJRXc1Tmk0d01qY3NNalV1TmpNMklpQnBaRDBpUm1sc2JDMHlJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVFl6TGpRMk1Td3hNREl1TVRjMElFTTJNeTQwTlRNc01UQXlMakUzTkNBMk15NDBORFlzTVRBeUxqRTNOQ0EyTXk0ME16a3NNVEF5TGpFM01pQkROakV1TnpRMkxERXdNaTR3TVRZZ05qQXVNakV4TERFd01TNDFOak1nTlRndU9UazRMREV3TUM0NE5qTWdUREV5TGpReU1pdzNNeTQ1TnpNZ1F6RXlMak00Tml3M015NDVOVElnTVRJdU16WTBMRGN6TGpreE5DQXhNaTR6TmpRc056TXVPRGN4SUVNeE1pNHpOalFzTnpNdU9ETWdNVEl1TXpnMkxEY3pMamM1TVNBeE1pNDBNaklzTnpNdU56Y2dURGsxTGprMk9Dd3lOUzQxTXpVZ1F6azJMakF3TkN3eU5TNDFNVFFnT1RZdU1EUTVMREkxTGpVeE5DQTVOaTR3T0RVc01qVXVOVE0xSUV3eE5ESXVOall4TERVeUxqUXlOaUJETVRRekxqZzRPQ3cxTXk0eE16UWdNVFEwTGpZNE1pdzFOQzR3TXpnZ01UUTBMamsxTnl3MU5TNHdNemNnUXpFME5DNDVOeXcxTlM0d09ETWdNVFEwTGprMU15dzFOUzR4TXpNZ01UUTBMamt4TlN3MU5TNHhOakVnUXpFME5DNDVNVEVzTlRVdU1UWTFJREUwTkM0NE9UZ3NOVFV1TVRjMElERTBOQzQ0T1RRc05UVXVNVGMzSUV3Mk15NDFNVGtzTVRBeUxqRTFPQ0JETmpNdU5UQXhMREV3TWk0eE5qa2dOak11TkRneExERXdNaTR4TnpRZ05qTXVORFl4TERFd01pNHhOelFnVERZekxqUTJNU3d4TURJdU1UYzBJRm9nVFRFeUxqY3hOQ3czTXk0NE56RWdURFU1TGpFeE5Td3hNREF1TmpZeElFTTJNQzR5T1RNc01UQXhMak0wTVNBMk1TNDNPRFlzTVRBeExqYzRNaUEyTXk0ME16VXNNVEF4TGprek55Qk1NVFEwTGpjd055dzFOUzR3TVRVZ1F6RTBOQzQwTWpnc05UUXVNVEE0SURFME15NDJPRElzTlRNdU1qZzFJREUwTWk0MU5EUXNOVEl1TmpJNElFdzVOaTR3TWpjc01qVXVOemN4SUV3eE1pNDNNVFFzTnpNdU9EY3hJRXd4TWk0M01UUXNOek11T0RjeElGb2lJR2xrUFNKR2FXeHNMVE1pSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRRNExqTXlOeXcxT0M0ME56RWdRekUwT0M0eE5EVXNOVGd1TkRnZ01UUTNMamsyTWl3MU9DNDBPQ0F4TkRjdU56Z3hMRFU0TGpRM01pQkRNVFExTGpnNE55dzFPQzR6T0RrZ01UUTBMalEzT1N3MU55NDBNelFnTVRRMExqWXpOaXcxTmk0ek5DQkRNVFEwTGpZNE9TdzFOUzQ1TmpjZ01UUTBMalkyTkN3MU5TNDFPVGNnTVRRMExqVTJOQ3cxTlM0eU16VWdURFl6TGpRMk1Td3hNREl1TURVM0lFTTJOQzR3T0Rrc01UQXlMakV4TlNBMk5DNDNNek1zTVRBeUxqRXpJRFkxTGpNM09Td3hNREl1TURrNUlFTTJOUzQxTmpFc01UQXlMakE1SURZMUxqYzBNeXd4TURJdU1Ea2dOalV1T1RJMUxERXdNaTR3T1RnZ1F6WTNMamd4T1N3eE1ESXVNVGd4SURZNUxqSXlOeXd4TURNdU1UTTJJRFk1TGpBM0xERXdOQzR5TXlCTU1UUTRMak15Tnl3MU9DNDBOekVpSUdsa1BTSkdhV3hzTFRRaUlHWnBiR3c5SWlOR1JrWkdSa1lpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk5qa3VNRGNzTVRBMExqTTBOeUJETmprdU1EUTRMREV3TkM0ek5EY2dOamt1TURJMUxERXdOQzR6TkNBMk9TNHdNRFVzTVRBMExqTXlOeUJETmpndU9UWTRMREV3TkM0ek1ERWdOamd1T1RRNExERXdOQzR5TlRjZ05qZ3VPVFUxTERFd05DNHlNVE1nUXpZNUxERXdNeTQ0T1RZZ05qZ3VPRGs0TERFd015NDFOellnTmpndU5qVTRMREV3TXk0eU9EZ2dRelk0TGpFMU15d3hNREl1TmpjNElEWTNMakV3TXl3eE1ESXVNalkySURZMUxqa3lMREV3TWk0eU1UUWdRelkxTGpjME1pd3hNREl1TWpBMklEWTFMalUyTXl3eE1ESXVNakEzSURZMUxqTTROU3d4TURJdU1qRTFJRU0yTkM0M05ESXNNVEF5TGpJME5pQTJOQzR3T0Rjc01UQXlMakl6TWlBMk15NDBOU3d4TURJdU1UYzBJRU0yTXk0ek9Ua3NNVEF5TGpFMk9TQTJNeTR6TlRnc01UQXlMakV6TWlBMk15NHpORGNzTVRBeUxqQTRNaUJETmpNdU16TTJMREV3TWk0d016TWdOak11TXpVNExERXdNUzQ1T0RFZ05qTXVOREF5TERFd01TNDVOVFlnVERFME5DNDFNRFlzTlRVdU1UTTBJRU14TkRRdU5UTTNMRFUxTGpFeE5pQXhORFF1TlRjMUxEVTFMakV4TXlBeE5EUXVOakE1TERVMUxqRXlOeUJETVRRMExqWTBNaXcxTlM0eE5ERWdNVFEwTGpZMk9DdzFOUzR4TnlBeE5EUXVOamMzTERVMUxqSXdOQ0JETVRRMExqYzRNU3cxTlM0MU9EVWdNVFEwTGpnd05pdzFOUzQ1TnpJZ01UUTBMamMxTVN3MU5pNHpOVGNnUXpFME5DNDNNRFlzTlRZdU5qY3pJREUwTkM0NE1EZ3NOVFl1T1RrMElERTBOUzR3TkRjc05UY3VNamd5SUVNeE5EVXVOVFV6TERVM0xqZzVNaUF4TkRZdU5qQXlMRFU0TGpNd015QXhORGN1TnpnMkxEVTRMak0xTlNCRE1UUTNMamsyTkN3MU9DNHpOak1nTVRRNExqRTBNeXcxT0M0ek5qTWdNVFE0TGpNeU1TdzFPQzR6TlRRZ1F6RTBPQzR6Tnpjc05UZ3VNelV5SURFME9DNDBNalFzTlRndU16ZzNJREUwT0M0ME16a3NOVGd1TkRNNElFTXhORGd1TkRVMExEVTRMalE1SURFME9DNDBNeklzTlRndU5UUTFJREUwT0M0ek9EVXNOVGd1TlRjeUlFdzJPUzR4TWprc01UQTBMak16TVNCRE5qa3VNVEV4TERFd05DNHpORElnTmprdU1Ea3NNVEEwTGpNME55QTJPUzR3Tnl3eE1EUXVNelEzSUV3Mk9TNHdOeXd4TURRdU16UTNJRm9nVFRZMUxqWTJOU3d4TURFdU9UYzFJRU0yTlM0M05UUXNNVEF4TGprM05TQTJOUzQ0TkRJc01UQXhMamszTnlBMk5TNDVNeXd4TURFdU9UZ3hJRU0yTnk0eE9UWXNNVEF5TGpBek55QTJPQzR5T0RNc01UQXlMalEyT1NBMk9DNDRNemdzTVRBekxqRXpPU0JETmprdU1EWTFMREV3TXk0ME1UTWdOamt1TVRnNExERXdNeTQzTVRRZ05qa3VNVGs0TERFd05DNHdNakVnVERFME55NDRPRE1zTlRndU5Ua3lJRU14TkRjdU9EUTNMRFU0TGpVNU1pQXhORGN1T0RFeExEVTRMalU1TVNBeE5EY3VOemMyTERVNExqVTRPU0JETVRRMkxqVXdPU3cxT0M0MU16TWdNVFExTGpReU1pdzFPQzR4SURFME5DNDROamNzTlRjdU5ETXhJRU14TkRRdU5UZzFMRFUzTGpBNU1TQXhORFF1TkRZMUxEVTJMamN3TnlBeE5EUXVOVElzTlRZdU16STBJRU14TkRRdU5UWXpMRFUyTGpBeU1TQXhORFF1TlRVeUxEVTFMamN4TmlBeE5EUXVORGc0TERVMUxqUXhOQ0JNTmpNdU9EUTJMREV3TVM0NU55QkROalF1TXpVekxERXdNaTR3TURJZ05qUXVPRFkzTERFd01pNHdNRFlnTmpVdU16YzBMREV3TVM0NU9ESWdRelkxTGpRM01Td3hNREV1T1RjM0lEWTFMalUyT0N3eE1ERXVPVGMxSURZMUxqWTJOU3d4TURFdU9UYzFJRXcyTlM0Mk5qVXNNVEF4TGprM05TQmFJaUJwWkQwaVJtbHNiQzAxSWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRJdU1qQTRMRFUxTGpFek5DQkRNUzR5TURjc05UTXVNekEzSURFdU9UWTNMRFV3TGpreE55QXpMamt3Tml3ME9TNDNPVGNnVERVNUxqa3hOeXd4Tnk0ME5UTWdRell4TGpnMU5pd3hOaTR6TXpNZ05qUXVNalF4TERFMkxqa3dOeUEyTlM0eU5ETXNNVGd1TnpNMElFdzJOUzQwTnpVc01Ua3VNVFEwSUVNMk5TNDROeklzTVRrdU9EZ3lJRFkyTGpNMk9Dd3lNQzQxTmlBMk5pNDVORFVzTWpFdU1UWTFJRXcyTnk0eU1qTXNNakV1TkRNMUlFTTNNQzQxTkRnc01qUXVOalE1SURjMUxqZ3dOaXd5TlM0eE5URWdPREF1TVRFeExESXlMalkyTlNCTU9EY3VORE1zTVRndU5EUTFJRU00T1M0ek55d3hOeTR6TWpZZ09URXVOelUwTERFM0xqZzVPU0E1TWk0M05UVXNNVGt1TnpJM0lFdzVOaTR3TURVc01qVXVOalUxSUV3eE1pNDBPRFlzTnpNdU9EZzBJRXd5TGpJd09DdzFOUzR4TXpRZ1dpSWdhV1E5SWtacGJHd3ROaUlnWm1sc2JEMGlJMFpCUmtGR1FTSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TWk0ME9EWXNOelF1TURBeElFTXhNaTQwTnpZc056UXVNREF4SURFeUxqUTJOU3czTXk0NU9Ua2dNVEl1TkRVMUxEY3pMams1TmlCRE1USXVOREkwTERjekxqazRPQ0F4TWk0ek9Ua3NOek11T1RZM0lERXlMak00TkN3M015NDVOQ0JNTWk0eE1EWXNOVFV1TVRrZ1F6RXVNRGMxTERVekxqTXhJREV1T0RVM0xEVXdMamcwTlNBekxqZzBPQ3cwT1M0Mk9UWWdURFU1TGpnMU9Dd3hOeTR6TlRJZ1F6WXdMalV5TlN3eE5pNDVOamNnTmpFdU1qY3hMREUyTGpjMk5DQTJNaTR3TVRZc01UWXVOelkwSUVNMk15NDBNekVzTVRZdU56WTBJRFkwTGpZMk5pd3hOeTQwTmpZZ05qVXVNekkzTERFNExqWTBOaUJETmpVdU16TTNMREU0TGpZMU5DQTJOUzR6TkRVc01UZ3VOall6SURZMUxqTTFNU3d4T0M0Mk56UWdURFkxTGpVM09Dd3hPUzR3T0RnZ1F6WTFMalU0TkN3eE9TNHhJRFkxTGpVNE9Td3hPUzR4TVRJZ05qVXVOVGt4TERFNUxqRXlOaUJETmpVdU9UZzFMREU1TGpnek9DQTJOaTQwTmprc01qQXVORGszSURZM0xqQXpMREl4TGpBNE5TQk1OamN1TXpBMUxESXhMak0xTVNCRE5qa3VNVFV4TERJekxqRXpOeUEzTVM0Mk5Ea3NNalF1TVRJZ056UXVNek0yTERJMExqRXlJRU0zTmk0ek1UTXNNalF1TVRJZ056Z3VNamtzTWpNdU5UZ3lJRGd3TGpBMU15d3lNaTQxTmpNZ1F6Z3dMakEyTkN3eU1pNDFOVGNnT0RBdU1EYzJMREl5TGpVMU15QTRNQzR3T0Rnc01qSXVOVFVnVERnM0xqTTNNaXd4T0M0ek5EUWdRemc0TGpBek9Dd3hOeTQ1TlRrZ09EZ3VOemcwTERFM0xqYzFOaUE0T1M0MU1qa3NNVGN1TnpVMklFTTVNQzQ1TlRZc01UY3VOelUySURreUxqSXdNU3d4T0M0ME56SWdPVEl1T0RVNExERTVMalkzSUV3NU5pNHhNRGNzTWpVdU5UazVJRU01Tmk0eE16Z3NNalV1TmpVMElEazJMakV4T0N3eU5TNDNNalFnT1RZdU1EWXpMREkxTGpjMU5pQk1NVEl1TlRRMUxEY3pMams0TlNCRE1USXVOVEkyTERjekxqazVOaUF4TWk0MU1EWXNOelF1TURBeElERXlMalE0Tml3M05DNHdNREVnVERFeUxqUTROaXczTkM0d01ERWdXaUJOTmpJdU1ERTJMREUyTGprNU55QkROakV1TXpFeUxERTJMams1TnlBMk1DNDJNRFlzTVRjdU1Ua2dOVGt1T1RjMUxERTNMalUxTkNCTU15NDVOalVzTkRrdU9EazVJRU15TGpBNE15dzFNQzQ1T0RVZ01TNHpOREVzTlRNdU16QTRJREl1TXpFc05UVXVNRGM0SUV3eE1pNDFNekVzTnpNdU56SXpJRXc1TlM0NE5EZ3NNalV1TmpFeElFdzVNaTQyTlRNc01Ua3VOemd5SUVNNU1pNHdNemdzTVRndU5qWWdPVEF1T0Rjc01UY3VPVGtnT0RrdU5USTVMREUzTGprNUlFTTRPQzQ0TWpVc01UY3VPVGtnT0RndU1URTVMREU0TGpFNE1pQTROeTQwT0Rrc01UZ3VOVFEzSUV3NE1DNHhOeklzTWpJdU56Y3lJRU00TUM0eE5qRXNNakl1TnpjNElEZ3dMakUwT1N3eU1pNDNPRElnT0RBdU1UTTNMREl5TGpjNE5TQkROemd1TXpRMkxESXpMamd4TVNBM05pNHpOREVzTWpRdU16VTBJRGMwTGpNek5pd3lOQzR6TlRRZ1F6Y3hMalU0T0N3eU5DNHpOVFFnTmprdU1ETXpMREl6TGpNME55QTJOeTR4TkRJc01qRXVOVEU1SUV3Mk5pNDROalFzTWpFdU1qUTVJRU0yTmk0eU56Y3NNakF1TmpNMElEWTFMamMzTkN3eE9TNDVORGNnTmpVdU16WTNMREU1TGpJd015QkROalV1TXpZc01Ua3VNVGt5SURZMUxqTTFOaXd4T1M0eE56a2dOalV1TXpVMExERTVMakUyTmlCTU5qVXVNVFl6TERFNExqZ3hPU0JETmpVdU1UVTBMREU0TGpneE1TQTJOUzR4TkRZc01UZ3VPREF4SURZMUxqRTBMREU0TGpjNUlFTTJOQzQxTWpVc01UY3VOalkzSURZekxqTTFOeXd4Tmk0NU9UY2dOakl1TURFMkxERTJMams1TnlCTU5qSXVNREUyTERFMkxqazVOeUJhSWlCcFpEMGlSbWxzYkMwM0lpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUUXlMalF6TkN3ME9DNDRNRGdnVERReUxqUXpOQ3cwT0M0NE1EZ2dRek01TGpreU5DdzBPQzQ0TURjZ016Y3VOek0zTERRM0xqVTFJRE0yTGpVNE1pdzBOUzQwTkRNZ1F6TTBMamMzTVN3ME1pNHhNemtnTXpZdU1UUTBMRE0zTGpnd09TQXpPUzQyTkRFc016VXVOemc1SUV3MU1TNDVNeklzTWpndU5qa3hJRU0xTXk0eE1ETXNNamd1TURFMUlEVTBMalF4TXl3eU55NDJOVGdnTlRVdU56SXhMREkzTGpZMU9DQkROVGd1TWpNeExESTNMalkxT0NBMk1DNDBNVGdzTWpndU9URTJJRFl4TGpVM015d3pNUzR3TWpNZ1F6WXpMak00TkN3ek5DNHpNamNnTmpJdU1ERXlMRE00TGpZMU55QTFPQzQxTVRRc05EQXVOamMzSUV3ME5pNHlNak1zTkRjdU56YzFJRU0wTlM0d05UTXNORGd1TkRVZ05ETXVOelF5TERRNExqZ3dPQ0EwTWk0ME16UXNORGd1T0RBNElFdzBNaTQwTXpRc05EZ3VPREE0SUZvZ1RUVTFMamN5TVN3eU9DNHhNalVnUXpVMExqUTVOU3d5T0M0eE1qVWdOVE11TWpZMUxESTRMalEyTVNBMU1pNHhOallzTWprdU1EazJJRXd6T1M0NE56VXNNell1TVRrMElFTXpOaTQxT1RZc016Z3VNRGczSURNMUxqTXdNaXcwTWk0eE16WWdNell1T1RreUxEUTFMakl4T0NCRE16Z3VNRFl6TERRM0xqRTNNeUEwTUM0d09UZ3NORGd1TXpRZ05ESXVORE0wTERRNExqTTBJRU0wTXk0Mk5qRXNORGd1TXpRZ05EUXVPRGtzTkRndU1EQTFJRFExTGprNUxEUTNMak0zSUV3MU9DNHlPREVzTkRBdU1qY3lJRU0yTVM0MU5pd3pPQzR6TnprZ05qSXVPRFV6TERNMExqTXpJRFl4TGpFMk5Dd3pNUzR5TkRnZ1F6WXdMakE1TWl3eU9TNHlPVE1nTlRndU1EVTRMREk0TGpFeU5TQTFOUzQzTWpFc01qZ3VNVEkxSUV3MU5TNDNNakVzTWpndU1USTFJRm9pSUdsa1BTSkdhV3hzTFRnaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UUTVMalU0T0N3eUxqUXdOeUJETVRRNUxqVTRPQ3d5TGpRd055QXhOVFV1TnpZNExEVXVPVGMxSURFMU5pNHpNalVzTmk0eU9UY2dUREUxTmk0ek1qVXNOeTR4T0RRZ1F6RTFOaTR6TWpVc055NHpOaUF4TlRZdU16TTRMRGN1TlRRMElERTFOaTR6TmpJc055NDNNek1nUXpFMU5pNHpOek1zTnk0NE1UUWdNVFUyTGpNNE1pdzNMamc1TkNBeE5UWXVNemtzTnk0NU56VWdRekUxTmk0MU15dzVMak01SURFMU55NHpOak1zTVRBdU9UY3pJREUxT0M0ME9UVXNNVEV1T1RjMElFd3hOalV1T0RreExERTRMalV4T1NCRE1UWTJMakEyT0N3eE9DNDJOelVnTVRZMkxqSTBPU3d4T0M0NE1UUWdNVFkyTGpRek1pd3hPQzQ1TXpRZ1F6RTJPQzR3TVRFc01Ua3VPVGMwSURFMk9TNHpPRElzTVRrdU5DQXhOamt1TkRrMExERTNMalkxTWlCRE1UWTVMalUwTXl3eE5pNDROamdnTVRZNUxqVTFNU3d4Tmk0d05UY2dNVFk1TGpVeE55d3hOUzR5TWpNZ1RERTJPUzQxTVRRc01UVXVNRFl6SUV3eE5qa3VOVEUwTERFekxqa3hNaUJETVRjd0xqYzRMREUwTGpZME1pQXhPVFV1TlRBeExESTRMamt4TlNBeE9UVXVOVEF4TERJNExqa3hOU0JNTVRrMUxqVXdNU3c0TWk0NU1UVWdRekU1TlM0MU1ERXNPRFF1TURBMUlERTVOQzQzTXpFc09EUXVORFExSURFNU15NDNPREVzT0RNdU9EazNJRXd4TlRFdU16QTRMRFU1TGpNM05DQkRNVFV3TGpNMU9DdzFPQzQ0TWpZZ01UUTVMalU0T0N3MU55NDBPVGNnTVRRNUxqVTRPQ3cxTmk0ME1EZ2dUREUwT1M0MU9EZ3NNakl1TXpjMUlpQnBaRDBpUm1sc2JDMDVJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEU1TkM0MU5UTXNPRFF1TWpVZ1F6RTVOQzR5T1RZc09EUXVNalVnTVRrMExqQXhNeXc0TkM0eE5qVWdNVGt6TGpjeU1pdzRNeTQ1T1RjZ1RERTFNUzR5TlN3MU9TNDBOellnUXpFMU1DNHlOamtzTlRndU9UQTVJREUwT1M0ME56RXNOVGN1TlRNeklERTBPUzQwTnpFc05UWXVOREE0SUV3eE5Ea3VORGN4TERJeUxqTTNOU0JNTVRRNUxqY3dOU3d5TWk0ek56VWdUREUwT1M0M01EVXNOVFl1TkRBNElFTXhORGt1TnpBMUxEVTNMalExT1NBeE5UQXVORFVzTlRndU56UTBJREUxTVM0ek5qWXNOVGt1TWpjMElFd3hPVE11T0RNNUxEZ3pMamM1TlNCRE1UazBMakkyTXl3NE5DNHdOQ0F4T1RRdU5qVTFMRGcwTGpBNE15QXhPVFF1T1RReUxEZ3pMamt4TnlCRE1UazFMakl5Tnl3NE15NDNOVE1nTVRrMUxqTTROQ3c0TXk0ek9UY2dNVGsxTGpNNE5DdzRNaTQ1TVRVZ1RERTVOUzR6T0RRc01qZ3VPVGd5SUVNeE9UUXVNVEF5TERJNExqSTBNaUF4TnpJdU1UQTBMREUxTGpVME1pQXhOamt1TmpNeExERTBMakV4TkNCTU1UWTVMall6TkN3eE5TNHlNaUJETVRZNUxqWTJPQ3d4Tmk0d05USWdNVFk1TGpZMkxERTJMamczTkNBeE5qa3VOakVzTVRjdU5qVTVJRU14TmprdU5UVTJMREU0TGpVd015QXhOamt1TWpFMExERTVMakV5TXlBeE5qZ3VOalEzTERFNUxqUXdOU0JETVRZNExqQXlPQ3d4T1M0M01UUWdNVFkzTGpFNU55d3hPUzQxTnpnZ01UWTJMak0yTnl3eE9TNHdNeklnUXpFMk5pNHhPREVzTVRndU9UQTVJREUyTlM0NU9UVXNNVGd1TnpZMklERTJOUzQ0TVRRc01UZ3VOakEySUV3eE5UZ3VOREUzTERFeUxqQTJNaUJETVRVM0xqSTFPU3d4TVM0d016WWdNVFUyTGpReE9DdzVMalF6TnlBeE5UWXVNamMwTERjdU9UZzJJRU14TlRZdU1qWTJMRGN1T1RBM0lERTFOaTR5TlRjc055NDRNamNnTVRVMkxqSTBOeXczTGpjME9DQkRNVFUyTGpJeU1TdzNMalUxTlNBeE5UWXVNakE1TERjdU16WTFJREUxTmk0eU1Ea3NOeTR4T0RRZ1RERTFOaTR5TURrc05pNHpOalFnUXpFMU5TNHpOelVzTlM0NE9ETWdNVFE1TGpVeU9Td3lMalV3T0NBeE5Ea3VOVEk1TERJdU5UQTRJRXd4TkRrdU5qUTJMREl1TXpBMklFTXhORGt1TmpRMkxESXVNekEySURFMU5TNDRNamNzTlM0NE56UWdNVFUyTGpNNE5DdzJMakU1TmlCTU1UVTJMalEwTWl3MkxqSXpJRXd4TlRZdU5EUXlMRGN1TVRnMElFTXhOVFl1TkRReUxEY3VNelUxSURFMU5pNDBOVFFzTnk0MU16VWdNVFUyTGpRM09DdzNMamN4TnlCRE1UVTJMalE0T1N3M0xqZ2dNVFUyTGpRNU9TdzNMamc0TWlBeE5UWXVOVEEzTERjdU9UWXpJRU14TlRZdU5qUTFMRGt1TXpVNElERTFOeTQwTlRVc01UQXVPRGs0SURFMU9DNDFOeklzTVRFdU9EZzJJRXd4TmpVdU9UWTVMREU0TGpRek1TQkRNVFkyTGpFME1pd3hPQzQxT0RRZ01UWTJMak14T1N3eE9DNDNNaUF4TmpZdU5EazJMREU0TGpnek55QkRNVFkzTGpJMU5Dd3hPUzR6TXpZZ01UWTRMREU1TGpRMk55QXhOamd1TlRRekxERTVMakU1TmlCRE1UWTVMakF6TXl3eE9DNDVOVE1nTVRZNUxqTXlPU3d4T0M0ME1ERWdNVFk1TGpNM055d3hOeTQyTkRVZ1F6RTJPUzQwTWpjc01UWXVPRFkzSURFMk9TNDBNelFzTVRZdU1EVTBJREUyT1M0ME1ERXNNVFV1TWpJNElFd3hOamt1TXprM0xERTFMakEyTlNCTU1UWTVMak01Tnl3eE15NDNNU0JNTVRZNUxqVTNNaXd4TXk0NE1TQkRNVGN3TGpnek9Td3hOQzQxTkRFZ01UazFMalUxT1N3eU9DNDRNVFFnTVRrMUxqVTFPU3d5T0M0NE1UUWdUREU1TlM0Mk1UZ3NNamd1T0RRM0lFd3hPVFV1TmpFNExEZ3lMamt4TlNCRE1UazFMall4T0N3NE15NDBPRFFnTVRrMUxqUXlMRGd6TGpreE1TQXhPVFV1TURVNUxEZzBMakV4T1NCRE1UazBMamt3T0N3NE5DNHlNRFlnTVRrMExqY3pOeXc0TkM0eU5TQXhPVFF1TlRVekxEZzBMakkxSWlCcFpEMGlSbWxzYkMweE1DSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhORFV1TmpnMUxEVTJMakUyTVNCTU1UWTVMamdzTnpBdU1EZ3pJRXd4TkRNdU9ESXlMRGcxTGpBNE1TQk1NVFF5TGpNMkxEZzBMamMzTkNCRE1UTTFMamd5Tml3NE1pNDJNRFFnTVRJNExqY3pNaXc0TVM0d05EWWdNVEl4TGpNME1TdzRNQzR4TlRnZ1F6RXhOaTQ1TnpZc056a3VOak0wSURFeE1pNDJOemdzT0RFdU1qVTBJREV4TVM0M05ETXNPRE11TnpjNElFTXhNVEV1TlRBMkxEZzBMalF4TkNBeE1URXVOVEF6TERnMUxqQTNNU0F4TVRFdU56TXlMRGcxTGpjd05pQkRNVEV6TGpJM0xEZzVMamszTXlBeE1UVXVPVFk0TERrMExqQTJPU0F4TVRrdU56STNMRGszTGpnME1TQk1NVEl3TGpJMU9TdzVPQzQyT0RZZ1F6RXlNQzR5Tml3NU9DNDJPRFVnT1RRdU1qZ3lMREV4TXk0Mk9ETWdPVFF1TWpneUxERXhNeTQyT0RNZ1REY3dMakUyTnl3NU9TNDNOakVnVERFME5TNDJPRFVzTlRZdU1UWXhJaUJwWkQwaVJtbHNiQzB4TVNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWswNU5DNHlPRElzTVRFekxqZ3hPQ0JNT1RRdU1qSXpMREV4TXk0M09EVWdURFk1TGprek15dzVPUzQzTmpFZ1REY3dMakV3T0N3NU9TNDJOaUJNTVRRMUxqWTROU3cxTmk0d01qWWdUREUwTlM0M05ETXNOVFl1TURVNUlFd3hOekF1TURNekxEY3dMakE0TXlCTU1UUXpMamcwTWl3NE5TNHlNRFVnVERFME15NDNPVGNzT0RVdU1UazFJRU14TkRNdU56Y3lMRGcxTGpFNUlERTBNaTR6TXpZc09EUXVPRGc0SURFME1pNHpNellzT0RRdU9EZzRJRU14TXpVdU56ZzNMRGd5TGpjeE5DQXhNamd1TnpJekxEZ3hMakUyTXlBeE1qRXVNekkzTERnd0xqSTNOQ0JETVRJd0xqYzRPQ3c0TUM0eU1Ea2dNVEl3TGpJek5pdzRNQzR4TnpjZ01URTVMalk0T1N3NE1DNHhOemNnUXpFeE5TNDVNekVzT0RBdU1UYzNJREV4TWk0Mk16VXNPREV1TnpBNElERXhNUzQ0TlRJc09ETXVPREU1SUVNeE1URXVOakkwTERnMExqUXpNaUF4TVRFdU5qSXhMRGcxTGpBMU15QXhNVEV1T0RReUxEZzFMalkyTnlCRE1URXpMak0zTnl3NE9TNDVNalVnTVRFMkxqQTFPQ3c1TXk0NU9UTWdNVEU1TGpneExEazNMamMxT0NCTU1URTVMamd5Tml3NU55NDNOemtnVERFeU1DNHpOVElzT1RndU5qRTBJRU14TWpBdU16VTBMRGs0TGpZeE55QXhNakF1TXpVMkxEazRMall5SURFeU1DNHpOVGdzT1RndU5qSTBJRXd4TWpBdU5ESXlMRGs0TGpjeU5pQk1NVEl3TGpNeE55dzVPQzQzT0RjZ1F6RXlNQzR5TmpRc09UZ3VPREU0SURrMExqVTVPU3d4TVRNdU5qTTFJRGswTGpNMExERXhNeTQzT0RVZ1REazBMakk0TWl3eE1UTXVPREU0SUV3NU5DNHlPRElzTVRFekxqZ3hPQ0JhSUUwM01DNDBNREVzT1RrdU56WXhJRXc1TkM0eU9ESXNNVEV6TGpVME9TQk1NVEU1TGpBNE5DdzVPUzR5TWprZ1F6RXhPUzQyTXl3NU9DNDVNVFFnTVRFNUxqa3pMRGs0TGpjMElERXlNQzR4TURFc09UZ3VOalUwSUV3eE1Ua3VOak0xTERrM0xqa3hOQ0JETVRFMUxqZzJOQ3c1TkM0eE1qY2dNVEV6TGpFMk9DdzVNQzR3TXpNZ01URXhMall5TWl3NE5TNDNORFlnUXpFeE1TNHpPRElzT0RVdU1EYzVJREV4TVM0ek9EWXNPRFF1TkRBMElERXhNUzQyTXpNc09ETXVOek00SUVNeE1USXVORFE0TERneExqVXpPU0F4TVRVdU9ETTJMRGM1TGprME15QXhNVGt1TmpnNUxEYzVMamswTXlCRE1USXdMakkwTml3M09TNDVORE1nTVRJd0xqZ3dOaXczT1M0NU56WWdNVEl4TGpNMU5TdzRNQzR3TkRJZ1F6RXlPQzQzTmpjc09EQXVPVE16SURFek5TNDRORFlzT0RJdU5EZzNJREUwTWk0ek9UWXNPRFF1TmpZeklFTXhORE11TWpNeUxEZzBMamd6T0NBeE5ETXVOakV4TERnMExqa3hOeUF4TkRNdU56ZzJMRGcwTGprMk55Qk1NVFk1TGpVMk5pdzNNQzR3T0RNZ1RERTBOUzQyT0RVc05UWXVNamsxSUV3M01DNDBNREVzT1RrdU56WXhJRXczTUM0ME1ERXNPVGt1TnpZeElGb2lJR2xrUFNKR2FXeHNMVEV5SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFMk55NHlNeXd4T0M0NU56a2dUREUyTnk0eU15dzJPUzQ0TlNCTU1UTTVMamt3T1N3NE5TNDJNak1nVERFek15NDBORGdzTnpFdU5EVTJJRU14TXpJdU5UTTRMRFk1TGpRMklERXpNQzR3TWl3Mk9TNDNNVGdnTVRJM0xqZ3lOQ3czTWk0d015QkRNVEkyTGpjMk9TdzNNeTR4TkNBeE1qVXVPVE14TERjMExqVTROU0F4TWpVdU5EazBMRGMyTGpBME9DQk1NVEU1TGpBek5DdzVOeTQyTnpZZ1REa3hMamN4TWl3eE1UTXVORFVnVERreExqY3hNaXcyTWk0MU56a2dUREUyTnk0eU15d3hPQzQ1TnpraUlHbGtQU0pHYVd4c0xURXpJaUJtYVd4c1BTSWpSa1pHUmtaR0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVGt4TGpjeE1pd3hNVE11TlRZM0lFTTVNUzQyT1RJc01URXpMalUyTnlBNU1TNDJOeklzTVRFekxqVTJNU0E1TVM0Mk5UTXNNVEV6TGpVMU1TQkRPVEV1TmpFNExERXhNeTQxTXlBNU1TNDFPVFVzTVRFekxqUTVNaUE1TVM0MU9UVXNNVEV6TGpRMUlFdzVNUzQxT1RVc05qSXVOVGM1SUVNNU1TNDFPVFVzTmpJdU5UTTNJRGt4TGpZeE9DdzJNaTQwT1RrZ09URXVOalV6TERZeUxqUTNPQ0JNTVRZM0xqRTNNaXd4T0M0NE56Z2dRekUyTnk0eU1EZ3NNVGd1T0RVM0lERTJOeTR5TlRJc01UZ3VPRFUzSURFMk55NHlPRGdzTVRndU9EYzRJRU14TmpjdU16STBMREU0TGpnNU9TQXhOamN1TXpRM0xERTRMamt6TnlBeE5qY3VNelEzTERFNExqazNPU0JNTVRZM0xqTTBOeXcyT1M0NE5TQkRNVFkzTGpNME55dzJPUzQ0T1RFZ01UWTNMak15TkN3Mk9TNDVNeUF4TmpjdU1qZzRMRFk1TGprMUlFd3hNemt1T1RZM0xEZzFMamN5TlNCRE1UTTVMamt6T1N3NE5TNDNOREVnTVRNNUxqa3dOU3c0TlM0M05EVWdNVE01TGpnM015dzROUzQzTXpVZ1F6RXpPUzQ0TkRJc09EVXVOekkxSURFek9TNDRNVFlzT0RVdU56QXlJREV6T1M0NE1ESXNPRFV1TmpjeUlFd3hNek11TXpReUxEY3hMalV3TkNCRE1UTXlMamsyTnl3M01DNDJPRElnTVRNeUxqSTRMRGN3TGpJeU9TQXhNekV1TkRBNExEY3dMakl5T1NCRE1UTXdMak14T1N3M01DNHlNamtnTVRJNUxqQTBOQ3czTUM0NU1UVWdNVEkzTGprd09DdzNNaTR4TVNCRE1USTJMamczTkN3M015NHlJREV5Tmk0d016UXNOelF1TmpRM0lERXlOUzQyTURZc056WXVNRGd5SUV3eE1Ua3VNVFEyTERrM0xqY3dPU0JETVRFNUxqRXpOeXc1Tnk0M016Z2dNVEU1TGpFeE9DdzVOeTQzTmpJZ01URTVMakE1TWl3NU55NDNOemNnVERreExqYzNMREV4TXk0MU5URWdRemt4TGpjMU1pd3hNVE11TlRZeElEa3hMamN6TWl3eE1UTXVOVFkzSURreExqY3hNaXd4TVRNdU5UWTNJRXc1TVM0M01USXNNVEV6TGpVMk55QmFJRTA1TVM0NE1qa3NOakl1TmpRM0lFdzVNUzQ0TWprc01URXpMakkwT0NCTU1URTRMamt6TlN3NU55NDFPVGdnVERFeU5TNHpPRElzTnpZdU1ERTFJRU14TWpVdU9ESTNMRGMwTGpVeU5TQXhNall1TmpZMExEY3pMakE0TVNBeE1qY3VOek01TERjeExqazFJRU14TWpndU9URTVMRGN3TGpjd09DQXhNekF1TWpVMkxEWTVMams1TmlBeE16RXVOREE0TERZNUxqazVOaUJETVRNeUxqTTNOeXcyT1M0NU9UWWdNVE16TGpFek9TdzNNQzQwT1RjZ01UTXpMalUxTkN3M01TNDBNRGNnVERFek9TNDVOakVzT0RVdU5EVTRJRXd4TmpjdU1URXpMRFk1TGpjNE1pQk1NVFkzTGpFeE15d3hPUzR4T0RFZ1REa3hMamd5T1N3Mk1pNDJORGNnVERreExqZ3lPU3cyTWk0Mk5EY2dXaUlnYVdROUlrWnBiR3d0TVRRaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UWTRMalUwTXl3eE9TNHlNVE1nVERFMk9DNDFORE1zTnpBdU1EZ3pJRXd4TkRFdU1qSXhMRGcxTGpnMU55Qk1NVE0wTGpjMk1TdzNNUzQyT0RrZ1F6RXpNeTQ0TlRFc05qa3VOamswSURFek1TNHpNek1zTmprdU9UVXhJREV5T1M0eE16Y3NOekl1TWpZeklFTXhNamd1TURneUxEY3pMak0zTkNBeE1qY3VNalEwTERjMExqZ3hPU0F4TWpZdU9EQTNMRGMyTGpJNE1pQk1NVEl3TGpNME5pdzVOeTQ1TURrZ1REa3pMakF5TlN3eE1UTXVOamd6SUV3NU15NHdNalVzTmpJdU9ERXpJRXd4TmpndU5UUXpMREU1TGpJeE15SWdhV1E5SWtacGJHd3RNVFVpSUdacGJHdzlJaU5HUmtaR1JrWWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOT1RNdU1ESTFMREV4TXk0NElFTTVNeTR3TURVc01URXpMamdnT1RJdU9UZzBMREV4TXk0M09UVWdPVEl1T1RZMkxERXhNeTQzT0RVZ1F6a3lMamt6TVN3eE1UTXVOelkwSURreUxqa3dPQ3d4TVRNdU56STFJRGt5TGprd09Dd3hNVE11TmpnMElFdzVNaTQ1TURnc05qSXVPREV6SUVNNU1pNDVNRGdzTmpJdU56Y3hJRGt5TGprek1TdzJNaTQzTXpNZ09USXVPVFkyTERZeUxqY3hNaUJNTVRZNExqUTROQ3d4T1M0eE1USWdRekUyT0M0MU1pd3hPUzR3T1NBeE5qZ3VOVFkxTERFNUxqQTVJREUyT0M0Mk1ERXNNVGt1TVRFeUlFTXhOamd1TmpNM0xERTVMakV6TWlBeE5qZ3VOallzTVRrdU1UY3hJREUyT0M0Mk5pd3hPUzR5TVRJZ1RERTJPQzQyTml3M01DNHdPRE1nUXpFMk9DNDJOaXczTUM0eE1qVWdNVFk0TGpZek55dzNNQzR4TmpRZ01UWTRMall3TVN3M01DNHhPRFFnVERFME1TNHlPQ3c0TlM0NU5UZ2dRekUwTVM0eU5URXNPRFV1T1RjMUlERTBNUzR5TVRjc09EVXVPVGM1SURFME1TNHhPRFlzT0RVdU9UWTRJRU14TkRFdU1UVTBMRGcxTGprMU9DQXhOREV1TVRJNUxEZzFMamt6TmlBeE5ERXVNVEUxTERnMUxqa3dOaUJNTVRNMExqWTFOU3czTVM0M016Z2dRekV6TkM0eU9DdzNNQzQ1TVRVZ01UTXpMalU1TXl3M01DNDBOak1nTVRNeUxqY3lMRGN3TGpRMk15QkRNVE14TGpZek1pdzNNQzQwTmpNZ01UTXdMak0xTnl3M01TNHhORGdnTVRJNUxqSXlNU3czTWk0ek5EUWdRekV5T0M0eE9EWXNOek11TkRNeklERXlOeTR6TkRjc056UXVPRGd4SURFeU5pNDVNVGtzTnpZdU16RTFJRXd4TWpBdU5EVTRMRGszTGprME15QkRNVEl3TGpRMUxEazNMamszTWlBeE1qQXVORE14TERrM0xqazVOaUF4TWpBdU5EQTFMRGs0TGpBeElFdzVNeTR3T0RNc01URXpMamM0TlNCRE9UTXVNRFkxTERFeE15NDNPVFVnT1RNdU1EUTFMREV4TXk0NElEa3pMakF5TlN3eE1UTXVPQ0JNT1RNdU1ESTFMREV4TXk0NElGb2dUVGt6TGpFME1pdzJNaTQ0T0RFZ1REa3pMakUwTWl3eE1UTXVORGd4SUV3eE1qQXVNalE0TERrM0xqZ3pNaUJNTVRJMkxqWTVOU3czTmk0eU5EZ2dRekV5Tnk0eE5DdzNOQzQzTlRnZ01USTNMamszTnl3M015NHpNVFVnTVRJNUxqQTFNaXczTWk0eE9ETWdRekV6TUM0eU16RXNOekF1T1RReUlERXpNUzQxTmpnc056QXVNakk1SURFek1pNDNNaXczTUM0eU1qa2dRekV6TXk0Mk9Ea3NOekF1TWpJNUlERXpOQzQwTlRJc056QXVOek14SURFek5DNDROamNzTnpFdU5qUXhJRXd4TkRFdU1qYzBMRGcxTGpZNU1pQk1NVFk0TGpReU5pdzNNQzR3TVRZZ1RERTJPQzQwTWpZc01Ua3VOREUxSUV3NU15NHhORElzTmpJdU9EZ3hJRXc1TXk0eE5ESXNOakl1T0RneElGb2lJR2xrUFNKR2FXeHNMVEUySWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFMk9TNDRMRGN3TGpBNE15Qk1NVFF5TGpRM09DdzROUzQ0TlRjZ1RERXpOaTR3TVRnc056RXVOamc1SUVNeE16VXVNVEE0TERZNUxqWTVOQ0F4TXpJdU5Ua3NOamt1T1RVeElERXpNQzR6T1RNc056SXVNall6SUVNeE1qa3VNek01TERjekxqTTNOQ0F4TWpndU5TdzNOQzQ0TVRrZ01USTRMakEyTkN3M05pNHlPRElnVERFeU1TNDJNRE1zT1RjdU9UQTVJRXc1TkM0eU9ESXNNVEV6TGpZNE15Qk1PVFF1TWpneUxEWXlMamd4TXlCTU1UWTVMamdzTVRrdU1qRXpJRXd4TmprdU9DdzNNQzR3T0RNZ1dpSWdhV1E5SWtacGJHd3RNVGNpSUdacGJHdzlJaU5HUVVaQlJrRWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOT1RRdU1qZ3lMREV4TXk0NU1UY2dRemswTGpJME1Td3hNVE11T1RFM0lEazBMakl3TVN3eE1UTXVPVEEzSURrMExqRTJOU3d4TVRNdU9EZzJJRU01TkM0d09UTXNNVEV6TGpnME5TQTVOQzR3TkRnc01URXpMamMyTnlBNU5DNHdORGdzTVRFekxqWTROQ0JNT1RRdU1EUTRMRFl5TGpneE15QkRPVFF1TURRNExEWXlMamN6SURrMExqQTVNeXcyTWk0Mk5USWdPVFF1TVRZMUxEWXlMall4TVNCTU1UWTVMalk0TXl3eE9TNHdNU0JETVRZNUxqYzFOU3d4T0M0NU5qa2dNVFk1TGpnME5Dd3hPQzQ1TmprZ01UWTVMamt4Tnl3eE9TNHdNU0JETVRZNUxqazRPU3d4T1M0d05USWdNVGN3TGpBek15d3hPUzR4TWprZ01UY3dMakF6TXl3eE9TNHlNVElnVERFM01DNHdNek1zTnpBdU1EZ3pJRU14TnpBdU1ETXpMRGN3TGpFMk5pQXhOamt1T1RnNUxEY3dMakkwTkNBeE5qa3VPVEUzTERjd0xqSTROU0JNTVRReUxqVTVOU3c0Tmk0d05pQkRNVFF5TGpVek9DdzROaTR3T1RJZ01UUXlMalEyT1N3NE5pNHhJREUwTWk0ME1EY3NPRFl1TURnZ1F6RTBNaTR6TkRRc09EWXVNRFlnTVRReUxqSTVNeXc0Tmk0d01UUWdNVFF5TGpJMk5pdzROUzQ1TlRRZ1RERXpOUzQ0TURVc056RXVOemcySUVNeE16VXVORFExTERjd0xqazVOeUF4TXpRdU9ERXpMRGN3TGpVNElERXpNeTQ1Tnpjc056QXVOVGdnUXpFek1pNDVNakVzTnpBdU5UZ2dNVE14TGpZM05pdzNNUzR5TlRJZ01UTXdMalUyTWl3M01pNDBNalFnUXpFeU9TNDFOQ3czTXk0MU1ERWdNVEk0TGpjeE1TdzNOQzQ1TXpFZ01USTRMakk0Tnl3M05pNHpORGdnVERFeU1TNDRNamNzT1RjdU9UYzJJRU14TWpFdU9ERXNPVGd1TURNMElERXlNUzQzTnpFc09UZ3VNRGd5SURFeU1TNDNNaXc1T0M0eE1USWdURGswTGpNNU9Dd3hNVE11T0RnMklFTTVOQzR6TmpJc01URXpMamt3TnlBNU5DNHpNaklzTVRFekxqa3hOeUE1TkM0eU9ESXNNVEV6TGpreE55Qk1PVFF1TWpneUxERXhNeTQ1TVRjZ1dpQk5PVFF1TlRFMUxEWXlMamswT0NCTU9UUXVOVEUxTERFeE15NHlOemtnVERFeU1TNDBNRFlzT1RjdU56VTBJRXd4TWpjdU9EUXNOell1TWpFMUlFTXhNamd1TWprc056UXVOekE0SURFeU9TNHhNemNzTnpNdU1qUTNJREV6TUM0eU1qUXNOekl1TVRBeklFTXhNekV1TkRJMUxEY3dMamd6T0NBeE16SXVOemt6TERjd0xqRXhNaUF4TXpNdU9UYzNMRGN3TGpFeE1pQkRNVE0wTGprNU5TdzNNQzR4TVRJZ01UTTFMamM1TlN3M01DNDJNemdnTVRNMkxqSXpMRGN4TGpVNU1pQk1NVFF5TGpVNE5DdzROUzQxTWpZZ1RERTJPUzQxTmpZc05qa3VPVFE0SUV3eE5qa3VOVFkyTERFNUxqWXhOeUJNT1RRdU5URTFMRFl5TGprME9DQk1PVFF1TlRFMUxEWXlMamswT0NCYUlpQnBaRDBpUm1sc2JDMHhPQ0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TURrdU9EazBMRGt5TGprME15Qk1NVEE1TGpnNU5DdzVNaTQ1TkRNZ1F6RXdPQzR4TWl3NU1pNDVORE1nTVRBMkxqWTFNeXc1TWk0eU1UZ2dNVEExTGpZMUxEa3dMamd5TXlCRE1UQTFMalU0TXl3NU1DNDNNekVnTVRBMUxqVTVNeXc1TUM0Mk1TQXhNRFV1TmpjekxEa3dMalV5T1NCRE1UQTFMamMxTXl3NU1DNDBORGdnTVRBMUxqZzRMRGt3TGpRMElERXdOUzQ1TnpRc09UQXVOVEEySUVNeE1EWXVOelUwTERreExqQTFNeUF4TURjdU5qYzVMRGt4TGpNek15QXhNRGd1TnpJMExEa3hMak16TXlCRE1URXdMakEwTnl3NU1TNHpNek1nTVRFeExqUTNPQ3c1TUM0NE9UUWdNVEV5TGprNExEa3dMakF5TnlCRE1URTRMakk1TVN3NE5pNDVOaUF4TWpJdU5qRXhMRGM1TGpVd09TQXhNakl1TmpFeExEY3pMalF4TmlCRE1USXlMall4TVN3M01TNDBPRGtnTVRJeUxqRTJPU3cyT1M0NE5UWWdNVEl4TGpNek15dzJPQzQyT1RJZ1F6RXlNUzR5TmpZc05qZ3VOaUF4TWpFdU1qYzJMRFk0TGpRM015QXhNakV1TXpVMkxEWTRMak01TWlCRE1USXhMalF6Tml3Mk9DNHpNVEVnTVRJeExqVTJNeXcyT0M0eU9Ua2dNVEl4TGpZMU5pdzJPQzR6TmpVZ1F6RXlNeTR6TWpjc05qa3VOVE0zSURFeU5DNHlORGNzTnpFdU56UTJJREV5TkM0eU5EY3NOelF1TlRnMElFTXhNalF1TWpRM0xEZ3dMamd5TmlBeE1Ua3VPREl4TERnNExqUTBOeUF4TVRRdU16Z3lMRGt4TGpVNE55QkRNVEV5TGpnd09DdzVNaTQwT1RVZ01URXhMakk1T0N3NU1pNDVORE1nTVRBNUxqZzVOQ3c1TWk0NU5ETWdUREV3T1M0NE9UUXNPVEl1T1RReklGb2dUVEV3Tmk0NU1qVXNPVEV1TkRBeElFTXhNRGN1TnpNNExEa3lMakExTWlBeE1EZ3VOelExTERreUxqSTNPQ0F4TURrdU9Ea3pMRGt5TGpJM09DQk1NVEE1TGpnNU5DdzVNaTR5TnpnZ1F6RXhNUzR5TVRVc09USXVNamM0SURFeE1pNDJORGNzT1RFdU9UVXhJREV4TkM0eE5EZ3NPVEV1TURnMElFTXhNVGt1TkRVNUxEZzRMakF4TnlBeE1qTXVOemdzT0RBdU5qSXhJREV5TXk0M09DdzNOQzQxTWpnZ1F6RXlNeTQzT0N3M01pNDFORGtnTVRJekxqTXhOeXczTUM0NU1qa2dNVEl5TGpRMU5DdzJPUzQzTmpjZ1F6RXlNaTQ0TmpVc056QXVPREF5SURFeU15NHdOemtzTnpJdU1EUXlJREV5TXk0d056a3NOek11TkRBeUlFTXhNak11TURjNUxEYzVMalkwTlNBeE1UZ3VOalV6TERnM0xqSTROU0F4TVRNdU1qRTBMRGt3TGpReU5TQkRNVEV4TGpZMExEa3hMak16TkNBeE1UQXVNVE1zT1RFdU56UXlJREV3T0M0M01qUXNPVEV1TnpReUlFTXhNRGd1TURnekxEa3hMamMwTWlBeE1EY3VORGd4TERreExqVTVNeUF4TURZdU9USTFMRGt4TGpRd01TQk1NVEEyTGpreU5TdzVNUzQwTURFZ1dpSWdhV1E5SWtacGJHd3RNVGtpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFekxqQTVOeXc1TUM0eU15QkRNVEU0TGpRNE1TdzROeTR4TWpJZ01USXlMamcwTlN3M09TNDFPVFFnTVRJeUxqZzBOU3czTXk0ME1UWWdRekV5TWk0NE5EVXNOekV1TXpZMUlERXlNaTR6TmpJc05qa3VOekkwSURFeU1TNDFNaklzTmpndU5UVTJJRU14TVRrdU56TTRMRFkzTGpNd05DQXhNVGN1TVRRNExEWTNMak0yTWlBeE1UUXVNalkxTERZNUxqQXlOaUJETVRBNExqZzRNU3czTWk0eE16UWdNVEEwTGpVeE55dzNPUzQyTmpJZ01UQTBMalV4Tnl3NE5TNDROQ0JETVRBMExqVXhOeXc0Tnk0NE9URWdNVEExTERnNUxqVXpNaUF4TURVdU9EUXNPVEF1TnlCRE1UQTNMall5TkN3NU1TNDVOVElnTVRFd0xqSXhOQ3c1TVM0NE9UUWdNVEV6TGpBNU55dzVNQzR5TXlJZ2FXUTlJa1pwYkd3dE1qQWlJR1pwYkd3OUlpTkdRVVpCUmtFaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEE0TGpjeU5DdzVNUzQyTVRRZ1RERXdPQzQzTWpRc09URXVOakUwSUVNeE1EY3VOVGd5TERreExqWXhOQ0F4TURZdU5UWTJMRGt4TGpRd01TQXhNRFV1TnpBMUxEa3dMamM1TnlCRE1UQTFMalk0TkN3NU1DNDNPRE1nTVRBMUxqWTJOU3c1TUM0NE1URWdNVEExTGpZMUxEa3dMamM1SUVNeE1EUXVOelUyTERnNUxqVTBOaUF4TURRdU1qZ3pMRGczTGpnME1pQXhNRFF1TWpnekxEZzFMamd4TnlCRE1UQTBMakk0TXl3M09TNDFOelVnTVRBNExqY3dPU3czTVM0NU5UTWdNVEUwTGpFME9DdzJPQzQ0TVRJZ1F6RXhOUzQzTWpJc05qY3VPVEEwSURFeE55NHlNeklzTmpjdU5EUTVJREV4T0M0Mk16Z3NOamN1TkRRNUlFTXhNVGt1Tnpnc05qY3VORFE1SURFeU1DNDNPVFlzTmpjdU56VTRJREV5TVM0Mk5UWXNOamd1TXpZeUlFTXhNakV1TmpjNExEWTRMak0zTnlBeE1qRXVOamszTERZNExqTTVOeUF4TWpFdU56RXlMRFk0TGpReE9DQkRNVEl5TGpZd05pdzJPUzQyTmpJZ01USXpMakEzT1N3M01TNHpPU0F4TWpNdU1EYzVMRGN6TGpReE5TQkRNVEl6TGpBM09TdzNPUzQyTlRnZ01URTRMalkxTXl3NE55NHhPVGdnTVRFekxqSXhOQ3c1TUM0ek16Z2dRekV4TVM0Mk5DdzVNUzR5TkRjZ01URXdMakV6TERreExqWXhOQ0F4TURndU56STBMRGt4TGpZeE5DQk1NVEE0TGpjeU5DdzVNUzQyTVRRZ1dpQk5NVEEyTGpBd05pdzVNQzQxTURVZ1F6RXdOaTQzT0N3NU1TNHdNemNnTVRBM0xqWTVOQ3c1TVM0eU9ERWdNVEE0TGpjeU5DdzVNUzR5T0RFZ1F6RXhNQzR3TkRjc09URXVNamd4SURFeE1TNDBOemdzT1RBdU9EWTRJREV4TWk0NU9DdzVNQzR3TURFZ1F6RXhPQzR5T1RFc09EWXVPVE0xSURFeU1pNDJNVEVzTnprdU5EazJJREV5TWk0Mk1URXNOek11TkRBeklFTXhNakl1TmpFeExEY3hMalE1TkNBeE1qSXVNVGMzTERZNUxqZzRJREV5TVM0ek5UWXNOamd1TnpFNElFTXhNakF1TlRneUxEWTRMakU0TlNBeE1Ua3VOalk0TERZM0xqa3hPU0F4TVRndU5qTTRMRFkzTGpreE9TQkRNVEUzTGpNeE5TdzJOeTQ1TVRrZ01URTFMamc0TXl3Mk9DNHpOaUF4TVRRdU16Z3lMRFk1TGpJeU55QkRNVEE1TGpBM01TdzNNaTR5T1RNZ01UQTBMamMxTVN3M09TNDNNek1nTVRBMExqYzFNU3c0TlM0NE1qWWdRekV3TkM0M05URXNPRGN1TnpNMUlERXdOUzR4T0RVc09Ea3VNelF6SURFd05pNHdNRFlzT1RBdU5UQTFJRXd4TURZdU1EQTJMRGt3TGpVd05TQmFJaUJwWkQwaVJtbHNiQzB5TVNJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE5Ea3VNekU0TERjdU1qWXlJRXd4TXprdU16TTBMREUyTGpFMElFd3hOVFV1TWpJM0xESTNMakUzTVNCTU1UWXdMamd4Tml3eU1TNHdOVGtnVERFME9TNHpNVGdzTnk0eU5qSWlJR2xrUFNKR2FXeHNMVEl5SWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFMk9TNDJOellzTVRNdU9EUWdUREUxT1M0NU1qZ3NNVGt1TkRZM0lFTXhOVFl1TWpnMkxESXhMalUzSURFMU1DNDBMREl4TGpVNElERTBOaTQzT0RFc01Ua3VORGt4SUVNeE5ETXVNVFl4TERFM0xqUXdNaUF4TkRNdU1UZ3NNVFF1TURBeklERTBOaTQ0TWpJc01URXVPU0JNTVRVMkxqTXhOeXcyTGpJNU1pQk1NVFE1TGpVNE9Dd3lMalF3TnlCTU5qY3VOelV5TERRNUxqUTNPQ0JNTVRFekxqWTNOU3czTlM0NU9USWdUREV4Tmk0M05UWXNOelF1TWpFeklFTXhNVGN1TXpnM0xEY3pMamcwT0NBeE1UY3VOakkxTERjekxqTXhOU0F4TVRjdU16YzBMRGN5TGpneU15QkRNVEUxTGpBeE55dzJPQzR4T1RFZ01URTBMamM0TVN3Mk15NHlOemNnTVRFMkxqWTVNU3cxT0M0MU5qRWdRekV5TWk0ek1qa3NORFF1TmpReElERTBNUzR5TERNekxqYzBOaUF4TmpVdU16QTVMRE13TGpRNU1TQkRNVGN6TGpRM09Dd3lPUzR6T0RnZ01UZ3hMams0T1N3eU9TNDFNalFnTVRrd0xqQXhNeXd6TUM0NE9EVWdRekU1TUM0NE5qVXNNekV1TURNZ01Ua3hMamM0T1N3ek1DNDRPVE1nTVRreUxqUXlMRE13TGpVeU9DQk1NVGsxTGpVd01Td3lPQzQzTlNCTU1UWTVMalkzTml3eE15NDROQ0lnYVdROUlrWnBiR3d0TWpNaUlHWnBiR3c5SWlOR1FVWkJSa0VpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URXpMalkzTlN3M05pNDBOVGtnUXpFeE15NDFPVFFzTnpZdU5EVTVJREV4TXk0MU1UUXNOell1TkRNNElERXhNeTQwTkRJc056WXVNemszSUV3Mk55NDFNVGdzTkRrdU9EZ3lJRU0yTnk0ek56UXNORGt1TnprNUlEWTNMakk0TkN3ME9TNDJORFVnTmpjdU1qZzFMRFE1TGpRM09DQkROamN1TWpnMUxEUTVMak14TVNBMk55NHpOelFzTkRrdU1UVTNJRFkzTGpVeE9TdzBPUzR3TnpNZ1RERTBPUzR6TlRVc01pNHdNRElnUXpFME9TNDBPVGtzTVM0NU1Ua2dNVFE1TGpZM055d3hMamt4T1NBeE5Ea3VPREl4TERJdU1EQXlJRXd4TlRZdU5UVXNOUzQ0T0RjZ1F6RTFOaTQzTnpRc05pNHdNVGNnTVRVMkxqZzFMRFl1TXpBeUlERTFOaTQzTWpJc05pNDFNallnUXpFMU5pNDFPVElzTmk0M05Ea2dNVFUyTGpNd055dzJMamd5TmlBeE5UWXVNRGd6TERZdU5qazJJRXd4TkRrdU5UZzNMREl1T1RRMklFdzJPQzQyT0Rjc05Ea3VORGM1SUV3eE1UTXVOamMxTERjMUxqUTFNaUJNTVRFMkxqVXlNeXczTXk0NE1EZ2dRekV4Tmk0M01UVXNOek11TmprM0lERXhOeTR4TkRNc056TXVNems1SURFeE5pNDVOVGdzTnpNdU1ETTFJRU14TVRRdU5UUXlMRFk0TGpJNE55QXhNVFF1TXl3Mk15NHlNakVnTVRFMkxqSTFPQ3cxT0M0ek9EVWdRekV4T1M0d05qUXNOVEV1TkRVNElERXlOUzR4TkRNc05EVXVNVFF6SURFek15NDROQ3cwTUM0eE1qSWdRekUwTWk0ME9UY3NNelV1TVRJMElERTFNeTR6TlRnc016RXVOak16SURFMk5TNHlORGNzTXpBdU1ESTRJRU14TnpNdU5EUTFMREk0TGpreU1TQXhPREl1TURNM0xESTVMakExT0NBeE9UQXVNRGt4TERNd0xqUXlOU0JETVRrd0xqZ3pMRE13TGpVMUlERTVNUzQyTlRJc016QXVORE15SURFNU1pNHhPRFlzTXpBdU1USTBJRXd4T1RRdU5UWTNMREk0TGpjMUlFd3hOamt1TkRReUxERTBMakkwTkNCRE1UWTVMakl4T1N3eE5DNHhNVFVnTVRZNUxqRTBNaXd4TXk0NE1qa2dNVFk1TGpJM01Td3hNeTQyTURZZ1F6RTJPUzQwTERFekxqTTRNaUF4TmprdU5qZzFMREV6TGpNd05pQXhOamt1T1RBNUxERXpMalF6TlNCTU1UazFMamN6TkN3eU9DNHpORFVnUXpFNU5TNDROemtzTWpndU5ESTRJREU1TlM0NU5qZ3NNamd1TlRneklERTVOUzQ1Tmpnc01qZ3VOelVnUXpFNU5TNDVOamdzTWpndU9URTJJREU1TlM0NE56a3NNamt1TURjeElERTVOUzQzTXpRc01qa3VNVFUwSUV3eE9USXVOalV6TERNd0xqa3pNeUJETVRreExqa3pNaXd6TVM0ek5TQXhPVEF1T0Rrc016RXVOVEE0SURFNE9TNDVNelVzTXpFdU16UTJJRU14T0RFdU9UY3lMREk1TGprNU5TQXhOek11TkRjNExESTVMamcySURFMk5TNHpOeklzTXpBdU9UVTBJRU14TlRNdU5qQXlMRE15TGpVME15QXhOREl1T0RZc016VXVPVGt6SURFek5DNHpNRGNzTkRBdU9UTXhJRU14TWpVdU56a3pMRFExTGpnME55QXhNVGt1T0RVeExEVXlMakF3TkNBeE1UY3VNVEkwTERVNExqY3pOaUJETVRFMUxqSTNMRFl6TGpNeE5DQXhNVFV1TlRBeExEWTRMakV4TWlBeE1UY3VOemtzTnpJdU5qRXhJRU14TVRndU1UWXNOek11TXpNMklERXhOeTQ0TkRVc056UXVNVEkwSURFeE5pNDVPU3czTkM0Mk1UY2dUREV4TXk0NU1Ea3NOell1TXprM0lFTXhNVE11T0RNMkxEYzJMalF6T0NBeE1UTXVOelUyTERjMkxqUTFPU0F4TVRNdU5qYzFMRGMyTGpRMU9TSWdhV1E5SWtacGJHd3RNalFpSUdacGJHdzlJaU0wTlRWQk5qUWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRVekxqTXhOaXd5TVM0eU56a2dRekUxTUM0NU1ETXNNakV1TWpjNUlERTBPQzQwT1RVc01qQXVOelV4SURFME5pNDJOalFzTVRrdU5qa3pJRU14TkRRdU9EUTJMREU0TGpZME5DQXhORE11T0RRMExERTNMakl6TWlBeE5ETXVPRFEwTERFMUxqY3hPQ0JETVRRekxqZzBOQ3d4TkM0eE9URWdNVFEwTGpnMkxERXlMamMyTXlBeE5EWXVOekExTERFeExqWTVPQ0JNTVRVMkxqRTVPQ3cyTGpBNU1TQkRNVFUyTGpNd09TdzJMakF5TlNBeE5UWXVORFV5TERZdU1EWXlJREUxTmk0MU1UZ3NOaTR4TnpNZ1F6RTFOaTQxT0RNc05pNHlPRFFnTVRVMkxqVTBOeXcyTGpReU55QXhOVFl1TkRNMkxEWXVORGt6SUV3eE5EWXVPVFFzTVRJdU1UQXlJRU14TkRVdU1qUTBMREV6TGpBNE1TQXhORFF1TXpFeUxERTBMak0yTlNBeE5EUXVNekV5TERFMUxqY3hPQ0JETVRRMExqTXhNaXd4Tnk0d05UZ2dNVFExTGpJekxERTRMak15TmlBeE5EWXVPRGszTERFNUxqSTRPU0JETVRVd0xqUTBOaXd5TVM0ek16Z2dNVFUyTGpJMExESXhMak15TnlBeE5Ua3VPREV4TERFNUxqSTJOU0JNTVRZNUxqVTFPU3d4TXk0Mk16Y2dRekUyT1M0Mk55d3hNeTQxTnpNZ01UWTVMamd4TXl3eE15NDJNVEVnTVRZNUxqZzNPQ3d4TXk0M01qTWdRekUyT1M0NU5ETXNNVE11T0RNMElERTJPUzQ1TURRc01UTXVPVGMzSURFMk9TNDNPVE1zTVRRdU1EUXlJRXd4TmpBdU1EUTFMREU1TGpZM0lFTXhOVGd1TVRnM0xESXdMamMwTWlBeE5UVXVOelE1TERJeExqSTNPU0F4TlRNdU16RTJMREl4TGpJM09TSWdhV1E5SWtacGJHd3RNalVpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFekxqWTNOU3czTlM0NU9USWdURFkzTGpjMk1pdzBPUzQwT0RRaUlHbGtQU0pHYVd4c0xUSTJJaUJtYVd4c1BTSWpORFUxUVRZMElqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV4TXk0Mk56VXNOell1TXpReUlFTXhNVE11TmpFMUxEYzJMak0wTWlBeE1UTXVOVFUxTERjMkxqTXlOeUF4TVRNdU5TdzNOaTR5T1RVZ1REWTNMalU0Tnl3ME9TNDNPRGNnUXpZM0xqUXhPU3cwT1M0Mk9TQTJOeTR6TmpJc05Ea3VORGMySURZM0xqUTFPU3cwT1M0ek1Ea2dRelkzTGpVMU5pdzBPUzR4TkRFZ05qY3VOemNzTkRrdU1EZ3pJRFkzTGprek55dzBPUzR4T0NCTU1URXpMamcxTERjMUxqWTRPQ0JETVRFMExqQXhPQ3czTlM0M09EVWdNVEUwTGpBM05TdzNOaUF4TVRNdU9UYzRMRGMyTGpFMk55QkRNVEV6TGpreE5DdzNOaTR5TnprZ01URXpMamM1Tml3M05pNHpORElnTVRFekxqWTNOU3czTmk0ek5ESWlJR2xrUFNKR2FXeHNMVEkzSWlCbWFXeHNQU0lqTkRVMVFUWTBJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRZM0xqYzJNaXcwT1M0ME9EUWdURFkzTGpjMk1pd3hNRE11TkRnMUlFTTJOeTQzTmpJc01UQTBMalUzTlNBMk9DNDFNeklzTVRBMUxqa3dNeUEyT1M0ME9ESXNNVEEyTGpRMU1pQk1NVEV4TGprMU5Td3hNekF1T1RjeklFTXhNVEl1T1RBMUxERXpNUzQxTWpJZ01URXpMalkzTlN3eE16RXVNRGd6SURFeE15NDJOelVzTVRJNUxqazVNeUJNTVRFekxqWTNOU3czTlM0NU9USWlJR2xrUFNKR2FXeHNMVEk0SWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFeE1pNDNNamNzTVRNeExqVTJNU0JETVRFeUxqUXpMREV6TVM0MU5qRWdNVEV5TGpFd055d3hNekV1TkRZMklERXhNUzQzT0N3eE16RXVNamMySUV3Mk9TNHpNRGNzTVRBMkxqYzFOU0JETmpndU1qUTBMREV3Tmk0eE5ESWdOamN1TkRFeUxERXdOQzQzTURVZ05qY3VOREV5TERFd015NDBPRFVnVERZM0xqUXhNaXcwT1M0ME9EUWdRelkzTGpReE1pdzBPUzR5T1NBMk55NDFOamtzTkRrdU1UTTBJRFkzTGpjMk1pdzBPUzR4TXpRZ1F6WTNMamsxTml3ME9TNHhNelFnTmpndU1URXpMRFE1TGpJNUlEWTRMakV4TXl3ME9TNDBPRFFnVERZNExqRXhNeXd4TURNdU5EZzFJRU0yT0M0eE1UTXNNVEEwTGpRME5TQTJPQzQ0TWl3eE1EVXVOalkxSURZNUxqWTFOeXd4TURZdU1UUTRJRXd4TVRJdU1UTXNNVE13TGpZM0lFTXhNVEl1TkRjMExERXpNQzQ0TmpnZ01URXlMamM1TVN3eE16QXVPVEV6SURFeE15d3hNekF1TnpreUlFTXhNVE11TWpBMkxERXpNQzQyTnpNZ01URXpMak15TlN3eE16QXVNemd4SURFeE15NHpNalVzTVRJNUxqazVNeUJNTVRFekxqTXlOU3czTlM0NU9USWdRekV4TXk0ek1qVXNOelV1TnprNElERXhNeTQwT0RJc056VXVOalF4SURFeE15NDJOelVzTnpVdU5qUXhJRU14TVRNdU9EWTVMRGMxTGpZME1TQXhNVFF1TURJMUxEYzFMamM1T0NBeE1UUXVNREkxTERjMUxqazVNaUJNTVRFMExqQXlOU3d4TWprdU9Ua3pJRU14TVRRdU1ESTFMREV6TUM0Mk5EZ2dNVEV6TGpjNE5pd3hNekV1TVRRM0lERXhNeTR6TlN3eE16RXVNems1SUVNeE1UTXVNVFl5TERFek1TNDFNRGNnTVRFeUxqazFNaXd4TXpFdU5UWXhJREV4TWk0M01qY3NNVE14TGpVMk1TSWdhV1E5SWtacGJHd3RNamtpSUdacGJHdzlJaU0wTlRWQk5qUWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFeUxqZzJMRFF3TGpVeE1pQkRNVEV5TGpnMkxEUXdMalV4TWlBeE1USXVPRFlzTkRBdU5URXlJREV4TWk0NE5Ua3NOREF1TlRFeUlFTXhNVEF1TlRReExEUXdMalV4TWlBeE1EZ3VNellzTXprdU9Ua2dNVEEyTGpjeE55d3pPUzR3TkRFZ1F6RXdOUzR3TVRJc016Z3VNRFUzSURFd05DNHdOelFzTXpZdU56STJJREV3TkM0d056UXNNelV1TWpreUlFTXhNRFF1TURjMExETXpMamcwTnlBeE1EVXVNREkyTERNeUxqVXdNU0F4TURZdU56VTBMRE14TGpVd05DQk1NVEU0TGpjNU5Td3lOQzQxTlRFZ1F6RXlNQzQwTmpNc01qTXVOVGc1SURFeU1pNDJOamtzTWpNdU1EVTRJREV5TlM0d01EY3NNak11TURVNElFTXhNamN1TXpJMUxESXpMakExT0NBeE1qa3VOVEEyTERJekxqVTRNU0F4TXpFdU1UVXNNalF1TlRNZ1F6RXpNaTQ0TlRRc01qVXVOVEUwSURFek15NDNPVE1zTWpZdU9EUTFJREV6TXk0M09UTXNNamd1TWpjNElFTXhNek11TnprekxESTVMamN5TkNBeE16SXVPRFF4TERNeExqQTJPU0F4TXpFdU1URXpMRE15TGpBMk55Qk1NVEU1TGpBM01Td3pPUzR3TVRrZ1F6RXhOeTQwTURNc016a3VPVGd5SURFeE5TNHhPVGNzTkRBdU5URXlJREV4TWk0NE5pdzBNQzQxTVRJZ1RERXhNaTQ0Tml3ME1DNDFNVElnV2lCTk1USTFMakF3Tnl3eU15NDNOVGtnUXpFeU1pNDNPU3d5TXk0M05Ua2dNVEl3TGpjd09Td3lOQzR5TlRZZ01URTVMakUwTml3eU5TNHhOVGdnVERFd055NHhNRFFzTXpJdU1URWdRekV3TlM0Mk1ESXNNekl1T1RjNElERXdOQzQzTnpRc016UXVNVEE0SURFd05DNDNOelFzTXpVdU1qa3lJRU14TURRdU56YzBMRE0yTGpRMk5TQXhNRFV1TlRnNUxETTNMalU0TVNBeE1EY3VNRFkzTERNNExqUXpOQ0JETVRBNExqWXdOU3d6T1M0ek1qTWdNVEV3TGpZMk15d3pPUzQ0TVRJZ01URXlMamcxT1N3ek9TNDRNVElnVERFeE1pNDROaXd6T1M0NE1USWdRekV4TlM0d056WXNNemt1T0RFeUlERXhOeTR4TlRnc016a3VNekUxSURFeE9DNDNNakVzTXpndU5ERXpJRXd4TXpBdU56WXlMRE14TGpRMklFTXhNekl1TWpZMExETXdMalU1TXlBeE16TXVNRGt5TERJNUxqUTJNeUF4TXpNdU1Ea3lMREk0TGpJM09DQkRNVE16TGpBNU1pd3lOeTR4TURZZ01UTXlMakkzT0N3eU5TNDVPU0F4TXpBdU9Dd3lOUzR4TXpZZ1F6RXlPUzR5TmpFc01qUXVNalE0SURFeU55NHlNRFFzTWpNdU56VTVJREV5TlM0d01EY3NNak11TnpVNUlFd3hNalV1TURBM0xESXpMamMxT1NCYUlpQnBaRDBpUm1sc2JDMHpNQ0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TmpVdU5qTXNNVFl1TWpFNUlFd3hOVGt1T0RrMkxERTVMalV6SUVNeE5UWXVOekk1TERJeExqTTFPQ0F4TlRFdU5qRXNNakV1TXpZM0lERTBPQzQwTmpNc01Ua3VOVFVnUXpFME5TNHpNVFlzTVRjdU56TXpJREUwTlM0ek16SXNNVFF1TnpjNElERTBPQzQwT1Rrc01USXVPVFE1SUV3eE5UUXVNak16TERrdU5qTTVJRXd4TmpVdU5qTXNNVFl1TWpFNUlpQnBaRDBpUm1sc2JDMHpNU0lnWm1sc2JEMGlJMFpCUmtGR1FTSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TlRRdU1qTXpMREV3TGpRME9DQk1NVFkwTGpJeU9Dd3hOaTR5TVRrZ1RERTFPUzQxTkRZc01UZ3VPVEl6SUVNeE5UZ3VNVEV5TERFNUxqYzFJREUxTmk0eE9UUXNNakF1TWpBMklERTFOQzR4TkRjc01qQXVNakEySUVNeE5USXVNVEU0TERJd0xqSXdOaUF4TlRBdU1qSTBMREU1TGpjMU55QXhORGd1T0RFMExERTRMamswTXlCRE1UUTNMalV5TkN3eE9DNHhPVGtnTVRRMkxqZ3hOQ3d4Tnk0eU5Ea2dNVFEyTGpneE5Dd3hOaTR5TmprZ1F6RTBOaTQ0TVRRc01UVXVNamM0SURFME55NDFNemNzTVRRdU16RTBJREUwT0M0NE5Td3hNeTQxTlRZZ1RERTFOQzR5TXpNc01UQXVORFE0SUUweE5UUXVNak16TERrdU5qTTVJRXd4TkRndU5EazVMREV5TGprME9TQkRNVFExTGpNek1pd3hOQzQzTnpnZ01UUTFMak14Tml3eE55NDNNek1nTVRRNExqUTJNeXd4T1M0MU5TQkRNVFV3TGpBek1Td3lNQzQwTlRVZ01UVXlMakE0Tml3eU1DNDVNRGNnTVRVMExqRTBOeXd5TUM0NU1EY2dRekUxTmk0eU1qUXNNakF1T1RBM0lERTFPQzR6TURZc01qQXVORFEzSURFMU9TNDRPVFlzTVRrdU5UTWdUREUyTlM0Mk15d3hOaTR5TVRrZ1RERTFOQzR5TXpNc09TNDJNemtpSUdsa1BTSkdhV3hzTFRNeUlpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTBOUzQwTkRVc056SXVOalkzSUV3eE5EVXVORFExTERjeUxqWTJOeUJETVRRekxqWTNNaXczTWk0Mk5qY2dNVFF5TGpJd05DdzNNUzQ0TVRjZ01UUXhMakl3TWl3M01DNDBNaklnUXpFME1TNHhNelVzTnpBdU16TWdNVFF4TGpFME5TdzNNQzR4TkRjZ01UUXhMakl5TlN3M01DNHdOallnUXpFME1TNHpNRFVzTmprdU9UZzFJREUwTVM0ME16SXNOamt1T1RRMklERTBNUzQxTWpVc056QXVNREV4SUVNeE5ESXVNekEyTERjd0xqVTFPU0F4TkRNdU1qTXhMRGN3TGpneU15QXhORFF1TWpjMkxEY3dMamd5TWlCRE1UUTFMalU1T0N3M01DNDRNaklnTVRRM0xqQXpMRGN3TGpNM05pQXhORGd1TlRNeUxEWTVMalV3T1NCRE1UVXpMamcwTWl3Mk5pNDBORE1nTVRVNExqRTJNeXcxT0M0NU9EY2dNVFU0TGpFMk15dzFNaTQ0T1RRZ1F6RTFPQzR4TmpNc05UQXVPVFkzSURFMU55NDNNakVzTkRrdU16TXlJREUxTmk0NE9EUXNORGd1TVRZNElFTXhOVFl1T0RFNExEUTRMakEzTmlBeE5UWXVPREk0TERRM0xqazBPQ0F4TlRZdU9UQTRMRFEzTGpnMk55QkRNVFUyTGprNE9DdzBOeTQzT0RZZ01UVTNMakV4TkN3ME55NDNOelFnTVRVM0xqSXdPQ3cwTnk0NE5DQkRNVFU0TGpnM09DdzBPUzR3TVRJZ01UVTVMamM1T0N3MU1TNHlNaUF4TlRrdU56azRMRFUwTGpBMU9TQkRNVFU1TGpjNU9DdzJNQzR6TURFZ01UVTFMak0zTXl3Mk9DNHdORFlnTVRRNUxqa3pNeXczTVM0eE9EWWdRekUwT0M0ek5pdzNNaTR3T1RRZ01UUTJMamcxTERjeUxqWTJOeUF4TkRVdU5EUTFMRGN5TGpZMk55Qk1NVFExTGpRME5TdzNNaTQyTmpjZ1dpQk5NVFF5TGpRM05pdzNNU0JETVRRekxqSTVMRGN4TGpZMU1TQXhORFF1TWprMkxEY3lMakF3TWlBeE5EVXVORFExTERjeUxqQXdNaUJETVRRMkxqYzJOeXczTWk0d01ESWdNVFE0TGpFNU9DdzNNUzQxTlNBeE5Ea3VOeXczTUM0Mk9ESWdRekUxTlM0d01TdzJOeTQyTVRjZ01UVTVMak16TVN3Mk1DNHhOVGtnTVRVNUxqTXpNU3cxTkM0d05qVWdRekUxT1M0ek16RXNOVEl1TURnMUlERTFPQzQ0Tmpnc05UQXVORE0xSURFMU9DNHdNRFlzTkRrdU1qY3lJRU14TlRndU5ERTNMRFV3TGpNd055QXhOVGd1TmpNc05URXVOVE15SURFMU9DNDJNeXcxTWk0NE9USWdRekUxT0M0Mk15dzFPUzR4TXpRZ01UVTBMakl3TlN3Mk5pNDNOamNnTVRRNExqYzJOU3cyT1M0NU1EY2dRekUwTnk0eE9USXNOekF1T0RFMklERTBOUzQyT0RFc056RXVNamd6SURFME5DNHlOellzTnpFdU1qZ3pJRU14TkRNdU5qTTBMRGN4TGpJNE15QXhORE11TURNekxEY3hMakU1TWlBeE5ESXVORGMyTERjeElFd3hOREl1TkRjMkxEY3hJRm9pSUdsa1BTSkdhV3hzTFRNeklpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTBPQzQyTkRnc05qa3VOekEwSUVNeE5UUXVNRE15TERZMkxqVTVOaUF4TlRndU16azJMRFU1TGpBMk9DQXhOVGd1TXprMkxEVXlMamc1TVNCRE1UVTRMak01Tml3MU1DNDRNemtnTVRVM0xqa3hNeXcwT1M0eE9UZ2dNVFUzTGpBM05DdzBPQzR3TXlCRE1UVTFMakk0T1N3ME5pNDNOemdnTVRVeUxqWTVPU3cwTmk0NE16WWdNVFE1TGpneE5pdzBPQzQxTURFZ1F6RTBOQzQwTXpNc05URXVOakE1SURFME1DNHdOamdzTlRrdU1UTTNJREUwTUM0d05qZ3NOalV1TXpFMElFTXhOREF1TURZNExEWTNMak0yTlNBeE5EQXVOVFV5TERZNUxqQXdOaUF4TkRFdU16a3hMRGN3TGpFM05DQkRNVFF6TGpFM05pdzNNUzQwTWpjZ01UUTFMamMyTlN3M01TNHpOamtnTVRRNExqWTBPQ3cyT1M0M01EUWlJR2xrUFNKR2FXeHNMVE0wSWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFME5DNHlOellzTnpFdU1qYzJJRXd4TkRRdU1qYzJMRGN4TGpJM05pQkRNVFF6TGpFek15dzNNUzR5TnpZZ01UUXlMakV4T0N3M01DNDVOamtnTVRReExqSTFOeXczTUM0ek5qVWdRekUwTVM0eU16WXNOekF1TXpVeElERTBNUzR5TVRjc056QXVNek15SURFME1TNHlNRElzTnpBdU16RXhJRU14TkRBdU16QTNMRFk1TGpBMk55QXhNemt1T0RNMUxEWTNMak16T1NBeE16a3VPRE0xTERZMUxqTXhOQ0JETVRNNUxqZ3pOU3cxT1M0d056TWdNVFEwTGpJMkxEVXhMalF6T1NBeE5Ea3VOeXcwT0M0eU9UZ2dRekUxTVM0eU56TXNORGN1TXprZ01UVXlMamM0TkN3ME5pNDVNamtnTVRVMExqRTRPU3cwTmk0NU1qa2dRekUxTlM0ek16SXNORFl1T1RJNUlERTFOaTR6TkRjc05EY3VNak0ySURFMU55NHlNRGdzTkRjdU9ETTVJRU14TlRjdU1qSTVMRFEzTGpnMU5DQXhOVGN1TWpRNExEUTNMamczTXlBeE5UY3VNall6TERRM0xqZzVOQ0JETVRVNExqRTFOeXcwT1M0eE16Z2dNVFU0TGpZekxEVXdMamcyTlNBeE5UZ3VOak1zTlRJdU9Ea3hJRU14TlRndU5qTXNOVGt1TVRNeUlERTFOQzR5TURVc05qWXVOelkySURFME9DNDNOalVzTmprdU9UQTNJRU14TkRjdU1Ua3lMRGN3TGpneE5TQXhORFV1TmpneExEY3hMakkzTmlBeE5EUXVNamMyTERjeExqSTNOaUJNTVRRMExqSTNOaXczTVM0eU56WWdXaUJOTVRReExqVTFPQ3czTUM0eE1EUWdRekUwTWk0ek16RXNOekF1TmpNM0lERTBNeTR5TkRVc056RXVNREExSURFME5DNHlOellzTnpFdU1EQTFJRU14TkRVdU5UazRMRGN4TGpBd05TQXhORGN1TURNc056QXVORFkzSURFME9DNDFNeklzTmprdU5pQkRNVFV6TGpnME1pdzJOaTQxTXpRZ01UVTRMakUyTXl3MU9TNHdNek1nTVRVNExqRTJNeXcxTWk0NU16a2dRekUxT0M0eE5qTXNOVEV1TURNeElERTFOeTQzTWprc05Ea3VNemcxSURFMU5pNDVNRGNzTkRndU1qSXpJRU14TlRZdU1UTXpMRFEzTGpZNU1TQXhOVFV1TWpFNUxEUTNMalF3T1NBeE5UUXVNVGc1TERRM0xqUXdPU0JETVRVeUxqZzJOeXcwTnk0ME1Ea2dNVFV4TGpRek5TdzBOeTQ0TkRJZ01UUTVMamt6TXl3ME9DNDNNRGtnUXpFME5DNDJNak1zTlRFdU56YzFJREUwTUM0ek1ESXNOVGt1TWpjeklERTBNQzR6TURJc05qVXVNelkySUVNeE5EQXVNekF5TERZM0xqSTNOaUF4TkRBdU56TTJMRFk0TGprME1pQXhOREV1TlRVNExEY3dMakV3TkNCTU1UUXhMalUxT0N3M01DNHhNRFFnV2lJZ2FXUTlJa1pwYkd3dE16VWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFV3TGpjeUxEWTFMak0yTVNCTU1UVXdMak0xTnl3Mk5TNHdOallnUXpFMU1TNHhORGNzTmpRdU1Ea3lJREUxTVM0NE5qa3NOak11TURRZ01UVXlMalV3TlN3Mk1TNDVNemdnUXpFMU15NHpNVE1zTmpBdU5UTTVJREUxTXk0NU56Z3NOVGt1TURZM0lERTFOQzQwT0RJc05UY3VOVFl6SUV3eE5UUXVPVEkxTERVM0xqY3hNaUJETVRVMExqUXhNaXcxT1M0eU5EVWdNVFV6TGpjek15dzJNQzQzTkRVZ01UVXlMamt4TERZeUxqRTNNaUJETVRVeUxqSTJNaXcyTXk0eU9UVWdNVFV4TGpVeU5TdzJOQzR6TmpnZ01UVXdMamN5TERZMUxqTTJNU0lnYVdROUlrWnBiR3d0TXpZaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URTFMamt4Tnl3NE5DNDFNVFFnVERFeE5TNDFOVFFzT0RRdU1qSWdRekV4Tmk0ek5EUXNPRE11TWpRMUlERXhOeTR3TmpZc09ESXVNVGswSURFeE55NDNNRElzT0RFdU1Ea3lJRU14TVRndU5URXNOemt1TmpreUlERXhPUzR4TnpVc056Z3VNaklnTVRFNUxqWTNPQ3czTmk0M01UY2dUREV5TUM0eE1qRXNOell1T0RZMUlFTXhNVGt1TmpBNExEYzRMak01T0NBeE1UZ3VPVE1zTnprdU9EazVJREV4T0M0eE1EWXNPREV1TXpJMklFTXhNVGN1TkRVNExEZ3lMalEwT0NBeE1UWXVOekl5TERnekxqVXlNU0F4TVRVdU9URTNMRGcwTGpVeE5DSWdhV1E5SWtacGJHd3RNemNpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFMExERXpNQzQwTnpZZ1RERXhOQ3d4TXpBdU1EQTRJRXd4TVRRc056WXVNRFV5SUV3eE1UUXNOelV1TlRnMElFd3hNVFFzTnpZdU1EVXlJRXd4TVRRc01UTXdMakF3T0NCTU1URTBMREV6TUM0ME56WWlJR2xrUFNKR2FXeHNMVE00SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThMMmMrQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4WnlCcFpEMGlTVzF3YjNKMFpXUXRUR0Y1WlhKekxVTnZjSGtpSUhSeVlXNXpabTl5YlQwaWRISmhibk5zWVhSbEtEWXlMakF3TURBd01Dd2dNQzR3TURBd01EQXBJaUJ6YTJWMFkyZzZkSGx3WlQwaVRWTlRhR0Z3WlVkeWIzVndJajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1Ua3VPREl5TERNM0xqUTNOQ0JETVRrdU9ETTVMRE0zTGpNek9TQXhPUzQzTkRjc016Y3VNVGswSURFNUxqVTFOU3d6Tnk0d09ESWdRekU1TGpJeU9Dd3pOaTQ0T1RRZ01UZ3VOekk1TERNMkxqZzNNaUF4T0M0ME5EWXNNemN1TURNM0lFd3hNaTQwTXpRc05EQXVOVEE0SUVNeE1pNHpNRE1zTkRBdU5UZzBJREV5TGpJMExEUXdMalk0TmlBeE1pNHlORE1zTkRBdU56a3pJRU14TWk0eU5EVXNOREF1T1RJMUlERXlMakkwTlN3ME1TNHlOVFFnTVRJdU1qUTFMRFF4TGpNM01TQk1NVEl1TWpRMUxEUXhMalF4TkNCTU1USXVNak00TERReExqVTBNaUJET0M0eE5EZ3NORE11T0RnM0lEVXVOalEzTERRMUxqTXlNU0ExTGpZME55dzBOUzR6TWpFZ1F6VXVOalEyTERRMUxqTXlNU0F6TGpVM0xEUTJMak0yTnlBeUxqZzJMRFV3TGpVeE15QkRNaTQ0Tml3MU1DNDFNVE1nTVM0NU5EZ3NOVGN1TkRjMElERXVPVFl5TERjd0xqSTFPQ0JETVM0NU56Y3NPREl1T0RJNElESXVOVFk0TERnM0xqTXlPQ0F6TGpFeU9TdzVNUzQyTURrZ1F6TXVNelE1TERrekxqSTVNeUEyTGpFekxEa3pMamN6TkNBMkxqRXpMRGt6TGpjek5DQkROaTQwTmpFc09UTXVOemMwSURZdU9ESTRMRGt6TGpjd055QTNMakl4TERrekxqUTROaUJNT0RJdU5EZ3pMRFE1TGprek5TQkRPRFF1TWpreExEUTRMamcyTmlBNE5TNHhOU3cwTmk0eU1UWWdPRFV1TlRNNUxEUXpMalkxTVNCRE9EWXVOelV5TERNMUxqWTJNU0E0Tnk0eU1UUXNNVEF1TmpjeklEZzFMakkyTkN3ekxqYzNNeUJET0RVdU1EWTRMRE11TURnZ09EUXVOelUwTERJdU5qa2dPRFF1TXprMkxESXVORGt4SUV3NE1pNHpNU3d4TGpjd01TQkRPREV1TlRnekxERXVOekk1SURnd0xqZzVOQ3d5TGpFMk9DQTRNQzQzTnpZc01pNHlNellnUXpnd0xqWXpOaXd5TGpNeE55QTBNUzQ0TURjc01qUXVOVGcxSURJd0xqQXpNaXd6Tnk0d056SWdUREU1TGpneU1pd3pOeTQwTnpRaUlHbGtQU0pHYVd4c0xURWlJR1pwYkd3OUlpTkdSa1pHUmtZaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5PREl1TXpFeExERXVOekF4SUV3NE5DNHpPVFlzTWk0ME9URWdRemcwTGpjMU5Dd3lMalk1SURnMUxqQTJPQ3d6TGpBNElEZzFMakkyTkN3ekxqYzNNeUJET0RjdU1qRXpMREV3TGpZM015QTROaTQzTlRFc016VXVOallnT0RVdU5UTTVMRFF6TGpZMU1TQkRPRFV1TVRRNUxEUTJMakl4TmlBNE5DNHlPU3cwT0M0NE5qWWdPREl1TkRnekxEUTVMamt6TlNCTU55NHlNU3c1TXk0ME9EWWdRell1T0RrM0xEa3pMalkyTnlBMkxqVTVOU3c1TXk0M05EUWdOaTR6TVRRc09UTXVOelEwSUV3MkxqRXpNU3c1TXk0M016TWdRell1TVRNeExEa3pMamN6TkNBekxqTTBPU3c1TXk0eU9UTWdNeTR4TWpnc09URXVOakE1SUVNeUxqVTJPQ3c0Tnk0ek1qY2dNUzQ1Tnpjc09ESXVPREk0SURFdU9UWXpMRGN3TGpJMU9DQkRNUzQ1TkRnc05UY3VORGMwSURJdU9EWXNOVEF1TlRFeklESXVPRFlzTlRBdU5URXpJRU16TGpVM0xEUTJMak0yTnlBMUxqWTBOeXcwTlM0ek1qRWdOUzQyTkRjc05EVXVNekl4SUVNMUxqWTBOeXcwTlM0ek1qRWdPQzR4TkRnc05ETXVPRGczSURFeUxqSXpPQ3cwTVM0MU5ESWdUREV5TGpJME5TdzBNUzQwTVRRZ1RERXlMakkwTlN3ME1TNHpOekVnUXpFeUxqSTBOU3cwTVM0eU5UUWdNVEl1TWpRMUxEUXdMamt5TlNBeE1pNHlORE1zTkRBdU56a3pJRU14TWk0eU5DdzBNQzQyT0RZZ01USXVNekF5TERRd0xqVTRNeUF4TWk0ME16UXNOREF1TlRBNElFd3hPQzQwTkRZc016Y3VNRE0ySUVNeE9DNDFOelFzTXpZdU9UWXlJREU0TGpjME5pd3pOaTQ1TWpZZ01UZ3VPVEkzTERNMkxqa3lOaUJETVRrdU1UUTFMRE0yTGpreU5pQXhPUzR6TnpZc016WXVPVGM1SURFNUxqVTFOQ3d6Tnk0d09ESWdRekU1TGpjME55d3pOeTR4T1RRZ01Ua3VPRE01TERNM0xqTTBJREU1TGpneU1pd3pOeTQwTnpRZ1RESXdMakF6TXl3ek55NHdOeklnUXpReExqZ3dOaXd5TkM0MU9EVWdPREF1TmpNMkxESXVNekU0SURnd0xqYzNOeXd5TGpJek5pQkRPREF1T0RrMExESXVNVFk0SURneExqVTRNeXd4TGpjeU9TQTRNaTR6TVRFc01TNDNNREVnVFRneUxqTXhNU3d3TGpjd05DQk1PREl1TWpjeUxEQXVOekExSUVNNE1TNDJOVFFzTUM0M01qZ2dPREF1T1RnNUxEQXVPVFE1SURnd0xqSTVPQ3d4TGpNMk1TQk1PREF1TWpjM0xERXVNemN6SUVNNE1DNHhNamtzTVM0ME5UZ2dOVGt1TnpZNExERXpMakV6TlNBeE9TNDNOVGdzTXpZdU1EYzVJRU14T1M0MUxETTFMams0TVNBeE9TNHlNVFFzTXpVdU9USTVJREU0TGpreU55d3pOUzQ1TWprZ1F6RTRMalUyTWl3ek5TNDVNamtnTVRndU1qSXpMRE0yTGpBeE15QXhOeTQ1TkRjc016WXVNVGN6SUV3eE1TNDVNelVzTXprdU5qUTBJRU14TVM0ME9UTXNNemt1T0RrNUlERXhMakl6Tml3ME1DNHpNelFnTVRFdU1qUTJMRFF3TGpneElFd3hNUzR5TkRjc05EQXVPVFlnVERVdU1UWTNMRFEwTGpRME55QkROQzQzT1RRc05EUXVOalEySURJdU5qSTFMRFExTGprM09DQXhMamczTnl3MU1DNHpORFVnVERFdU9EY3hMRFV3TGpNNE5DQkRNUzQ0TmpJc05UQXVORFUwSURBdU9UVXhMRFUzTGpVMU55QXdMamsyTlN3M01DNHlOVGtnUXpBdU9UYzVMRGd5TGpnM09TQXhMalUyT0N3NE55NHpOelVnTWk0eE16Y3NPVEV1TnpJMElFd3lMakV6T1N3NU1TNDNNemtnUXpJdU5EUTNMRGswTGpBNU5DQTFMall4TkN3NU5DNDJOaklnTlM0NU56VXNPVFF1TnpFNUlFdzJMakF3T1N3NU5DNDNNak1nUXpZdU1URXNPVFF1TnpNMklEWXVNakV6TERrMExqYzBNaUEyTGpNeE5DdzVOQzQzTkRJZ1F6WXVOemtzT1RRdU56UXlJRGN1TWpZc09UUXVOakVnTnk0M01TdzVOQzR6TlNCTU9ESXVPVGd6TERVd0xqYzVPQ0JET0RRdU56azBMRFE1TGpjeU55QTROUzQ1T0RJc05EY3VNemMxSURnMkxqVXlOU3cwTXk0NE1ERWdRemczTGpjeE1Td3pOUzQ1T0RjZ09EZ3VNalU1TERFd0xqY3dOU0E0Tmk0eU1qUXNNeTQxTURJZ1F6ZzFMamszTVN3eUxqWXdPU0E0TlM0MU1pd3hMamszTlNBNE5DNDRPREVzTVM0Mk1pQk1PRFF1TnpRNUxERXVOVFU0SUV3NE1pNDJOalFzTUM0M05qa2dRemd5TGpVMU1Td3dMamN5TlNBNE1pNDBNekVzTUM0M01EUWdPREl1TXpFeExEQXVOekEwSWlCcFpEMGlSbWxzYkMweUlpQm1hV3hzUFNJak5EVTFRVFkwSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUWTJMakkyTnl3eE1TNDFOalVnVERZM0xqYzJNaXd4TVM0NU9Ua2dUREV4TGpReU15dzBOQzR6TWpVaUlHbGtQU0pHYVd4c0xUTWlJR1pwYkd3OUlpTkdSa1pHUmtZaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEl1TWpBeUxEa3dMalUwTlNCRE1USXVNREk1TERrd0xqVTBOU0F4TVM0NE5qSXNPVEF1TkRVMUlERXhMamMyT1N3NU1DNHlPVFVnUXpFeExqWXpNaXc1TUM0d05UY2dNVEV1TnpFekxEZzVMamMxTWlBeE1TNDVOVElzT0RrdU5qRTBJRXd6TUM0ek9Ea3NOemd1T1RZNUlFTXpNQzQyTWpnc056Z3VPRE14SURNd0xqa3pNeXczT0M0NU1UTWdNekV1TURjeExEYzVMakUxTWlCRE16RXVNakE0TERjNUxqTTVJRE14TGpFeU55dzNPUzQyT1RZZ016QXVPRGc0TERjNUxqZ3pNeUJNTVRJdU5EVXhMRGt3TGpRM09DQk1NVEl1TWpBeUxEa3dMalUwTlNJZ2FXUTlJa1pwYkd3dE5DSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhNeTQzTmpRc05ESXVOalUwSUV3eE15NDJOVFlzTkRJdU5Ua3lJRXd4TXk0M01ESXNOREl1TkRJeElFd3hPQzQ0TXpjc016a3VORFUzSUV3eE9TNHdNRGNzTXprdU5UQXlJRXd4T0M0NU5qSXNNemt1TmpjeklFd3hNeTQ0TWpjc05ESXVOak0zSUV3eE15NDNOalFzTkRJdU5qVTBJaUJwWkQwaVJtbHNiQzAxSWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRndU5USXNPVEF1TXpjMUlFdzRMalV5TERRMkxqUXlNU0JNT0M0MU9ETXNORFl1TXpnMUlFdzNOUzQ0TkN3M0xqVTFOQ0JNTnpVdU9EUXNOVEV1TlRBNElFdzNOUzQzTnpnc05URXVOVFEwSUV3NExqVXlMRGt3TGpNM05TQk1PQzQxTWl3NU1DNHpOelVnV2lCTk9DNDNOeXcwTmk0MU5qUWdURGd1Tnpjc09Ea3VPVFEwSUV3M05TNDFPVEVzTlRFdU16WTFJRXczTlM0MU9URXNOeTQ1T0RVZ1REZ3VOemNzTkRZdU5UWTBJRXc0TGpjM0xEUTJMalUyTkNCYUlpQnBaRDBpUm1sc2JDMDJJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEkwTGprNE5pdzRNeTR4T0RJZ1F6STBMamMxTml3NE15NHpNekVnTWpRdU16YzBMRGd6TGpVMk5pQXlOQzR4TXpjc09ETXVOekExSUV3eE1pNDJNeklzT1RBdU5EQTJJRU14TWk0ek9UVXNPVEF1TlRRMUlERXlMalF5Tml3NU1DNDJOVGdnTVRJdU55dzVNQzQyTlRnZ1RERXpMakkyTlN3NU1DNDJOVGdnUXpFekxqVTBMRGt3TGpZMU9DQXhNeTQ1TlRnc09UQXVOVFExSURFMExqRTVOU3c1TUM0ME1EWWdUREkxTGpjc09ETXVOekExSUVNeU5TNDVNemNzT0RNdU5UWTJJREkyTGpFeU9DdzRNeTQwTlRJZ01qWXVNVEkxTERnekxqUTBPU0JETWpZdU1USXlMRGd6TGpRME55QXlOaTR4TVRrc09ETXVNaklnTWpZdU1URTVMRGd5TGprME5pQkRNall1TVRFNUxEZ3lMalkzTWlBeU5TNDVNekVzT0RJdU5UWTVJREkxTGpjd01TdzRNaTQzTVRrZ1RESTBMams0Tml3NE15NHhPRElpSUdsa1BTSkdhV3hzTFRjaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UTXVNalkyTERrd0xqYzRNaUJNTVRJdU55dzVNQzQzT0RJZ1F6RXlMalVzT1RBdU56Z3lJREV5TGpNNE5DdzVNQzQzTWpZZ01USXVNelUwTERrd0xqWXhOaUJETVRJdU16STBMRGt3TGpVd05pQXhNaTR6T1Rjc09UQXVNems1SURFeUxqVTJPU3c1TUM0eU9Ua2dUREkwTGpBM05DdzRNeTQxT1RjZ1F6STBMak14TERnekxqUTFPU0F5TkM0Mk9Ea3NPRE11TWpJMklESTBMamt4T0N3NE15NHdOemdnVERJMUxqWXpNeXc0TWk0Mk1UUWdRekkxTGpjeU15dzRNaTQxTlRVZ01qVXVPREV6TERneUxqVXlOU0F5TlM0NE9Ua3NPREl1TlRJMUlFTXlOaTR3TnpFc09ESXVOVEkxSURJMkxqSTBOQ3c0TWk0Mk5UVWdNall1TWpRMExEZ3lMamswTmlCRE1qWXVNalEwTERnekxqRTJJREkyTGpJME5TdzRNeTR6TURrZ01qWXVNalEzTERnekxqTTRNeUJNTWpZdU1qVXpMRGd6TGpNNE55Qk1Nall1TWpRNUxEZ3pMalExTmlCRE1qWXVNalEyTERnekxqVXpNU0F5Tmk0eU5EWXNPRE11TlRNeElESTFMamMyTXl3NE15NDRNVElnVERFMExqSTFPQ3c1TUM0MU1UUWdRekUwTERrd0xqWTJOU0F4TXk0MU5qUXNPVEF1TnpneUlERXpMakkyTml3NU1DNDNPRElnVERFekxqSTJOaXc1TUM0M09ESWdXaUJOTVRJdU5qWTJMRGt3TGpVek1pQk1NVEl1Tnl3NU1DNDFNek1nVERFekxqSTJOaXc1TUM0MU16TWdRekV6TGpVeE9DdzVNQzQxTXpNZ01UTXVPVEUxTERrd0xqUXlOU0F4TkM0eE16SXNPVEF1TWprNUlFd3lOUzQyTXpjc09ETXVOVGszSUVNeU5TNDRNRFVzT0RNdU5EazVJREkxTGprek1TdzRNeTQwTWpRZ01qVXVPVGs0TERnekxqTTRNeUJETWpVdU9UazBMRGd6TGpJNU9TQXlOUzQ1T1RRc09ETXVNVFkxSURJMUxqazVOQ3c0TWk0NU5EWWdUREkxTGpnNU9TdzRNaTQzTnpVZ1RESTFMamMyT0N3NE1pNDRNalFnVERJMUxqQTFOQ3c0TXk0eU9EY2dRekkwTGpneU1pdzRNeTQwTXpjZ01qUXVORE00TERnekxqWTNNeUF5TkM0eUxEZ3pMamd4TWlCTU1USXVOamsxTERrd0xqVXhOQ0JNTVRJdU5qWTJMRGt3TGpVek1pQk1NVEl1TmpZMkxEa3dMalV6TWlCYUlpQnBaRDBpUm1sc2JDMDRJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV6TGpJMk5pdzRPUzQ0TnpFZ1RERXlMamNzT0RrdU9EY3hJRU14TWk0MUxEZzVMamczTVNBeE1pNHpPRFFzT0RrdU9ERTFJREV5TGpNMU5DdzRPUzQzTURVZ1F6RXlMak15TkN3NE9TNDFPVFVnTVRJdU16azNMRGc1TGpRNE9DQXhNaTQxTmprc09Ea3VNemc0SUV3eU5DNHdOelFzT0RJdU5qZzJJRU15TkM0ek16SXNPREl1TlRNMUlESTBMamMyT0N3NE1pNDBNVGdnTWpVdU1EWTNMRGd5TGpReE9DQk1NalV1TmpNeUxEZ3lMalF4T0NCRE1qVXVPRE15TERneUxqUXhPQ0F5TlM0NU5EZ3NPREl1TkRjMElESTFMamszT0N3NE1pNDFPRFFnUXpJMkxqQXdPQ3c0TWk0Mk9UUWdNalV1T1RNMUxEZ3lMamd3TVNBeU5TNDNOak1zT0RJdU9UQXhJRXd4TkM0eU5UZ3NPRGt1TmpBeklFTXhOQ3c0T1M0M05UUWdNVE11TlRZMExEZzVMamczTVNBeE15NHlOallzT0RrdU9EY3hJRXd4TXk0eU5qWXNPRGt1T0RjeElGb2dUVEV5TGpZMk5pdzRPUzQyTWpFZ1RERXlMamNzT0RrdU5qSXlJRXd4TXk0eU5qWXNPRGt1TmpJeUlFTXhNeTQxTVRnc09Ea3VOakl5SURFekxqa3hOU3c0T1M0MU1UVWdNVFF1TVRNeUxEZzVMak00T0NCTU1qVXVOak0zTERneUxqWTROaUJNTWpVdU5qWTNMRGd5TGpZMk9DQk1NalV1TmpNeUxEZ3lMalkyTnlCTU1qVXVNRFkzTERneUxqWTJOeUJETWpRdU9ERTFMRGd5TGpZMk55QXlOQzQwTVRnc09ESXVOemMxSURJMExqSXNPREl1T1RBeElFd3hNaTQyT1RVc09Ea3VOakF6SUV3eE1pNDJOallzT0RrdU5qSXhJRXd4TWk0Mk5qWXNPRGt1TmpJeElGb2lJR2xrUFNKR2FXeHNMVGtpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRJdU16Y3NPVEF1T0RBeElFd3hNaTR6Tnl3NE9TNDFOVFFnVERFeUxqTTNMRGt3TGpnd01TSWdhV1E5SWtacGJHd3RNVEFpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTmk0eE15dzVNeTQ1TURFZ1F6VXVNemM1TERrekxqZ3dPQ0EwTGpneE5pdzVNeTR4TmpRZ05DNDJPVEVzT1RJdU5USTFJRU16TGpnMkxEZzRMakk0TnlBekxqVTBMRGd6TGpjME15QXpMalV5Tml3M01TNHhOek1nUXpNdU5URXhMRFU0TGpNNE9TQTBMalF5TXl3MU1TNDBNamdnTkM0ME1qTXNOVEV1TkRJNElFTTFMakV6TkN3ME55NHlPRElnTnk0eU1TdzBOaTR5TXpZZ055NHlNU3cwTmk0eU16WWdRemN1TWpFc05EWXVNak0ySURneExqWTJOeXd6TGpJMUlEZ3lMakEyT1N3ekxqQXhOeUJET0RJdU1qa3lMREl1T0RnNElEZzBMalUxTml3eExqUXpNeUE0TlM0eU5qUXNNeTQ1TkNCRE9EY3VNakUwTERFd0xqZzBJRGcyTGpjMU1pd3pOUzQ0TWpjZ09EVXVOVE01TERRekxqZ3hPQ0JET0RVdU1UVXNORFl1TXpneklEZzBMakk1TVN3ME9TNHdNek1nT0RJdU5EZ3pMRFV3TGpFd01TQk1OeTR5TVN3NU15NDJOVE1nUXpZdU9ESTRMRGt6TGpnM05DQTJMalEyTVN3NU15NDVOREVnTmk0eE15dzVNeTQ1TURFZ1F6WXVNVE1zT1RNdU9UQXhJRE11TXpRNUxEa3pMalEySURNdU1USTVMRGt4TGpjM05pQkRNaTQxTmpnc09EY3VORGsxSURFdU9UYzNMRGd5TGprNU5TQXhMamsyTWl3M01DNDBNalVnUXpFdU9UUTRMRFUzTGpZME1TQXlMamcyTERVd0xqWTRJREl1T0RZc05UQXVOamdnUXpNdU5UY3NORFl1TlRNMElEVXVOalEzTERRMUxqUTRPU0ExTGpZME55dzBOUzQwT0RrZ1F6VXVOalEyTERRMUxqUTRPU0E0TGpBMk5TdzBOQzR3T1RJZ01USXVNalExTERReExqWTNPU0JNTVRNdU1URTJMRFF4TGpVMklFd3hPUzQzTVRVc016Y3VOek1nVERFNUxqYzJNU3d6Tnk0eU5qa2dURFl1TVRNc09UTXVPVEF4SWlCcFpEMGlSbWxzYkMweE1TSWdabWxzYkQwaUkwWkJSa0ZHUVNJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMDJMak14Tnl3NU5DNHhOakVnVERZdU1UQXlMRGswTGpFME9DQk1OaTR4TURFc09UUXVNVFE0SUV3MUxqZzFOeXc1TkM0eE1ERWdRelV1TVRNNExEa3pMamswTlNBekxqQTROU3c1TXk0ek5qVWdNaTQ0T0RFc09URXVPREE1SUVNeUxqTXhNeXc0Tnk0ME5qa2dNUzQzTWpjc09ESXVPVGsySURFdU56RXpMRGN3TGpReU5TQkRNUzQyT1Rrc05UY3VOemN4SURJdU5qQTBMRFV3TGpjeE9DQXlMall4TXl3MU1DNDJORGdnUXpNdU16TTRMRFEyTGpReE55QTFMalEwTlN3ME5TNHpNU0ExTGpVek5TdzBOUzR5TmpZZ1RERXlMakUyTXl3ME1TNDBNemtnVERFekxqQXpNeXcwTVM0ek1pQk1NVGt1TkRjNUxETTNMalUzT0NCTU1Ua3VOVEV6TERNM0xqSTBOQ0JETVRrdU5USTJMRE0zTGpFd055QXhPUzQyTkRjc016Y3VNREE0SURFNUxqYzROaXd6Tnk0d01qRWdRekU1TGpreU1pd3pOeTR3TXpRZ01qQXVNREl6TERNM0xqRTFOaUF5TUM0d01Ea3NNemN1TWpreklFd3hPUzQ1TlN3ek55NDRPRElnVERFekxqRTVPQ3cwTVM0NE1ERWdUREV5TGpNeU9DdzBNUzQ1TVRrZ1REVXVOemN5TERRMUxqY3dOQ0JETlM0M05ERXNORFV1TnpJZ015NDNPRElzTkRZdU56Y3lJRE11TVRBMkxEVXdMamN5TWlCRE15NHdPVGtzTlRBdU56Z3lJREl1TVRrNExEVTNMamd3T0NBeUxqSXhNaXczTUM0ME1qUWdRekl1TWpJMkxEZ3lMamsyTXlBeUxqZ3dPU3c0Tnk0ME1pQXpMak0zTXl3NU1TNDNNamtnUXpNdU5EWTBMRGt5TGpReUlEUXVNRFl5TERreUxqZzRNeUEwTGpZNE1pdzVNeTR4T0RFZ1F6UXVOVFkyTERreUxqazROQ0EwTGpRNE5pdzVNaTQzTnpZZ05DNDBORFlzT1RJdU5UY3lJRU16TGpZMk5TdzRPQzQxT0RnZ015NHlPVEVzT0RRdU16Y2dNeTR5TnpZc056RXVNVGN6SUVNekxqSTJNaXcxT0M0MU1pQTBMakUyTnl3MU1TNDBOallnTkM0eE56WXNOVEV1TXprMklFTTBMamt3TVN3ME55NHhOalVnTnk0d01EZ3NORFl1TURVNUlEY3VNRGs0TERRMkxqQXhOQ0JETnk0d09UUXNORFl1TURFMUlEZ3hMalUwTWl3ekxqQXpOQ0E0TVM0NU5EUXNNaTQ0TURJZ1REZ3hMamszTWl3eUxqYzROU0JET0RJdU9EYzJMREl1TWpRM0lEZ3pMalk1TWl3eUxqQTVOeUE0TkM0ek16SXNNaTR6TlRJZ1F6ZzBMamc0Tnl3eUxqVTNNeUE0TlM0eU9ERXNNeTR3T0RVZ09EVXVOVEEwTERNdU9EY3lJRU00Tnk0MU1UZ3NNVEVnT0RZdU9UWTBMRE0yTGpBNU1TQTROUzQzT0RVc05ETXVPRFUxSUVNNE5TNHlOemdzTkRjdU1UazJJRGcwTGpJeExEUTVMak0zSURneUxqWXhMRFV3TGpNeE55Qk1OeTR6TXpVc09UTXVPRFk1SUVNMkxqazVPU3c1TkM0d05qTWdOaTQyTlRnc09UUXVNVFl4SURZdU16RTNMRGswTGpFMk1TQk1OaTR6TVRjc09UUXVNVFl4SUZvZ1RUWXVNVGNzT1RNdU5qVTBJRU0yTGpRMk15dzVNeTQyT1NBMkxqYzNOQ3c1TXk0Mk1UY2dOeTR3T0RVc09UTXVORE0zSUV3NE1pNHpOVGdzTkRrdU9EZzJJRU00TkM0eE9ERXNORGd1T0RBNElEZzBMamsyTERRMUxqazNNU0E0TlM0eU9USXNORE11TnpnZ1F6ZzJMalEyTml3ek5pNHdORGtnT0RjdU1ESXpMREV4TGpBNE5TQTROUzR3TWpRc05DNHdNRGdnUXpnMExqZzBOaXd6TGpNM055QTROQzQxTlRFc01pNDVOellnT0RRdU1UUTRMREl1T0RFMklFTTRNeTQyTmpRc01pNDJNak1nT0RJdU9UZ3lMREl1TnpZMElEZ3lMakl5Tnl3ekxqSXhNeUJNT0RJdU1Ua3pMRE11TWpNMElFTTRNUzQzT1RFc015NDBOallnTnk0ek16VXNORFl1TkRVeUlEY3VNek0xTERRMkxqUTFNaUJETnk0ek1EUXNORFl1TkRZNUlEVXVNelEyTERRM0xqVXlNU0EwTGpZMk9TdzFNUzQwTnpFZ1F6UXVOall5TERVeExqVXpJRE11TnpZeExEVTRMalUxTmlBekxqYzNOU3czTVM0eE56TWdRek11Tnprc09EUXVNekk0SURRdU1UWXhMRGc0TGpVeU5DQTBMamt6Tml3NU1pNDBOellnUXpVdU1ESTJMRGt5TGprek55QTFMalF4TWl3NU15NDBOVGtnTlM0NU56TXNPVE11TmpFMUlFTTJMakE0Tnl3NU15NDJOQ0EyTGpFMU9DdzVNeTQyTlRJZ05pNHhOamtzT1RNdU5qVTBJRXcyTGpFM0xEa3pMalkxTkNCTU5pNHhOeXc1TXk0Mk5UUWdXaUlnYVdROUlrWnBiR3d0TVRJaUlHWnBiR3c5SWlNME5UVkJOalFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk55NHpNVGNzTmpndU9UZ3lJRU0zTGpnd05pdzJPQzQzTURFZ09DNHlNRElzTmpndU9USTJJRGd1TWpBeUxEWTVMalE0TnlCRE9DNHlNRElzTnpBdU1EUTNJRGN1T0RBMkxEY3dMamN6SURjdU16RTNMRGN4TGpBeE1pQkROaTQ0TWprc056RXVNamswSURZdU5ETXpMRGN4TGpBMk9TQTJMalF6TXl3M01DNDFNRGdnUXpZdU5ETXpMRFk1TGprME9DQTJMamd5T1N3Mk9TNHlOalVnTnk0ek1UY3NOamd1T1RneUlpQnBaRDBpUm1sc2JDMHhNeUlnWm1sc2JEMGlJMFpHUmtaR1JpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazAyTGpreUxEY3hMakV6TXlCRE5pNDJNekVzTnpFdU1UTXpJRFl1TkRNekxEY3dMamt3TlNBMkxqUXpNeXczTUM0MU1EZ2dRell1TkRNekxEWTVMamswT0NBMkxqZ3lPU3cyT1M0eU5qVWdOeTR6TVRjc05qZ3VPVGd5SUVNM0xqUTJMRFk0TGprZ055NDFPVFVzTmpndU9EWXhJRGN1TnpFMExEWTRMamcyTVNCRE9DNHdNRE1zTmpndU9EWXhJRGd1TWpBeUxEWTVMakE1SURndU1qQXlMRFk1TGpRNE55QkRPQzR5TURJc056QXVNRFEzSURjdU9EQTJMRGN3TGpjeklEY3VNekUzTERjeExqQXhNaUJETnk0eE56UXNOekV1TURrMElEY3VNRE01TERjeExqRXpNeUEyTGpreUxEY3hMakV6TXlCTk55NDNNVFFzTmpndU5qYzBJRU0zTGpVMU55dzJPQzQyTnpRZ055NHpPVElzTmpndU56SXpJRGN1TWpJMExEWTRMamd5TVNCRE5pNDJOellzTmprdU1UTTRJRFl1TWpRMkxEWTVMamczT1NBMkxqSTBOaXczTUM0MU1EZ2dRell1TWpRMkxEY3dMams1TkNBMkxqVXhOeXczTVM0ek1pQTJMamt5TERjeExqTXlJRU0zTGpBM09DdzNNUzR6TWlBM0xqSTBNeXczTVM0eU56RWdOeTQwTVRFc056RXVNVGMwSUVNM0xqazFPU3czTUM0NE5UY2dPQzR6T0Rrc056QXVNVEUzSURndU16ZzVMRFk1TGpRNE55QkRPQzR6T0Rrc05qa3VNREF4SURndU1URTNMRFk0TGpZM05DQTNMamN4TkN3Mk9DNDJOelFpSUdsa1BTSkdhV3hzTFRFMElpQm1hV3hzUFNJak9EQTVOMEV5SWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUWXVPVElzTnpBdU9UUTNJRU0yTGpZME9TdzNNQzQ1TkRjZ05pNDJNakVzTnpBdU5qUWdOaTQyTWpFc056QXVOVEE0SUVNMkxqWXlNU3czTUM0d01UY2dOaTQ1T0RJc05qa3VNemt5SURjdU5ERXhMRFk1TGpFME5TQkROeTQxTWpFc05qa3VNRGd5SURjdU5qSTFMRFk1TGpBME9TQTNMamN4TkN3Mk9TNHdORGtnUXpjdU9UZzJMRFk1TGpBME9TQTRMakF4TlN3Mk9TNHpOVFVnT0M0d01UVXNOamt1TkRnM0lFTTRMakF4TlN3Mk9TNDVOemdnTnk0Mk5USXNOekF1TmpBeklEY3VNakkwTERjd0xqZzFNU0JETnk0eE1UVXNOekF1T1RFMElEY3VNREVzTnpBdU9UUTNJRFl1T1RJc056QXVPVFEzSUUwM0xqY3hOQ3cyT0M0NE5qRWdRemN1TlRrMUxEWTRMamcyTVNBM0xqUTJMRFk0TGprZ055NHpNVGNzTmpndU9UZ3lJRU0yTGpneU9TdzJPUzR5TmpVZ05pNDBNek1zTmprdU9UUTRJRFl1TkRNekxEY3dMalV3T0NCRE5pNDBNek1zTnpBdU9UQTFJRFl1TmpNeExEY3hMakV6TXlBMkxqa3lMRGN4TGpFek15QkROeTR3TXprc056RXVNVE16SURjdU1UYzBMRGN4TGpBNU5DQTNMak14Tnl3M01TNHdNVElnUXpjdU9EQTJMRGN3TGpjeklEZ3VNakF5TERjd0xqQTBOeUE0TGpJd01pdzJPUzQwT0RjZ1F6Z3VNakF5TERZNUxqQTVJRGd1TURBekxEWTRMamcyTVNBM0xqY3hOQ3cyT0M0NE5qRWlJR2xrUFNKR2FXeHNMVEUxSWlCbWFXeHNQU0lqT0RBNU4wRXlJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRjdU5EUTBMRGcxTGpNMUlFTTNMamN3T0N3NE5TNHhPVGdnTnk0NU1qRXNPRFV1TXpFNUlEY3VPVEl4TERnMUxqWXlNaUJETnk0NU1qRXNPRFV1T1RJMUlEY3VOekE0TERnMkxqSTVNaUEzTGpRME5DdzROaTQwTkRRZ1F6Y3VNVGd4TERnMkxqVTVOeUEyTGprMk55dzROaTQwTnpVZ05pNDVOamNzT0RZdU1UY3pJRU0yTGprMk55dzROUzQ0TnpFZ055NHhPREVzT0RVdU5UQXlJRGN1TkRRMExEZzFMak0xSWlCcFpEMGlSbWxzYkMweE5pSWdabWxzYkQwaUkwWkdSa1pHUmlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMDNMakl6TERnMkxqVXhJRU0zTGpBM05DdzROaTQxTVNBMkxqazJOeXc0Tmk0ek9EY2dOaTQ1Tmpjc09EWXVNVGN6SUVNMkxqazJOeXc0TlM0NE56RWdOeTR4T0RFc09EVXVOVEF5SURjdU5EUTBMRGcxTGpNMUlFTTNMalV5TVN3NE5TNHpNRFVnTnk0MU9UUXNPRFV1TWpnMElEY3VOalU0TERnMUxqSTROQ0JETnk0NE1UUXNPRFV1TWpnMElEY3VPVEl4TERnMUxqUXdPQ0EzTGpreU1TdzROUzQyTWpJZ1F6Y3VPVEl4TERnMUxqa3lOU0EzTGpjd09DdzROaTR5T1RJZ055NDBORFFzT0RZdU5EUTBJRU0zTGpNMk55dzROaTQwT0RrZ055NHlPVFFzT0RZdU5URWdOeTR5TXl3NE5pNDFNU0JOTnk0Mk5UZ3NPRFV1TURrNElFTTNMalUxT0N3NE5TNHdPVGdnTnk0ME5UVXNPRFV1TVRJM0lEY3VNelV4TERnMUxqRTRPQ0JETnk0d016RXNPRFV1TXpjeklEWXVOemd4TERnMUxqZ3dOaUEyTGpjNE1TdzROaTR4TnpNZ1F6WXVOemd4TERnMkxqUTRNaUEyTGprMk5pdzROaTQyT1RjZ055NHlNeXc0Tmk0Mk9UY2dRemN1TXpNc09EWXVOamszSURjdU5ETXpMRGcyTGpZMk5pQTNMalV6T0N3NE5pNDJNRGNnUXpjdU9EVTRMRGcyTGpReU1pQTRMakV3T0N3NE5TNDVPRGtnT0M0eE1EZ3NPRFV1TmpJeUlFTTRMakV3T0N3NE5TNHpNVE1nTnk0NU1qTXNPRFV1TURrNElEY3VOalU0TERnMUxqQTVPQ0lnYVdROUlrWnBiR3d0TVRjaUlHWnBiR3c5SWlNNE1EazNRVElpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk55NHlNeXc0Tmk0ek1qSWdURGN1TVRVMExEZzJMakUzTXlCRE55NHhOVFFzT0RVdU9UTTRJRGN1TXpNekxEZzFMall5T1NBM0xqVXpPQ3c0TlM0MU1USWdURGN1TmpVNExEZzFMalEzTVNCTU55NDNNelFzT0RVdU5qSXlJRU0zTGpjek5DdzROUzQ0TlRZZ055NDFOVFVzT0RZdU1UWTBJRGN1TXpVeExEZzJMakk0TWlCTU55NHlNeXc0Tmk0ek1qSWdUVGN1TmpVNExEZzFMakk0TkNCRE55NDFPVFFzT0RVdU1qZzBJRGN1TlRJeExEZzFMak13TlNBM0xqUTBOQ3c0TlM0ek5TQkROeTR4T0RFc09EVXVOVEF5SURZdU9UWTNMRGcxTGpnM01TQTJMamsyTnl3NE5pNHhOek1nUXpZdU9UWTNMRGcyTGpNNE55QTNMakEzTkN3NE5pNDFNU0EzTGpJekxEZzJMalV4SUVNM0xqSTVOQ3c0Tmk0MU1TQTNMak0yTnl3NE5pNDBPRGtnTnk0ME5EUXNPRFl1TkRRMElFTTNMamN3T0N3NE5pNHlPVElnTnk0NU1qRXNPRFV1T1RJMUlEY3VPVEl4TERnMUxqWXlNaUJETnk0NU1qRXNPRFV1TkRBNElEY3VPREUwTERnMUxqSTROQ0EzTGpZMU9DdzROUzR5T0RRaUlHbGtQU0pHYVd4c0xURTRJaUJtYVd4c1BTSWpPREE1TjBFeUlqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVGMzTGpJM09DdzNMamMyT1NCTU56Y3VNamM0TERVeExqUXpOaUJNTVRBdU1qQTRMRGt3TGpFMklFd3hNQzR5TURnc05EWXVORGt6SUV3M055NHlOemdzTnk0M05qa2lJR2xrUFNKR2FXeHNMVEU1SWlCbWFXeHNQU0lqTkRVMVFUWTBJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFd0xqQTRNeXc1TUM0ek56VWdUREV3TGpBNE15dzBOaTQwTWpFZ1RERXdMakUwTml3ME5pNHpPRFVnVERjM0xqUXdNeXczTGpVMU5DQk1OemN1TkRBekxEVXhMalV3T0NCTU56Y3VNelF4TERVeExqVTBOQ0JNTVRBdU1EZ3pMRGt3TGpNM05TQk1NVEF1TURnekxEa3dMak0zTlNCYUlFMHhNQzR6TXpNc05EWXVOVFkwSUV3eE1DNHpNek1zT0RrdU9UUTBJRXczTnk0eE5UUXNOVEV1TXpZMUlFdzNOeTR4TlRRc055NDVPRFVnVERFd0xqTXpNeXcwTmk0MU5qUWdUREV3TGpNek15dzBOaTQxTmpRZ1dpSWdhV1E5SWtacGJHd3RNakFpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEd3ZaejRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TWpVdU56TTNMRGc0TGpZME55Qk1NVEU0TGpBNU9DdzVNUzQ1T0RFZ1RERXhPQzR3T1Rnc09EUWdUREV3Tmk0Mk16a3NPRGd1TnpFeklFd3hNRFl1TmpNNUxEazJMams0TWlCTU9Ua3NNVEF3TGpNeE5TQk1NVEV5TGpNMk9Td3hNRE11T1RZeElFd3hNalV1TnpNM0xEZzRMalkwTnlJZ2FXUTlJa2x0Y0c5eWRHVmtMVXhoZVdWeWN5MURiM0I1TFRJaUlHWnBiR3c5SWlNME5UVkJOalFpSUhOclpYUmphRHAwZVhCbFBTSk5VMU5vWVhCbFIzSnZkWEFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ1BDOW5QZ29nSUNBZ0lDQWdJRHd2Wno0S0lDQWdJRHd2Wno0S1BDOXpkbWMrJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdGF0ZUluc3RydWN0aW9ucztcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogVE9ETzogRml4IHVwIGFsbCBcIm5ldyBUSFJFRVwiIGluc3RhbnRpYXRpb25zIHRvIGltcHJvdmUgcGVyZm9ybWFuY2UuXG4gKi9cbnZhciBTZW5zb3JTYW1wbGUgPSByZXF1aXJlKCcuL3NlbnNvci1zYW1wbGUuanMnKTtcbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4uL21hdGgtdXRpbC5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbnZhciBERUJVRyA9IGZhbHNlO1xuXG4vKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIGEgc2ltcGxlIGNvbXBsZW1lbnRhcnkgZmlsdGVyLCB3aGljaCBmdXNlcyBneXJvc2NvcGUgYW5kXG4gKiBhY2NlbGVyb21ldGVyIGRhdGEgZnJvbSB0aGUgJ2RldmljZW1vdGlvbicgZXZlbnQuXG4gKlxuICogQWNjZWxlcm9tZXRlciBkYXRhIGlzIHZlcnkgbm9pc3ksIGJ1dCBzdGFibGUgb3ZlciB0aGUgbG9uZyB0ZXJtLlxuICogR3lyb3Njb3BlIGRhdGEgaXMgc21vb3RoLCBidXQgdGVuZHMgdG8gZHJpZnQgb3ZlciB0aGUgbG9uZyB0ZXJtLlxuICpcbiAqIFRoaXMgZnVzaW9uIGlzIHJlbGF0aXZlbHkgc2ltcGxlOlxuICogMS4gR2V0IG9yaWVudGF0aW9uIGVzdGltYXRlcyBmcm9tIGFjY2VsZXJvbWV0ZXIgYnkgYXBwbHlpbmcgYSBsb3ctcGFzcyBmaWx0ZXJcbiAqICAgIG9uIHRoYXQgZGF0YS5cbiAqIDIuIEdldCBvcmllbnRhdGlvbiBlc3RpbWF0ZXMgZnJvbSBneXJvc2NvcGUgYnkgaW50ZWdyYXRpbmcgb3ZlciB0aW1lLlxuICogMy4gQ29tYmluZSB0aGUgdHdvIGVzdGltYXRlcywgd2VpZ2hpbmcgKDEpIGluIHRoZSBsb25nIHRlcm0sIGJ1dCAoMikgZm9yIHRoZVxuICogICAgc2hvcnQgdGVybS5cbiAqL1xuZnVuY3Rpb24gQ29tcGxlbWVudGFyeUZpbHRlcihrRmlsdGVyKSB7XG4gIHRoaXMua0ZpbHRlciA9IGtGaWx0ZXI7XG5cbiAgLy8gUmF3IHNlbnNvciBtZWFzdXJlbWVudHMuXG4gIHRoaXMuY3VycmVudEFjY2VsTWVhc3VyZW1lbnQgPSBuZXcgU2Vuc29yU2FtcGxlKCk7XG4gIHRoaXMuY3VycmVudEd5cm9NZWFzdXJlbWVudCA9IG5ldyBTZW5zb3JTYW1wbGUoKTtcbiAgdGhpcy5wcmV2aW91c0d5cm9NZWFzdXJlbWVudCA9IG5ldyBTZW5zb3JTYW1wbGUoKTtcblxuICAvLyBDdXJyZW50IGZpbHRlciBvcmllbnRhdGlvblxuICB0aGlzLmZpbHRlclEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICB0aGlzLnByZXZpb3VzRmlsdGVyUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG5cbiAgLy8gT3JpZW50YXRpb24gYmFzZWQgb24gdGhlIGFjY2VsZXJvbWV0ZXIuXG4gIHRoaXMuYWNjZWxRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgLy8gV2hldGhlciBvciBub3QgdGhlIG9yaWVudGF0aW9uIGhhcyBiZWVuIGluaXRpYWxpemVkLlxuICB0aGlzLmlzT3JpZW50YXRpb25Jbml0aWFsaXplZCA9IGZhbHNlO1xuICAvLyBSdW5uaW5nIGVzdGltYXRlIG9mIGdyYXZpdHkgYmFzZWQgb24gdGhlIGN1cnJlbnQgb3JpZW50YXRpb24uXG4gIHRoaXMuZXN0aW1hdGVkR3Jhdml0eSA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG4gIC8vIE1lYXN1cmVkIGdyYXZpdHkgYmFzZWQgb24gYWNjZWxlcm9tZXRlci5cbiAgdGhpcy5tZWFzdXJlZEdyYXZpdHkgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMygpO1xuXG4gIC8vIERlYnVnIG9ubHkgcXVhdGVybmlvbiBvZiBneXJvLWJhc2VkIG9yaWVudGF0aW9uLlxuICB0aGlzLmd5cm9JbnRlZ3JhbFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xufVxuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5hZGRBY2NlbE1lYXN1cmVtZW50ID0gZnVuY3Rpb24odmVjdG9yLCB0aW1lc3RhbXBTKSB7XG4gIHRoaXMuY3VycmVudEFjY2VsTWVhc3VyZW1lbnQuc2V0KHZlY3RvciwgdGltZXN0YW1wUyk7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5hZGRHeXJvTWVhc3VyZW1lbnQgPSBmdW5jdGlvbih2ZWN0b3IsIHRpbWVzdGFtcFMpIHtcbiAgdGhpcy5jdXJyZW50R3lyb01lYXN1cmVtZW50LnNldCh2ZWN0b3IsIHRpbWVzdGFtcFMpO1xuXG4gIHZhciBkZWx0YVQgPSB0aW1lc3RhbXBTIC0gdGhpcy5wcmV2aW91c0d5cm9NZWFzdXJlbWVudC50aW1lc3RhbXBTO1xuICBpZiAoVXRpbC5pc1RpbWVzdGFtcERlbHRhVmFsaWQoZGVsdGFUKSkge1xuICAgIHRoaXMucnVuXygpO1xuICB9XG5cbiAgdGhpcy5wcmV2aW91c0d5cm9NZWFzdXJlbWVudC5jb3B5KHRoaXMuY3VycmVudEd5cm9NZWFzdXJlbWVudCk7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5ydW5fID0gZnVuY3Rpb24oKSB7XG5cbiAgaWYgKCF0aGlzLmlzT3JpZW50YXRpb25Jbml0aWFsaXplZCkge1xuICAgIHRoaXMuYWNjZWxRID0gdGhpcy5hY2NlbFRvUXVhdGVybmlvbl8odGhpcy5jdXJyZW50QWNjZWxNZWFzdXJlbWVudC5zYW1wbGUpO1xuICAgIHRoaXMucHJldmlvdXNGaWx0ZXJRLmNvcHkodGhpcy5hY2NlbFEpO1xuICAgIHRoaXMuaXNPcmllbnRhdGlvbkluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgZGVsdGFUID0gdGhpcy5jdXJyZW50R3lyb01lYXN1cmVtZW50LnRpbWVzdGFtcFMgLVxuICAgICAgdGhpcy5wcmV2aW91c0d5cm9NZWFzdXJlbWVudC50aW1lc3RhbXBTO1xuXG4gIC8vIENvbnZlcnQgZ3lybyByb3RhdGlvbiB2ZWN0b3IgdG8gYSBxdWF0ZXJuaW9uIGRlbHRhLlxuICB2YXIgZ3lyb0RlbHRhUSA9IHRoaXMuZ3lyb1RvUXVhdGVybmlvbkRlbHRhXyh0aGlzLmN1cnJlbnRHeXJvTWVhc3VyZW1lbnQuc2FtcGxlLCBkZWx0YVQpO1xuICB0aGlzLmd5cm9JbnRlZ3JhbFEubXVsdGlwbHkoZ3lyb0RlbHRhUSk7XG5cbiAgLy8gZmlsdGVyXzEgPSBLICogKGZpbHRlcl8wICsgZ3lybyAqIGRUKSArICgxIC0gSykgKiBhY2NlbC5cbiAgdGhpcy5maWx0ZXJRLmNvcHkodGhpcy5wcmV2aW91c0ZpbHRlclEpO1xuICB0aGlzLmZpbHRlclEubXVsdGlwbHkoZ3lyb0RlbHRhUSk7XG5cbiAgLy8gQ2FsY3VsYXRlIHRoZSBkZWx0YSBiZXR3ZWVuIHRoZSBjdXJyZW50IGVzdGltYXRlZCBncmF2aXR5IGFuZCB0aGUgcmVhbFxuICAvLyBncmF2aXR5IHZlY3RvciBmcm9tIGFjY2VsZXJvbWV0ZXIuXG4gIHZhciBpbnZGaWx0ZXJRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgaW52RmlsdGVyUS5jb3B5KHRoaXMuZmlsdGVyUSk7XG4gIGludkZpbHRlclEuaW52ZXJzZSgpO1xuXG4gIHRoaXMuZXN0aW1hdGVkR3Jhdml0eS5zZXQoMCwgMCwgLTEpO1xuICB0aGlzLmVzdGltYXRlZEdyYXZpdHkuYXBwbHlRdWF0ZXJuaW9uKGludkZpbHRlclEpO1xuICB0aGlzLmVzdGltYXRlZEdyYXZpdHkubm9ybWFsaXplKCk7XG5cbiAgdGhpcy5tZWFzdXJlZEdyYXZpdHkuY29weSh0aGlzLmN1cnJlbnRBY2NlbE1lYXN1cmVtZW50LnNhbXBsZSk7XG4gIHRoaXMubWVhc3VyZWRHcmF2aXR5Lm5vcm1hbGl6ZSgpO1xuXG4gIC8vIENvbXBhcmUgZXN0aW1hdGVkIGdyYXZpdHkgd2l0aCBtZWFzdXJlZCBncmF2aXR5LCBnZXQgdGhlIGRlbHRhIHF1YXRlcm5pb25cbiAgLy8gYmV0d2VlbiB0aGUgdHdvLlxuICB2YXIgZGVsdGFRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgZGVsdGFRLnNldEZyb21Vbml0VmVjdG9ycyh0aGlzLmVzdGltYXRlZEdyYXZpdHksIHRoaXMubWVhc3VyZWRHcmF2aXR5KTtcbiAgZGVsdGFRLmludmVyc2UoKTtcblxuICBpZiAoREVCVUcpIHtcbiAgICBjb25zb2xlLmxvZygnRGVsdGE6ICVkIGRlZywgR19lc3Q6ICglcywgJXMsICVzKSwgR19tZWFzOiAoJXMsICVzLCAlcyknLFxuICAgICAgICAgICAgICAgIE1hdGhVdGlsLnJhZFRvRGVnICogVXRpbC5nZXRRdWF0ZXJuaW9uQW5nbGUoZGVsdGFRKSxcbiAgICAgICAgICAgICAgICAodGhpcy5lc3RpbWF0ZWRHcmF2aXR5LngpLnRvRml4ZWQoMSksXG4gICAgICAgICAgICAgICAgKHRoaXMuZXN0aW1hdGVkR3Jhdml0eS55KS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgICAgICh0aGlzLmVzdGltYXRlZEdyYXZpdHkueikudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5tZWFzdXJlZEdyYXZpdHkueCkudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5tZWFzdXJlZEdyYXZpdHkueSkudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5tZWFzdXJlZEdyYXZpdHkueikudG9GaXhlZCgxKSk7XG4gIH1cblxuICAvLyBDYWxjdWxhdGUgdGhlIFNMRVJQIHRhcmdldDogY3VycmVudCBvcmllbnRhdGlvbiBwbHVzIHRoZSBtZWFzdXJlZC1lc3RpbWF0ZWRcbiAgLy8gcXVhdGVybmlvbiBkZWx0YS5cbiAgdmFyIHRhcmdldFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICB0YXJnZXRRLmNvcHkodGhpcy5maWx0ZXJRKTtcbiAgdGFyZ2V0US5tdWx0aXBseShkZWx0YVEpO1xuXG4gIC8vIFNMRVJQIGZhY3RvcjogMCBpcyBwdXJlIGd5cm8sIDEgaXMgcHVyZSBhY2NlbC5cbiAgdGhpcy5maWx0ZXJRLnNsZXJwKHRhcmdldFEsIDEgLSB0aGlzLmtGaWx0ZXIpO1xuXG4gIHRoaXMucHJldmlvdXNGaWx0ZXJRLmNvcHkodGhpcy5maWx0ZXJRKTtcbn07XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLmdldE9yaWVudGF0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmZpbHRlclE7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5hY2NlbFRvUXVhdGVybmlvbl8gPSBmdW5jdGlvbihhY2NlbCkge1xuICB2YXIgbm9ybUFjY2VsID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgbm9ybUFjY2VsLmNvcHkoYWNjZWwpO1xuICBub3JtQWNjZWwubm9ybWFsaXplKCk7XG4gIHZhciBxdWF0ID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgcXVhdC5zZXRGcm9tVW5pdFZlY3RvcnMobmV3IE1hdGhVdGlsLlZlY3RvcjMoMCwgMCwgLTEpLCBub3JtQWNjZWwpO1xuICBxdWF0LmludmVyc2UoKTtcbiAgcmV0dXJuIHF1YXQ7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5neXJvVG9RdWF0ZXJuaW9uRGVsdGFfID0gZnVuY3Rpb24oZ3lybywgZHQpIHtcbiAgLy8gRXh0cmFjdCBheGlzIGFuZCBhbmdsZSBmcm9tIHRoZSBneXJvc2NvcGUgZGF0YS5cbiAgdmFyIHF1YXQgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICB2YXIgYXhpcyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG4gIGF4aXMuY29weShneXJvKTtcbiAgYXhpcy5ub3JtYWxpemUoKTtcbiAgcXVhdC5zZXRGcm9tQXhpc0FuZ2xlKGF4aXMsIGd5cm8ubGVuZ3RoKCkgKiBkdCk7XG4gIHJldHVybiBxdWF0O1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBsZW1lbnRhcnlGaWx0ZXI7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIENvbXBsZW1lbnRhcnlGaWx0ZXIgPSByZXF1aXJlKCcuL2NvbXBsZW1lbnRhcnktZmlsdGVyLmpzJyk7XG52YXIgUG9zZVByZWRpY3RvciA9IHJlcXVpcmUoJy4vcG9zZS1wcmVkaWN0b3IuanMnKTtcbnZhciBUb3VjaFBhbm5lciA9IHJlcXVpcmUoJy4uL3RvdWNoLXBhbm5lci5qcycpO1xudmFyIE1hdGhVdGlsID0gcmVxdWlyZSgnLi4vbWF0aC11dGlsLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxuLyoqXG4gKiBUaGUgcG9zZSBzZW5zb3IsIGltcGxlbWVudGVkIHVzaW5nIERldmljZU1vdGlvbiBBUElzLlxuICovXG5mdW5jdGlvbiBGdXNpb25Qb3NlU2Vuc29yKCkge1xuICB0aGlzLmRldmljZUlkID0gJ3dlYnZyLXBvbHlmaWxsOmZ1c2VkJztcbiAgdGhpcy5kZXZpY2VOYW1lID0gJ1ZSIFBvc2l0aW9uIERldmljZSAod2VidnItcG9seWZpbGw6ZnVzZWQpJztcblxuICB0aGlzLmFjY2VsZXJvbWV0ZXIgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMygpO1xuICB0aGlzLmd5cm9zY29wZSA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2RldmljZW1vdGlvbicsIHRoaXMub25EZXZpY2VNb3Rpb25DaGFuZ2VfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb3JpZW50YXRpb25jaGFuZ2UnLCB0aGlzLm9uU2NyZWVuT3JpZW50YXRpb25DaGFuZ2VfLmJpbmQodGhpcykpO1xuXG4gIHRoaXMuZmlsdGVyID0gbmV3IENvbXBsZW1lbnRhcnlGaWx0ZXIoV2ViVlJDb25maWcuS19GSUxURVIpO1xuICB0aGlzLnBvc2VQcmVkaWN0b3IgPSBuZXcgUG9zZVByZWRpY3RvcihXZWJWUkNvbmZpZy5QUkVESUNUSU9OX1RJTUVfUyk7XG4gIHRoaXMudG91Y2hQYW5uZXIgPSBuZXcgVG91Y2hQYW5uZXIoKTtcblxuICB0aGlzLmZpbHRlclRvV29ybGRRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcblxuICAvLyBTZXQgdGhlIGZpbHRlciB0byB3b3JsZCB0cmFuc2Zvcm0sIGRlcGVuZGluZyBvbiBPUy5cbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHRoaXMuZmlsdGVyVG9Xb3JsZFEuc2V0RnJvbUF4aXNBbmdsZShuZXcgTWF0aFV0aWwuVmVjdG9yMygxLCAwLCAwKSwgTWF0aC5QSS8yKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmZpbHRlclRvV29ybGRRLnNldEZyb21BeGlzQW5nbGUobmV3IE1hdGhVdGlsLlZlY3RvcjMoMSwgMCwgMCksIC1NYXRoLlBJLzIpO1xuICB9XG5cbiAgdGhpcy5sYW5kc2NhcGVBZGp1c3RRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgdGhpcy5sYW5kc2NhcGVBZGp1c3RRLnNldEZyb21BeGlzQW5nbGUobmV3IE1hdGhVdGlsLlZlY3RvcjMoMCwgMCwgMSksXG4gICAgICAod2luZG93Lm9yaWVudGF0aW9uIC8gTWF0aC5QSSkgLyAyKTtcblxuICAvLyBBZGp1c3QgdGhpcyBmaWx0ZXIgZm9yIGJlaW5nIGluIGxhbmRzY2FwZSBtb2RlLlxuICBpZiAoVXRpbC5pc0xhbmRzY2FwZU1vZGUoKSkge1xuICAgIHRoaXMuZmlsdGVyVG9Xb3JsZFEubXVsdGlwbHkodGhpcy5sYW5kc2NhcGVBZGp1c3RRKTtcbiAgfVxuICB0aGlzLndvcmxkVG9TY3JlZW5RID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcblxuICB0aGlzLnNldFNjcmVlblRyYW5zZm9ybV8oKTtcblxuICAvLyBLZWVwIHRyYWNrIG9mIGEgcmVzZXQgdHJhbnNmb3JtIGZvciByZXNldFNlbnNvci5cbiAgdGhpcy5yZXNldFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuXG4gIHRoaXMuaXNGaXJlZm94QW5kcm9pZCA9IFV0aWwuaXNGaXJlZm94QW5kcm9pZCgpO1xuICB0aGlzLmlzSU9TID0gVXRpbC5pc0lPUygpO1xuXG4gIHRoaXMub3JpZW50YXRpb25PdXRfID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbn1cblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUuZ2V0UG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgLy8gVGhpcyBQb3NlU2Vuc29yIGRvZXNuJ3Qgc3VwcG9ydCBwb3NpdGlvblxuICByZXR1cm4gbnVsbDtcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLmdldE9yaWVudGF0aW9uID0gZnVuY3Rpb24oKSB7XG4gIC8vIENvbnZlcnQgZnJvbSBmaWx0ZXIgc3BhY2UgdG8gdGhlIHRoZSBzYW1lIHN5c3RlbSB1c2VkIGJ5IHRoZVxuICAvLyBkZXZpY2VvcmllbnRhdGlvbiBldmVudC5cbiAgdmFyIG9yaWVudGF0aW9uID0gdGhpcy5maWx0ZXIuZ2V0T3JpZW50YXRpb24oKTtcblxuICAvLyBQcmVkaWN0IG9yaWVudGF0aW9uLlxuICB0aGlzLnByZWRpY3RlZFEgPSB0aGlzLnBvc2VQcmVkaWN0b3IuZ2V0UHJlZGljdGlvbihvcmllbnRhdGlvbiwgdGhpcy5neXJvc2NvcGUsIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTKTtcblxuICAvLyBDb252ZXJ0IHRvIFRIUkVFIGNvb3JkaW5hdGUgc3lzdGVtOiAtWiBmb3J3YXJkLCBZIHVwLCBYIHJpZ2h0LlxuICB2YXIgb3V0ID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgb3V0LmNvcHkodGhpcy5maWx0ZXJUb1dvcmxkUSk7XG4gIG91dC5tdWx0aXBseSh0aGlzLnJlc2V0USk7XG4gIGlmICghV2ViVlJDb25maWcuVE9VQ0hfUEFOTkVSX0RJU0FCTEVEKSB7XG4gICAgb3V0Lm11bHRpcGx5KHRoaXMudG91Y2hQYW5uZXIuZ2V0T3JpZW50YXRpb24oKSk7XG4gIH1cbiAgb3V0Lm11bHRpcGx5KHRoaXMucHJlZGljdGVkUSk7XG4gIG91dC5tdWx0aXBseSh0aGlzLndvcmxkVG9TY3JlZW5RKTtcblxuICAvLyBIYW5kbGUgdGhlIHlhdy1vbmx5IGNhc2UuXG4gIGlmIChXZWJWUkNvbmZpZy5ZQVdfT05MWSkge1xuICAgIC8vIE1ha2UgYSBxdWF0ZXJuaW9uIHRoYXQgb25seSB0dXJucyBhcm91bmQgdGhlIFktYXhpcy5cbiAgICBvdXQueCA9IDA7XG4gICAgb3V0LnogPSAwO1xuICAgIG91dC5ub3JtYWxpemUoKTtcbiAgfVxuXG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzBdID0gb3V0Lng7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzFdID0gb3V0Lnk7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzJdID0gb3V0Lno7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzNdID0gb3V0Lnc7XG4gIHJldHVybiB0aGlzLm9yaWVudGF0aW9uT3V0Xztcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLnJlc2V0UG9zZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIVV0aWwuaXNMYW5kc2NhcGVNb2RlKCkpIHtcbiAgICB0aGlzLnJlc2V0US5tdWx0aXBseSh0aGlzLmxhbmRzY2FwZUFkanVzdFEpO1xuICB9XG5cbiAgLy8gUmVkdWNlIHRvIGludmVydGVkIHlhdy1vbmx5LlxuICB0aGlzLnJlc2V0US5jb3B5KHRoaXMuZmlsdGVyLmdldE9yaWVudGF0aW9uKCkpO1xuICB0aGlzLnJlc2V0US54ID0gMDtcbiAgdGhpcy5yZXNldFEueSA9IDA7XG4gIHRoaXMucmVzZXRRLnogKj0gLTE7XG4gIHRoaXMucmVzZXRRLm5vcm1hbGl6ZSgpO1xuXG4gIGlmICghV2ViVlJDb25maWcuVE9VQ0hfUEFOTkVSX0RJU0FCTEVEKSB7XG4gICAgdGhpcy50b3VjaFBhbm5lci5yZXNldFNlbnNvcigpO1xuICB9XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5vbkRldmljZU1vdGlvbkNoYW5nZV8gPSBmdW5jdGlvbihkZXZpY2VNb3Rpb24pIHtcbiAgdmFyIGFjY0dyYXZpdHkgPSBkZXZpY2VNb3Rpb24uYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eTtcbiAgdmFyIHJvdFJhdGUgPSBkZXZpY2VNb3Rpb24ucm90YXRpb25SYXRlO1xuICB2YXIgdGltZXN0YW1wUyA9IGRldmljZU1vdGlvbi50aW1lU3RhbXAgLyAxMDAwO1xuXG4gIC8vIEZpcmVmb3ggQW5kcm9pZCB0aW1lU3RhbXAgcmV0dXJucyBvbmUgdGhvdXNhbmR0aCBvZiBhIG1pbGxpc2Vjb25kLlxuICBpZiAodGhpcy5pc0ZpcmVmb3hBbmRyb2lkKSB7XG4gICAgdGltZXN0YW1wUyAvPSAxMDAwO1xuICB9XG5cbiAgdmFyIGRlbHRhUyA9IHRpbWVzdGFtcFMgLSB0aGlzLnByZXZpb3VzVGltZXN0YW1wUztcbiAgaWYgKGRlbHRhUyA8PSBVdGlsLk1JTl9USU1FU1RFUCB8fCBkZWx0YVMgPiBVdGlsLk1BWF9USU1FU1RFUCkge1xuICAgIGNvbnNvbGUud2FybignSW52YWxpZCB0aW1lc3RhbXBzIGRldGVjdGVkLiBUaW1lIHN0ZXAgYmV0d2VlbiBzdWNjZXNzaXZlICcgK1xuICAgICAgICAgICAgICAgICAnZ3lyb3Njb3BlIHNlbnNvciBzYW1wbGVzIGlzIHZlcnkgc21hbGwgb3Igbm90IG1vbm90b25pYycpO1xuICAgIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTID0gdGltZXN0YW1wUztcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5hY2NlbGVyb21ldGVyLnNldCgtYWNjR3Jhdml0eS54LCAtYWNjR3Jhdml0eS55LCAtYWNjR3Jhdml0eS56KTtcbiAgdGhpcy5neXJvc2NvcGUuc2V0KHJvdFJhdGUuYWxwaGEsIHJvdFJhdGUuYmV0YSwgcm90UmF0ZS5nYW1tYSk7XG5cbiAgLy8gV2l0aCBpT1MgYW5kIEZpcmVmb3ggQW5kcm9pZCwgcm90YXRpb25SYXRlIGlzIHJlcG9ydGVkIGluIGRlZ3JlZXMsXG4gIC8vIHNvIHdlIGZpcnN0IGNvbnZlcnQgdG8gcmFkaWFucy5cbiAgaWYgKHRoaXMuaXNJT1MgfHwgdGhpcy5pc0ZpcmVmb3hBbmRyb2lkKSB7XG4gICAgdGhpcy5neXJvc2NvcGUubXVsdGlwbHlTY2FsYXIoTWF0aC5QSSAvIDE4MCk7XG4gIH1cblxuICB0aGlzLmZpbHRlci5hZGRBY2NlbE1lYXN1cmVtZW50KHRoaXMuYWNjZWxlcm9tZXRlciwgdGltZXN0YW1wUyk7XG4gIHRoaXMuZmlsdGVyLmFkZEd5cm9NZWFzdXJlbWVudCh0aGlzLmd5cm9zY29wZSwgdGltZXN0YW1wUyk7XG5cbiAgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMgPSB0aW1lc3RhbXBTO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUub25TY3JlZW5PcmllbnRhdGlvbkNoYW5nZV8gPVxuICAgIGZ1bmN0aW9uKHNjcmVlbk9yaWVudGF0aW9uKSB7XG4gIHRoaXMuc2V0U2NyZWVuVHJhbnNmb3JtXygpO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUuc2V0U2NyZWVuVHJhbnNmb3JtXyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLndvcmxkVG9TY3JlZW5RLnNldCgwLCAwLCAwLCAxKTtcbiAgc3dpdGNoICh3aW5kb3cub3JpZW50YXRpb24pIHtcbiAgICBjYXNlIDA6XG4gICAgICBicmVhaztcbiAgICBjYXNlIDkwOlxuICAgICAgdGhpcy53b3JsZFRvU2NyZWVuUS5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBNYXRoVXRpbC5WZWN0b3IzKDAsIDAsIDEpLCAtTWF0aC5QSS8yKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgLTkwOlxuICAgICAgdGhpcy53b3JsZFRvU2NyZWVuUS5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBNYXRoVXRpbC5WZWN0b3IzKDAsIDAsIDEpLCBNYXRoLlBJLzIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAxODA6XG4gICAgICAvLyBUT0RPLlxuICAgICAgYnJlYWs7XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBGdXNpb25Qb3NlU2Vuc29yO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4uL21hdGgtdXRpbC5qcycpO1xudmFyIERFQlVHID0gZmFsc2U7XG5cbi8qKlxuICogR2l2ZW4gYW4gb3JpZW50YXRpb24gYW5kIHRoZSBneXJvc2NvcGUgZGF0YSwgcHJlZGljdHMgdGhlIGZ1dHVyZSBvcmllbnRhdGlvblxuICogb2YgdGhlIGhlYWQuIFRoaXMgbWFrZXMgcmVuZGVyaW5nIGFwcGVhciBmYXN0ZXIuXG4gKlxuICogQWxzbyBzZWU6IGh0dHA6Ly9tc2wuY3MudWl1Yy5lZHUvfmxhdmFsbGUvcGFwZXJzL0xhdlllckthdEFudDE0LnBkZlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVkaWN0aW9uVGltZVMgdGltZSBmcm9tIGhlYWQgbW92ZW1lbnQgdG8gdGhlIGFwcGVhcmFuY2Ugb2ZcbiAqIHRoZSBjb3JyZXNwb25kaW5nIGltYWdlLlxuICovXG5mdW5jdGlvbiBQb3NlUHJlZGljdG9yKHByZWRpY3Rpb25UaW1lUykge1xuICB0aGlzLnByZWRpY3Rpb25UaW1lUyA9IHByZWRpY3Rpb25UaW1lUztcblxuICAvLyBUaGUgcXVhdGVybmlvbiBjb3JyZXNwb25kaW5nIHRvIHRoZSBwcmV2aW91cyBzdGF0ZS5cbiAgdGhpcy5wcmV2aW91c1EgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICAvLyBQcmV2aW91cyB0aW1lIGEgcHJlZGljdGlvbiBvY2N1cnJlZC5cbiAgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMgPSBudWxsO1xuXG4gIC8vIFRoZSBkZWx0YSBxdWF0ZXJuaW9uIHRoYXQgYWRqdXN0cyB0aGUgY3VycmVudCBwb3NlLlxuICB0aGlzLmRlbHRhUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIC8vIFRoZSBvdXRwdXQgcXVhdGVybmlvbi5cbiAgdGhpcy5vdXRRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbn1cblxuUG9zZVByZWRpY3Rvci5wcm90b3R5cGUuZ2V0UHJlZGljdGlvbiA9IGZ1bmN0aW9uKGN1cnJlbnRRLCBneXJvLCB0aW1lc3RhbXBTKSB7XG4gIGlmICghdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMpIHtcbiAgICB0aGlzLnByZXZpb3VzUS5jb3B5KGN1cnJlbnRRKTtcbiAgICB0aGlzLnByZXZpb3VzVGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG4gICAgcmV0dXJuIGN1cnJlbnRRO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIGF4aXMgYW5kIGFuZ2xlIGJhc2VkIG9uIGd5cm9zY29wZSByb3RhdGlvbiByYXRlIGRhdGEuXG4gIHZhciBheGlzID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgYXhpcy5jb3B5KGd5cm8pO1xuICBheGlzLm5vcm1hbGl6ZSgpO1xuXG4gIHZhciBhbmd1bGFyU3BlZWQgPSBneXJvLmxlbmd0aCgpO1xuXG4gIC8vIElmIHdlJ3JlIHJvdGF0aW5nIHNsb3dseSwgZG9uJ3QgZG8gcHJlZGljdGlvbi5cbiAgaWYgKGFuZ3VsYXJTcGVlZCA8IE1hdGhVdGlsLmRlZ1RvUmFkICogMjApIHtcbiAgICBpZiAoREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNb3Zpbmcgc2xvd2x5LCBhdCAlcyBkZWcvczogbm8gcHJlZGljdGlvbicsXG4gICAgICAgICAgICAgICAgICAoTWF0aFV0aWwucmFkVG9EZWcgKiBhbmd1bGFyU3BlZWQpLnRvRml4ZWQoMSkpO1xuICAgIH1cbiAgICB0aGlzLm91dFEuY29weShjdXJyZW50USk7XG4gICAgdGhpcy5wcmV2aW91c1EuY29weShjdXJyZW50USk7XG4gICAgcmV0dXJuIHRoaXMub3V0UTtcbiAgfVxuXG4gIC8vIEdldCB0aGUgcHJlZGljdGVkIGFuZ2xlIGJhc2VkIG9uIHRoZSB0aW1lIGRlbHRhIGFuZCBsYXRlbmN5LlxuICB2YXIgZGVsdGFUID0gdGltZXN0YW1wUyAtIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTO1xuICB2YXIgcHJlZGljdEFuZ2xlID0gYW5ndWxhclNwZWVkICogdGhpcy5wcmVkaWN0aW9uVGltZVM7XG5cbiAgdGhpcy5kZWx0YVEuc2V0RnJvbUF4aXNBbmdsZShheGlzLCBwcmVkaWN0QW5nbGUpO1xuICB0aGlzLm91dFEuY29weSh0aGlzLnByZXZpb3VzUSk7XG4gIHRoaXMub3V0US5tdWx0aXBseSh0aGlzLmRlbHRhUSk7XG5cbiAgdGhpcy5wcmV2aW91c1EuY29weShjdXJyZW50USk7XG5cbiAgcmV0dXJuIHRoaXMub3V0UTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBQb3NlUHJlZGljdG9yO1xuIiwiZnVuY3Rpb24gU2Vuc29yU2FtcGxlKHNhbXBsZSwgdGltZXN0YW1wUykge1xuICB0aGlzLnNldChzYW1wbGUsIHRpbWVzdGFtcFMpO1xufTtcblxuU2Vuc29yU2FtcGxlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihzYW1wbGUsIHRpbWVzdGFtcFMpIHtcbiAgdGhpcy5zYW1wbGUgPSBzYW1wbGU7XG4gIHRoaXMudGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG59O1xuXG5TZW5zb3JTYW1wbGUucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbihzZW5zb3JTYW1wbGUpIHtcbiAgdGhpcy5zZXQoc2Vuc29yU2FtcGxlLnNhbXBsZSwgc2Vuc29yU2FtcGxlLnRpbWVzdGFtcFMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZW5zb3JTYW1wbGU7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIE1hdGhVdGlsID0gcmVxdWlyZSgnLi9tYXRoLXV0aWwuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbnZhciBST1RBVEVfU1BFRUQgPSAwLjU7XG4vKipcbiAqIFByb3ZpZGVzIGEgcXVhdGVybmlvbiByZXNwb25zaWJsZSBmb3IgcHJlLXBhbm5pbmcgdGhlIHNjZW5lIGJlZm9yZSBmdXJ0aGVyXG4gKiB0cmFuc2Zvcm1hdGlvbnMgZHVlIHRvIGRldmljZSBzZW5zb3JzLlxuICovXG5mdW5jdGlvbiBUb3VjaFBhbm5lcigpIHtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydF8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kXy5iaW5kKHRoaXMpKTtcblxuICB0aGlzLmlzVG91Y2hpbmcgPSBmYWxzZTtcbiAgdGhpcy5yb3RhdGVTdGFydCA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRW5kID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcbiAgdGhpcy5yb3RhdGVEZWx0YSA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG5cbiAgdGhpcy50aGV0YSA9IDA7XG4gIHRoaXMub3JpZW50YXRpb24gPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xufVxuXG5Ub3VjaFBhbm5lci5wcm90b3R5cGUuZ2V0T3JpZW50YXRpb24gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vcmllbnRhdGlvbi5zZXRGcm9tRXVsZXJYWVooMCwgMCwgdGhpcy50aGV0YSk7XG4gIHJldHVybiB0aGlzLm9yaWVudGF0aW9uO1xufTtcblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLnJlc2V0U2Vuc29yID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMudGhldGEgPSAwO1xufTtcblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLm9uVG91Y2hTdGFydF8gPSBmdW5jdGlvbihlKSB7XG4gIC8vIE9ubHkgcmVzcG9uZCBpZiB0aGVyZSBpcyBleGFjdGx5IG9uZSB0b3VjaC5cbiAgaWYgKGUudG91Y2hlcy5sZW5ndGggIT0gMSkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLnJvdGF0ZVN0YXJ0LnNldChlLnRvdWNoZXNbMF0ucGFnZVgsIGUudG91Y2hlc1swXS5wYWdlWSk7XG4gIHRoaXMuaXNUb3VjaGluZyA9IHRydWU7XG59O1xuXG5Ub3VjaFBhbm5lci5wcm90b3R5cGUub25Ub3VjaE1vdmVfID0gZnVuY3Rpb24oZSkge1xuICBpZiAoIXRoaXMuaXNUb3VjaGluZykge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLnJvdGF0ZUVuZC5zZXQoZS50b3VjaGVzWzBdLnBhZ2VYLCBlLnRvdWNoZXNbMF0ucGFnZVkpO1xuICB0aGlzLnJvdGF0ZURlbHRhLnN1YlZlY3RvcnModGhpcy5yb3RhdGVFbmQsIHRoaXMucm90YXRlU3RhcnQpO1xuICB0aGlzLnJvdGF0ZVN0YXJ0LmNvcHkodGhpcy5yb3RhdGVFbmQpO1xuXG4gIC8vIE9uIGlPUywgZGlyZWN0aW9uIGlzIGludmVydGVkLlxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgdGhpcy5yb3RhdGVEZWx0YS54ICo9IC0xO1xuICB9XG5cbiAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xuICB0aGlzLnRoZXRhICs9IDIgKiBNYXRoLlBJICogdGhpcy5yb3RhdGVEZWx0YS54IC8gZWxlbWVudC5jbGllbnRXaWR0aCAqIFJPVEFURV9TUEVFRDtcbn07XG5cblRvdWNoUGFubmVyLnByb3RvdHlwZS5vblRvdWNoRW5kXyA9IGZ1bmN0aW9uKGUpIHtcbiAgdGhpcy5pc1RvdWNoaW5nID0gZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRvdWNoUGFubmVyO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIG9iamVjdEFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcblxudmFyIFV0aWwgPSB3aW5kb3cuVXRpbCB8fCB7fTtcblxuVXRpbC5NSU5fVElNRVNURVAgPSAwLjAwMTtcblV0aWwuTUFYX1RJTUVTVEVQID0gMTtcblxuVXRpbC5iYXNlNjQgPSBmdW5jdGlvbihtaW1lVHlwZSwgYmFzZTY0KSB7XG4gIHJldHVybiAnZGF0YTonICsgbWltZVR5cGUgKyAnO2Jhc2U2NCwnICsgYmFzZTY0O1xufTtcblxuVXRpbC5jbGFtcCA9IGZ1bmN0aW9uKHZhbHVlLCBtaW4sIG1heCkge1xuICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgobWluLCB2YWx1ZSksIG1heCk7XG59O1xuXG5VdGlsLmxlcnAgPSBmdW5jdGlvbihhLCBiLCB0KSB7XG4gIHJldHVybiBhICsgKChiIC0gYSkgKiB0KTtcbn07XG5cblV0aWwuaXNJT1MgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBpc0lPUyA9IC9pUGFkfGlQaG9uZXxpUG9kLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gaXNJT1M7XG4gIH07XG59KSgpO1xuXG5VdGlsLmlzU2FmYXJpID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaXNTYWZhcmkgPSAvXigoPyFjaHJvbWV8YW5kcm9pZCkuKSpzYWZhcmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGlzU2FmYXJpO1xuICB9O1xufSkoKTtcblxuVXRpbC5pc0ZpcmVmb3hBbmRyb2lkID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaXNGaXJlZm94QW5kcm9pZCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignRmlyZWZveCcpICE9PSAtMSAmJlxuICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgIT09IC0xO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGlzRmlyZWZveEFuZHJvaWQ7XG4gIH07XG59KSgpO1xuXG5VdGlsLmlzTGFuZHNjYXBlTW9kZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKHdpbmRvdy5vcmllbnRhdGlvbiA9PSA5MCB8fCB3aW5kb3cub3JpZW50YXRpb24gPT0gLTkwKTtcbn07XG5cbi8vIEhlbHBlciBtZXRob2QgdG8gdmFsaWRhdGUgdGhlIHRpbWUgc3RlcHMgb2Ygc2Vuc29yIHRpbWVzdGFtcHMuXG5VdGlsLmlzVGltZXN0YW1wRGVsdGFWYWxpZCA9IGZ1bmN0aW9uKHRpbWVzdGFtcERlbHRhUykge1xuICBpZiAoaXNOYU4odGltZXN0YW1wRGVsdGFTKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodGltZXN0YW1wRGVsdGFTIDw9IFV0aWwuTUlOX1RJTUVTVEVQKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0aW1lc3RhbXBEZWx0YVMgPiBVdGlsLk1BWF9USU1FU1RFUCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblV0aWwuZ2V0U2NyZWVuV2lkdGggPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIE1hdGgubWF4KHdpbmRvdy5zY3JlZW4ud2lkdGgsIHdpbmRvdy5zY3JlZW4uaGVpZ2h0KSAqXG4gICAgICB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbn07XG5cblV0aWwuZ2V0U2NyZWVuSGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBNYXRoLm1pbih3aW5kb3cuc2NyZWVuLndpZHRoLCB3aW5kb3cuc2NyZWVuLmhlaWdodCkgKlxuICAgICAgd2luZG93LmRldmljZVBpeGVsUmF0aW87XG59O1xuXG5VdGlsLnJlcXVlc3RGdWxsc2NyZWVuID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICBpZiAoZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW4pIHtcbiAgICBlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZWxlbWVudC5tc1JlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgZWxlbWVudC5tc1JlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5VdGlsLmV4aXRGdWxsc2NyZWVuID0gZnVuY3Rpb24oKSB7XG4gIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNFeGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblV0aWwuZ2V0RnVsbHNjcmVlbkVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICBkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgZG9jdW1lbnQubW96RnVsbFNjcmVlbkVsZW1lbnQgfHxcbiAgICAgIGRvY3VtZW50Lm1zRnVsbHNjcmVlbkVsZW1lbnQ7XG59O1xuXG5VdGlsLmxpbmtQcm9ncmFtID0gZnVuY3Rpb24oZ2wsIHZlcnRleFNvdXJjZSwgZnJhZ21lbnRTb3VyY2UsIGF0dHJpYkxvY2F0aW9uTWFwKSB7XG4gIC8vIE5vIGVycm9yIGNoZWNraW5nIGZvciBicmV2aXR5LlxuICB2YXIgdmVydGV4U2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLlZFUlRFWF9TSEFERVIpO1xuICBnbC5zaGFkZXJTb3VyY2UodmVydGV4U2hhZGVyLCB2ZXJ0ZXhTb3VyY2UpO1xuICBnbC5jb21waWxlU2hhZGVyKHZlcnRleFNoYWRlcik7XG5cbiAgdmFyIGZyYWdtZW50U2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLkZSQUdNRU5UX1NIQURFUik7XG4gIGdsLnNoYWRlclNvdXJjZShmcmFnbWVudFNoYWRlciwgZnJhZ21lbnRTb3VyY2UpO1xuICBnbC5jb21waWxlU2hhZGVyKGZyYWdtZW50U2hhZGVyKTtcblxuICB2YXIgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZlcnRleFNoYWRlcik7XG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcmFnbWVudFNoYWRlcik7XG5cbiAgZm9yICh2YXIgYXR0cmliTmFtZSBpbiBhdHRyaWJMb2NhdGlvbk1hcClcbiAgICBnbC5iaW5kQXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgYXR0cmliTG9jYXRpb25NYXBbYXR0cmliTmFtZV0sIGF0dHJpYk5hbWUpO1xuXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuXG4gIGdsLmRlbGV0ZVNoYWRlcih2ZXJ0ZXhTaGFkZXIpO1xuICBnbC5kZWxldGVTaGFkZXIoZnJhZ21lbnRTaGFkZXIpO1xuXG4gIHJldHVybiBwcm9ncmFtO1xufTtcblxuVXRpbC5nZXRQcm9ncmFtVW5pZm9ybXMgPSBmdW5jdGlvbihnbCwgcHJvZ3JhbSkge1xuICB2YXIgdW5pZm9ybXMgPSB7fTtcbiAgdmFyIHVuaWZvcm1Db3VudCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKTtcbiAgdmFyIHVuaWZvcm1OYW1lID0gJyc7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdW5pZm9ybUNvdW50OyBpKyspIHtcbiAgICB2YXIgdW5pZm9ybUluZm8gPSBnbC5nZXRBY3RpdmVVbmlmb3JtKHByb2dyYW0sIGkpO1xuICAgIHVuaWZvcm1OYW1lID0gdW5pZm9ybUluZm8ubmFtZS5yZXBsYWNlKCdbMF0nLCAnJyk7XG4gICAgdW5pZm9ybXNbdW5pZm9ybU5hbWVdID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIHVuaWZvcm1OYW1lKTtcbiAgfVxuICByZXR1cm4gdW5pZm9ybXM7XG59O1xuXG5VdGlsLm9ydGhvTWF0cml4ID0gZnVuY3Rpb24gKG91dCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcbiAgdmFyIGxyID0gMSAvIChsZWZ0IC0gcmlnaHQpLFxuICAgICAgYnQgPSAxIC8gKGJvdHRvbSAtIHRvcCksXG4gICAgICBuZiA9IDEgLyAobmVhciAtIGZhcik7XG4gIG91dFswXSA9IC0yICogbHI7XG4gIG91dFsxXSA9IDA7XG4gIG91dFsyXSA9IDA7XG4gIG91dFszXSA9IDA7XG4gIG91dFs0XSA9IDA7XG4gIG91dFs1XSA9IC0yICogYnQ7XG4gIG91dFs2XSA9IDA7XG4gIG91dFs3XSA9IDA7XG4gIG91dFs4XSA9IDA7XG4gIG91dFs5XSA9IDA7XG4gIG91dFsxMF0gPSAyICogbmY7XG4gIG91dFsxMV0gPSAwO1xuICBvdXRbMTJdID0gKGxlZnQgKyByaWdodCkgKiBscjtcbiAgb3V0WzEzXSA9ICh0b3AgKyBib3R0b20pICogYnQ7XG4gIG91dFsxNF0gPSAoZmFyICsgbmVhcikgKiBuZjtcbiAgb3V0WzE1XSA9IDE7XG4gIHJldHVybiBvdXQ7XG59O1xuXG5VdGlsLmlzTW9iaWxlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjaGVjayA9IGZhbHNlO1xuICAoZnVuY3Rpb24oYSl7aWYoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlyaXN8a2luZGxlfGxnZSB8bWFlbW98bWlkcHxtbXB8bW9iaWxlLitmaXJlZm94fG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIGNlfHhkYXx4aWluby9pLnRlc3QoYSl8fC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QoYS5zdWJzdHIoMCw0KSkpY2hlY2sgPSB0cnVlfSkobmF2aWdhdG9yLnVzZXJBZ2VudHx8bmF2aWdhdG9yLnZlbmRvcnx8d2luZG93Lm9wZXJhKTtcbiAgcmV0dXJuIGNoZWNrO1xufTtcblxuVXRpbC5leHRlbmQgPSBvYmplY3RBc3NpZ247XG5cbm1vZHVsZS5leHBvcnRzID0gVXRpbDtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSgnLi9lbWl0dGVyLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xudmFyIERldmljZUluZm8gPSByZXF1aXJlKCcuL2RldmljZS1pbmZvLmpzJyk7XG5cbnZhciBERUZBVUxUX1ZJRVdFUiA9ICdDYXJkYm9hcmRWMSc7XG52YXIgVklFV0VSX0tFWSA9ICdXRUJWUl9DQVJEQk9BUkRfVklFV0VSJztcbnZhciBDTEFTU19OQU1FID0gJ3dlYnZyLXBvbHlmaWxsLXZpZXdlci1zZWxlY3Rvcic7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHZpZXdlciBzZWxlY3RvciB3aXRoIHRoZSBvcHRpb25zIHNwZWNpZmllZC4gU3VwcG9ydHMgYmVpbmcgc2hvd25cbiAqIGFuZCBoaWRkZW4uIEdlbmVyYXRlcyBldmVudHMgd2hlbiB2aWV3ZXIgcGFyYW1ldGVycyBjaGFuZ2UuIEFsc28gc3VwcG9ydHNcbiAqIHNhdmluZyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGluZGV4IGluIGxvY2FsU3RvcmFnZS5cbiAqL1xuZnVuY3Rpb24gVmlld2VyU2VsZWN0b3IoKSB7XG4gIC8vIFRyeSB0byBsb2FkIHRoZSBzZWxlY3RlZCBrZXkgZnJvbSBsb2NhbCBzdG9yYWdlLiBJZiBub25lIGV4aXN0cywgdXNlIHRoZVxuICAvLyBkZWZhdWx0IGtleS5cbiAgdHJ5IHtcbiAgICB0aGlzLnNlbGVjdGVkS2V5ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oVklFV0VSX0tFWSkgfHwgREVGQVVMVF9WSUVXRVI7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGxvYWQgdmlld2VyIHByb2ZpbGU6ICVzJywgZXJyb3IpO1xuICB9XG4gIHRoaXMuZGlhbG9nID0gdGhpcy5jcmVhdGVEaWFsb2dfKERldmljZUluZm8uVmlld2Vycyk7XG4gIHRoaXMucm9vdCA9IG51bGw7XG59XG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUgPSBuZXcgRW1pdHRlcigpO1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uKHJvb3QpIHtcbiAgdGhpcy5yb290ID0gcm9vdDtcblxuICByb290LmFwcGVuZENoaWxkKHRoaXMuZGlhbG9nKTtcbiAgLy9jb25zb2xlLmxvZygnVmlld2VyU2VsZWN0b3Iuc2hvdycpO1xuXG4gIC8vIEVuc3VyZSB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW0gaXMgY2hlY2tlZC5cbiAgdmFyIHNlbGVjdGVkID0gdGhpcy5kaWFsb2cucXVlcnlTZWxlY3RvcignIycgKyB0aGlzLnNlbGVjdGVkS2V5KTtcbiAgc2VsZWN0ZWQuY2hlY2tlZCA9IHRydWU7XG5cbiAgLy8gU2hvdyB0aGUgVUkuXG4gIHRoaXMuZGlhbG9nLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMucm9vdCAmJiB0aGlzLnJvb3QuY29udGFpbnModGhpcy5kaWFsb2cpKSB7XG4gICAgdGhpcy5yb290LnJlbW92ZUNoaWxkKHRoaXMuZGlhbG9nKTtcbiAgfVxuICAvL2NvbnNvbGUubG9nKCdWaWV3ZXJTZWxlY3Rvci5oaWRlJyk7XG4gIHRoaXMuZGlhbG9nLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuZ2V0Q3VycmVudFZpZXdlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gRGV2aWNlSW5mby5WaWV3ZXJzW3RoaXMuc2VsZWN0ZWRLZXldO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmdldFNlbGVjdGVkS2V5XyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaW5wdXQgPSB0aGlzLmRpYWxvZy5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPWZpZWxkXTpjaGVja2VkJyk7XG4gIGlmIChpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dC5pZDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5vblNhdmVfID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc2VsZWN0ZWRLZXkgPSB0aGlzLmdldFNlbGVjdGVkS2V5XygpO1xuICBpZiAoIXRoaXMuc2VsZWN0ZWRLZXkgfHwgIURldmljZUluZm8uVmlld2Vyc1t0aGlzLnNlbGVjdGVkS2V5XSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1ZpZXdlclNlbGVjdG9yLm9uU2F2ZV86IHRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbiEnKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmVtaXQoJ2NoYW5nZScsIERldmljZUluZm8uVmlld2Vyc1t0aGlzLnNlbGVjdGVkS2V5XSk7XG5cbiAgLy8gQXR0ZW1wdCB0byBzYXZlIHRoZSB2aWV3ZXIgcHJvZmlsZSwgYnV0IGZhaWxzIGluIHByaXZhdGUgbW9kZS5cbiAgdHJ5IHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShWSUVXRVJfS0VZLCB0aGlzLnNlbGVjdGVkS2V5KTtcbiAgfSBjYXRjaChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzYXZlIHZpZXdlciBwcm9maWxlOiAlcycsIGVycm9yKTtcbiAgfVxuICB0aGlzLmhpZGUoKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgZGlhbG9nLlxuICovXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuY3JlYXRlRGlhbG9nXyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb250YWluZXIuY2xhc3NMaXN0LmFkZChDTEFTU19OQU1FKTtcbiAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIC8vIENyZWF0ZSBhbiBvdmVybGF5IHRoYXQgZGltcyB0aGUgYmFja2dyb3VuZCwgYW5kIHdoaWNoIGdvZXMgYXdheSB3aGVuIHlvdVxuICAvLyB0YXAgaXQuXG4gIHZhciBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gb3ZlcmxheS5zdHlsZTtcbiAgcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHMubGVmdCA9IDA7XG4gIHMudG9wID0gMDtcbiAgcy53aWR0aCA9ICcxMDAlJztcbiAgcy5oZWlnaHQgPSAnMTAwJSc7XG4gIHMuYmFja2dyb3VuZCA9ICdyZ2JhKDAsIDAsIDAsIDAuMyknO1xuICBvdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oaWRlLmJpbmQodGhpcykpO1xuXG4gIHZhciB3aWR0aCA9IDI4MDtcbiAgdmFyIGRpYWxvZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IGRpYWxvZy5zdHlsZTtcbiAgcy5ib3hTaXppbmcgPSAnYm9yZGVyLWJveCc7XG4gIHMucG9zaXRpb24gPSAnZml4ZWQnO1xuICBzLnRvcCA9ICcyNHB4JztcbiAgcy5sZWZ0ID0gJzUwJSc7XG4gIHMubWFyZ2luTGVmdCA9ICgtd2lkdGgvMikgKyAncHgnO1xuICBzLndpZHRoID0gd2lkdGggKyAncHgnO1xuICBzLnBhZGRpbmcgPSAnMjRweCc7XG4gIHMub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgcy5iYWNrZ3JvdW5kID0gJyNmYWZhZmEnO1xuICBzLmZvbnRGYW1pbHkgPSBcIidSb2JvdG8nLCBzYW5zLXNlcmlmXCI7XG4gIHMuYm94U2hhZG93ID0gJzBweCA1cHggMjBweCAjNjY2JztcblxuICBkaWFsb2cuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVIMV8oJ1NlbGVjdCB5b3VyIHZpZXdlcicpKTtcbiAgZm9yICh2YXIgaWQgaW4gb3B0aW9ucykge1xuICAgIGRpYWxvZy5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUNob2ljZV8oaWQsIG9wdGlvbnNbaWRdLmxhYmVsKSk7XG4gIH1cbiAgZGlhbG9nLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlQnV0dG9uXygnU2F2ZScsIHRoaXMub25TYXZlXy5iaW5kKHRoaXMpKSk7XG5cbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKG92ZXJsYXkpO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZGlhbG9nKTtcblxuICByZXR1cm4gY29udGFpbmVyO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmNyZWF0ZUgxXyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIGgxID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDEnKTtcbiAgdmFyIHMgPSBoMS5zdHlsZTtcbiAgcy5jb2xvciA9ICdibGFjayc7XG4gIHMuZm9udFNpemUgPSAnMjBweCc7XG4gIHMuZm9udFdlaWdodCA9ICdib2xkJztcbiAgcy5tYXJnaW5Ub3AgPSAwO1xuICBzLm1hcmdpbkJvdHRvbSA9ICcyNHB4JztcbiAgaDEuaW5uZXJIVE1MID0gbmFtZTtcbiAgcmV0dXJuIGgxO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmNyZWF0ZUNob2ljZV8gPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuICAvKlxuICA8ZGl2IGNsYXNzPVwiY2hvaWNlXCI+XG4gIDxpbnB1dCBpZD1cInYxXCIgdHlwZT1cInJhZGlvXCIgbmFtZT1cImZpZWxkXCIgdmFsdWU9XCJ2MVwiPlxuICA8bGFiZWwgZm9yPVwidjFcIj5DYXJkYm9hcmQgVjE8L2xhYmVsPlxuICA8L2Rpdj5cbiAgKi9cbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuc3R5bGUubWFyZ2luVG9wID0gJzhweCc7XG4gIGRpdi5zdHlsZS5jb2xvciA9ICdibGFjayc7XG5cbiAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXQuc3R5bGUuZm9udFNpemUgPSAnMzBweCc7XG4gIGlucHV0LnNldEF0dHJpYnV0ZSgnaWQnLCBpZCk7XG4gIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgaWQpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ25hbWUnLCAnZmllbGQnKTtcblxuICB2YXIgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICBsYWJlbC5zdHlsZS5tYXJnaW5MZWZ0ID0gJzRweCc7XG4gIGxhYmVsLnNldEF0dHJpYnV0ZSgnZm9yJywgaWQpO1xuICBsYWJlbC5pbm5lckhUTUwgPSBuYW1lO1xuXG4gIGRpdi5hcHBlbmRDaGlsZChpbnB1dCk7XG4gIGRpdi5hcHBlbmRDaGlsZChsYWJlbCk7XG5cbiAgcmV0dXJuIGRpdjtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5jcmVhdGVCdXR0b25fID0gZnVuY3Rpb24obGFiZWwsIG9uY2xpY2spIHtcbiAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICBidXR0b24uaW5uZXJIVE1MID0gbGFiZWw7XG4gIHZhciBzID0gYnV0dG9uLnN0eWxlO1xuICBzLmZsb2F0ID0gJ3JpZ2h0JztcbiAgcy50ZXh0VHJhbnNmb3JtID0gJ3VwcGVyY2FzZSc7XG4gIHMuY29sb3IgPSAnIzEwOTRmNyc7XG4gIHMuZm9udFNpemUgPSAnMTRweCc7XG4gIHMubGV0dGVyU3BhY2luZyA9IDA7XG4gIHMuYm9yZGVyID0gMDtcbiAgcy5iYWNrZ3JvdW5kID0gJ25vbmUnO1xuICBzLm1hcmdpblRvcCA9ICcxNnB4JztcblxuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbmNsaWNrKTtcblxuICByZXR1cm4gYnV0dG9uO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3ZXJTZWxlY3RvcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbi8qKlxuICogQW5kcm9pZCBhbmQgaU9TIGNvbXBhdGlibGUgd2FrZWxvY2sgaW1wbGVtZW50YXRpb24uXG4gKlxuICogUmVmYWN0b3JlZCB0aGFua3MgdG8gZGtvdmFsZXZALlxuICovXG5mdW5jdGlvbiBBbmRyb2lkV2FrZUxvY2soKSB7XG4gIHZhciB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XG5cbiAgdmlkZW8uYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBmdW5jdGlvbigpIHtcbiAgICB2aWRlby5wbGF5KCk7XG4gIH0pO1xuXG4gIHRoaXMucmVxdWVzdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh2aWRlby5wYXVzZWQpIHtcbiAgICAgIC8vIEJhc2U2NCB2ZXJzaW9uIG9mIHZpZGVvc19zcmMvbm8tc2xlZXAtMTIwcy5tcDQuXG4gICAgICB2aWRlby5zcmMgPSBVdGlsLmJhc2U2NCgndmlkZW8vbXA0JywgJ0FBQUFHR1owZVhCcGMyOXRBQUFBQUcxd05ERmhkbU14QUFBSUEyMXZiM1lBQUFCc2JYWm9aQUFBQUFEU2E5djYwbXZiK2dBQlg1QUFsdy9nQUFFQUFBRUFBQUFBQUFBQUFBQUFBQUFCQUFBQUFBQUFBQUFBQUFBQUFBQUFBUUFBQUFBQUFBQUFBQUFBQUFBQVFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUlBQUFka2RISmhhd0FBQUZ4MGEyaGtBQUFBQWRKcjIvclNhOXY2QUFBQUFRQUFBQUFBbHcvZ0FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQkFBQUFBQUFBQUFBQUFBQUFBQUFBQVFBQUFBQUFBQUFBQUFBQUFBQUFRQUFBQUFBUUFBQUFIQUFBQUFBQUpHVmtkSE1BQUFBY1pXeHpkQUFBQUFBQUFBQUJBSmNQNEFBQUFBQUFBUUFBQUFBRzNHMWthV0VBQUFBZ2JXUm9aQUFBQUFEU2E5djYwbXZiK2dBUFFrQUdqbmVBRmNjQUFBQUFBQzFvWkd4eUFBQUFBQUFBQUFCMmFXUmxBQUFBQUFBQUFBQUFBQUFBVm1sa1pXOUlZVzVrYkdWeUFBQUFCb2R0YVc1bUFBQUFGSFp0YUdRQUFBQUJBQUFBQUFBQUFBQUFBQUFrWkdsdVpnQUFBQnhrY21WbUFBQUFBQUFBQUFFQUFBQU1kWEpzSUFBQUFBRUFBQVpIYzNSaWJBQUFBSmR6ZEhOa0FBQUFBQUFBQUFFQUFBQ0hZWFpqTVFBQUFBQUFBQUFCQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFNQUJ3QVNBQUFBRWdBQUFBQUFBQUFBUUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFCai8vd0FBQURGaGRtTkRBV1FBQy8vaEFCbG5aQUFMck5sZmxsdzRRQUFBQXdCQUFBQURBS1BGQ21XQUFRQUZhT3Zzc2l3QUFBQVljM1IwY3dBQUFBQUFBQUFCQUFBQWJnQVBRa0FBQUFBVWMzUnpjd0FBQUFBQUFBQUJBQUFBQVFBQUE0QmpkSFJ6QUFBQUFBQUFBRzRBQUFBQkFEMEpBQUFBQUFFQWVoSUFBQUFBQVFBOUNRQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQUxjYkFBQUFBSEhOMGMyTUFBQUFBQUFBQUFRQUFBQUVBQUFCdUFBQUFBUUFBQWN4emRITjZBQUFBQUFBQUFBQUFBQUJ1QUFBRENRQUFBQmdBQUFBT0FBQUFEZ0FBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQk1BQUFBVWMzUmpid0FBQUFBQUFBQUJBQUFJS3dBQUFDdDFaSFJoQUFBQUk2bGxibU1BRndBQWRteGpJREl1TWk0eElITjBjbVZoYlNCdmRYUndkWFFBQUFBSWQybGtaUUFBQ1JSdFpHRjBBQUFDcmdYLy82dmNSZW05NXRsSXQ1WXMyQ0RaSSs3dmVESTJOQ0F0SUdOdmNtVWdNVFF5SUMwZ1NDNHlOalF2VFZCRlJ5MDBJRUZXUXlCamIyUmxZeUF0SUVOdmNIbHNaV1owSURJd01ETXRNakF4TkNBdElHaDBkSEE2THk5M2QzY3VkbWxrWlc5c1lXNHViM0puTDNneU5qUXVhSFJ0YkNBdElHOXdkR2x2Ym5NNklHTmhZbUZqUFRFZ2NtVm1QVE1nWkdWaWJHOWphejB4T2pBNk1DQmhibUZzZVhObFBUQjRNem93ZURFeklHMWxQV2hsZUNCemRXSnRaVDAzSUhCemVUMHhJSEJ6ZVY5eVpEMHhMakF3T2pBdU1EQWdiV2w0WldSZmNtVm1QVEVnYldWZmNtRnVaMlU5TVRZZ1kyaHliMjFoWDIxbFBURWdkSEpsYkd4cGN6MHhJRGg0T0dSamREMHhJR054YlQwd0lHUmxZV1I2YjI1bFBUSXhMREV4SUdaaGMzUmZjSE5yYVhBOU1TQmphSEp2YldGZmNYQmZiMlptYzJWMFBTMHlJSFJvY21WaFpITTlNVElnYkc5dmEyRm9aV0ZrWDNSb2NtVmhaSE05TVNCemJHbGpaV1JmZEdoeVpXRmtjejB3SUc1eVBUQWdaR1ZqYVcxaGRHVTlNU0JwYm5SbGNteGhZMlZrUFRBZ1lteDFjbUY1WDJOdmJYQmhkRDB3SUdOdmJuTjBjbUZwYm1Wa1gybHVkSEpoUFRBZ1ltWnlZVzFsY3oweklHSmZjSGx5WVcxcFpEMHlJR0pmWVdSaGNIUTlNU0JpWDJKcFlYTTlNQ0JrYVhKbFkzUTlNU0IzWldsbmFIUmlQVEVnYjNCbGJsOW5iM0E5TUNCM1pXbG5hSFJ3UFRJZ2EyVjVhVzUwUFRJMU1DQnJaWGxwYm5SZmJXbHVQVEVnYzJObGJtVmpkWFE5TkRBZ2FXNTBjbUZmY21WbWNtVnphRDB3SUhKalgyeHZiMnRoYUdWaFpEMDBNQ0J5WXoxaFluSWdiV0owY21WbFBURWdZbWwwY21GMFpUMHhNREFnY21GMFpYUnZiRDB4TGpBZ2NXTnZiWEE5TUM0Mk1DQnhjRzFwYmoweE1DQnhjRzFoZUQwMU1TQnhjSE4wWlhBOU5DQnBjRjl5WVhScGJ6MHhMalF3SUdGeFBURTZNUzR3TUFDQUFBQUFVMldJaEFBUS84bHRsT2UrY1RadUdrS2crYVJ0dWl2Y0RaMHBCc2ZzRWk5cC9pMXlVOUR4UzJscTRkWFRpblZpRjFVUkJLWGduektCZC9VaDFia2hIdE1yd3JSY09Kc2xEMDFVQitmeWFMNmVmK0RCQUFBQUZFR2FKR3hCRDVCK3YrYSs0UXFGM01nQlh6OU1BQUFBQ2tHZVFuaUgvKzk0cjZFQUFBQUtBWjVoZEVOLzhReXR3QUFBQUFnQm5tTnFRMy9FZ1FBQUFBNUJtbWhKcUVGb21Vd0lJZi8rNFFBQUFBcEJub1pGRVN3Ly83NkJBQUFBQ0FHZXBYUkRmOFNCQUFBQUNBR2VwMnBEZjhTQUFBQUFEa0dhckVtb1FXeVpUQWdoLy83Z0FBQUFDa0dleWtVVkxELy92b0VBQUFBSUFaN3BkRU4veElBQUFBQUlBWjdyYWtOL3hJQUFBQUFPUVpyd1NhaEJiSmxNQ0NILy91RUFBQUFLUVo4T1JSVXNQLysrZ1FBQUFBZ0JueTEwUTMvRWdRQUFBQWdCbnk5cVEzL0VnQUFBQUE1Qm16UkpxRUZzbVV3SUlmLys0QUFBQUFwQm4xSkZGU3cvLzc2QkFBQUFDQUdmY1hSRGY4U0FBQUFBQ0FHZmMycERmOFNBQUFBQURrR2JlRW1vUVd5WlRBZ2gvLzdoQUFBQUNrR2Zsa1VWTEQvL3ZvQUFBQUFJQVorMWRFTi94SUVBQUFBSUFaKzNha04veElFQUFBQU9RWnU4U2FoQmJKbE1DQ0gvL3VBQUFBQUtRWi9hUlJVc1AvKytnUUFBQUFnQm4vbDBRMy9FZ0FBQUFBZ0JuL3RxUTMvRWdRQUFBQTVCbStCSnFFRnNtVXdJSWYvKzRRQUFBQXBCbmg1RkZTdy8vNzZBQUFBQUNBR2VQWFJEZjhTQUFBQUFDQUdlUDJwRGY4U0JBQUFBRGtHYUpFbW9RV3laVEFnaC8vN2dBQUFBQ2tHZVFrVVZMRC8vdm9FQUFBQUlBWjVoZEVOL3hJQUFBQUFJQVo1amFrTi94SUVBQUFBT1FacG9TYWhCYkpsTUNDSC8vdUVBQUFBS1FaNkdSUlVzUC8rK2dRQUFBQWdCbnFWMFEzL0VnUUFBQUFnQm5xZHFRMy9FZ0FBQUFBNUJtcXhKcUVGc21Vd0lJZi8rNEFBQUFBcEJuc3BGRlN3Ly83NkJBQUFBQ0FHZTZYUkRmOFNBQUFBQUNBR2U2MnBEZjhTQUFBQUFEa0dhOEVtb1FXeVpUQWdoLy83aEFBQUFDa0dmRGtVVkxELy92b0VBQUFBSUFaOHRkRU4veElFQUFBQUlBWjh2YWtOL3hJQUFBQUFPUVpzMFNhaEJiSmxNQ0NILy91QUFBQUFLUVo5U1JSVXNQLysrZ1FBQUFBZ0JuM0YwUTMvRWdBQUFBQWdCbjNOcVEzL0VnQUFBQUE1Qm0zaEpxRUZzbVV3SUlmLys0UUFBQUFwQm41WkZGU3cvLzc2QUFBQUFDQUdmdFhSRGY4U0JBQUFBQ0FHZnQycERmOFNCQUFBQURrR2J2RW1vUVd5WlRBZ2gvLzdnQUFBQUNrR2Yya1VWTEQvL3ZvRUFBQUFJQVovNWRFTi94SUFBQUFBSUFaLzdha04veElFQUFBQU9RWnZnU2FoQmJKbE1DQ0gvL3VFQUFBQUtRWjRlUlJVc1AvKytnQUFBQUFnQm5qMTBRMy9FZ0FBQUFBZ0JuajlxUTMvRWdRQUFBQTVCbWlSSnFFRnNtVXdJSWYvKzRBQUFBQXBCbmtKRkZTdy8vNzZCQUFBQUNBR2VZWFJEZjhTQUFBQUFDQUdlWTJwRGY4U0JBQUFBRGtHYWFFbW9RV3laVEFnaC8vN2hBQUFBQ2tHZWhrVVZMRC8vdm9FQUFBQUlBWjZsZEVOL3hJRUFBQUFJQVo2bmFrTi94SUFBQUFBT1FacXNTYWhCYkpsTUNDSC8vdUFBQUFBS1FaN0tSUlVzUC8rK2dRQUFBQWdCbnVsMFEzL0VnQUFBQUFnQm51dHFRMy9FZ0FBQUFBNUJtdkJKcUVGc21Vd0lJZi8rNFFBQUFBcEJudzVGRlN3Ly83NkJBQUFBQ0FHZkxYUkRmOFNCQUFBQUNBR2ZMMnBEZjhTQUFBQUFEa0diTkVtb1FXeVpUQWdoLy83Z0FBQUFDa0dmVWtVVkxELy92b0VBQUFBSUFaOXhkRU4veElBQUFBQUlBWjl6YWtOL3hJQUFBQUFPUVp0NFNhaEJiSmxNQ0NILy91RUFBQUFLUVorV1JSVXNQLysrZ0FBQUFBZ0JuN1YwUTMvRWdRQUFBQWdCbjdkcVEzL0VnUUFBQUE1Qm03eEpxRUZzbVV3SUlmLys0QUFBQUFwQm45cEZGU3cvLzc2QkFBQUFDQUdmK1hSRGY4U0FBQUFBQ0FHZisycERmOFNCQUFBQURrR2I0RW1vUVd5WlRBZ2gvLzdoQUFBQUNrR2VIa1VWTEQvL3ZvQUFBQUFJQVo0OWRFTi94SUFBQUFBSUFaNC9ha04veElFQUFBQU9RWm9rU2FoQmJKbE1DQ0gvL3VBQUFBQUtRWjVDUlJVc1AvKytnUUFBQUFnQm5tRjBRMy9FZ0FBQUFBZ0JubU5xUTMvRWdRQUFBQTVCbW1oSnFFRnNtVXdJSWYvKzRRQUFBQXBCbm9aRkZTdy8vNzZCQUFBQUNBR2VwWFJEZjhTQkFBQUFDQUdlcDJwRGY4U0FBQUFBRGtHYXJFbW9RV3laVEFnaC8vN2dBQUFBQ2tHZXlrVVZMRC8vdm9FQUFBQUlBWjdwZEVOL3hJQUFBQUFJQVo3cmFrTi94SUFBQUFBUFFacnVTYWhCYkpsTUZFdzMvLzdCJyk7XG4gICAgICB2aWRlby5wbGF5KCk7XG4gICAgfVxuICB9O1xuXG4gIHRoaXMucmVsZWFzZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZpZGVvLnBhdXNlKCk7XG4gICAgdmlkZW8uc3JjID0gJyc7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGlPU1dha2VMb2NrKCkge1xuICB2YXIgdGltZXIgPSBudWxsO1xuXG4gIHRoaXMucmVxdWVzdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGltZXIpIHtcbiAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbjtcbiAgICAgICAgc2V0VGltZW91dCh3aW5kb3cuc3RvcCwgMCk7XG4gICAgICB9LCAzMDAwMCk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5yZWxlYXNlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRpbWVyKSB7XG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgIHRpbWVyID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBnZXRXYWtlTG9jaygpIHtcbiAgdmFyIHVzZXJBZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQgfHwgbmF2aWdhdG9yLnZlbmRvciB8fCB3aW5kb3cub3BlcmE7XG4gIGlmICh1c2VyQWdlbnQubWF0Y2goL2lQaG9uZS9pKSB8fCB1c2VyQWdlbnQubWF0Y2goL2lQb2QvaSkpIHtcbiAgICByZXR1cm4gaU9TV2FrZUxvY2s7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIEFuZHJvaWRXYWtlTG9jaztcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFdha2VMb2NrKCk7IiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gUG9seWZpbGwgRVM2IFByb21pc2VzIChtb3N0bHkgZm9yIElFIDExKS5cbnJlcXVpcmUoJ2VzNi1wcm9taXNlJykucG9seWZpbGwoKTtcblxudmFyIENhcmRib2FyZFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vY2FyZGJvYXJkLXZyLWRpc3BsYXkuanMnKTtcbnZhciBNb3VzZUtleWJvYXJkVlJEaXNwbGF5ID0gcmVxdWlyZSgnLi9tb3VzZS1rZXlib2FyZC12ci1kaXNwbGF5LmpzJyk7XG4vLyBVbmNvbW1lbnQgdG8gYWRkIHBvc2l0aW9uYWwgdHJhY2tpbmcgdmlhIHdlYmNhbS5cbi8vdmFyIFdlYmNhbVBvc2l0aW9uU2Vuc29yVlJEZXZpY2UgPSByZXF1aXJlKCcuL3dlYmNhbS1wb3NpdGlvbi1zZW5zb3ItdnItZGV2aWNlLmpzJyk7XG52YXIgVlJEaXNwbGF5ID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuVlJEaXNwbGF5O1xudmFyIEhNRFZSRGV2aWNlID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuSE1EVlJEZXZpY2U7XG52YXIgUG9zaXRpb25TZW5zb3JWUkRldmljZSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlBvc2l0aW9uU2Vuc29yVlJEZXZpY2U7XG52YXIgVlJEaXNwbGF5SE1ERGV2aWNlID0gcmVxdWlyZSgnLi9kaXNwbGF5LXdyYXBwZXJzLmpzJykuVlJEaXNwbGF5SE1ERGV2aWNlO1xudmFyIFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlID0gcmVxdWlyZSgnLi9kaXNwbGF5LXdyYXBwZXJzLmpzJykuVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2U7XG5cbmZ1bmN0aW9uIFdlYlZSUG9seWZpbGwoKSB7XG4gIHRoaXMuZGlzcGxheXMgPSBbXTtcbiAgdGhpcy5kZXZpY2VzID0gW107IC8vIEZvciBkZXByZWNhdGVkIG9iamVjdHNcbiAgdGhpcy5kZXZpY2VzUG9wdWxhdGVkID0gZmFsc2U7XG4gIHRoaXMubmF0aXZlV2ViVlJBdmFpbGFibGUgPSB0aGlzLmlzV2ViVlJBdmFpbGFibGUoKTtcbiAgdGhpcy5uYXRpdmVMZWdhY3lXZWJWUkF2YWlsYWJsZSA9IHRoaXMuaXNEZXByZWNhdGVkV2ViVlJBdmFpbGFibGUoKTtcblxuICBpZiAoIXRoaXMubmF0aXZlTGVnYWN5V2ViVlJBdmFpbGFibGUpIHtcbiAgICBpZiAoIXRoaXMubmF0aXZlV2ViVlJBdmFpbGFibGUpIHtcbiAgICAgIHRoaXMuZW5hYmxlUG9seWZpbGwoKTtcbiAgICB9XG4gICAgaWYgKFdlYlZSQ29uZmlnLkVOQUJMRV9ERVBSRUNBVEVEX0FQSSkge1xuICAgICAgdGhpcy5lbmFibGVEZXByZWNhdGVkUG9seWZpbGwoKTtcbiAgICB9XG4gIH1cbn1cblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuaXNXZWJWUkF2YWlsYWJsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKCdnZXRWUkRpc3BsYXlzJyBpbiBuYXZpZ2F0b3IpO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuaXNEZXByZWNhdGVkV2ViVlJBdmFpbGFibGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICgnZ2V0VlJEZXZpY2VzJyBpbiBuYXZpZ2F0b3IpIHx8ICgnbW96R2V0VlJEZXZpY2VzJyBpbiBuYXZpZ2F0b3IpO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUucG9wdWxhdGVEZXZpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRldmljZXNQb3B1bGF0ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBJbml0aWFsaXplIG91ciB2aXJ0dWFsIFZSIGRldmljZXMuXG4gIHZhciB2ckRpc3BsYXkgPSBudWxsO1xuXG4gIC8vIEFkZCBhIENhcmRib2FyZCBWUkRpc3BsYXkgb24gY29tcGF0aWJsZSBtb2JpbGUgZGV2aWNlc1xuICBpZiAodGhpcy5pc0NhcmRib2FyZENvbXBhdGlibGUoKSkge1xuICAgIHZyRGlzcGxheSA9IG5ldyBDYXJkYm9hcmRWUkRpc3BsYXkoKTtcbiAgICB0aGlzLmRpc3BsYXlzLnB1c2godnJEaXNwbGF5KTtcblxuICAgIC8vIEZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgIGlmIChXZWJWUkNvbmZpZy5FTkFCTEVfREVQUkVDQVRFRF9BUEkpIHtcbiAgICAgIHRoaXMuZGV2aWNlcy5wdXNoKG5ldyBWUkRpc3BsYXlITUREZXZpY2UodnJEaXNwbGF5KSk7XG4gICAgICB0aGlzLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UodnJEaXNwbGF5KSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQWRkIGEgTW91c2UgYW5kIEtleWJvYXJkIGRyaXZlbiBWUkRpc3BsYXkgZm9yIGRlc2t0b3BzL2xhcHRvcHNcbiAgaWYgKCF0aGlzLmlzTW9iaWxlKCkgJiYgIVdlYlZSQ29uZmlnLk1PVVNFX0tFWUJPQVJEX0NPTlRST0xTX0RJU0FCTEVEKSB7XG4gICAgdnJEaXNwbGF5ID0gbmV3IE1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkoKTtcbiAgICB0aGlzLmRpc3BsYXlzLnB1c2godnJEaXNwbGF5KTtcblxuICAgIC8vIEZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgIGlmIChXZWJWUkNvbmZpZy5FTkFCTEVfREVQUkVDQVRFRF9BUEkpIHtcbiAgICAgIHRoaXMuZGV2aWNlcy5wdXNoKG5ldyBWUkRpc3BsYXlITUREZXZpY2UodnJEaXNwbGF5KSk7XG4gICAgICB0aGlzLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UodnJEaXNwbGF5KSk7XG4gICAgfVxuICB9XG5cbiAgLy8gVW5jb21tZW50IHRvIGFkZCBwb3NpdGlvbmFsIHRyYWNraW5nIHZpYSB3ZWJjYW0uXG4gIC8vaWYgKCF0aGlzLmlzTW9iaWxlKCkgJiYgV2ViVlJDb25maWcuRU5BQkxFX0RFUFJFQ0FURURfQVBJKSB7XG4gIC8vICBwb3NpdGlvbkRldmljZSA9IG5ldyBXZWJjYW1Qb3NpdGlvblNlbnNvclZSRGV2aWNlKCk7XG4gIC8vICB0aGlzLmRldmljZXMucHVzaChwb3NpdGlvbkRldmljZSk7XG4gIC8vfVxuXG4gIHRoaXMuZGV2aWNlc1BvcHVsYXRlZCA9IHRydWU7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5lbmFibGVQb2x5ZmlsbCA9IGZ1bmN0aW9uKCkge1xuICAvLyBQcm92aWRlIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzLlxuICBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cyA9IHRoaXMuZ2V0VlJEaXNwbGF5cy5iaW5kKHRoaXMpO1xuXG4gIC8vIFByb3ZpZGUgdGhlIFZSRGlzcGxheSBvYmplY3QuXG4gIHdpbmRvdy5WUkRpc3BsYXkgPSBWUkRpc3BsYXk7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5lbmFibGVEZXByZWNhdGVkUG9seWZpbGwgPSBmdW5jdGlvbigpIHtcbiAgLy8gUHJvdmlkZSBuYXZpZ2F0b3IuZ2V0VlJEZXZpY2VzLlxuICBuYXZpZ2F0b3IuZ2V0VlJEZXZpY2VzID0gdGhpcy5nZXRWUkRldmljZXMuYmluZCh0aGlzKTtcblxuICAvLyBQcm92aWRlIHRoZSBDYXJkYm9hcmRITURWUkRldmljZSBhbmQgUG9zaXRpb25TZW5zb3JWUkRldmljZSBvYmplY3RzLlxuICB3aW5kb3cuSE1EVlJEZXZpY2UgPSBITURWUkRldmljZTtcbiAgd2luZG93LlBvc2l0aW9uU2Vuc29yVlJEZXZpY2UgPSBQb3NpdGlvblNlbnNvclZSRGV2aWNlO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuZ2V0VlJEaXNwbGF5cyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBvcHVsYXRlRGV2aWNlcygpO1xuICB2YXIgZGlzcGxheXMgPSB0aGlzLmRpc3BsYXlzO1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdHJ5IHtcbiAgICAgIHJlc29sdmUoZGlzcGxheXMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJlamVjdChlKTtcbiAgICB9XG4gIH0pO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuZ2V0VlJEZXZpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUud2FybignZ2V0VlJEZXZpY2VzIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1cGRhdGUgeW91ciBjb2RlIHRvIHVzZSBnZXRWUkRpc3BsYXlzIGluc3RlYWQuJyk7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXNlbGYuZGV2aWNlc1BvcHVsYXRlZCkge1xuICAgICAgICBpZiAoc2VsZi5uYXRpdmVXZWJWUkF2YWlsYWJsZSkge1xuICAgICAgICAgIHJldHVybiBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cyhmdW5jdGlvbihkaXNwbGF5cykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkaXNwbGF5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICBzZWxmLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5SE1ERGV2aWNlKGRpc3BsYXlzW2ldKSk7XG4gICAgICAgICAgICAgIHNlbGYuZGV2aWNlcy5wdXNoKG5ldyBWUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZShkaXNwbGF5c1tpXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5kZXZpY2VzUG9wdWxhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUoc2VsZi5kZXZpY2VzKTtcbiAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNlbGYubmF0aXZlTGVnYWN5V2ViVlJBdmFpbGFibGUpIHtcbiAgICAgICAgICByZXR1cm4gKG5hdmlnYXRvci5nZXRWUkREZXZpY2VzIHx8IG5hdmlnYXRvci5tb3pHZXRWUkRldmljZXMpKGZ1bmN0aW9uKGRldmljZXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGV2aWNlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICBpZiAoZGV2aWNlc1tpXSBpbnN0YW5jZW9mIEhNRFZSRGV2aWNlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5kZXZpY2VzLnB1c2goZGV2aWNlc1tpXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGRldmljZXNbaV0gaW5zdGFuY2VvZiBQb3NpdGlvblNlbnNvclZSRGV2aWNlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5kZXZpY2VzLnB1c2goZGV2aWNlc1tpXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuZGV2aWNlc1BvcHVsYXRlZCA9IHRydWU7XG4gICAgICAgICAgICByZXNvbHZlKHNlbGYuZGV2aWNlcyk7XG4gICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzZWxmLnBvcHVsYXRlRGV2aWNlcygpO1xuICAgICAgcmVzb2x2ZShzZWxmLmRldmljZXMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJlamVjdChlKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgYSBkZXZpY2UgaXMgbW9iaWxlLlxuICovXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5pc01vYmlsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gL0FuZHJvaWQvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpIHx8XG4gICAgICAvaVBob25lfGlQYWR8aVBvZC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5pc0NhcmRib2FyZENvbXBhdGlibGUgPSBmdW5jdGlvbigpIHtcbiAgLy8gRm9yIG5vdywgc3VwcG9ydCBhbGwgaU9TIGFuZCBBbmRyb2lkIGRldmljZXMuXG4gIC8vIEFsc28gZW5hYmxlIHRoZSBXZWJWUkNvbmZpZy5GT1JDRV9WUiBmbGFnIGZvciBkZWJ1Z2dpbmcuXG4gIHJldHVybiB0aGlzLmlzTW9iaWxlKCkgfHwgV2ViVlJDb25maWcuRk9SQ0VfRU5BQkxFX1ZSO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWJWUlBvbHlmaWxsO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iXX0=
