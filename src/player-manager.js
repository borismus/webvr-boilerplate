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

var Emitter = require('./emitter.js');
var Modes = require('./modes.js');
var ButtonManager = require('./button-manager.js');
var Util = require('./util.js');

/**
 * The Player is a wrapper for a VR-enabled canvas,
 * plus its controls. It is implemented as an html5
 * <figure> element with a <figcaption> describing
 * the VR scene. It also stores the last known style
 * of its canvas, for loop updates.
 */
function PlayerManager(renderer, params) {

  this.playerClasses = {
    prefix: 'webvr',
    player: 'player',
    canvas: 'canvas',
    caption: 'caption',
    controls: 'controls-',
    back: 'button-back',
    fullscreen: 'button-fullscreen',
    vr: 'button-vr',
  };

  // Warning when HTML5 canvas not supported.
  this.canvasWarn = 'Your browser does not support HTML5 Canvas. You need to upgrade to view this content.';
  this.captionDefault = 'WebVR Boilerplate Player Scene';

  this.loadIcons_();

  // Save a local reference to the canvas (note: ThreeJS can also render to SVG)
  this.canvas = renderer.domElement;

  // Save a local reference to params
  this.params = params || {};

  // Assign IDs and classes to the Player elements.
  this.uid = Util.getUniqueId(this.playerClasses.player);
  console.log("PLAYER UID:" + this.uid);

  // Initialize the Player container.
  this.initFigure(this.canvas);
};

PlayerManager.prototype = new Emitter();

PlayerManager.prototype.initFigure = function(canvas) {
  // If our canvas isn't wrapped in a Player <figure> container, add it.
  if(canvas.parentNode.tagName != 'FIGURE') {
    this.dom = document.createElement('figure');
    canvas.parentNode.appendChild(this.dom);
    this.dom.appendChild(canvas);
  }
  else {
    // Canvas should be inside a <figure> tag.
    this.dom = canvas.parentNode;
  }

  // Set default Player styles (all controls and captions overlay canvas).
  this.dom.style.position = 'relative';
  //this.dom.style.width = this.canvas.style.width;
  //this.dom.style.height = this.canvas.style.height;

  // Set the ARIA attribute for figure caption.
  this.dom.setAttribute('aria-describedby', this.uid + '-caption');

  this.initButtons();
  this.initCaption();

};

PlayerManager.prototype.initButtons = function() {

};

PlayerManager.prototype.initCaption = function() {
  var figCaption = Util.getChildrenByTagName(this.dom, 'figcaption');
  if(figCaption && figCaption[0]) {
    figCaption = figCaption[0];
  } else {
    figCaption = document.createElement('figcaption');
    this.dom.appendChild(figCaption);
  }
  // Set the default styles.
  figCaption.style.position = 'absolute';
  figCaption.style.width = '100%';
  figCaption.style.bottom = '48px';
  figCaption.style.textAlign = 'center';

  // Link caption to its parent figure (required by ARIA).
  figCaption.id = this.dom.getAttribute('aria-describedby');

  // Add a caption, if supplied, otherwise default.
  if(this.params.caption) {
    figCaption.textContent = this.params.caption;
  } else {
    if(figCaption.textContent == '') {
      figCaption.textContent = this.captionDefault;
    }
  }
};

PlayerManager.prototype.onInit_ = function() {
  console.log("Player:init event from manager");
};

PlayerManager.prototype.onModeChange_ = function(oldMode, newMode) {
  console.log('Player:modechange from manager, old:' + oldMode + ' new:' + newMode);
};

PlayerManager.prototype.onResized_ = function(newCWidth, newCHeight) {
  console.log('resize event from manager, for Player, new canvas width:' + newCWidth + ' height:' + newCHeight);
};

// Run on entering fullscreen.
PlayerManager.prototype.enterFullscreen_ = function() {
  console.log('Player.enterFullscreen()');
};

PlayerManager.prototype.reachFullscreen_ = function() {
  console.log('Player.reachFullscreen()');
}

// Run on exiting fullscreen.
PlayerManager.prototype.exitFullscreen_ = function() {
  console.log('Player.exitFullscreen()');
};

PlayerManager.prototype.reachNormalscreen_ = function() {
  console.log('Player.reachNormalscreen');
}

PlayerManager.prototype.onViewerChanged_ = function() {
  console.log('Player.onViewerChanged');
};

  // Preload additional non-Button Player icons, as needed.
PlayerManager.prototype.loadIcons_ = function() {
  this.ICONS = {};
};

module.exports = PlayerManager;
