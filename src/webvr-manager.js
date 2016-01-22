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

var ButtonManager = require('./button-manager.js');
var CardboardDistorter = require('./cardboard-distorter.js');
var DeviceInfo = require('./device-info.js');
var Dpdb = require('./dpdb.js');
var Emitter = require('./emitter.js');
var Modes = require('./modes.js');
var RotateInstructions = require('./rotate-instructions.js');
var Util = require('./util.js');
var ViewerSelector = require('./viewer-selector.js');
var Wakelock = require('./wakelock.js');

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
  this.hideButton = this.params.hideButton || false;
  // Whether or not the FOV should be distorted or un-distorted. By default, it
  // should be distorted, but in the case of vertex shader based distortion,
  // ensure that we use undistorted parameters.
  this.isUndistorted = !!this.params.isUndistorted;

  // Save the THREE.js renderer and effect for later.
  this.renderer = renderer;
  this.effect = effect;
  this.button = new ButtonManager();
  this.rotateInstructions = new RotateInstructions();
  this.viewerSelector = new ViewerSelector(DeviceInfo.Viewers);

  // Load the DPDB.
  var shouldFetch = !WebVRConfig.NO_DPDB_FETCH;
  this.dpdb = new Dpdb(shouldFetch, this.onDeviceParamsUpdated_.bind(this));

  // Create device info and set the correct default viewer.
  this.deviceInfo = new DeviceInfo(this.dpdb.getDeviceParams());
  this.deviceInfo.viewer = DeviceInfo.Viewers[this.viewerSelector.selectedKey];
  console.log('Using the %s viewer.', this.getViewer().label);

  this.distorter = new CardboardDistorter(renderer, this.deviceInfo);

  this.isVRCompatible = false;
  this.isFullscreenDisabled = !!Util.getQueryParameter('no_fullscreen');
  this.startMode = Modes.NORMAL;
  var startModeParam = parseInt(Util.getQueryParameter('start_mode'));
  if (!isNaN(startModeParam)) {
    this.startMode = startModeParam;
  }

  // Set the correct viewer profile, but only if this is Cardboard.
  if (Util.isMobile()) {
    this.onViewerChanged_(this.getViewer());
  }
  // Listen for changes to the viewer.
  this.viewerSelector.on('change', this.onViewerChanged_.bind(this));

  if (this.hideButton) {
    this.button.setVisibility(false);
  }

  // Check if the browser is compatible with WebVR.
  this.getDeviceByType_(HMDVRDevice).then(function(hmd) {
    // Activate either VR or Immersive mode.
    if (WebVRConfig.FORCE_DISTORTION) {
      this.distorter.setActive(true);
      this.isVRCompatible = true;
    } else if (hmd) {
      this.isVRCompatible = true;
      // Only enable distortion if we are dealing using the polyfill, we have a
      // perfect device match, and it's not prevented via configuration.
      if (hmd.deviceName.indexOf('webvr-polyfill') == 0 && this.deviceInfo.getDevice() &&
          !WebVRConfig.PREVENT_DISTORTION) {
        this.distorter.setActive(true);
      }
      this.hmd = hmd;
    }
    // Set the right mode.
    switch (this.startMode) {
      case Modes.MAGIC_WINDOW:
        this.normalToMagicWindow_();
        this.setMode_(Modes.MAGIC_WINDOW);
        break;
      case Modes.VR:
        this.anyModeToVR_();
        this.setMode_(Modes.VR);
        break;
      default:
        this.setMode_(Modes.NORMAL);
    }
    this.button.on('fs', this.onFSClick_.bind(this));
    this.button.on('vr', this.onVRClick_.bind(this));
    this.button.on('back', this.onBackClick_.bind(this));
    this.button.on('settings', this.onSettingsClick_.bind(this));
    this.emit('initialized');
  }.bind(this));

  // Save the input device for later sending timing data.
  this.getDeviceByType_(PositionSensorVRDevice).then(function(input) {
    this.input = input;
  }.bind(this));

  // Whenever we enter fullscreen, we are entering VR or immersive mode.
  document.addEventListener('webkitfullscreenchange',
      this.onFullscreenChange_.bind(this));
  document.addEventListener('mozfullscreenchange',
      this.onFullscreenChange_.bind(this));
  window.addEventListener('orientationchange',
      this.onOrientationChange_.bind(this));

  // Create the necessary elements for wake lock to work.
  this.wakelock = new Wakelock();

  // Save whether or not we want the touch panner to be enabled or disabled by
  // default.
  this.isTouchPannerEnabled = !WebVRConfig.TOUCH_PANNER_DISABLED;

}

WebVRManager.prototype = new Emitter();

// Expose these values externally.
WebVRManager.Modes = Modes;

