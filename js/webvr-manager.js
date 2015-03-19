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

function WebVRManager(effect, opts) {
  this.opts = opts || {};

  // Set option to hide the button.
  this.hideButton = this.opts.hideButton || false;

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
      // Incompatible? At least prepare for "immersive" mode.
      this.activateBig();
    }
  }.bind(this));

  this.os = this.getOS();

  this.isWebkit = this.isWebkit();
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
      // Promise succeeds, but check if there are any devices actually.
      for (var i = 0; i < devices.length; i++) {
        if (devices[i] instanceof HMDVRDevice) {
          resolve(true);
          break;
        }
      }
      resolve(false);
    }, function() {
      // No devices are found.
      resolve(false);
    });
  });
};

WebVRManager.prototype.isVRMode = function() {
  return this.mode == Modes.IMMERSED;
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
      this.vrButton.title = 'Open in immersive mode';
      if(this.isWebkit) {
        this.vrButton.src = this.base64('image/png', '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');
        this.vrButton.style.opacity = 0.2;
      } else {
        this.vrButton.src = this.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4xLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTkyIDE5MiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTkyIDE5MiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8Zz4NCgkJPHBhdGggaWQ9Il94M0NfUGF0aF94M0VfXzlfIiBkPSJNMTcxLjIsMTQ0LjJjMC01LjYtMy42LTcuMi04LjgtNy4ySDE1NXYyNmg2di0xMWgtMC40bDYuNCwxMWg2LjJsLTcuNC0xMS4zDQoJCQlDMTY5LjMsMTUxLjEsMTcxLjIsMTQ3LjYsMTcxLjIsMTQ0LjJ6IE0xNjEuMiwxNDlIMTYxdi05aDAuM2MyLjcsMCw0LjgsMS4yLDQuOCw0LjRDMTY2LDE0Ny42LDE2NC4xLDE0OSwxNjEuMiwxNDl6Ii8+DQoJCTxwb2x5Z29uIHBvaW50cz0iMTMyLjMsMTUzIDEzMi4yLDE1MyAxMjUuOSwxMzcgMTIwLjQsMTM3IDEzMC40LDE2MyAxMzMuNCwxNjMgMTQzLjYsMTM3IDEzOC4xLDEzNyAJCSIvPg0KCQk8cGF0aCBpZD0iX3gzQ19QYXRoX3gzRV9fOF8iIGQ9Ik0xMDUsMTQ3LjljMS42LTEsMi4zLTIuNSwyLjMtNC40YzAtNS4yLTMtNi41LTcuOS02LjVIOTN2MjZoOC4xYzQuOCwwLDguNC0yLjksOC40LTgNCgkJCUMxMDkuNSwxNTIuMSwxMDguMSwxNDguNCwxMDUsMTQ3Ljl6IE05OCwxNDBoMC44YzIuMiwwLDMuNywwLjgsMy43LDMuNWMwLDIuNy0xLjIsMy41LTMuNywzLjVIOThWMTQweiBNOTkuMywxNThIOTh2LTdoMQ0KCQkJYzIuNiwwLDUuNCwwLDUuNCwzLjRTMTAyLDE1OCw5OS4zLDE1OHoiLz4NCgkJPHBvbHlnb24gcG9pbnRzPSI2NSwxNjMgNzksMTYzIDc5LDE1OCA3MSwxNTggNzEsMTUxIDc5LDE1MSA3OSwxNDcgNzEsMTQ3IDcxLDE0MCA3OSwxNDAgNzksMTM3IDY1LDEzNyAJCSIvPg0KCQk8cG9seWdvbiBwb2ludHM9IjQzLjMsMTU0IDQzLjIsMTU0IDM3LjgsMTM3IDM0LjcsMTM3IDI5LjUsMTU0IDI5LjQsMTU0IDI0LjEsMTM3IDE4LjgsMTM3IDI3LjEsMTYzIDMwLjksMTYzIDM1LjgsMTQ2IDM1LjksMTQ2IA0KCQkJNDEuMSwxNjMgNDQuOSwxNjMgNTMuOCwxMzcgNDguNCwxMzcgCQkiLz4NCgk8L2c+DQoJPGNpcmNsZSBjeD0iNjIuNCIgY3k9IjczLjUiIHI9IjEzLjkiLz4NCgk8Y2lyY2xlIGN4PSIxMzAiIGN5PSI3My41IiByPSIxMy45Ii8+DQoJPHBhdGggaWQ9Il94M0NfUGF0aF94M0VfXzVfIiBkPSJNMTI5LjYsMTE3YzM0LjUsMCw1Ni4xLTQzLjksNTYuMS00My45cy0yMS42LTQzLjgtNTYuMS00My45YzAsMC02Ny4yLDAuMS02Ny4zLDAuMQ0KCQljLTM0LjUsMC01Ni4xLDQzLjgtNTYuMSw0My44UzI3LjgsMTE3LDYyLjQsMTE3YzEzLjMsMCwyNC43LTYuNSwzMy42LTE0LjVDMTA1LDExMC41LDExNi4zLDExNywxMjkuNiwxMTd6IE04NS43LDkxLjcNCgkJYy02LjIsNS43LTE0LjEsMTAuNi0yMy41LDEwLjZjLTIzLjIsMC0zNy43LTI5LjMtMzcuNy0yOS4zczE0LjUtMjkuMywzNy43LTI5LjNjOS42LDAsMTcuNiw1LDIzLjgsMTAuOGM0LjEsMy45LDcuNCw4LjIsOS44LDExLjcNCgkJYzIuNC0zLjUsNS44LTgsMTAuMS0xMS45YzYuMi01LjcsMTQuMS0xMC42LDIzLjYtMTAuNmMyMy4yLDAsMzcuNywyOS4zLDM3LjcsMjkuM3MtMTQuNSwyOS4zLTM3LjcsMjkuM2MtOS4zLDAtMTcuMS00LjctMjMuMy0xMC4zDQoJCWMtNC40LTQuMS03LjktOC42LTEwLjQtMTIuMkM5My40LDgzLjIsOTAsODcuNyw4NS43LDkxLjd6Ii8+DQoJPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAsMGgxOTJ2MTkySDBWMHoiLz4NCjwvZz4NCjwvc3ZnPg0K');
        this.setContrast(0.5);
      }
      break;
    case Modes.COMPATIBLE:
      this.vrButton.title = 'Open in VR mode';
      if(this.isWebkit) {
        this.vrButton.src = this.base64('image/png', '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');
      } else {
        this.vrButton.src = this.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4xLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTkyIDE5MiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTkyIDE5MiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8Zz4NCgkJPHBhdGggaWQ9Il94M0NfUGF0aF94M0VfXzlfIiBkPSJNMTcxLjIsMTQ0LjJjMC01LjYtMy42LTcuMi04LjgtNy4ySDE1NXYyNmg2di0xMWgtMC40bDYuNCwxMWg2LjJsLTcuNC0xMS4zDQoJCQlDMTY5LjMsMTUxLjEsMTcxLjIsMTQ3LjYsMTcxLjIsMTQ0LjJ6IE0xNjEuMiwxNDlIMTYxdi05aDAuM2MyLjcsMCw0LjgsMS4yLDQuOCw0LjRDMTY2LDE0Ny42LDE2NC4xLDE0OSwxNjEuMiwxNDl6Ii8+DQoJCTxwb2x5Z29uIHBvaW50cz0iMTMyLjMsMTUzIDEzMi4yLDE1MyAxMjUuOSwxMzcgMTIwLjQsMTM3IDEzMC40LDE2MyAxMzMuNCwxNjMgMTQzLjYsMTM3IDEzOC4xLDEzNyAJCSIvPg0KCQk8cGF0aCBpZD0iX3gzQ19QYXRoX3gzRV9fOF8iIGQ9Ik0xMDUsMTQ3LjljMS42LTEsMi4zLTIuNSwyLjMtNC40YzAtNS4yLTMtNi41LTcuOS02LjVIOTN2MjZoOC4xYzQuOCwwLDguNC0yLjksOC40LTgNCgkJCUMxMDkuNSwxNTIuMSwxMDguMSwxNDguNCwxMDUsMTQ3Ljl6IE05OCwxNDBoMC44YzIuMiwwLDMuNywwLjgsMy43LDMuNWMwLDIuNy0xLjIsMy41LTMuNywzLjVIOThWMTQweiBNOTkuMywxNThIOTh2LTdoMQ0KCQkJYzIuNiwwLDUuNCwwLDUuNCwzLjRTMTAyLDE1OCw5OS4zLDE1OHoiLz4NCgkJPHBvbHlnb24gcG9pbnRzPSI2NSwxNjMgNzksMTYzIDc5LDE1OCA3MSwxNTggNzEsMTUxIDc5LDE1MSA3OSwxNDcgNzEsMTQ3IDcxLDE0MCA3OSwxNDAgNzksMTM3IDY1LDEzNyAJCSIvPg0KCQk8cG9seWdvbiBwb2ludHM9IjQzLjMsMTU0IDQzLjIsMTU0IDM3LjgsMTM3IDM0LjcsMTM3IDI5LjUsMTU0IDI5LjQsMTU0IDI0LjEsMTM3IDE4LjgsMTM3IDI3LjEsMTYzIDMwLjksMTYzIDM1LjgsMTQ2IDM1LjksMTQ2IA0KCQkJNDEuMSwxNjMgNDQuOSwxNjMgNTMuOCwxMzcgNDguNCwxMzcgCQkiLz4NCgk8L2c+DQoJPGNpcmNsZSBjeD0iNjIuNCIgY3k9IjczLjUiIHI9IjEzLjkiLz4NCgk8Y2lyY2xlIGN4PSIxMzAiIGN5PSI3My41IiByPSIxMy45Ii8+DQoJPHBhdGggaWQ9Il94M0NfUGF0aF94M0VfXzVfIiBkPSJNMTI5LjYsMTE3YzM0LjUsMCw1Ni4xLTQzLjksNTYuMS00My45cy0yMS42LTQzLjgtNTYuMS00My45YzAsMC02Ny4yLDAuMS02Ny4zLDAuMQ0KCQljLTM0LjUsMC01Ni4xLDQzLjgtNTYuMSw0My44UzI3LjgsMTE3LDYyLjQsMTE3YzEzLjMsMCwyNC43LTYuNSwzMy42LTE0LjVDMTA1LDExMC41LDExNi4zLDExNywxMjkuNiwxMTd6IE04NS43LDkxLjcNCgkJYy02LjIsNS43LTE0LjEsMTAuNi0yMy41LDEwLjZjLTIzLjIsMC0zNy43LTI5LjMtMzcuNy0yOS4zczE0LjUtMjkuMywzNy43LTI5LjNjOS42LDAsMTcuNiw1LDIzLjgsMTAuOGM0LjEsMy45LDcuNCw4LjIsOS44LDExLjcNCgkJYzIuNC0zLjUsNS44LTgsMTAuMS0xMS45YzYuMi01LjcsMTQuMS0xMC42LDIzLjYtMTAuNmMyMy4yLDAsMzcuNywyOS4zLDM3LjcsMjkuM3MtMTQuNSwyOS4zLTM3LjcsMjkuM2MtOS4zLDAtMTcuMS00LjctMjMuMy0xMC4zDQoJCWMtNC40LTQuMS03LjktOC42LTEwLjQtMTIuMkM5My40LDgzLjIsOTAsODcuNyw4NS43LDkxLjd6Ii8+DQoJPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAsMGgxOTJ2MTkySDBWMHoiLz4NCjwvZz4NCjwvc3ZnPg0K');
        this.setContrast(0.25);
      }
      break;
    case Modes.IMMERSED:
      this.vrButton.title = 'Leave VR mode';
      if(this.isWebkit) {
        this.vrButton.src = this.base64('image/png', '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');
      } else {
        this.vrButton.src = this.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4xLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTkyIDE5MiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTkyIDE5MiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8cGF0aCBkPSJNMTQzLjksOTYuNGMwLTcuNi02LjItMTMuOS0xMy45LTEzLjljLTcuNSwwLTEzLjUsNS45LTEzLjgsMTMuM2wxNC40LDE0LjRDMTM4LDEwOS45LDE0My45LDEwMy45LDE0My45LDk2LjR6Ii8+DQoJPHBhdGggZD0iTTEwNS44LDc3YzYuMi01LjcsMTQuMS0xMC42LDIzLjYtMTAuNmMyMy4yLDAsMzcuNywyOS4zLDM3LjcsMjkuM3MtOS4yLDE4LjctMjQuOCwyNi4ybDEwLjksMTAuOQ0KCQljMjAuNS0xMi40LDMyLjUtMzYuOSwzMi41LTM2LjlzLTIxLjYtNDMuOC01Ni4xLTQzLjljMCwwLTM4LjMsMC01Ny4yLDAuMWwyOS4xLDI5LjFDMTAyLjksNzkuOSwxMDQuMyw3OC40LDEwNS44LDc3eiIvPg0KCTxwYXRoIGQ9Ik0xNjIuOSwxNjIuOWwtMjQtMjRjMCwwLDAsMCwwLDBsLTE0LjItMTQuMmMwLDAsMCwwLDAsMEw2Ni45LDY2LjljMCwwLDAsMCwwLDBMNTMuMyw1My4yYzAsMCwwLDAsMCwwTDIzLjEsMjMuMUwxMywzMy4zDQoJCWwyNS45LDI1LjlDMTguMyw3MS41LDYuMiw5Niw2LjIsOTZzMjEuNiw0My44LDU2LjEsNDMuOGMxMy4zLDAsMjQuNy02LjUsMzMuNi0xNC41YzYuMiw1LjUsMTMuNSwxMC4zLDIxLjgsMTIuN2wzNC45LDM0LjkNCgkJTDE2Mi45LDE2Mi45eiBNODUuNywxMTQuNWMtNi4yLDUuNy0xNC4xLDEwLjYtMjMuNSwxMC42Yy0yMy4yLDAtMzcuNy0yOS4zLTM3LjctMjkuM3M5LjMtMTguNywyNC44LTI2LjJsMTMsMTMNCgkJYy03LjYsMC4xLTEzLjcsNi4yLTEzLjcsMTMuOGMwLDcuNyw2LjIsMTMuOSwxMy45LDEzLjljNy42LDAsMTMuOC02LjEsMTMuOC0xMy43bDEzLjYsMTMuNkM4OC42LDExMS43LDg3LjIsMTEzLjEsODUuNywxMTQuNXoiLz4NCgk8cGF0aCBmaWxsPSJub25lIiBkPSJNMCwwaDE5MnYxOTJIMFYweiIvPg0KPC9nPg0KPC9zdmc+DQo=');
        this.setContrast(0.25);
      }
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

WebVRManager.prototype.activateBig = function() {
  // Next time a user does anything with their mouse, we trigger big mode.
  this.vrButton.addEventListener('click', this.enterBig.bind(this));
};

WebVRManager.prototype.enterBig = function() {
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
  var canvas = this.effect._renderer.domElement;
  canvas.requestPointerLock = canvas.requestPointerLock ||
      canvas.mozRequestPointerLock ||
      canvas.webkitRequestPointerLock;

  canvas.requestPointerLock();
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
  var canvas = this.effect._renderer.domElement;
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

WebVRManager.prototype.isWebkit = function() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (userAgent.match(/Safari/i) || userAgent.match(/Chrome/i)) {
    return true;
  }

  return false;
};

WebVRManager.prototype.enterVR = function() {
  console.log('Entering VR.');
  // Enter fullscreen mode (note: this doesn't work in iOS).
  this.effect.setFullScreen(true);
  // Lock down orientation, pointer, etc.
  this.requestOrientationLock();
  // Set style on button.
  this.setMode(Modes.IMMERSED);
};

WebVRManager.prototype.exitVR = function() {
  console.log('Exiting VR.');
  // Leave fullscreen mode (note: this doesn't work in iOS).
  this.effect.setFullScreen(false);
  // Release orientation, wake, pointer lock.
  this.releaseOrientationLock();
  this.releaseWakeLock();
  // Go back to compatible mode.
  this.setMode(Modes.COMPATIBLE);
};

// Expose the WebVRManager class globally.
window.WebVRManager = WebVRManager;

})();
