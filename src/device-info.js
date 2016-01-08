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

var Distortion = require('./distortion/distortion.js');
var Util = require('./util.js');

function Device(params) {
  this.label = params.label;
  this.userAgentRegExp = params.userAgentRegExp;

  this.width = params.width || this.calcWidth_();
  this.height = params.height || this.calcHeight_();
  this.widthMeters = params.widthMeters;
  this.heightMeters = params.heightMeters;
  this.bevelMeters = params.bevelMeters;
}

Device.prototype.calcWidth_ = function() {
  return Math.max(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Device.prototype.calcHeight_ = function() {
  return Math.min(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};


// Display width, display height and bevel measurements done on real phones.
// Resolutions from http://www.paintcodeapp.com/news/ultimate-guide-to-iphone-resolutions
var iOSDevices = {
  iPhone4: new Device({
    width: 640,
    height: 960,
    widthMeters: 0.075,
    heightMeters: 0.0495,
    bevelMeters: 0.004
  }),
  iPhone5: new Device({
    width: 640,
    height: 1136,
    widthMeters: 0.09011,
    heightMeters: 0.05127,
    bevelMeters: 0.00343
  }),
  iPhone6: new Device({
    width: 750,
    height: 1334,
    widthMeters: 0.1038,
    heightMeters: 0.0584,
    bevelMeters: 0.004
  }),
  iPhone6Plus: new Device({
    width: 1242,
    height: 2208,
    widthMeters: 0.12235,
    heightMeters: 0.06954,
    bevelMeters: 0.00471
  })
};


var AndroidDevices = {
  Nexus5: new Device({
    userAgentRegExp: /Nexus 5 /, // Trailing space to disambiguate from 5X.
    widthMeters: 0.110,
    heightMeters: 0.062,
    bevelMeters: 0.004
  }),
  Nexus6: new Device({
    userAgentRegExp: /Nexus 6 /, // Trailing space to disambiguate from 6P.
    widthMeters: 0.1320,
    heightMeters: 0.074,
    bevelMeters: 0.004
  }),
  Nexus5X: new Device({
    userAgentRegExp: /Nexus 5X/,
    widthMeters: 0.1155,
    heightMeters: 0.065,
    bevelMeters: 0.004
  }),
  Nexus6P: new Device({
    userAgentRegExp: /Nexus 6P/,
    widthMeters: 0.126,
    heightMeters: 0.0705,
    bevelMeters: 0.004
  }),
  GalaxyS3: new Device({
    userAgentRegExp: /GT-I9300/,
    widthMeters: 0.106,
    heightMeters: 0.060,
    bevelMeters: 0.005
  }),
  GalaxyS4: new Device({
    userAgentRegExp: /GT-I9505/,
    widthMeters: 0.111,
    heightMeters: 0.0625,
    bevelMeters: 0.004
  }),
  GalaxyS5: new Device({
    userAgentRegExp: /SM-G900F/,
    widthMeters: 0.113,
    heightMeters: 0.066,
    bevelMeters: 0.005
  }),
  GalaxyS6: new Device({
    userAgentRegExp: /SM-G920/,
    widthMeters: 0.114,
    heightMeters: 0.0635,
    bevelMeters: 0.0035
  }),
};


var AVERAGE_ANDROID = new Device({
  label: 'Average android (ie. no specific device detected)',
  widthMeters: AndroidDevices.Nexus5.widthMeters,
  heightMeters: AndroidDevices.Nexus5.heightMeters,
  bevelMeters: AndroidDevices.Nexus5.bevelMeters
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
 * Gives the correct device DPI based on screen dimensions and user agent.
 * For now, only iOS is supported.
 */
function DeviceInfo() {
  this.device = this.determineDevice_();
  this.viewer = Viewers.CardboardV1;
}

DeviceInfo.prototype.getDevice = function() {
  return this.device;
};

DeviceInfo.prototype.setViewer = function(viewer) {
  this.viewer = viewer;
};

DeviceInfo.prototype.determineDevice_ = function() {
  // Only support iPhones.
  if (Util.isIOS()) {
    return this.determineIPhone_();
  } else {
    return this.determineAndroid_();
  }
};

DeviceInfo.prototype.determineIPhone_ = function() {
  // On iOS, use screen dimensions to determine iPhone/iPad model.
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Check both width and height since the phone may be in landscape.
  var width = screen.availWidth;
  var height = screen.availHeight;
  var pixelWidth = width * window.devicePixelRatio;
  var pixelHeight = height * window.devicePixelRatio;

  // Match the screen dimension to the correct device.
  for (var id in iOSDevices) {
    var device = iOSDevices[id];
    // Expect an exact match on width.
    if (device.width == pixelWidth || device.width == pixelHeight) {
      console.log('Detected iPhone: %s', id);
      // This is the right device.
      return device;
    }
  }
  // This should never happen.
  console.error('Unable to detect iPhone type.');
  return null;
};

DeviceInfo.prototype.determineAndroid_ = function() {
  // Do a userAgent match against all of the known Android devices.
  for (var id in AndroidDevices) {
    var device = AndroidDevices[id];
    // Does it match?
    if (navigator.userAgent.match(device.userAgentRegExp)) {
      console.log('Detected Android: %s', id);
      return device;
    }
  }
  // No device matched, so return a default (average) smartphone.
  console.warn('No specific Android device detected. Using a generic size, ' +
               'which may lead to VR rendering issues.');
  return AVERAGE_ANDROID;
};

/**
 * Calculates field of view for the left eye.
 */
DeviceInfo.prototype.getDistortedFieldOfViewLeftEye = function() {
  var viewer = this.viewer;
  var device = this.device;

  var distortion = new Distortion(viewer.distortionCoefficients);

  // Device.height and device.width for device in portrait mode, so transpose.
  var eyeToScreenDistance = viewer.screenLensDistance;

  var outerDist = (device.widthMeters - viewer.interLensDistance) / 2;
  var innerDist = viewer.interLensDistance / 2;
  var bottomDist = viewer.baselineLensDistance - device.bevelMeters;
  var topDist = device.heightMeters - bottomDist;

  var outerAngle = THREE.Math.radToDeg(Math.atan(
      distortion.distort(outerDist / eyeToScreenDistance)));
  var innerAngle = THREE.Math.radToDeg(Math.atan(
      distortion.distort(innerDist / eyeToScreenDistance)));
  var bottomAngle = THREE.Math.radToDeg(Math.atan(
      distortion.distort(bottomDist / eyeToScreenDistance)));
  var topAngle = THREE.Math.radToDeg(Math.atan(
      distortion.distort(topDist / eyeToScreenDistance)));

  return {
    leftDegrees: Math.min(outerAngle, viewer.fov),
    rightDegrees: Math.min(innerAngle, viewer.fov),
    downDegrees: Math.min(bottomAngle, viewer.fov),
    upDegrees: Math.min(topAngle, viewer.fov)
  }
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
 * Calculates a projection matrix for the left eye.
 */
DeviceInfo.prototype.getProjectionMatrixLeftEye = function(opt_isUndistorted) {
  var fov = this.getFieldOfViewLeftEye(opt_isUndistorted);

  var projectionMatrix = new THREE.Matrix4();
  var near = 0.1;
  var far = 1000;
  var left = Math.tan(THREE.Math.degToRad(fov.leftDegrees)) * near;
  var right = Math.tan(THREE.Math.degToRad(fov.rightDegrees)) * near;
  var bottom = Math.tan(THREE.Math.degToRad(fov.downDegrees)) * near;
  var top = Math.tan(THREE.Math.degToRad(fov.upDegrees)) * near;

  // makeFrustum expects units in tan-angle space.
  projectionMatrix.makeFrustum(-left, right, -bottom, top, near, far);
  
  return projectionMatrix;
};


DeviceInfo.prototype.getUndistortedViewportLeftEye = function() {
  var p = this.getUndistortedParams_();
  var viewer = this.viewer;
  var device = this.device;

  var eyeToScreenDistance = viewer.screenLensDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;
  var xPxPerTanAngle = device.width / screenWidth;
  var yPxPerTanAngle = device.height / screenHeight;

  var x = Math.round((p.eyePosX - p.outerDist) * xPxPerTanAngle);
  var y = Math.round((p.eyePosY - p.bottomDist) * yPxPerTanAngle);
  return {
    x: x,
    y: y,
    width: Math.round((p.eyePosX + p.innerDist) * xPxPerTanAngle) - x,
    height: Math.round((p.eyePosY + p.topDist) * yPxPerTanAngle) - y
  };
};

/**
 * Calculates undistorted field of view for the left eye.
 */
DeviceInfo.prototype.getUndistortedFieldOfViewLeftEye = function() {
  var p = this.getUndistortedParams_();

  return {
    leftDegrees: THREE.Math.radToDeg(Math.atan(p.outerDist)),
    rightDegrees: THREE.Math.radToDeg(Math.atan(p.innerDist)),
    downDegrees: THREE.Math.radToDeg(Math.atan(p.bottomDist)),
    upDegrees: THREE.Math.radToDeg(Math.atan(p.topDist))
  };
};

DeviceInfo.prototype.getUndistortedParams_ = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = new Distortion(viewer.distortionCoefficients);

  // Most of these variables in tan-angle units.
  var eyeToScreenDistance = viewer.screenLensDistance;
  var halfLensDistance = viewer.interLensDistance / 2 / eyeToScreenDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;

  var eyePosX = screenWidth / 2 - halfLensDistance;
  var eyePosY = (viewer.baselineLensDistance - device.bevelMeters) / eyeToScreenDistance;

  var maxFov = viewer.fov;
  var viewerMax = distortion.distortInverse(Math.tan(THREE.Math.degToRad(maxFov)));
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
