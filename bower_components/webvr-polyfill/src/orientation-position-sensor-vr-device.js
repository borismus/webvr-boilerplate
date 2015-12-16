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
var TouchPanner = require('./touch-panner.js');
var Util = require('./util.js');

WEBVR_YAW_ONLY = false;

/**
 * The positional sensor, implemented using web DeviceOrientation APIs.
 */
function OrientationPositionSensorVRDevice() {
  this.deviceId = 'webvr-polyfill:gyro';
  this.deviceName = 'VR Position Device (webvr-polyfill:gyro)';

  // Subscribe to deviceorientation events.
  window.addEventListener('deviceorientation', this.onDeviceOrientationChange_.bind(this));
  window.addEventListener('orientationchange', this.onScreenOrientationChange_.bind(this));

  this.deviceOrientation = null;
  this.screenOrientation = window.orientation;

  // Helper objects for calculating orientation.
  this.finalQuaternion = new THREE.Quaternion();
  this.tmpQuaternion = new THREE.Quaternion();
  this.deviceEuler = new THREE.Euler();
  this.screenTransform = new THREE.Quaternion();
  // -PI/2 around the x-axis.
  this.worldTransform = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

  // The quaternion for taking into account the reset position.
  this.resetTransform = new THREE.Quaternion();

  this.touchPanner = new TouchPanner();
}
OrientationPositionSensorVRDevice.prototype = new PositionSensorVRDevice();

/**
 * Returns {orientation: {x,y,z,w}, position: null}.
 * Position is not supported since we can't do 6DOF.
 */
OrientationPositionSensorVRDevice.prototype.getState = function() {
  return {
    hasOrientation: true,
    orientation: this.getOrientation(),
    hasPosition: false,
    position: null
  }
};

OrientationPositionSensorVRDevice.prototype.onDeviceOrientationChange_ =
    function(deviceOrientation) {
  this.deviceOrientation = deviceOrientation;
};

OrientationPositionSensorVRDevice.prototype.onScreenOrientationChange_ =
    function(screenOrientation) {
  this.screenOrientation = window.orientation;
};

OrientationPositionSensorVRDevice.prototype.getOrientation = function() {
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
  this.tmpQuaternion.setFromEuler(this.deviceEuler);
  this.minusHalfAngle = -orient / 2;
  this.screenTransform.set(0, Math.sin(this.minusHalfAngle), 0, Math.cos(this.minusHalfAngle));
  // Take into account the reset transformation.
  this.finalQuaternion.copy(this.resetTransform);
  // And any rotations done via touch events.
  this.finalQuaternion.multiply(this.touchPanner.getOrientation());
  this.finalQuaternion.multiply(this.tmpQuaternion);
  this.finalQuaternion.multiply(this.screenTransform);
  this.finalQuaternion.multiply(this.worldTransform);

  return this.finalQuaternion;
};

OrientationPositionSensorVRDevice.prototype.resetSensor = function() {
  var angle = THREE.Math.degToRad(this.deviceOrientation.alpha);
  console.log('Normalizing yaw to %f', angle);
  this.resetTransform.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
};

module.exports = OrientationPositionSensorVRDevice;
