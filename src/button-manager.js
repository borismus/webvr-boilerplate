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

var Aligner = require('./aligner.js');
var Emitter = require('./emitter.js');
var Modes = require('./modes.js');
var Util = require('./util.js');

/**
 * Everything having to do with the WebVR button.
 * Emits a 'click' event when it's clicked.
 */
function ButtonManager(params) {
  this.loadIcons_();

  this.buttonClasses = {
    button: '-button',      //prefix
    panel: '-panel',        //panels with multiple buttons
    back: '-back',          //back button
    fs: '-fullscreen',      //fullscreen mode button
    vr: '-vr',              //vr mode button
    settings: '-settings'   //settings panel
  };

  // Constants for setting the corner of the button display.
  this.buttonPositions = {
    topLeft:0,
    topRight:1,
    bottomRight:2,
    bottomLeft:3
  };

  // Default sizes.
  this.buttonWidth = 24;
  this.buttonHeight = 24;
  this.buttonPadding = 12;

  // Save a local reference to params
  this.params = params;

  // Set a UID.
  this.uid = this.params.uid + this.buttonClasses.panel;

  // Create a wrapper element for the Buttons.
  this.dom = document.createElement('nav');
  this.dom.id = this.uid;
  Util.addClass(this.dom, this.params.prefix + this.buttonClasses.panel);
  var s = this.dom.style;
  s.position = 'absolute';
  s.width = '150px';
  s.height = this.buttonHeight + this.buttonPadding + this.buttonPadding + 'px';
  //s.bottom = '0px';
  //s.right = '0px';
  this.setPosition(this.buttonPositions.bottomRight);

  // Attach buttons to the wrapper, and store an object reference.

  // Make the fullscreen button.
  var fsButton = this.createButton();
  fsButton.src = this.ICONS.fullscreen;
  fsButton.id = this.uid + this.buttonClasses.button + this.buttonClasses.fs;
  fsButton.title = 'Fullscreen mode';
  this.dom.appendChild(fsButton);
  s = fsButton.style;
  s.bottom = 0;
  s.right = 0;
  fsButton.addEventListener('click', this.createClickHandler_('fs'));
  this.fsButton = fsButton;

  // DEBUG!!!!!!!!!!!!!
  //Util.listenReflow(this.fsButton, function() { console.log('got a reflow');});

  // Make the VR button.
  var vrButton = this.createButton();
  vrButton.src = this.ICONS.cardboard;
  vrButton.id = this.uid + this.buttonClasses.button + this.buttonClasses.vr;
  vrButton.title = 'Virtual reality mode';
  this.dom.appendChild(vrButton);
  s = vrButton.style;
  s.bottom = 0;
  s.right = '48px';
  vrButton.addEventListener('click', this.createClickHandler_('vr'));
  this.vrButton = vrButton;

  // Make the back button.
  var backButton = this.createButton();
  backButton.id = this.uid + this.buttonClasses.button + this.buttonClasses.back;
  backButton.title = 'Back to previous mode';
  this.dom.appendChild(backButton);
  s = backButton.style;
  s.left = 0;
  s.top = 0;
  backButton.src = this.ICONS.back;
  backButton.addEventListener('click', this.createClickHandler_('back'));
  this.backButton = backButton;

  // Make the settings button, but only for mobile.
  var settingsButton = this.createButton();
  settingsButton.title = 'Configure viewer';
  this.dom.appendChild(settingsButton);
  s = settingsButton.style;
  s.left = '50%';
  s.marginLeft = '-24px';
  s.bottom = 0;
  s.zIndex = 0;
  settingsButton.src = this.ICONS.settings;
  settingsButton.addEventListener('click', this.createClickHandler_('settings'));
  this.settingsButton = settingsButton;

  this.isVisible = true;

  this.aligner = new Aligner();
  return this;
}

ButtonManager.prototype = new Emitter();

