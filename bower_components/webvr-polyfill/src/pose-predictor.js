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
var THREE = require('./three-math.js');

var PredictionMode = {
  NONE: 'none',
  INTERPOLATE: 'interpolate',
  PREDICT: 'predict'
}

// How much to interpolate between the current orientation estimate and the
// previous estimate position. This is helpful for devices with low
// deviceorientation firing frequency (eg. on iOS8 and below, it is 20 Hz).  The
// larger this value (in [0, 1]), the smoother but more delayed the head
// tracking is.
var INTERPOLATION_SMOOTHING_FACTOR = 0.01;

// Angular threshold, if the angular speed (in deg/s) is less than this, do no
// prediction. Without it, the screen flickers quite a bit.
var PREDICTION_THRESHOLD_DEG_PER_S = 0.01;
//var PREDICTION_THRESHOLD_DEG_PER_S = 0;

// How far into the future to predict.
WEBVR_PREDICTION_TIME_MS = 80;

// Whether to predict or what.
WEBVR_PREDICTION_MODE = PredictionMode.PREDICT;

function PosePredictor() {
  this.lastQ = new THREE.Quaternion();
  this.lastTimestamp = null;

  this.outQ = new THREE.Quaternion();
  this.deltaQ = new THREE.Quaternion();
}

PosePredictor.prototype.getPrediction = function(currentQ, rotationRate, timestamp) {
  // If there's no previous quaternion, output the current one and save for
  // later.
  if (!this.lastTimestamp) {
    this.lastQ.copy(currentQ);
    this.lastTimestamp = timestamp;
    return currentQ;
  }

  // DEBUG ONLY: Try with a fixed 60 Hz update speed.
  //var elapsedMs = 1000/60;
  var elapsedMs = timestamp - this.lastTimestamp;

  switch (WEBVR_PREDICTION_MODE) {
    case PredictionMode.INTERPOLATE:
      this.outQ.copy(currentQ);
      this.outQ.slerp(this.lastQ, INTERPOLATION_SMOOTHING_FACTOR);

      // Save the current quaternion for later.
      this.lastQ.copy(currentQ);
      break;
    case PredictionMode.PREDICT:
      var axisAngle;
      if (rotationRate) {
        axisAngle = this.getAxisAngularSpeedFromRotationRate_(rotationRate);
      } else {
        axisAngle = this.getAxisAngularSpeedFromGyroDelta_(currentQ, elapsedMs);
      }

      // If there is no predicted axis/angle, don't do prediction.
      if (!axisAngle) {
        this.outQ.copy(currentQ);
        this.lastQ.copy(currentQ);
        break;
      }
      var angularSpeedDegS = axisAngle.speed;
      var axis = axisAngle.axis;
      var predictAngleDeg = (WEBVR_PREDICTION_TIME_MS / 1000) * angularSpeedDegS;

      // If we're rotating slowly, don't do prediction.
      if (angularSpeedDegS < PREDICTION_THRESHOLD_DEG_PER_S) {
        this.outQ.copy(currentQ);
        this.lastQ.copy(currentQ);
        break;
      }

      // Calculate the prediction delta to apply to the original angle.
      this.deltaQ.setFromAxisAngle(axis, THREE.Math.degToRad(predictAngleDeg));
      // DEBUG ONLY: As a sanity check, use the same axis and angle as before,
      // which should cause no prediction to happen.
      //this.deltaQ.setFromAxisAngle(axis, angle);

      this.outQ.copy(this.lastQ);
      this.outQ.multiply(this.deltaQ);

      // Use the predicted quaternion as the new last one.
      //this.lastQ.copy(this.outQ);
      this.lastQ.copy(currentQ);
      break;
    case PredictionMode.NONE:
    default:
      this.outQ.copy(currentQ);
  }
  this.lastTimestamp = timestamp;

  return this.outQ;
};

PosePredictor.prototype.setScreenOrientation = function(screenOrientation) {
  this.screenOrientation = screenOrientation;
};

PosePredictor.prototype.getAxis_ = function(quat) {
  // x = qx / sqrt(1-qw*qw)
  // y = qy / sqrt(1-qw*qw)
  // z = qz / sqrt(1-qw*qw)
  var d = Math.sqrt(1 - quat.w * quat.w);
  return new THREE.Vector3(quat.x / d, quat.y / d, quat.z / d);
};

PosePredictor.prototype.getAngle_ = function(quat) {
  // angle = 2 * acos(qw)
  // If w is greater than 1 (THREE.js, how can this be?), arccos is not defined.
  if (quat.w > 1) {
    return 0;
  }
  var angle = 2 * Math.acos(quat.w);
  // Normalize the angle to be in [-π, π].
  if (angle > Math.PI) {
    angle -= 2 * Math.PI;
  }
  return angle;
};

