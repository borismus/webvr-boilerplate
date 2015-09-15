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

var PositionSensorVRDevice = require('./base.js').PositionSensorVRDevice;
var headtrackr = require('./deps/headtrackr.js');
var THREE = require('./three-math.js');

// What's the range of the position changes? Use 1m for now.
var X_SCALE = 2;
var Y_SCALE = 1;
var ALPHA = 0.3;

function WebcamPositionSensorVRDevice() {
  this.deviceId = 'webvr-polyfill:webcam';
  this.deviceName = 'VR Position Device (webvr-polyfill:webcam)';

  this.position = new THREE.Vector3();

  var videoInput = document.createElement('video');
  videoInput.autoplay = true;
  videoInput.loop = true;

  var canvasInput = document.createElement('canvas');
  canvasInput.width = 320;
  canvasInput.height = 240;
  this.canvasInput = canvasInput;

  var tracker = new headtrackr.Tracker({
    ui: true,
    debug: true
  });
  tracker.init(videoInput, canvasInput);
  tracker.start();

  document.addEventListener('facetrackingEvent', this.onFaceTrackingEvent_.bind(this));
}
WebcamPositionSensorVRDevice.prototype = new PositionSensorVRDevice();

WebcamPositionSensorVRDevice.prototype.getState = function() {
  return {
    hasOrientation: false,
    orientation: null,
    hasPosition: true,
    position: this.position
  }
};

WebcamPositionSensorVRDevice.prototype.onFaceTrackingEvent_ = function(e) {
  //console.log('onFaceTrackingEvent_', e.x);
  // Normalize the x tracking position based on the size of the canvas.
  var xPercent = e.x / this.canvasInput.width;
  var x = (0.5 - xPercent) * X_SCALE;

  var yPercent = e.y / this.canvasInput.height;
  var y = (0.5 - yPercent) * Y_SCALE;

  // Smooth the camera movement.
  var smoothX = ALPHA * x + (1 - ALPHA) * this.position.x;
  var smoothY = ALPHA * y + (1 - ALPHA) * this.position.y;
  this.position.set(smoothX, smoothY, 0);
};

module.exports = WebcamPositionSensorVRDevice;
