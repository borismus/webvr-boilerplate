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

var Modes = require('./modes.js');
var Emitter = require('./emitter.js');
var Util = require('./util.js');

/**
 * Everything having to do with the WebVR button.
 * Emits a 'click' event when it's clicked.
 */
function WebVRButton() {
  var button = this.createButton();
  document.body.appendChild(button);
  button.addEventListener('click', this.onClick_.bind(this));

  this.button = button;
  this.isVisible = true;

  // Preload some hard-coded SVG.
  this.logo = Util.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4xLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTkyIDE5MiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTkyIDE5MiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8Zz4NCgkJPHBhdGggZmlsbD0iZ3JheSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxIiBpZD0iX3gzQ19QYXRoX3gzRV9fOV8iIGQ9Ik0xNzEuMiwxNDQuMmMwLTUuNi0zLjYtNy4yLTguOC03LjJIMTU1djI2aDZ2LTExaC0wLjRsNi40LDExaDYuMmwtNy40LTExLjMNCgkJCUMxNjkuMywxNTEuMSwxNzEuMiwxNDcuNiwxNzEuMiwxNDQuMnogTTE2MS4yLDE0OUgxNjF2LTloMC4zYzIuNywwLDQuOCwxLjIsNC44LDQuNEMxNjYsMTQ3LjYsMTY0LjEsMTQ5LDE2MS4yLDE0OXoiLz4NCgkJPHBvbHlnb24gZmlsbD0iZ3JheSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxIiBwb2ludHM9IjEzMi4zLDE1MyAxMzIuMiwxNTMgMTI1LjksMTM3IDEyMC40LDEzNyAxMzAuNCwxNjMgMTMzLjQsMTYzIDE0My42LDEzNyAxMzguMSwxMzcgCQkiLz4NCgkJPHBhdGggZmlsbD0iZ3JheSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxIiBpZD0iX3gzQ19QYXRoX3gzRV9fOF8iIGQ9Ik0xMDUsMTQ3LjljMS42LTEsMi4zLTIuNSwyLjMtNC40YzAtNS4yLTMtNi41LTcuOS02LjVIOTN2MjZoOC4xYzQuOCwwLDguNC0yLjksOC40LTgNCgkJCUMxMDkuNSwxNTIuMSwxMDguMSwxNDguNCwxMDUsMTQ3Ljl6IE05OCwxNDBoMC44YzIuMiwwLDMuNywwLjgsMy43LDMuNWMwLDIuNy0xLjIsMy41LTMuNywzLjVIOThWMTQweiBNOTkuMywxNThIOTh2LTdoMQ0KCQkJYzIuNiwwLDUuNCwwLDUuNCwzLjRTMTAyLDE1OCw5OS4zLDE1OHoiLz4NCgkJPHBvbHlnb24gZmlsbD0iZ3JheSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxIiBwb2ludHM9IjY1LDE2MyA3OSwxNjMgNzksMTU4IDcxLDE1OCA3MSwxNTEgNzksMTUxIDc5LDE0NyA3MSwxNDcgNzEsMTQwIDc5LDE0MCA3OSwxMzcgNjUsMTM3IAkJIi8+DQoJCTxwb2x5Z29uIGZpbGw9ImdyYXkiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMSIgcG9pbnRzPSI0My4zLDE1NCA0My4yLDE1NCAzNy44LDEzNyAzNC43LDEzNyAyOS41LDE1NCAyOS40LDE1NCAyNC4xLDEzNyAxOC44LDEzNyAyNy4xLDE2MyAzMC45LDE2MyAzNS44LDE0NiAzNS45LDE0NiANCgkJCTQxLjEsMTYzIDQ0LjksMTYzIDUzLjgsMTM3IDQ4LjQsMTM3ICIvPg0KCTwvZz4NCgk8Y2lyY2xlIGZpbGw9ImdyYXkiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMyIgY3g9IjYyLjQiIGN5PSI3My41IiByPSIxMy45Ii8+DQoJPGNpcmNsZSBmaWxsPSJncmF5IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIGN4PSIxMzAiIGN5PSI3My41IiByPSIxMy45Ii8+DQoJPHBhdGggZmlsbD0iZ3JheSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIiBpZD0iX3gzQ19QYXRoX3gzRV9fNV8iIGQ9Ik0xMjkuNiwxMTdjMzQuNSwwLDU2LjEtNDMuOSw1Ni4xLTQzLjlzLTIxLjYtNDMuOC01Ni4xLTQzLjljMCwwLTY3LjIsMC4xLTY3LjMsMC4xDQoJCWMtMzQuNSwwLTU2LjEsNDMuOC01Ni4xLDQzLjhTMjcuOCwxMTcsNjIuNCwxMTdjMTMuMywwLDI0LjctNi41LDMzLjYtMTQuNUMxMDUsMTEwLjUsMTE2LjMsMTE3LDEyOS42LDExN3ogTTg1LjcsOTEuNw0KCQljLTYuMiw1LjctMTQuMSwxMC42LTIzLjUsMTAuNmMtMjMuMiwwLTM3LjctMjkuMy0zNy43LTI5LjNzMTQuNS0yOS4zLDM3LjctMjkuM2M5LjYsMCwxNy42LDUsMjMuOCwxMC44YzQuMSwzLjksNy40LDguMiw5LjgsMTEuNw0KCQljMi40LTMuNSw1LjgtOCwxMC4xLTExLjljNi4yLTUuNywxNC4xLTEwLjYsMjMuNi0xMC42YzIzLjIsMCwzNy43LDI5LjMsMzcuNywyOS4zcy0xNC41LDI5LjMtMzcuNywyOS4zYy05LjMsMC0xNy4xLTQuNy0yMy4zLTEwLjMNCgkJYy00LjQtNC4xLTcuOS04LjYtMTAuNC0xMi4yQzkzLjQsODMuMiw5MCw4Ny43LDg1LjcsOTEuN3oiLz4NCgk8cGF0aCBmaWxsPSJub25lIiBkPSJNMCwwaDE5MnYxOTJIMFYweiIvPg0KPC9nPg0KPC9zdmc+DQo=');
  this.logoDisabled = Util.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4xLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMTkyIDE5MiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTkyIDE5MiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8cGF0aCBmaWxsPSJncmF5IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xNDMuOSw5Ni40YzAtNy42LTYuMi0xMy45LTEzLjktMTMuOWMtNy41LDAtMTMuNSw1LjktMTMuOCwxMy4zbDE0LjQsMTQuNEMxMzgsMTA5LjksMTQzLjksMTAzLjksMTQzLjksOTYuNHoiLz4NCgk8cGF0aCBmaWxsPSJncmF5IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xMDUuOCw3N2M2LjItNS43LDE0LjEtMTAuNiwyMy42LTEwLjZjMjMuMiwwLDM3LjcsMjkuMywzNy43LDI5LjNzLTkuMiwxOC43LTI0LjgsMjYuMmwxMC45LDEwLjkNCgkJYzIwLjUtMTIuNCwzMi41LTM2LjksMzIuNS0zNi45cy0yMS42LTQzLjgtNTYuMS00My45YzAsMC0zOC4zLDAtNTcuMiwwLjFsMjkuMSwyOS4xQzEwMi45LDc5LjksMTA0LjMsNzguNCwxMDUuOCw3N3oiLz4NCgk8cGF0aCBmaWxsPSJncmF5IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xNjIuOSwxNjIuOWwtMjQtMjRjMCwwLDAsMCwwLDBsLTE0LjItMTQuMmMwLDAsMCwwLDAsMEw2Ni45LDY2LjljMCwwLDAsMCwwLDBMNTMuMyw1My4yYzAsMCwwLDAsMCwwTDIzLjEsMjMuMUwxMywzMy4zDQoJCWwyNS45LDI1LjlDMTguMyw3MS41LDYuMiw5Niw2LjIsOTZzMjEuNiw0My44LDU2LjEsNDMuOGMxMy4zLDAsMjQuNy02LjUsMzMuNi0xNC41YzYuMiw1LjUsMTMuNSwxMC4zLDIxLjgsMTIuN2wzNC45LDM0LjkNCgkJTDE2Mi45LDE2Mi45eiBNODUuNywxMTQuNWMtNi4yLDUuNy0xNC4xLDEwLjYtMjMuNSwxMC42Yy0yMy4yLDAtMzcuNy0yOS4zLTM3LjctMjkuM3M5LjMtMTguNywyNC44LTI2LjJsMTMsMTMNCgkJYy03LjYsMC4xLTEzLjcsNi4yLTEzLjcsMTMuOGMwLDcuNyw2LjIsMTMuOSwxMy45LDEzLjljNy42LDAsMTMuOC02LjEsMTMuOC0xMy43bDEzLjYsMTMuNkM4OC42LDExMS43LDg3LjIsMTEzLjEsODUuNywxMTQuNXoiLz4NCgk8cGF0aCBmaWxsPSJub25lIiBkPSJNMCwwaDE5MnYxOTJIMFYweiIvPg0KPC9nPg0KPC9zdmc+DQo=');
}
WebVRButton.prototype = new Emitter();

WebVRButton.prototype.createButton = function() {
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
  s.cursor = 'pointer';
  // Prevent button from being dragged.
  button.draggable = false;
  button.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });
  return button;
};

WebVRButton.prototype.setMode = function(mode) {
  if (!this.isVisible) {
    return;
  }
  switch (mode) {
    case Modes.INCOMPATIBLE:
      this.button.src = this.logo;
      this.button.title = 'Open in immersive mode';
      break;
    case Modes.COMPATIBLE:
      this.button.src = this.logo;
      this.button.title = 'Open in VR mode';
      break;
    case Modes.VR:
      this.button.src = this.logoDisabled;
      this.button.title = 'Leave VR mode';
      break;
  }

  // Hack for Safari Mac/iOS to force relayout (svg-specific issue)
  // http://goo.gl/hjgR6r
  this.button.style.display = 'inline-block';
  this.button.offsetHeight;
  this.button.style.display = 'block';
};

WebVRButton.prototype.setVisibility = function(isVisible) {
  this.isVisible = isVisible;
  this.button.style.display = isVisible ? 'block' : 'none';
};

WebVRButton.prototype.onClick_ = function(e) {
  e.stopPropagation();
  e.preventDefault();
  this.emit('click');
}

module.exports = WebVRButton;
