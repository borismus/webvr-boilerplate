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
};

Emitter.prototype.emit = function(eventName) {
  //console.log('emitting:' + eventName);
  var callbacks = this.callbacks[eventName];
  if (!callbacks) {
    console.log('No valid callback specified for manager:' + this.uid + ' event:' + eventName + '.');
    return false;
  }
  var args = [].slice.call(arguments);

  // Eliminate the first param (the callback).
  args.shift();
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i].apply(this, args);
  }
  return true;
};

Emitter.prototype.on = function(eventName, callback) {
  if (eventName in this.callbacks) {
    this.callbacks[eventName].push(callback);
  } else {
    this.callbacks[eventName] = [callback];
  }
};

Emitter.prototype.remove = function (eventName, callback) {
  if (eventName in this.callbacks) {
      var index = indexOf(this.callbacks[eventName], callback);
      if(index >= 0) {
        this.callbacks[eventName].splice(index, 1);
      }
  }

};

module.exports = Emitter;
