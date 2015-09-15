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
var HMDVRDevice = require('./base.js').HMDVRDevice;

// Constants from vrtoolkit: https://github.com/googlesamples/cardboard-java.
var INTERPUPILLARY_DISTANCE = 0.06;
var DEFAULT_MAX_FOV_LEFT_RIGHT = 40;
var DEFAULT_MAX_FOV_BOTTOM = 40;
var DEFAULT_MAX_FOV_TOP = 40;

/**
 * The HMD itself, providing rendering parameters.
 */
function CardboardHMDVRDevice() {
  // From com/google/vrtoolkit/cardboard/FieldOfView.java.
  this.fov = {
    upDegrees: DEFAULT_MAX_FOV_TOP,
    downDegrees: DEFAULT_MAX_FOV_BOTTOM,
    leftDegrees: DEFAULT_MAX_FOV_LEFT_RIGHT,
    rightDegrees: DEFAULT_MAX_FOV_LEFT_RIGHT
  };
  // Set display constants.
  this.eyeTranslationLeft = {
    x: INTERPUPILLARY_DISTANCE * -0.5,
    y: 0,
    z: 0
  };
  this.eyeTranslationRight = {
    x: INTERPUPILLARY_DISTANCE * 0.5,
    y: 0,
    z: 0
  };
}
CardboardHMDVRDevice.prototype = new HMDVRDevice();

CardboardHMDVRDevice.prototype.getEyeParameters = function(whichEye) {
  var eyeTranslation;
  if (whichEye == 'left') {
    eyeTranslation = this.eyeTranslationLeft;
  } else if (whichEye == 'right') {
    eyeTranslation = this.eyeTranslationRight;
  } else {
    console.error('Invalid eye provided: %s', whichEye);
    return null;
  }
  return {
    recommendedFieldOfView: this.fov,
    eyeTranslation: eyeTranslation
  };
};

module.exports = CardboardHMDVRDevice;
