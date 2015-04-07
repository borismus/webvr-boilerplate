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

function WebVRManager(renderer, effect, params) {
  this.params = params || {};

  // Set option to hide the button.
  this.hideButton = this.params.hideButton || false;

  // Save the THREE.js renderer and effect for later.
  this.renderer = renderer;
  this.effect = effect;

  // Create the button regardless.
  this.vrButton = this.createVRButton();

  // Check if the browser is compatible with WebVR.
  this.getHMD().then(function(hmd) {
    // Activate either VR or Immersive mode.
    if (hmd) {
      this.activateVR();
    } else {
      this.activateImmersive();
    }
    // Set the right mode.
    this.defaultMode = hmd ? Modes.COMPATIBLE : Modes.INCOMPATIBLE;
    this.setMode(this.defaultMode);
  }.bind(this));

  this.os = this.getOS();
  this.logo = this.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4xLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTkyIDE5MiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTkyIDE5MiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8Zz4NCgkJPHBhdGggZmlsbD0iZ3JheSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxIiBpZD0iX3gzQ19QYXRoX3gzRV9fOV8iIGQ9Ik0xNzEuMiwxNDQuMmMwLTUuNi0zLjYtNy4yLTguOC03LjJIMTU1djI2aDZ2LTExaC0wLjRsNi40LDExaDYuMmwtNy40LTExLjMNCgkJCUMxNjkuMywxNTEuMSwxNzEuMiwxNDcuNiwxNzEuMiwxNDQuMnogTTE2MS4yLDE0OUgxNjF2LTloMC4zYzIuNywwLDQuOCwxLjIsNC44LDQuNEMxNjYsMTQ3LjYsMTY0LjEsMTQ5LDE2MS4yLDE0OXoiLz4NCgkJPHBvbHlnb24gZmlsbD0iZ3JheSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxIiBwb2ludHM9IjEzMi4zLDE1MyAxMzIuMiwxNTMgMTI1LjksMTM3IDEyMC40LDEzNyAxMzAuNCwxNjMgMTMzLjQsMTYzIDE0My42LDEzNyAxMzguMSwxMzcgCQkiLz4NCgkJPHBhdGggZmlsbD0iZ3JheSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxIiBpZD0iX3gzQ19QYXRoX3gzRV9fOF8iIGQ9Ik0xMDUsMTQ3LjljMS42LTEsMi4zLTIuNSwyLjMtNC40YzAtNS4yLTMtNi41LTcuOS02LjVIOTN2MjZoOC4xYzQuOCwwLDguNC0yLjksOC40LTgNCgkJCUMxMDkuNSwxNTIuMSwxMDguMSwxNDguNCwxMDUsMTQ3Ljl6IE05OCwxNDBoMC44YzIuMiwwLDMuNywwLjgsMy43LDMuNWMwLDIuNy0xLjIsMy41LTMuNywzLjVIOThWMTQweiBNOTkuMywxNThIOTh2LTdoMQ0KCQkJYzIuNiwwLDUuNCwwLDUuNCwzLjRTMTAyLDE1OCw5OS4zLDE1OHoiLz4NCgkJPHBvbHlnb24gZmlsbD0iZ3JheSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxIiBwb2ludHM9IjY1LDE2MyA3OSwxNjMgNzksMTU4IDcxLDE1OCA3MSwxNTEgNzksMTUxIDc5LDE0NyA3MSwxNDcgNzEsMTQwIDc5LDE0MCA3OSwxMzcgNjUsMTM3IAkJIi8+DQoJCTxwb2x5Z29uIGZpbGw9ImdyYXkiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMSIgcG9pbnRzPSI0My4zLDE1NCA0My4yLDE1NCAzNy44LDEzNyAzNC43LDEzNyAyOS41LDE1NCAyOS40LDE1NCAyNC4xLDEzNyAxOC44LDEzNyAyNy4xLDE2MyAzMC45LDE2MyAzNS44LDE0NiAzNS45LDE0NiANCgkJCTQxLjEsMTYzIDQ0LjksMTYzIDUzLjgsMTM3IDQ4LjQsMTM3ICIvPg0KCTwvZz4NCgk8Y2lyY2xlIGZpbGw9ImdyYXkiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMyIgY3g9IjYyLjQiIGN5PSI3My41IiByPSIxMy45Ii8+DQoJPGNpcmNsZSBmaWxsPSJncmF5IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIGN4PSIxMzAiIGN5PSI3My41IiByPSIxMy45Ii8+DQoJPHBhdGggZmlsbD0iZ3JheSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIiBpZD0iX3gzQ19QYXRoX3gzRV9fNV8iIGQ9Ik0xMjkuNiwxMTdjMzQuNSwwLDU2LjEtNDMuOSw1Ni4xLTQzLjlzLTIxLjYtNDMuOC01Ni4xLTQzLjljMCwwLTY3LjIsMC4xLTY3LjMsMC4xDQoJCWMtMzQuNSwwLTU2LjEsNDMuOC01Ni4xLDQzLjhTMjcuOCwxMTcsNjIuNCwxMTdjMTMuMywwLDI0LjctNi41LDMzLjYtMTQuNUMxMDUsMTEwLjUsMTE2LjMsMTE3LDEyOS42LDExN3ogTTg1LjcsOTEuNw0KCQljLTYuMiw1LjctMTQuMSwxMC42LTIzLjUsMTAuNmMtMjMuMiwwLTM3LjctMjkuMy0zNy43LTI5LjNzMTQuNS0yOS4zLDM3LjctMjkuM2M5LjYsMCwxNy42LDUsMjMuOCwxMC44YzQuMSwzLjksNy40LDguMiw5LjgsMTEuNw0KCQljMi40LTMuNSw1LjgtOCwxMC4xLTExLjljNi4yLTUuNywxNC4xLTEwLjYsMjMuNi0xMC42YzIzLjIsMCwzNy43LDI5LjMsMzcuNywyOS4zcy0xNC41LDI5LjMtMzcuNywyOS4zYy05LjMsMC0xNy4xLTQuNy0yMy4zLTEwLjMNCgkJYy00LjQtNC4xLTcuOS04LjYtMTAuNC0xMi4yQzkzLjQsODMuMiw5MCw4Ny43LDg1LjcsOTEuN3oiLz4NCgk8cGF0aCBmaWxsPSJub25lIiBkPSJNMCwwaDE5MnYxOTJIMFYweiIvPg0KPC9nPg0KPC9zdmc+DQo=');
  this.logoDisabled = this.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4xLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTkyIDE5MiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTkyIDE5MiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8cGF0aCBmaWxsPSJncmF5IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xNDMuOSw5Ni40YzAtNy42LTYuMi0xMy45LTEzLjktMTMuOWMtNy41LDAtMTMuNSw1LjktMTMuOCwxMy4zbDE0LjQsMTQuNEMxMzgsMTA5LjksMTQzLjksMTAzLjksMTQzLjksOTYuNHoiLz4NCgk8cGF0aCBmaWxsPSJncmF5IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xMDUuOCw3N2M2LjItNS43LDE0LjEtMTAuNiwyMy42LTEwLjZjMjMuMiwwLDM3LjcsMjkuMywzNy43LDI5LjNzLTkuMiwxOC43LTI0LjgsMjYuMmwxMC45LDEwLjkNCgkJYzIwLjUtMTIuNCwzMi41LTM2LjksMzIuNS0zNi45cy0yMS42LTQzLjgtNTYuMS00My45YzAsMC0zOC4zLDAtNTcuMiwwLjFsMjkuMSwyOS4xQzEwMi45LDc5LjksMTA0LjMsNzguNCwxMDUuOCw3N3oiLz4NCgk8cGF0aCBmaWxsPSJncmF5IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xNjIuOSwxNjIuOWwtMjQtMjRjMCwwLDAsMCwwLDBsLTE0LjItMTQuMmMwLDAsMCwwLDAsMEw2Ni45LDY2LjljMCwwLDAsMCwwLDBMNTMuMyw1My4yYzAsMCwwLDAsMCwwTDIzLjEsMjMuMUwxMywzMy4zDQoJCWwyNS45LDI1LjlDMTguMyw3MS41LDYuMiw5Niw2LjIsOTZzMjEuNiw0My44LDU2LjEsNDMuOGMxMy4zLDAsMjQuNy02LjUsMzMuNi0xNC41YzYuMiw1LjUsMTMuNSwxMC4zLDIxLjgsMTIuN2wzNC45LDM0LjkNCgkJTDE2Mi45LDE2Mi45eiBNODUuNywxMTQuNWMtNi4yLDUuNy0xNC4xLDEwLjYtMjMuNSwxMC42Yy0yMy4yLDAtMzcuNy0yOS4zLTM3LjctMjkuM3M5LjMtMTguNywyNC44LTI2LjJsMTMsMTMNCgkJYy03LjYsMC4xLTEzLjcsNi4yLTEzLjcsMTMuOGMwLDcuNyw2LjIsMTMuOSwxMy45LDEzLjljNy42LDAsMTMuOC02LjEsMTMuOC0xMy43bDEzLjYsMTMuNkM4OC42LDExMS43LDg3LjIsMTEzLjEsODUuNywxMTQuNXoiLz4NCgk8cGF0aCBmaWxsPSJub25lIiBkPSJNMCwwaDE5MnYxOTJIMFYweiIvPg0KPC9nPg0KPC9zdmc+DQo=');
}