/**
 * Promise returns true if there is at least one HMD device available.
 */
WebVRManager.prototype.getDeviceByType_ = function(type) {
  return new Promise(function(resolve, reject) {
    navigator.getVRDevices().then(function(devices) {
      // Promise succeeds, but check if there are any devices actually.
      for (var i = 0; i < devices.length; i++) {
        if (devices[i] instanceof type) {
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

WebVRManager.prototype.getViewer = function() {
  return this.deviceInfo.viewer;
};

WebVRManager.prototype.getDevice = function() {
  return this.deviceInfo.device;
};

WebVRManager.prototype.getDeviceInfo = function() {
  return this.deviceInfo;
};

WebVRManager.prototype.render = function(scene, camera, timestamp) {
  this.resizeIfNeeded_(camera);

  if (this.isVRMode()) {
    this.distorter.preRender();
    this.effect.render(scene, camera);
    this.distorter.postRender();
  } else {
    // Scene may be an array of two scenes, one for each eye.
    if (scene instanceof Array) {
      this.renderer.render(scene[0], camera);
    } else {
      this.renderer.render(scene, camera);
    }
  }
};


WebVRManager.prototype.setMode_ = function(mode) {
  var oldMode = this.mode;
  if (mode == this.mode) {
    console.error('Not changing modes, already in %s', mode);
    return;
  }
  console.log('Mode change: %s => %s', this.mode, mode);
  this.mode = mode;
  this.button.setMode(mode, this.isVRCompatible);

  if (this.mode == Modes.VR && Util.isLandscapeMode() && Util.isMobile()) {
    // In landscape mode, temporarily show the "put into Cardboard"
    // interstitial. Otherwise, do the default thing.
    this.rotateInstructions.showTemporarily(3000);
  } else {
    this.updateRotateInstructions_();
  }

  // Also hide the viewer selector.
  this.viewerSelector.hide();

  // Emit an event indicating the mode changed.
  this.emit('modechange', mode, oldMode);

  // Note: This is a nasty hack since we need to communicate to the polyfill
  // that touch panning is disabled, and the only way to do this currently is
  // via WebVRConfig.
  // TODO: Maybe move touch panning to the boilerplate to eliminate the hack.
  //
  // If we are in VR mode, always disable touch panning.
  if (this.isTouchPannerEnabled) {
    if (this.mode == Modes.VR) {
      WebVRConfig.TOUCH_PANNER_DISABLED = true;
    } else {
      WebVRConfig.TOUCH_PANNER_DISABLED = false;
    }
  }

  if (this.mode == Modes.VR) {
    // In VR mode, set the HMDVRDevice parameters.
    this.setHMDVRDeviceParams_(this.getViewer());
  }
};

/**
 * Main button was clicked.
 */
WebVRManager.prototype.onFSClick_ = function() {
  switch (this.mode) {
    case Modes.NORMAL:
      // TODO: Remove this hack when iOS has fullscreen mode.
      // If this is an iframe on iOS, break out and open in no_fullscreen mode.
      if (Util.isIOS() && Util.isIFrame()) {
        var url = window.location.href;
        url = Util.appendQueryParameter(url, 'no_fullscreen', 'true');
        url = Util.appendQueryParameter(url, 'start_mode', Modes.MAGIC_WINDOW);
        top.location.href = url;
        return;
      }
      this.normalToMagicWindow_();
      this.setMode_(Modes.MAGIC_WINDOW);
      break;
    case Modes.MAGIC_WINDOW:
      if (this.isFullscreenDisabled) {
        window.history.back();
      } else {
        this.anyModeToNormal_();
        this.setMode_(Modes.NORMAL);
      }
      break;
  }
};

/**
 * The VR button was clicked.
 */
WebVRManager.prototype.onVRClick_ = function() {
  // TODO: Remove this hack when iOS has fullscreen mode.
  // If this is an iframe on iOS, break out and open in no_fullscreen mode.
  if (this.mode == Modes.NORMAL && Util.isIOS() && Util.isIFrame()) {
    var url = window.location.href;
    url = Util.appendQueryParameter(url, 'no_fullscreen', 'true');
    url = Util.appendQueryParameter(url, 'start_mode', Modes.VR);
    top.location.href = url;
    return;
  }
  this.anyModeToVR_();
  this.setMode_(Modes.VR);
};

/**
 * Back button was clicked.
 */
WebVRManager.prototype.onBackClick_ = function() {
  if (this.isFullscreenDisabled) {
    window.history.back();
  } else {
    this.anyModeToNormal_();
    this.setMode_(Modes.NORMAL);
  }
};

WebVRManager.prototype.onSettingsClick_ = function() {
  // Show the viewer selection dialog.
  this.viewerSelector.show();
};

/**
 *
 * Methods to go between modes.
 *
 */
WebVRManager.prototype.normalToMagicWindow_ = function() {
  // TODO: Re-enable pointer lock after debugging.
  //this.requestPointerLock_();
  this.requestFullscreen_();
  this.wakelock.request();
};

WebVRManager.prototype.anyModeToVR_ = function() {
  // Don't do orientation locking for consistency.
  //this.requestOrientationLock_();
  this.requestFullscreen_();
  //this.effect.setFullScreen(true);
  this.wakelock.request();
  this.distorter.patch();
};

WebVRManager.prototype.vrToMagicWindow_ = function() {
  //this.releaseOrientationLock_();
  this.distorter.unpatch();

  // Android bug: when returning from VR, resize the effect.
  this.resize_();
}

WebVRManager.prototype.anyModeToNormal_ = function() {
  //this.effect.setFullScreen(false);
  this.exitFullscreen_();
  //this.releaseOrientationLock_();
  this.releasePointerLock_();
  this.wakelock.release();
  this.distorter.unpatch();

  // Android bug: when returning from VR, resize the effect.
  this.resize_();
};

WebVRManager.prototype.resizeIfNeeded_ = function(camera) {
  // Only resize the canvas if it needs to be resized.
  var size = this.renderer.getSize();
  if (size.width != window.innerWidth || size.height != window.innerHeight) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    this.resize_();
  }
};

WebVRManager.prototype.resize_ = function() {
  this.effect.setSize(window.innerWidth, window.innerHeight);
};

WebVRManager.prototype.onOrientationChange_ = function(e) {
  this.updateRotateInstructions_();
  // Also hide the viewer selector.
  this.viewerSelector.hide();
};

WebVRManager.prototype.updateRotateInstructions_ = function() {
  this.rotateInstructions.disableShowTemporarily();
  // In portrait VR mode, tell the user to rotate to landscape.
  if (this.mode == Modes.VR && !Util.isLandscapeMode() && Util.isMobile()) {
    this.rotateInstructions.show();
  } else {
    this.rotateInstructions.hide();
  }
};

WebVRManager.prototype.onFullscreenChange_ = function(e) {
  // If we leave full-screen, go back to normal mode.
  if (document.webkitFullscreenElement === null ||
      document.mozFullScreenElement === null) {
    this.anyModeToNormal_();
    this.setMode_(Modes.NORMAL);
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
  var canvas = document.body;
  //var canvas = this.renderer.domElement;
  if (canvas.requestFullscreen) {
    canvas.requestFullscreen();
  } else if (canvas.mozRequestFullScreen) {
    canvas.mozRequestFullScreen({vrDisplay: this.hmd});
  } else if (canvas.webkitRequestFullscreen) {
    canvas.webkitRequestFullscreen({vrDisplay: this.hmd});
  }
};

WebVRManager.prototype.exitFullscreen_ = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
};

WebVRManager.prototype.onViewerChanged_ = function(viewer) {
  this.deviceInfo.setViewer(viewer);

  // Update the distortion appropriately.
  this.distorter.recalculateUniforms();

  // And update the HMDVRDevice parameters.
  this.setHMDVRDeviceParams_(viewer);

  // Notify anyone interested in this event.
  this.emit('viewerchange', viewer);
};

/**
 * Sets parameters on CardboardHMDVRDevice. These changes are ultimately handled
 * by VREffect.
 */
WebVRManager.prototype.setHMDVRDeviceParams_ = function(viewer) {
  this.getDeviceByType_(HMDVRDevice).then(function(hmd) {
    if (!hmd) {
      return;
    }

    // If we can set fields of view, do that now.
    if (hmd.setFieldOfView) {
      // Calculate the optimal field of view for each eye.
      hmd.setFieldOfView(this.deviceInfo.getFieldOfViewLeftEye(this.isUndistorted),
                         this.deviceInfo.getFieldOfViewRightEye(this.isUndistorted));
    }

    // Note: setInterpupillaryDistance is not part of the WebVR standard.
    if (hmd.setInterpupillaryDistance) {
      hmd.setInterpupillaryDistance(viewer.interLensDistance);
    }

    if (hmd.setRenderRect) {
      // TODO(smus): If we can set the render rect, do it.
      //var renderRect = this.deviceInfo.getUndistortedViewportLeftEye();
      //hmd.setRenderRect(renderRect, renderRect);
    }
  }.bind(this));
};

WebVRManager.prototype.onDeviceParamsUpdated_ = function(newParams) {
  console.log('DPDB reported that device params were updated.');
  this.deviceInfo.updateDeviceParams(newParams);
  this.distorter.recalculateUniforms();
}

module.exports = WebVRManager;