PosePredictor.prototype.getAxisAngularSpeedFromRotationRate_ = function(rotationRate) {
  if (!rotationRate) {
    return null;
  }
  var screenRotationRate;
  if (/iPad|iPhone|iPod/.test(navigator.platform)) {
    // iOS: angular speed in deg/s.
    var screenRotationRate = this.getScreenAdjustedRotationRateIOS_(rotationRate);
  } else {
    // Android: angular speed in rad/s, so need to convert.
    rotationRate.alpha = THREE.Math.radToDeg(rotationRate.alpha);
    rotationRate.beta = THREE.Math.radToDeg(rotationRate.beta);
    rotationRate.gamma = THREE.Math.radToDeg(rotationRate.gamma);
    var screenRotationRate = this.getScreenAdjustedRotationRate_(rotationRate);
  }
  var vec = new THREE.Vector3(
      screenRotationRate.beta, screenRotationRate.alpha, screenRotationRate.gamma);

  /*
  var vec;
  if (/iPad|iPhone|iPod/.test(navigator.platform)) {
    vec = new THREE.Vector3(rotationRate.gamma, rotationRate.alpha, rotationRate.beta);
  } else {
    vec = new THREE.Vector3(rotationRate.beta, rotationRate.alpha, rotationRate.gamma);
  }
  // Take into account the screen orientation too!
  vec.applyQuaternion(this.screenTransform);
  */

  // Angular speed in deg/s.
  var angularSpeedDegS = vec.length();

  var axis = vec.normalize();
  return {
    speed: angularSpeedDegS,
    axis: axis
  }
};

PosePredictor.prototype.getScreenAdjustedRotationRate_ = function(rotationRate) {
  var screenRotationRate = {
    alpha: -rotationRate.alpha,
    beta: rotationRate.beta,
    gamma: rotationRate.gamma
  };
  switch (this.screenOrientation) {
    case 90:
      screenRotationRate.beta  = - rotationRate.gamma;
      screenRotationRate.gamma =   rotationRate.beta;
      break;
    case 180:
      screenRotationRate.beta  = - rotationRate.beta;
      screenRotationRate.gamma = - rotationRate.gamma;
      break;
    case 270:
    case -90:
      screenRotationRate.beta  =   rotationRate.gamma;
      screenRotationRate.gamma = - rotationRate.beta;
      break;
    default: // SCREEN_ROTATION_0
      screenRotationRate.beta  =   rotationRate.beta;
      screenRotationRate.gamma =   rotationRate.gamma;
      break;
  }
  return screenRotationRate;
};

PosePredictor.prototype.getScreenAdjustedRotationRateIOS_ = function(rotationRate) {
  var screenRotationRate = {
    alpha: rotationRate.alpha,
    beta: rotationRate.beta,
    gamma: rotationRate.gamma
  };
  // Values empirically derived.
  switch (this.screenOrientation) {
    case 90:
      screenRotationRate.beta  = -rotationRate.beta;
      screenRotationRate.gamma =  rotationRate.gamma;
      break;
    case 180:
      // You can't even do this on iOS.
      break;
    case 270:
    case -90:
      screenRotationRate.alpha = -rotationRate.alpha;
      screenRotationRate.beta  =  rotationRate.beta;
      screenRotationRate.gamma =  rotationRate.gamma;
      break;
    default: // SCREEN_ROTATION_0
      screenRotationRate.alpha =  rotationRate.beta;
      screenRotationRate.beta  =  rotationRate.alpha;
      screenRotationRate.gamma =  rotationRate.gamma;
      break;
  }
  return screenRotationRate;
};

PosePredictor.prototype.getAxisAngularSpeedFromGyroDelta_ = function(currentQ, elapsedMs) {
  // Sometimes we use the same sensor timestamp, in which case prediction
  // won't work.
  if (elapsedMs == 0) {
    return null;
  }
  // Q_delta = Q_last^-1 * Q_curr
  this.deltaQ.copy(this.lastQ);
  this.deltaQ.inverse();
  this.deltaQ.multiply(currentQ);

  // Convert from delta quaternion to axis-angle.
  var axis = this.getAxis_(this.deltaQ);
  var angleRad = this.getAngle_(this.deltaQ);
  // It took `elapsed` ms to travel the angle amount over the axis. Now,
  // we make a new quaternion based how far in the future we want to
  // calculate.
  var angularSpeedRadMs = angleRad / elapsedMs;
  var angularSpeedDegS = THREE.Math.radToDeg(angularSpeedRadMs) * 1000;
  // If no rotation rate is provided, do no prediction.
  return {
    speed: angularSpeedDegS,
    axis: axis
  };
};

module.exports = PosePredictor;
