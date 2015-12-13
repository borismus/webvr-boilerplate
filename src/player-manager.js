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
    prefix: 'webvr',     //common prefix
    player: '-player',   //player suffix
    caption: '-caption', //<figcaption> suffix
    canvas: '-canvas'    //canvas suffix
  };

  this.fullWin = false;
  this.aspect = 0;

  // Warning when HTML5 canvas not supported.
  this.canvasWarn = 'Your browser does not support HTML5 Canvas. You need to upgrade to view this content.';
  this.captionDefault = 'WebVR Boilerplate Player Scene';

  this.loadIcons_();

  // Save a local reference to the canvas (note: ThreeJS can also render to SVG)
  this.canvas = renderer.domElement;

  // Save a local reference to params
  this.params = params || {};

  // Assign IDs and classes to the Player elements.
  this.uid =  Util.getUniqueId(this.playerClasses.prefix + this.playerClasses.player);

  // Initialize the Player container.
  this.initFigure(this.canvas);
  this.initButtons();

  // Attach a Button panel to the Player, and save an object reference.
  //window.player = this;
};

// Set player to emit events.
PlayerManager.prototype = new Emitter();

// Use the <figure> element for semantic wrapping.
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
  // Set the Player id and standard class.
  if(!this.dom.id) {
      this.dom.id = this.uid;
  }
  Util.addClass(this.dom, this.playerClasses.prefix + this.playerClasses.player);

  // Set the Player canvas id and standard class
  if(!canvas.id) {
    canvas.id = this.uid + this.playerClasses.canvas;
  }
  Util.addClass(canvas, this.playerClasses.prefix + this.playerClasses.player + this.playerClasses.canvas);

  // Set the ARIA attribute for figure caption.
  this.dom.setAttribute('aria-describedby', this.uid + this.playerClasses.caption);

  // Set the Player default CSS styles.
  var s = this.dom.style;

  // If our parent is document.body, add styles causing the Player to fill the window.
  if(this.isFullWin()) {
    s.width = '100%';
    s.height = '100%';
  }

  s.position = 'relative';
  s.margin = '0px'; //applied to <figure> by some browsers
  s.padding = '0px';

  // Set canvas to always fill the Player (all controls and captions overlay canvas).
  var c = this.canvas.style;
  c.margin = '0px';
  c.padding = '0px';
  c.width = '100%';
  c.height = '100%';

  // Initialize internal Player elements.
  this.initButtons();
  this.initCaption();

  /**
   * Use the computed (not preset) size of the Player to set an aspect ratio.
   * If the Player is is the DOM, we maintain this aspect ratio, and don't
   * reculate it. If the Player is full window (its parent is document.body)
   * we recalculate the aspect ratio via window.innerWidth and window.innerHeight
   * each time Player.resize() is subsequently recalled.
   */
  this.getAspect();
};

PlayerManager.prototype.isFullWin = function() {
  return(this.dom.parentNode == document.body);
};

PlayerManager.prototype.initButtons = function() {
  this.buttons = new ButtonManager(this.playerClasses.prefix, this.uid, this.params);
  this.dom.appendChild(this.buttons.dom);
};

PlayerManager.prototype.initCaption = function() {
  var figCaption = Util.getChildrenByTagName(this.dom, 'figcaption');
  if(figCaption && figCaption[0]) {
    figCaption = figCaption[0];
  } else {
    figCaption = document.createElement('figcaption');
    this.dom.appendChild(figCaption);
  }

  // Set the standard class.
  Util.addClass(figCaption, this.playerClasses.prefix + this.playerClasses.player + this.playerClasses.caption);

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

// Get the dynamically-computed aspect ratio of the Player based on CSS.
PlayerManager.prototype.getAspect = function() {
    this.aspect = parseFloat(getComputedStyle(this.dom).getPropertyValue('width')) / parseFloat(getComputedStyle(this.dom).getPropertyValue('height'));
};

/**
 * Get dynamically computed size and aspect ratio of the Player (allows
 * responsive CSS styling). If the Player is running standalone, it sizes
 * via window.innerWidth and window.innerHeight. If it is part of a DOM, it
 * sets width based on its CSS computed style, and sets height by using the
 * ORIGINAL aspect ratio used when the player is initialized.
 */
PlayerManager.prototype.getSize = function() {
  console.log('Player.getSize()');
  if(this.isFullWin()) {
    return {
      aspect: this.getAspect(), // Dynamic, controlled by width and height
      width: window.innerWidth,
      height: window.innerHeight
    };
  } else {
    var width = parseFloat(getComputedStyle(this.dom).getPropertyValue('width'));
    return {
      aspect: this.aspect, // Static, controlled by width
      width: width,
      height: width / this.aspect
    };
  }
};

// Set the Player size.
PlayerManager.prototype.setSize = function(width, height) {
  // Canvas property.
  this.canvas.width = width;
  this.canvas.height = height;
  //CSS styles (the most important).
  this.dom.style.width = width + 'px';
  this.dom.style.height = height + 'px';
}

// Initializaiton event received from WebVRManager.
PlayerManager.prototype.onInit_ = function() {
  console.log("Player:init event from manager");
};

// Mode change event received from WebVRManager.
PlayerManager.prototype.onModeChange_ = function(oldMode, newMode) {
  console.log('Player:modechange from manager, old:' + oldMode + ' new:' + newMode);
};

// Resized event received from WebVRManager.
PlayerManager.prototype.onResized_ = function(newCWidth, newCHeight) {
  console.log('resize event from manager, for Player, new canvas width:' + newCWidth + ' height:' + newCHeight);
};

// Callback for entering fullscreen.
PlayerManager.prototype.enterFullscreen_ = function() {
  console.log('Player.enterFullscreen()');
  // Temporarily override any CSS styles.
  this.dom.style.width = '100%';
  this.dom.style.height = '100%';
};

// Callback when fullscreen is actually reached.
PlayerManager.prototype.reachFullscreen_ = function() {

};

// Callback for exiting fullscreen.
PlayerManager.prototype.exitFullscreen_ = function() {
  console.log('Player.exitFullscreen()');
  this.dom.style.width = '';
  this.dom.style.height = '';
  //this.canvas.width = '';
  //this.canvas.height = '';
};

// Callback when normal screen is actually reached from fullscreen.
PlayerManager.prototype.reachNormalScreen_ = function() {

};

// Viewer changed.
PlayerManager.prototype.onViewerChanged_ = function() {
  console.log('Player.onViewerChanged');
};

// Preload additional non-Button Player icons, as needed.
PlayerManager.prototype.loadIcons_ = function() {
  this.ICONS = {};
};

module.exports = PlayerManager;
