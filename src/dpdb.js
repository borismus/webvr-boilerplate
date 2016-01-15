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

// Offline cache of the DPDB, to be used until we load the online one (and
// as a fallback in case we can't load the online one).
var DPDB_CACHE = require('./dpdb-cache.js');
var Util = require('./util.js');

// TODO(btco): replace this with the actual DPDB URL.
var ONLINE_DPDB_URL = "/dpdb.txt";

/**
 * Calculates device parameters based on the DPDB (Device Parameter Database).
 * Initially, uses the cached DPDB values.
 *
 * If fetchOnline == true, then this object tries to fetch the online version
 * of the DPDB and updates the device info if a better match is found.
 * Calls the onDeviceParamsUpdated callback when there is an update to the
 * device information.
 */
function Dpdb(fetchOnline, onDeviceParamsUpdated) {
  // Start with the offline DPDB cache while we are loading the real one.
  this.dpdb = DPDB_CACHE;

  // Calculate device params based on the offline version of the DPDB.
  this.recalculateDeviceParams_();

  // XHR to fetch online DPDB file, if requested.
  if (fetchOnline) {
    // Set the callback.
    this.onDeviceParamsUpdated = onDeviceParamsUpdated;

    console.log("Fetching DPDB...");
    var xhr = new XMLHttpRequest();
    var obj = this;
    xhr.open("GET", ONLINE_DPDB_URL, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState != 4) return;

      obj.loading = false;
      if (xhr.status >= 200 && xhr.status <= 299) {
        // Success.
        console.log("Successfully loaded online DPDB.");
        obj.dpdb = JSON.parse(xhr.response);
        obj.recalculateDeviceParams_();
      } else {
        // Error loading the DPDB.
        console.error("Error loading online DPDB!");
      }
    };
    xhr.send();
  }
}

// Returns the current device parameters.
Dpdb.prototype.getDeviceParams = function() {
  return this.deviceParams;
};

// Recalculates this device's parameters based on the DPDB.
Dpdb.prototype.recalculateDeviceParams_ = function() {
  console.log("Recalculating device params.");
  var newDeviceParams = this.calcDeviceParams_();
  console.log("New device parameters:");
  console.log(newDeviceParams);
  if (newDeviceParams) {
    this.deviceParams = newDeviceParams;
    // Invoke callback, if it is set.
    if (this.onDeviceParamsUpdated) {
      this.onDeviceParamsUpdated(this.deviceParams);
    }
  } else {
    console.error("Failed to recalculate device parameters.");
  }
};

// Returns a DeviceParams object that represents the best guess as to this
// device's parameters. Can return null if the device does not match any
// known devices.
Dpdb.prototype.calcDeviceParams_ = function() {
  var db = this.dpdb; // shorthand
  if (!db) {
    console.error("DPDB not available.");
    return null;
  }
  if (db.format != "1") {
    console.error("DPDB has unexpected format version.");
    return null;
  }
  if (!db.devices || !db.devices.length) {
    console.error("DPDB does not have a devices section.");
    return null;
  }

  // Get the actual user agent and screen dimensions in pixels.
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();
  console.log("User agent: " + userAgent);
  console.log("Pixel width: " + width);
  console.log("Pixel height: " + height);

  for (var i = 0; i < db.devices.length; i++) {
    var device = db.devices[i];
    if (!device.ru) {
      console.warn("Device[" + i + "] has no rules section.");
      continue;
    }

    if (device.type != "ios" && device.type != "android") {
      console.warn("Device[" + i + "] has invalid type.");
      continue;
    }

    // See if this device is of the appropriate type.
    if (Util.isIOS() != (device.type == "ios")) continue;

    // See if this device matches any of the rules:
    var matched = false;
    for (var j = 0; j < device.ru.length; j++) {
      var rule = device.ru[j];
      if (this.matchRule_(rule, userAgent, width, height)) {
        console.log("Rule matched:");
        console.log(rule);
        matched = true;
        break;
      }
    }
    if (!matched) continue;

    console.log("Device matched, #" + i + ", id " + device.id);

    var dpiPair = device.dpi.indexOf('x') > 0 ? this.parseRes_(device.dpi) :
        { x: device.dpi, y: device.dpi };

    return new DeviceParams({
      xdpi: dpiPair.x,
      ydpi: dpiPair.y,
      bevelMm: device.bw
    });
  }

  console.warn("No DPDB device match.");
  return null;
};

Dpdb.prototype.matchRule_ = function(rule, ua, screenWidth, screenHeight) {
  // If the rule doesn't have a user agent, we can't match it (it is meant
  // for other platforms).
  if (!rule.ua) return false;

  // If our user agent string doesn't contain the indicated user agent string,
  // the match fails.
  if (ua.indexOf(rule.ua) < 0) return false;

  // If the rule specifies screen dimensions that don't correspond to ours,
  // the match fails.
  if (rule.res) {
    var reqRes = this.parseRes_(rule.res);
    if (!reqRes) return false;
    // Compare min and max so as to make the order not matter, i.e., it should
    // be true that 640x480 == 480x640.
    if (Math.min(screenWidth, screenHeight) != Math.min(reqRes.x, reqRes.y) ||
        (Math.max(screenWidth, screenHeight) != Math.max(reqRes.x, reqRes.y))) {
      return false;
    }
  }

  return true;
}

// Parses a resolution string like "1280x760" into {x: 1280, y: 760}
Dpdb.prototype.parseRes_ = function(res) {
  var p = res.split(/x/);
  if (p.length != 2) {
    console.error("Invalid resolution string: " + res);
    return null;
  }
  return { "x": p[0], "y": p[1] };
}

function DeviceParams(params) {
  this.xdpi = params.xdpi;
  this.ydpi = params.ydpi;
  this.bevelMm = params.bevelMm;
}

module.exports = Dpdb;
