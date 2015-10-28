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

var Util = require('./util.js');

// Display width, display height and bevel measurements done on real phones.
// Resolutions from http://www.paintcodeapp.com/news/ultimate-guide-to-iphone-resolutions
var iOSDevices = {
  iPhone5: new Device({
    width: 640,
    height: 1136,
    widthMm: 51.27,
    heightMm: 90.11,
    bevelMm: 3.96
  }),
  iPhone6: new Device({
    width: 750,
    height: 1334,
    widthMm: 58.4,
    heightMm: 103.8,
    bevelMm: 3.71
  }),
  iPhone6Plus: new Device({
    width: 1242,
    height: 2208,
    widthMm: 69.54,
    heightMm: 122.35,
    bevelMm: 4.62
  })
};

var AndroidDevices = {
  Nexus5: new Device({
    userAgentRegExp: /Nexus 5/,
    widthMm: 62,
    heightMm: 110,
    bevelMm: 4
  }),
  GalaxyS3: new Device({
    userAgentRegExp: /GT-I9300/,
    widthMm: 60,
    heightMm: 106,
    bevelMm: 5
  }),
  GalaxyS4: new Device({
    userAgentRegExp: /GT-I9505/,
    widthMm: 62.5,
    heightMm: 111,
    bevelMm: 4
  }),
  GalaxyS5: new Device({
    userAgentRegExp: /SM-G900F/,
    widthMm: 66,
    heightMm: 113,
    bevelMm: 5
  }),
  GalaxyS6: new Device({
    userAgentRegExp: /SM-G920/,
    widthMm: 63.5,
    heightMm: 114,
    bevelMm: 3.5
  }),
};

var Enclosures = {
  CardboardV1: new CardboardEnclosure({
    ipdMm: 61,
    baselineLensCenterMm: 37.26
  }),
  FunkyMonkey: new CardboardEnclosure({
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
  this.enclosure = Enclosures.CardboardV1;
}

DeviceInfo.prototype.getDevice = function() {
  return this.device;
};

/**
 * Gets the coordinates (in [0, 1]) for the left eye.
 */
DeviceInfo.prototype.getLeftEyeCenter = function() {
  if (!this.device) {
    return DEFAULT_LEFT_CENTER;
  }
  // Get parameters from the enclosure.
  var eyeToMid = this.enclosure.ipdMm / 2;
  var eyeToBase = this.enclosure.baselineLensCenterMm;

  // Get parameters from the phone.
  var halfWidthMm = this.device.heightMm / 2;
  var heightMm = this.device.widthMm;

  // Do calculations.
  // Measure the distance between bottom of screen and center.
  var eyeToBevel = eyeToBase - this.device.bevelMm;
  var px = 1 - (eyeToMid / halfWidthMm);
  var py = 1 - (eyeToBevel / heightMm);

  return {x: px, y: py};
};

DeviceInfo.prototype.getRightEyeCenter = function() {
  if (!this.device) {
    return DEFAULT_RIGHT_CENTER;
  }
  var left = this.getLeftEyeCenter();
  return {x: 1 - left.x, y: left.y};
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
  // No device matched.
  return null;
};


function Device(params) {
  this.userAgentRegExp = params.userAgentRegExp;
  this.width = params.width;
  this.height = params.height;
  this.widthMm = params.widthMm;
  this.heightMm = params.heightMm;
  this.bevelMm = params.bevelMm;
}


function CardboardEnclosure(params) {
  // Distortion coefficients.
  this.k1 = params.k1;
  this.k2 = params.k2;
  // IPD in millimeters.
  this.ipdMm = params.ipdMm;
  // Distance between baseline and lens.
  this.baselineLensCenterMm = params.baselineLensCenterMm;
}

module.exports = DeviceInfo;
