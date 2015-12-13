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

var ComplementaryFilter = require('./complementary-filter.js');
var PosePredictor = require('./pose-predictor.js');
var TouchPanner = require('./touch-panner.js');
var THREE = require('./three-math.js');
var Util = require('./util.js');

/**
 * The positional sensor, implemented using DeviceMotion APIs.
 */
function FusionPositionSensorVRDevice() {
  this.deviceId = 'webvr-polyfill:fused';
  this.deviceName = 'VR Position Device (webvr-polyfill:fused)';

  this.accelerometer = new THREE.Vector3();
  this.gyroscope = new THREE.Vector3();

  window.addEventListener('devicemotion', this.onDeviceMotionChange_.bind(this));
  window.addEventListener('orientationchange', this.onScreenOrientationChange_.bind(this));

  this.filter = new ComplementaryFilter(WebVRConfig.K_FILTER || 0.98);
  this.posePredictor = new PosePredictor(WebVRConfig.PREDICTION_TIME_S || 0.050);
  if (!WebVRConfig.TOUCH_PANNER_DISABLED) {
    this.touchPanner = new TouchPanner();
  }

  this.filterToWorldQ = new THREE.Quaternion();

  // Set the filter to world transform, depending on OS.
  if (Util.isIOS()) {
    this.filterToWorldQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2);
  } else {
    this.filterToWorldQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2);
  }

  this.worldToScreenQ = new THREE.Quaternion();
  this.setScreenTransform_();

  // Keep track of a reset transform for resetSensor.
  this.resetQ = new THREE.Quaternion();

  this.isFirefoxAndroid = Util.isFirefoxAndroid();
  this.isIOS = Util.isIOS();
}
FusionPositionSensorVRDevice.prototype = new PositionSensorVRDevice();

/**
 * Returns {orientation: {x,y,z,w}, position: null}.
 * Position is not supported since we can't do 6DOF.
 */
FusionPositionSensorVRDevice.prototype.getState = function() {
  return {
    hasOrientation: true,
    orientation: this.getOrientation(),
    hasPosition: false,
    position: null
  }
};

FusionPositionSensorVRDevice.prototype.getOrientation = function() {
  // Convert from filter space to the the same system used by the
  // deviceorientation event.
  var orientation = this.filter.getOrientation();

  // Predict orientation.
  this.predictedQ = this.posePredictor.getPrediction(orientation, this.gyroscope, this.previousTimestampS);

  // Convert to THREE coordinate system: -Z forward, Y up, X right.
  var out = new THREE.Quaternion();
  out.copy(this.filterToWorldQ);
  out.multiply(this.resetQ);
  if (this.touchPanner) {
    out.multiply(this.touchPanner.getOrientation());
  }
  out.multiply(this.predictedQ);
  out.multiply(this.worldToScreenQ);
  return out;
};

FusionPositionSensorVRDevice.prototype.resetSensor = function() {
  var euler = new THREE.Euler();
  euler.setFromQuaternion(this.filter.getOrientation());
  var yaw = euler.y;
  console.log('resetSensor with yaw: %f', yaw);
  this.resetQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -yaw);
  if (this.touchPanner) {
    this.touchPanner.resetSensor();
  }
};

FusionPositionSensorVRDevice.prototype.onDeviceMotionChange_ = function(deviceMotion) {
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

FusionPositionSensorVRDevice.prototype.onScreenOrientationChange_ =
    function(screenOrientation) {
  this.setScreenTransform_();
};

FusionPositionSensorVRDevice.prototype.setScreenTransform_ = function() {
  this.worldToScreenQ.set(0, 0, 0, 1);
  switch (window.orientation) {
    case 0:
      break;
    case 90:
      this.worldToScreenQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI/2);
      break;
    case -90:
      this.worldToScreenQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2);
      break;
    case 180:
      // TODO.
      break;
  }
};


module.exports = FusionPositionSensorVRDevice;