var Modes = {
  // Incompatible with WebVR.
  INCOMPATIBLE: 1,
  // Compatible with WebVR.
  COMPATIBLE: 2,
  // In virtual reality via WebVR.
  VR: 3,
};

/**
 * Promise returns true if there is at least one HMD device available.
 */
WebVRManager.prototype.getHMD = function() {
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
    this.effect.render(scene, camera);
  } else {
    this.renderer.render(scene, camera);
  }
};

WebVRManager.prototype.createVRButton = function() {
  var button = document.createElement('img');
  var s = button.style;
  s.position = 'absolute';
  s.bottom = '5px';
  s.left = 0;
  s.right = 0;
  s.marginLeft = 'auto';
  s.marginRight = 'auto';
  s.width = '64px'
  s.height = '64px';
  s.backgroundSize = 'cover';
  s.backgroundColor = 'transparent';
  s.border = 0;
  s.userSelect = 'none';
  s.webkitUserSelect = 'none';
  s.MozUserSelect = 'none';
  // Prevent button from being dragged.
  button.draggable = false;
  button.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });
  document.body.appendChild(button);
  return button;
};

WebVRManager.prototype.setMode = function(mode) {
  this.mode = mode;
  switch (mode) {
    case Modes.INCOMPATIBLE:
      this.vrButton.src = this.logo;
      this.vrButton.title = 'Open in immersive mode';
      break;
    case Modes.COMPATIBLE:
      this.vrButton.src = this.logo;
      this.vrButton.title = 'Open in VR mode';
      break;
    case Modes.VR:
      this.vrButton.src = this.logoDisabled;
      this.vrButton.title = 'Leave VR mode';
      break;
  }

  // Hack for Safari Mac/iOS to force relayout (svg-specific issue)
  // http://goo.gl/hjgR6r
  this.vrButton.style.display = 'inline-block';
  this.vrButton.offsetHeight;
  this.vrButton.style.display = 'block';
};

