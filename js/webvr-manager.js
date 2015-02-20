/*
 * Copyright 2015 Boris Smus. All Rights Reserved.
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



/**
 * Helper for getting in and out of VR mode.
 * Here we assume VR mode == full screen mode.
 *
 * 1. Detects whether or not VR mode is possible by feature detecting for
 * WebVR (or polyfill).
 *
 * 2. If WebVR is available, provides means of entering VR mode:
 * - Double click
 * - Double tap
 * - Click "Enter VR" button
 *
 * 3. Provides best practices while in VR mode.
 * - Full screen
 * - Wake lock
 * - Orientation lock (mobile only)
 */
(function() {

function WebVRManager(effect) {
  // Save the THREE.js effect for later.
  this.effect = effect;
  // Create the button regardless.
  this.vrButton = this.createVRButton();

  // Check if the browser is compatible with WebVR.
  this.isHMDAvailable().then(function(isCompatible) {
    if (isCompatible) {
      this.setMode(Modes.COMPATIBLE);
      // If it is, activate VR mode.
      this.activateVR();
    } else {
      this.setMode(Modes.INCOMPATIBLE);
    }
  }.bind(this));

  this.os = this.getOS();
}

var Modes = {
  // Incompatible with WebVR.
  INCOMPATIBLE: 1,
  // Compatible with WebVR.
  COMPATIBLE: 2,
  // In virtual reality via WebVR.
  IMMERSED: 3,
};

/**
 * True if this browser supports WebVR.
 */
WebVRManager.prototype.isWebVRCompatible = function() {
  return 'getVRDevices' in navigator ||
      'mozGetVRDevices' in navigator ||
      'webkitGetVRDevices' in navigator;
};

/**
 * Promise returns true if there is at least one HMD device available.
 */
WebVRManager.prototype.isHMDAvailable = function() {
  return new Promise(function(resolve, reject) {
    navigator.getVRDevices().then(function(devices) {
      for (var i = 0; i < devices.length; i++) {
        if (devices[i] instanceof HMDVRDevice) {
          resolve(true);
          break;
        }
      }
      resolve(false);
    });
  });
};

WebVRManager.prototype.isVRMode = function() {
  return !!(document.isFullScreen ||
      document.webkitIsFullScreen || document.mozFullScreen);
};

WebVRManager.prototype.createVRButton = function() {
  var button = document.createElement('button');
  var s = button.style;
  s.position = 'absolute';
  s.top = 0;
  s.right = 0;
  s.width = '64px';
  s.height = '64px';
  s.backgroundSize = 'cover';
  s.backgroundColor = 'transparent';
  s.border = 0;
  document.body.appendChild(button);
  return button;
};

WebVRManager.prototype.setMode = function(mode) {
  switch (mode) {
    case Modes.INCOMPATIBLE:
      this.vrButton.style.display = 'none';
      break;
    case Modes.COMPATIBLE:
      this.vrButton.style.display = 'block';
      // See img_src/vr_dark_256.png
      this.vrButton.style.backgroundImage = this.base64('image/png', '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', true);
      break;
    case Modes.IMMERSED:
      this.vrButton.style.display = 'block';
      // See img_src/exit_dark_256.png
      this.vrButton.style.backgroundImage = this.base64('image/png', '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', true);
      break;
  }
};

WebVRManager.prototype.base64 = function(format, base64, opt_urlPrefix) {
  var out = 'data:' + format + ';base64,' + base64;
  if (opt_urlPrefix) {
    out = 'url(' + out + ')';
  }
  return out;
};

/**
 * Makes it possible to go into VR mode.
 */
WebVRManager.prototype.activateVR = function() {
  // Make it possible to enter VR via double click.
  window.addEventListener('dblclick', this.enterVR.bind(this));
  // Or via double tap.
  window.addEventListener('touchend', this.onTouchEnd.bind(this));
  // Or via clicking on the VR button.
  this.vrButton.addEventListener('click', this.onButtonClick.bind(this));
  // Or by hitting the 'f' key.
  window.addEventListener('keydown', this.onKeyDown.bind(this));

  // Whenever we enter fullscreen, this is tantamount to entering VR mode.
  document.addEventListener('webkitfullscreenchange',
      this.onFullscreenChange.bind(this));
  document.addEventListener('mozfullscreenchange',
      this.onFullscreenChange.bind(this));

  // Create the necessary elements for wake lock to work.
  this.setupWakeLock();
};

WebVRManager.prototype.setupWakeLock = function() {
  // Create a small video element.
  this.wakeLockVideo = document.createElement('video');

  // Loop the video.
  this.wakeLockVideo.addEventListener('ended', function(ev) {
    this.wakeLockVideo.play();
  }.bind(this));

  // Turn on wake lock as soon as the screen is tapped.
  triggerWakeLock = function() {
    this.requestWakeLock();
  }.bind(this);
  window.addEventListener('touchstart', triggerWakeLock, false);
};

WebVRManager.prototype.onTouchEnd = function(e) {
  // TODO: Implement better double tap that takes distance into account.
  // https://github.com/mckamey/doubleTap.js/blob/master/doubleTap.js

  var now = new Date();
  if (now - this.lastTouchTime < 300) {
    this.enterVR();
  }
  this.lastTouchTime = now;
};

WebVRManager.prototype.onButtonClick = function() {
  this.toggleVRMode();
};

WebVRManager.prototype.onKeyDown = function(e) {
  if (e.keyCode == 70) { // 'f'
    this.toggleVRMode();
  }
};

WebVRManager.prototype.toggleVRMode = function() {
  if (!this.isVRMode()) {
    // Enter VR mode.
    this.enterVR();
  } else {
    this.exitVR();
  }
};

WebVRManager.prototype.onFullscreenChange = function(e) {
  var isVRMode = this.isVRMode();
  console.log('isVRMode', isVRMode);
  if (isVRMode) {
    // Orientation lock.
    screen.orientation.lock('landscape');
    // Set style on button.
    this.setMode(Modes.IMMERSED);
  } else {
    // Unlock orientation.
    screen.orientation.unlock();
    // Relinquish wake lock.
    this.releaseWakeLock();
    // Go back to compatible mode.
    this.setMode(Modes.COMPATIBLE);
  }
};

/**
 * Add cross-browser functionality to keep a mobile device from
 * auto-locking.
 */
WebVRManager.prototype.requestWakeLock = function() {
  this.releaseWakeLock();
  if (this.os == 'iOS') {
    // If the wake lock timer is already running, stop.
    if (this.wakeLockTimer) {
      return;
    }
    this.wakeLockTimer = setInterval(function() {
      window.location = window.location;
      setTimeout(window.stop, 0);
    }, 30000);
  } else if (this.os == 'Android') {
    // If the video is already playing, do nothing.
    if (this.wakeLockVideo.paused === false) {
      return;
    }
    // See videos_src/no-sleep.webm.
    this.wakeLockVideo.src = this.base64('video/webm', 'GkXfowEAAAAAAAAfQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4ECQoWBAhhTgGcBAAAAAAACWxFNm3RALE27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEuTbuMU6uEHFO7a1OsggI+7AEAAAAAAACkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmAQAAAAAAAEMq17GDD0JATYCMTGF2ZjU2LjQuMTAxV0GMTGF2ZjU2LjQuMTAxc6SQ20Yv/Elws73A/+KfEjM11ESJiEBkwAAAAAAAFlSuawEAAAAAAABHrgEAAAAAAAA+14EBc8WBAZyBACK1nIN1bmSGhVZfVlA4g4EBI+ODhAT3kNXgAQAAAAAAABKwgRC6gRBTwIEBVLCBEFS6gRAfQ7Z1AQAAAAAAALHngQCgAQAAAAAAAFyho4EAAIAQAgCdASoQABAAAEcIhYWIhYSIAgIADA1gAP7/q1CAdaEBAAAAAAAALaYBAAAAAAAAJO6BAaWfEAIAnQEqEAAQAABHCIWFiIWEiAICAAwNYAD+/7r/QKABAAAAAAAAQKGVgQBTALEBAAEQEAAYABhYL/QACAAAdaEBAAAAAAAAH6YBAAAAAAAAFu6BAaWRsQEAARAQABgAGFgv9AAIAAAcU7trAQAAAAAAABG7j7OBALeK94EB8YIBgfCBAw==');
    this.wakeLockVideo.play();
  }

}

/**
 * Turn off cross-browser functionality to keep a mobile device from
 * auto-locking.
 */
WebVRManager.prototype.releaseWakeLock = function() {
  if (this.os == 'iOS') {
    if (this.wakeLockTimer) {
      clearInterval(this.wakeLockTimer);
      this.wakeLockTimer = null;
    }
  } else if (this.os == 'Android') {
    this.wakeLockVideo.pause();
    this.wakeLockVideo.src = '';
  }
}

WebVRManager.prototype.getOS = function(osName) {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
    return 'iOS';
  } else if (userAgent.match(/Android/i)) {
    return 'Android';
  }
  return 'unknown';
};

WebVRManager.prototype.enterVR = function() {
  this.effect.setFullScreen(true);
};

WebVRManager.prototype.exitVR = function() {
  this.effect.setFullScreen(false);
};

// Expose the WebVRManager class globally.
window.WebVRManager = WebVRManager;

})();
