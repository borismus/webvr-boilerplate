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

var CardboardHMDVRDevice = require('./cardboard-hmd-vr-device.js');
var GyroPositionSensorVRDevice = require('./gyro-position-sensor-vr-device.js');
var MouseKeyboardPositionSensorVRDevice = require('./mouse-keyboard-position-sensor-vr-device.js');
// Uncomment to add positional tracking via webcam.
//var WebcamPositionSensorVRDevice = require('./webcam-position-sensor-vr-device.js');
var HMDVRDevice = require('./base.js').HMDVRDevice;
var PositionSensorVRDevice = require('./base.js').PositionSensorVRDevice;

function WebVRPolyfill() {
  this.devices = [];

  if (!this.isWebVRAvailable()) {
    this.enablePolyfill();
  }
}

WebVRPolyfill.prototype.isWebVRAvailable = function() {
  return ('getVRDevices' in navigator) || ('mozGetVRDevices' in navigator);
};


WebVRPolyfill.prototype.enablePolyfill = function() {
  // Initialize our virtual VR devices.
  if (this.isCardboardCompatible()) {
    this.devices.push(new CardboardHMDVRDevice());
  }

  // Polyfill using the right position sensor.
  if (this.isMobile()) {
    this.devices.push(new GyroPositionSensorVRDevice());
  } else {
    this.devices.push(new MouseKeyboardPositionSensorVRDevice());
    // Uncomment to add positional tracking via webcam.
    //this.devices.push(new WebcamPositionSensorVRDevice());
  }

  // Provide navigator.getVRDevices.
  navigator.getVRDevices = this.getVRDevices.bind(this);

  // Provide the CardboardHMDVRDevice and PositionSensorVRDevice objects.
  window.HMDVRDevice = HMDVRDevice;
  window.PositionSensorVRDevice = PositionSensorVRDevice;
};

WebVRPolyfill.prototype.getVRDevices = function() {
  var devices = this.devices;
  return new Promise(function(resolve, reject) {
    try {
      resolve(devices);
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
  // Also enable the global CARDBOARD_DEBUG flag.
  return this.isMobile() || window.CARDBOARD_DEBUG;
};

module.exports = WebVRPolyfill;
