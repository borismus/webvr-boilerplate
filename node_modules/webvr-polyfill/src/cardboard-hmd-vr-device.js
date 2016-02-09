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
var DEFAULT_INTERPUPILLARY_DISTANCE = 0.06;
var DEFAULT_FIELD_OF_VIEW = 40;

var Eye = {
  LEFT: 'left',
  RIGHT: 'right'
};

/**
 * The HMD itself, providing rendering parameters.
 */
function CardboardHMDVRDevice() {
  // From com/google/vrtoolkit/cardboard/FieldOfView.java.
  this.setMonocularFieldOfView_(DEFAULT_FIELD_OF_VIEW);
  // Set display constants.
  this.setInterpupillaryDistance(DEFAULT_INTERPUPILLARY_DISTANCE);
}
CardboardHMDVRDevice.prototype = new HMDVRDevice();

CardboardHMDVRDevice.prototype.getEyeParameters = function(whichEye) {
  var eyeTranslation;
  var fieldOfView;
  var renderRect;

  if (whichEye == Eye.LEFT) {
    eyeTranslation = this.eyeTranslationLeft;
    fieldOfView = this.fieldOfViewLeft;
    renderRect = this.renderRectLeft;
  } else if (whichEye == Eye.RIGHT) {
    eyeTranslation = this.eyeTranslationRight;
    fieldOfView = this.fieldOfViewRight;
    renderRect = this.renderRectRight;
  } else {
    console.error('Invalid eye provided: %s', whichEye);
    return null;
  }
  return {
    recommendedFieldOfView: fieldOfView,
    eyeTranslation: eyeTranslation,
    renderRect: renderRect
  };
};

/**
 * Sets the field of view for both eyes. This is according to WebVR spec:
 *
 * @param {FieldOfView} opt_fovLeft Field of view of the left eye.
 * @param {FieldOfView} opt_fovRight Field of view of the right eye.
 * @param {Number} opt_zNear The near plane.
 * @param {Number} opt_zFar The far plane.
 *
 * http://mozvr.github.io/webvr-spec/webvr.html#dom-hmdvrdevice-setfieldofviewleftfov-rightfov-znear-zfar
 */
CardboardHMDVRDevice.prototype.setFieldOfView =
    function(opt_fovLeft, opt_fovRight, opt_zNear, opt_zFar) {
  if (opt_fovLeft) {
    this.fieldOfViewLeft = opt_fovLeft;
  }
  if (opt_fovRight) {
    this.fieldOfViewRight = opt_fovRight;
  }
  if (opt_zNear) {
    this.zNear = opt_zNear;
  }
  if (opt_zFar) {
    this.zFar = opt_zFar;
  }
};


/**
 * Changes the interpupillary distance of the rendered scene. This is useful for
 * changing Cardboard viewers.
 *
 * Possibly a useful addition to the WebVR spec?
 *
 * @param {Number} ipd Distance between eyes.
 */
CardboardHMDVRDevice.prototype.setInterpupillaryDistance = function(ipd) {
  this.eyeTranslationLeft = {
    x: ipd * -0.5,
    y: 0,
    z: 0
  };
  this.eyeTranslationRight = {
    x: ipd * 0.5,
    y: 0,
    z: 0
  };
};


/**
 * Changes the render rect (ie. viewport) where each eye is rendered. This is
 * useful for changing Cardboard viewers.
 *
 * Possibly a useful addition to the WebVR spec?
 *
 * @param {Rect} opt_rectLeft Viewport for left eye.
 * @param {Rect} opt_rectRight Viewport for right eye.
 */
CardboardHMDVRDevice.prototype.setRenderRect = function(opt_rectLeft, opt_rectRight) {
  if (opt_rectLeft) {
    this.renderRectLeft = opt_rectLeft;
  }
  if (opt_rectRight) {
    this.renderRectRight = opt_rectRight;
  }
};

/**
 * Sets a symmetrical field of view for both eyes, with just one angle.
 *
 * @param {Number} angle Angle in degrees of left, right, top and bottom for
 * both eyes.
 */
CardboardHMDVRDevice.prototype.setMonocularFieldOfView_ = function(angle) {
  this.setFieldOfView(this.createSymmetricalFieldOfView_(angle),
                      this.createSymmetricalFieldOfView_(angle));
};

CardboardHMDVRDevice.prototype.createSymmetricalFieldOfView_ = function(angle) {
  return {
    upDegrees: angle,
    downDegrees: angle,
    leftDegrees: angle,
    rightDegrees: angle
  };
};

module.exports = CardboardHMDVRDevice;
