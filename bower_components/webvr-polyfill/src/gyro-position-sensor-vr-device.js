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
var THREE = require('./three-math.js');
var PosePredictor = require('./pose-predictor.js');

/**
 * The positional sensor, implemented using web DeviceOrientation APIs.
 */
function GyroPositionSensorVRDevice() {
  this.deviceId = 'webvr-polyfill:gyro';
  this.deviceName = 'VR Position Device (webvr-polyfill:gyro)';

  // Subscribe to deviceorientation events.
  window.addEventListener('deviceorientation', this.onDeviceOrientationChange.bind(this));
  window.addEventListener('devicemotion', this.onDeviceMotionChange.bind(this));
  window.addEventListener('orientationchange', this.onScreenOrientationChange.bind(this));
  this.deviceOrientation = null;
  this.screenOrientation = window.orientation;

  // Helper objects for calculating orientation.
  this.finalQuaternion = new THREE.Quaternion();
  this.tmpQuaternion = new THREE.Quaternion();
  this.deviceEuler = new THREE.Euler();
  this.screenTransform = new THREE.Quaternion();
  // -PI/2 around the x-axis.
  this.worldTransform = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

  this.posePredictor = new PosePredictor();
}
GyroPositionSensorVRDevice.prototype = new PositionSensorVRDevice();

/**
 * Returns {orientation: {x,y,z,w}, position: null}.
 * Position is not supported since we can't do 6DOF.
 */
GyroPositionSensorVRDevice.prototype.getState = function() {
  return {
    hasOrientation: true,
    orientation: this.getOrientation(),
    hasPosition: false,
    position: null
  }
};

GyroPositionSensorVRDevice.prototype.onDeviceOrientationChange =
    function(deviceOrientation) {
  this.deviceOrientation = deviceOrientation;
};

GyroPositionSensorVRDevice.prototype.onDeviceMotionChange =
    function(deviceMotion) {
  this.deviceMotion = deviceMotion;
};

GyroPositionSensorVRDevice.prototype.onScreenOrientationChange =
    function(screenOrientation) {
  this.screenOrientation = window.orientation;
};

GyroPositionSensorVRDevice.prototype.getOrientation = function() {
  if (this.deviceOrientation == null) {
    return null;
  }

  // Rotation around the z-axis.
  var alpha = THREE.Math.degToRad(this.deviceOrientation.alpha);
  // Front-to-back (in portrait) rotation (x-axis).
  var beta = THREE.Math.degToRad(this.deviceOrientation.beta);
  // Left to right (in portrait) rotation (y-axis).
  var gamma = THREE.Math.degToRad(this.deviceOrientation.gamma);
  var orient = THREE.Math.degToRad(this.screenOrientation);

  // Use three.js to convert to quaternion. Lifted from
  // https://github.com/richtr/threeVR/blob/master/js/DeviceOrientationController.js
  this.deviceEuler.set(beta, alpha, -gamma, 'YXZ');
  this.finalQuaternion.setFromEuler(this.deviceEuler);
  this.minusHalfAngle = -orient / 2;
  this.screenTransform.set(0, Math.sin(this.minusHalfAngle), 0, Math.cos(this.minusHalfAngle));
  this.finalQuaternion.multiply(this.screenTransform);
  this.finalQuaternion.multiply(this.worldTransform);

  // DEBUG ONLY: Log rotation rate if it's large enough.
  /*
  if (this.deviceMotion) {
    var rotRate = this.deviceMotion.rotationRate;
    if (Math.abs(rotRate.alpha) > 5) {
      console.log('Rotation around Z: %f deg', rotRate.alpha);
    }
    if (Math.abs(rotRate.beta) > 5) {
      console.log('Rotation around X: %f deg', rotRate.beta);
    }
    if (Math.abs(rotRate.gamma) > 5) {
      console.log('Rotation around Y: %f deg', rotRate.gamma);
    }
  }
  */
  this.posePredictor.setScreenOrientation(this.screenOrientation);

  //var bestTime = this.rafTime || window.performance.now();
  //var bestTime = window.performance.now();
  var bestTime = this.deviceOrientation.timeStamp;
  var rotRate = this.deviceMotion && this.deviceMotion.rotationRate;
  return this.posePredictor.getPrediction(
      this.finalQuaternion, rotRate, bestTime);
};

GyroPositionSensorVRDevice.prototype.resetSensor = function() {
  console.error('Not implemented yet.');
};

GyroPositionSensorVRDevice.prototype.setAnimationFrameTime = function(rafTime) {
  this.rafTime = rafTime;
};


module.exports = GyroPositionSensorVRDevice;
