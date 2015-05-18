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

// Width, height and bevel measurements done on real iPhones.
// Resolutions from http://www.paintcodeapp.com/news/ultimate-guide-to-iphone-resolutions
// Note: iPhone pixels are not square, so relying on diagonal is not enough.
var Devices = {
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
  if (!Util.isIOS()) {
    return null;
  }

  // On iOS, use screen dimensions to determine iPhone/iPad model.
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Check both width and height since the phone may be in landscape.
  var width = screen.availWidth;
  var height = screen.availHeight;
  var pixelWidth = width * window.devicePixelRatio;
  var pixelHeight = height * window.devicePixelRatio;

  // Match the screen dimension to the correct device.
  for (var id in Devices) {
    var device = Devices[id];
    // Expect an exact match on width.
    if (device.width == pixelWidth || device.width == pixelHeight) {
      console.log('Detected iPhone: %s', id);
      // This is the right device.
      return device;
    }
  }
  return null;
};


function Device(params) {
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
