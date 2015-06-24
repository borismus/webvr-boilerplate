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

var Wakelock = require('./wakelock.js');
var CardboardDistorter = require('./cardboard-distorter.js');
var WebVRButton = require('./webvr-button.js');
var Modes = require('./modes.js');
var Util = require('./util.js');

/**
 * Helper for getting in and out of VR mode.
 * Here we assume VR mode == full screen mode.
 *
 * 1. Detects whether or not VR mode is possible by feature detecting for
 * WebVR (or polyfill).
 *
 * 2. If WebVR is available, shows a button that lets you enter VR mode.
 *
 * 3. Provides Cardboard-style distortion if the webvr-polyfill is being used.
 *
 * 4. Provides best practices while in VR mode.
 * - Full screen
 * - Wake lock
 * - Orientation lock (mobile only)
 */
function WebVRManager(renderer, effect, params) {
  this.params = params || {};

  this.mode = Modes.UNKNOWN;

  // Set option to hide the button.
  var hideButton = this.params.hideButton || false;

  // Save the THREE.js renderer and effect for later.
  this.renderer = renderer;
  this.effect = effect;
  this.distorter = new CardboardDistorter(renderer);

  this.button = new WebVRButton();
  if (hideButton) {
    this.button.setVisibility(false);
  }

  // Check if the browser is compatible with WebVR.
  this.getHMD_().then(function(hmd) {
    // If Cardboard debug flag is enabled, force cardboard compat mode.
    hmd = hmd || window.CARDBOARD_DEBUG;
    // Activate either VR or Immersive mode.
    if (hmd) {
      this.activateVR_();
      // Only enable distortion if we are dealing using the polyfill and this is iOS.
      if (hmd.deviceName.indexOf('webvr-polyfill') == 0 && Util.isIOS()) {
        this.distorter.setActive(true);
      }
    } else {
      this.activateImmersive_();
    }
    // Set the right mode.
    this.defaultMode = hmd ? Modes.COMPATIBLE : Modes.INCOMPATIBLE;
    this.button.setMode(this.defaultMode);
  }.bind(this));
}

/**
 * Promise returns true if there is at least one HMD device available.
 */
WebVRManager.prototype.getHMD_ = function() {
  return new Promise(function(resolve, reject) {
    navigator.getVRDevices().then(function(devices) {
      // Promise succeeds, but check if there are any devices actually.
      for (var i = 0; i < devices.length; i++) {
        if (devices[i] instanceof HMDVRDevice) {
          resolve(devices[i]);
          break;
        }
      }
      resolve(null);
    }, function() {
      // No devices are found.
      resolve(null);
    });
  });
};

WebVRManager.prototype.isVRMode = function() {
  return this.mode == Modes.VR;
};

WebVRManager.prototype.render = function(scene, camera) {
  if (this.isVRMode()) {
    this.distorter.preRender();
    this.effect.render(scene, camera);
    this.distorter.postRender();
  } else {
    this.renderer.render(scene, camera);
  }
};

/**
 * Makes it possible to go into VR mode.
 */
WebVRManager.prototype.activateVR_ = function() {
  // Or via clicking on the VR button.
  this.button.on('click', this.toggleVRMode.bind(this));

  // Whenever we enter fullscreen, we are entering VR or immersive mode.
  document.addEventListener('webkitfullscreenchange',
      this.onFullscreenChange_.bind(this));
  document.addEventListener('mozfullscreenchange',
      this.onFullscreenChange_.bind(this));

  // Create the necessary elements for wake lock to work.
  this.wakelock = new Wakelock();
};

WebVRManager.prototype.activateImmersive_ = function() {
  // Next time a user does anything with their mouse, we trigger immersive mode.
  this.button.on('click', this.enterImmersive.bind(this));
};

WebVRManager.prototype.enterImmersive = function() {
  this.requestPointerLock_();
  this.requestFullscreen_();
};

WebVRManager.prototype.toggleVRMode = function() {
  if (!this.isVRMode()) {
    // Enter VR mode.
    this.enterVR();
  } else {
    this.exitVR();
  }
};

WebVRManager.prototype.onFullscreenChange_ = function(e) {
  // If we leave full-screen, also exit VR mode.
  if (document.webkitFullscreenElement === null ||
      document.mozFullScreenElement === null) {
    this.exitVR();
  }
};

WebVRManager.prototype.requestPointerLock_ = function() {
  var canvas = this.renderer.domElement;
  canvas.requestPointerLock = canvas.requestPointerLock ||
      canvas.mozRequestPointerLock ||
      canvas.webkitRequestPointerLock;

  if (canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
};

WebVRManager.prototype.releasePointerLock_ = function() {
  document.exitPointerLock = document.exitPointerLock ||
      document.mozExitPointerLock ||
      document.webkitExitPointerLock;

  if (document.exitPointerLock) {
    document.exitPointerLock();
  }
};

WebVRManager.prototype.requestOrientationLock_ = function() {
  if (screen.orientation && Util.isMobile()) {
    screen.orientation.lock('landscape');
  }
};

WebVRManager.prototype.releaseOrientationLock_ = function() {
  if (screen.orientation) {
    screen.orientation.unlock();
  }
};

WebVRManager.prototype.requestFullscreen_ = function() {
  var canvas = this.renderer.domElement;
  if (canvas.mozRequestFullScreen) {
    canvas.mozRequestFullScreen();
  } else if (canvas.webkitRequestFullscreen) {
    canvas.webkitRequestFullscreen();
  }
};

WebVRManager.prototype.enterVR = function() {
  console.log('Entering VR.');
  // Enter fullscreen mode (note: this doesn't work in iOS).
  this.effect.setFullScreen(true);
  // Lock down orientation and wakelock.
  this.requestOrientationLock_();
  this.wakelock.request();

  this.mode = Modes.VR;
  // Set style on button.
  this.button.setMode(this.mode);

  this.distorter.patch();
};

WebVRManager.prototype.exitVR = function() {
  console.log('Exiting VR.');
  // Leave fullscreen mode (note: this doesn't work in iOS).
  this.effect.setFullScreen(false);
  // Release all locks.
  this.releaseOrientationLock_();
  this.releasePointerLock_();
  this.wakelock.release();
  // Also, work around a problem in VREffect and resize the window.
  this.effect.setSize(window.innerWidth, window.innerHeight);

  this.mode = this.defaultMode;
  // Go back to the default mode.
  this.button.setMode(this.mode);

  this.distorter.unpatch();
};

module.exports = WebVRManager;