ButtonManager.prototype.createButton = function() {
  var button = document.createElement('img');
  Util.addClass(button, this.params.prefix + this.buttonClasses.button);
  var s = button.style;
  //s.position = 'fixed';
  s.width = '24px'
  s.height = '24px';
  s.backgroundSize = 'cover';
  s.backgroundColor = 'transparent';
  s.border = 0;
  s.userSelect = 'none';
  s.webkitUserSelect = 'none';
  s.MozUserSelect = 'none';
  s.cursor = 'pointer';
  s.padding = '12px';
  s.zIndex = 1;
  s.display = 'none';
  s.float = 'right';

  // Prevent button from being selected and dragged.
  button.draggable = false;
  button.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });

  // Style it on hover.
  button.addEventListener('mouseenter', function(e) {
    s.filter = s.webkitFilter = 'drop-shadow(0 0 5px rgba(255,255,255,1))';
  });
  button.addEventListener('mouseleave', function(e) {
    s.filter = s.webkitFilter = '';
  });

  return button;
};

/**
 * TODO: using CSS pseudo-class to hide in fullscreen.
 * sel:-webkit-full-screen { display: none; }
 * sel:-moz-full-screen { display: none; }
 * sel:-ms-fullscreen { display: none; }
 * sel:fullscreen { display: none; }
 */
ButtonManager.prototype.setMode = function(mode, isVRCompatible) {
  if (!this.isVisible) {
    return;
  }
  switch (mode) {
    case Modes.NORMAL:
      this.fsButton.style.display = 'block';
      this.fsButton.src = this.ICONS.fullscreen;
      this.vrButton.style.display = (isVRCompatible ? 'block' : 'none');
      this.backButton.style.display = 'none';
      this.settingsButton.style.display = 'none';
      this.aligner.hide();
      break;
    case Modes.MAGIC_WINDOW:
      this.fsButton.style.display = 'block';
      this.fsButton.src = this.ICONS.exitFullscreen;
      this.vrButton.style.display = (isVRCompatible ? 'block' : 'none');
      this.backButton.style.display = 'block';
      this.settingsButton.style.display = 'none';
      this.aligner.hide();
      break;
    case Modes.VR:
      this.fsButton.style.display = 'none';
      this.vrButton.style.display = 'none';
      // Hack for Firefox, since it doesn't display HTML content correctly in
      // VR at the moment.
      this.backButton.style.display = Util.isFirefox() ? 'none' : 'block';
      // Only show the settings button on mobile.
      var isSettingsVisible = Util.isMobile() || WebVRConfig.FORCE_ENABLE_VR;
      this.settingsButton.style.display = isSettingsVisible ? 'block' : 'none';
      this.aligner.show();
      break;
  }

  // Hack for Safari Mac/iOS to force relayout (svg-specific issue)
  // http://goo.gl/hjgR6r
  var oldValue = this.fsButton.style.display;
  this.fsButton.style.display = 'inline-block';
  this.fsButton.offsetHeight;
  this.fsButton.style.display = oldValue;
};

// Move the control panel to one of the four corners.
ButtonManager.prototype.setPosition = function(corner) {
  // Assume position:absolute.
  var p = this.buttonPositions;
  switch(corner) {
    case p.topLeft:
      this.dom.style.top = '0px';
      this.dom.style.left = '0px';
      this.dom.style.bottom = this.dom.style.right = '';
      break;
    case p.topRight:
      this.dom.style.top = '0px';
      this.dom.style.right = '0px';
      this.dom.style.left = this.dom.style.bottom = '';
      break;
    case p.bottomRight:
      this.dom.style.bottom = '0px';
      this.dom.style.right = '0px';
      this.dom.style.top = this.dom.style.left = '';
      break;
    case p.bottomLeft:
      this.dom.style.bottom = '0px';
      this.dom.style.left = '0px';
      this.dom.style.top = this.dom.style.right = '';
      break;
    default:
      console.log('Unknown position for buttons:' + corner);
  }
};

ButtonManager.prototype.setVisibility = function(isVisible) {
  this.isVisible = isVisible;
  this.fsButton.style.display = isVisible ? 'block' : 'none';
  this.vrButton.style.display = isVisible ? 'block' : 'none';
  this.backButton.style.display = isVisible ? 'block' : 'none';
};

ButtonManager.prototype.createClickHandler_ = function(eventName) {
  return function(e) {
    e.stopPropagation();
    e.preventDefault();
    console.log("*****************ABOUT TO EMIT:" + eventName + '-' + this.params.uid)
    this.emit(eventName + '-' + this.params.uid);
  }.bind(this);
};