/**
 * Sets the contrast on the button (percent in [0, 1]).
 */
WebVRManager.prototype.setContrast = function(percent) {
  var value = Math.floor(percent * 100);
  this.vrButton.style.webkitFilter = 'contrast(' + value + '%)';
  this.vrButton.style.filter = 'contrast(' + value + '%)';
};

WebVRManager.prototype.base64 = function(format, base64) {
  var out = 'data:' + format + ';base64,' + base64;
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
  this.vrButton.addEventListener('mousedown', this.onButtonClick.bind(this));
  this.vrButton.addEventListener('touchstart', this.onButtonClick.bind(this));
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

WebVRManager.prototype.activateImmersive = function() {
  // Next time a user does anything with their mouse, we trigger immersive mode.
  this.vrButton.addEventListener('click', this.enterImmersive.bind(this));
};

WebVRManager.prototype.enterImmersive = function() {
  this.requestPointerLock();
  this.requestFullscreen();
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

WebVRManager.prototype.onButtonClick = function(e) {
  e.stopPropagation();
  e.preventDefault();
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
  // If we leave full-screen, also exit VR mode.
  if (document.webkitFullscreenElement === null ||
      document.mozFullScreenElement === null) {
    this.exitVR();
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
};

WebVRManager.prototype.requestPointerLock = function() {
  var canvas = this.renderer.domElement;
  canvas.requestPointerLock = canvas.requestPointerLock ||
      canvas.mozRequestPointerLock ||
      canvas.webkitRequestPointerLock;

  if (canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
};

WebVRManager.prototype.releasePointerLock = function() {
  document.exitPointerLock = document.exitPointerLock ||
      document.mozExitPointerLock ||
      document.webkitExitPointerLock;

  document.exitPointerLock();
};

WebVRManager.prototype.requestOrientationLock = function() {
  if (screen.orientation) {
    screen.orientation.lock('landscape');
  }
};

WebVRManager.prototype.releaseOrientationLock = function() {
  if (screen.orientation) {
    screen.orientation.unlock();
  }
};

WebVRManager.prototype.requestFullscreen = function() {
  var canvas = this.renderer.domElement;
  if (canvas.mozRequestFullScreen) {
    canvas.mozRequestFullScreen();
  } else if (canvas.webkitRequestFullscreen) {
    canvas.webkitRequestFullscreen();
  }
};

WebVRManager.prototype.releaseFullscreen = function() {
};

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
  console.log('Entering VR.');
  // Enter fullscreen mode (note: this doesn't work in iOS).
  this.effect.setFullScreen(true);
  // Lock down orientation, pointer, etc.
  this.requestOrientationLock();
  // Set style on button.
  this.setMode(Modes.VR);
};

WebVRManager.prototype.exitVR = function() {
  console.log('Exiting VR.');
  // Leave fullscreen mode (note: this doesn't work in iOS).
  this.effect.setFullScreen(false);
  // Release orientation, wake, pointer lock.
  this.releaseOrientationLock();
  this.releaseWakeLock();
  // Also, work around a problem in VREffect and resize the window.
  this.effect.setSize(window.innerWidth, window.innerHeight);

  // Go back to the default mode.
  this.setMode(this.defaultMode);
};

// Expose the WebVRManager class globally.
window.WebVRManager = WebVRManager;

})();
