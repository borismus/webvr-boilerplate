(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    widthMeters: 0.05127,
    heightMeters: 0.09011,
    bevelMeters: 0.00396
  }),
  iPhone6: new Device({
    width: 750,
    height: 1334,
    widthMeters: 0.0584,
    heightMeters: 0.1038,
    bevelMeters: 0.00371
  }),
  iPhone6Plus: new Device({
    width: 1242,
    height: 2208,
    widthMeters: 0.06954,
    heightMeters: 0.12235,
    bevelMeters: 0.00462
  })
};

// TODO: Add Nexus 5X, Nexus 6P, Nexus 6.
var AndroidDevices = {
  Nexus5: new Device({
    userAgentRegExp: /Nexus 5/,
    widthMeters: 0.062,
    heightMeters: 0.110,
    bevelMeters: 0.004
  }),
  GalaxyS3: new Device({
    userAgentRegExp: /GT-I9300/,
    widthMeters: 0.060,
    heightMeters: 0.106,
    bevelMeters: 0.005
  }),
  GalaxyS4: new Device({
    userAgentRegExp: /GT-I9505/,
    widthMeters: 0.0625,
    heightMeters: 0.111,
    bevelMeters: 0.004
  }),
  GalaxyS5: new Device({
    userAgentRegExp: /SM-G900F/,
    widthMeters: 0.066,
    heightMeters: 0.113,
    bevelMeters: 0.005
  }),
  GalaxyS6: new Device({
    userAgentRegExp: /SM-G920/,
    widthMeters: 0.0635,
    heightMeters: 0.114,
    bevelMeters: 0.0035
  }),
};

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

/**
 * Gets the coordinates (in [0, 1]) for the left eye. To go from these
 * normalized coordinates, you multiply by real dimensions.
 */
DeviceInfo.prototype.getLeftEyeCenter = function() {
  if (!this.device) {
    return DEFAULT_LEFT_CENTER;
  }
  // Get parameters from the viewer.
  var ipdMeters = this.viewer.interLensDistance;
  var eyeToMid = ipdMeters / 2;
  var eyeToBase = this.viewer.baselineLensDistance;

  // Get parameters from the phone.
  var halfWidthMeters = this.device.heightMeters / 2;
  var heightMeters = this.device.widthMeters;

  // Do calculations.
  // Measure the distance between bottom of screen and center.
  var eyeToBevel = eyeToBase - this.device.bevelMeters;
  var px = 1 - (eyeToMid / halfWidthMeters);
  var py = 1 - (eyeToBevel / heightMeters);

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
  this.widthMeters = params.widthMeters;
  this.heightMeters = params.heightMeters;
  this.bevelMeters = params.bevelMeters;
}


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

},{"./util.js":2}],2:[function(require,module,exports){
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

var Util = {};

Util.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.isFirefox = function() {
  return /firefox/i.test(navigator.userAgent);
};

Util.isIOS = function() {
  return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
};

Util.isIFrame = function() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

Util.appendQueryParameter = function(url, key, value) {
  // Determine delimiter based on if the URL already GET parameters in it.
  var delimiter = (url.indexOf('?') < 0 ? '?' : '&');
  url += delimiter + key + '=' + value;
  return url;
};

// From http://goo.gl/4WX3tg
Util.getQueryParameter = function(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

Util.isLandscapeMode = function() {
  return (window.orientation == 90 || window.orientation == -90);
};


module.exports = Util;

},{}],3:[function(require,module,exports){
var DeviceInfo = require('../src/device-info.js');

var di = new DeviceInfo();
var centroid = di.getLeftEyeCenter();

// Size the canvas. Render the centroid.
var canvas = document.querySelector('canvas');
var w = window.innerWidth;
var h = window.innerHeight;
var x = centroid.x * w/2;
var y = centroid.y * h;
var size = 10;

canvas.width = w;
canvas.height = h;

var ctx = canvas.getContext('2d');
ctx.clearRect(0, 0, w, h);
ctx.fillStyle = 'black';
ctx.fillRect(x - size/2, y - size/2, size, size);

console.log('Placing eye at (%d, %d).', x, y);

},{"../src/device-info.js":1}]},{},[3]);