ButtonManager.prototype.loadIcons_ = function() {
  // Preload some hard-coded SVG.
  this.ICONS = {};
  this.ICONS.cardboard = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMjAuNzQgNkgzLjIxQzIuNTUgNiAyIDYuNTcgMiA3LjI4djEwLjQ0YzAgLjcuNTUgMS4yOCAxLjIzIDEuMjhoNC43OWMuNTIgMCAuOTYtLjMzIDEuMTQtLjc5bDEuNC0zLjQ4Yy4yMy0uNTkuNzktMS4wMSAxLjQ0LTEuMDFzMS4yMS40MiAxLjQ1IDEuMDFsMS4zOSAzLjQ4Yy4xOS40Ni42My43OSAxLjExLjc5aDQuNzljLjcxIDAgMS4yNi0uNTcgMS4yNi0xLjI4VjcuMjhjMC0uNy0uNTUtMS4yOC0xLjI2LTEuMjh6TTcuNSAxNC42MmMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTMgMS4xOCAwIDIuMTIuOTYgMi4xMiAyLjEzcy0uOTUgMi4xMi0yLjEyIDIuMTJ6bTkgMGMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTNzMi4xMi45NiAyLjEyIDIuMTMtLjk1IDIuMTItMi4xMiAyLjEyeiIvPgogICAgPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgwVjB6Ii8+Cjwvc3ZnPgo=');
  this.ICONS.fullscreen = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNNyAxNEg1djVoNXYtMkg3di0zem0tMi00aDJWN2gzVjVINXY1em0xMiA3aC0zdjJoNXYtNWgtMnYzek0xNCA1djJoM3YzaDJWNWgtNXoiLz4KPC9zdmc+Cg==');
  this.ICONS.exitFullscreen = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNNSAxNmgzdjNoMnYtNUg1djJ6bTMtOEg1djJoNVY1SDh2M3ptNiAxMWgydi0zaDN2LTJoLTV2NXptMi0xMVY1aC0ydjVoNVY4aC0zeiIvPgo8L3N2Zz4K');
  this.ICONS.back = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNMjAgMTFINy44M2w1LjU5LTUuNTlMMTIgNGwtOCA4IDggOCAxLjQxLTEuNDFMNy44MyAxM0gyMHYtMnoiLz4KPC9zdmc+Cg==');
  this.ICONS.settings = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNMTkuNDMgMTIuOThjLjA0LS4zMi4wNy0uNjQuMDctLjk4cy0uMDMtLjY2LS4wNy0uOThsMi4xMS0xLjY1Yy4xOS0uMTUuMjQtLjQyLjEyLS42NGwtMi0zLjQ2Yy0uMTItLjIyLS4zOS0uMy0uNjEtLjIybC0yLjQ5IDFjLS41Mi0uNC0xLjA4LS43My0xLjY5LS45OGwtLjM4LTIuNjVDMTQuNDYgMi4xOCAxNC4yNSAyIDE0IDJoLTRjLS4yNSAwLS40Ni4xOC0uNDkuNDJsLS4zOCAyLjY1Yy0uNjEuMjUtMS4xNy41OS0xLjY5Ljk4bC0yLjQ5LTFjLS4yMy0uMDktLjQ5IDAtLjYxLjIybC0yIDMuNDZjLS4xMy4yMi0uMDcuNDkuMTIuNjRsMi4xMSAxLjY1Yy0uMDQuMzItLjA3LjY1LS4wNy45OHMuMDMuNjYuMDcuOThsLTIuMTEgMS42NWMtLjE5LjE1LS4yNC40Mi0uMTIuNjRsMiAzLjQ2Yy4xMi4yMi4zOS4zLjYxLjIybDIuNDktMWMuNTIuNCAxLjA4LjczIDEuNjkuOThsLjM4IDIuNjVjLjAzLjI0LjI0LjQyLjQ5LjQyaDRjLjI1IDAgLjQ2LS4xOC40OS0uNDJsLjM4LTIuNjVjLjYxLS4yNSAxLjE3LS41OSAxLjY5LS45OGwyLjQ5IDFjLjIzLjA5LjQ5IDAgLjYxLS4yMmwyLTMuNDZjLjEyLS4yMi4wNy0uNDktLjEyLS42NGwtMi4xMS0xLjY1ek0xMiAxNS41Yy0xLjkzIDAtMy41LTEuNTctMy41LTMuNXMxLjU3LTMuNSAzLjUtMy41IDMuNSAxLjU3IDMuNSAzLjUtMS41NyAzLjUtMy41IDMuNXoiLz4KPC9zdmc+Cg==');
};

module.exports = ButtonManager;
