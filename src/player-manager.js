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
function PlayerManager(canvas, params) {
  this.loadIcons_();

  // Storage for fixed size.


  // Save a canvas reference.
  this.canvas = canvas;

  // Warning when HTML5 canvas not supported.
  this.canvasWarn = 'Your browser does not support HTML5 Canvas. You need to upgrade to view this content.';
  this.captionDefault = 'WebVR Boilerplate Scene';

  // Save the size of canvas between redrawing.
  this.canvasSize = {};

  // Compute default size for the Player.
  this.initPlayer();

  // TODO: warning for VR not supported in <figcaption>

  // If our canvas isn't wrapped in a Player <figure> container, add it.
  if(canvas.parentNode.tagName != 'FIGURE') {
    this.dom = document.createElement('figure');
    canvas.parentNode.appendChild(this.dom);
    this.dom.appendChild(canvas);
  }
  else {
    this.dom = canvas.parentNode;
  }

  Util.addClass(this.dom, Util.containerClasses.player);

  // Assign IDs and classes to the Player elements.
  var randId = Util.getRandom(100, 999);

  if(!canvas.id) {
    canvas.id = randId;
  }

  // Set the Player id, if present, or create a random one.
  if(params.id) { 
    this.dom.id = params.id;
  } else {
    this.dom.id = Util.containerClasses.player + '-' + randId;
  }

  // Additional Player styles (needed to position controls).
  this.dom.style.position = 'relative';
  this.dom.style.display = 'block';
  this.dom.style.width = this.canvas.style.width; //Player is same width as canvas.
  this.dom.style.height = this.canvas.style.height;
  //this.dom.style.height = this.canvas.style.height; //Speed up document reflow after swap.

  // Set the error message if web browser doesn't support canvas.
  canvas.textContent == (canvas.textContent || this.canvasWarn);

  // Set ARIA describedby attribute.
  // From: https://dev.opera.com/articles/accessible-html5-video-with-javascripted-captions/
  this.dom.setAttribute('aria-describedby', this.dom.id + '-caption');

  // Add Buttons (positioned absolutely inside Player container).
  this.controls = new ButtonManager(this.dom);

  // Add <figcaption>, with id matching ARIA 'describedby' attribute.
  // Can be hidden, or used as an 'info' button after CSS styling.
  this.createCaption(params);

  this.isVisible = true;

  return this;
};

//create a fixed-size Player
PlayerManager.prototype.initPlayer = function() {
  if (this.canvas.style.width) {
    this.canvasSize.width = parseInt(this.canvas.style.width);
  } else if (this.canvas.width) {
    this.canvasSize.width = this.canvas.width;
  } else {
    this.canvasSize.width = window.innerWidth;
  }

  if (this.canvas.style.height) {
    this.canvasSize.height = parseInt(this.canvas.style.height);
  } else if(this.canvas.height) {
    this.canvasSize.height = this.canvas.height;
  } else {
    this.canvasSize.height = window.innerHeight;
  }
  console.log('this.canvasSize.width:' + this.canvasSize.width + ' this.canvasSize.height:' + this.canvasSize.height)
}

// Build a caption for the Player.
PlayerManager.prototype.createCaption = function(params) {
  var figCaption = Util.findChildrenByType(this.dom, 'figcaption');
  if(figCaption[0]) {
    figCaption = figCaption[0];
  } else {
    figCaption = document.createElement('figcaption');
    this.dom.appendChild(figCaption);
  }
  // If there is no id, make a random one (required by ARIA).
  if(!figCaption.id) {
    figCaption.id = this.dom.getAttribute('aria-describedby');
  }

  // Add the WebVR Boilerplate className to the caption.
  if(!figCaption.className.indexOf(Util.containerClasses.caption)) {
    Util.addClass(figCaption, Util.containerClasses.caption);
  }

  // Add a caption, if supplied, otherwise default.
  if(params.caption) {
    figCaption.textContent = params.caption;
  } else {
    if(figCaption.textContent == '') {
      figCaption.textContent = this.captionDefault;
    }
  }

  // Set default caption styles.
  if(params.showCaption) {
    figCaption.style.display = 'block';
  } else {
    figCaption.style.display = 'none';
  }

  // Additional styles centering caption above control row.
  figCaption.style.width = '100%';
  figCaption.style.position = 'absolute';
  figCaption.style.textAlign = 'center';
  //TODO: make ButtonManger button size arbitrary, add getter function for height
  figCaption.style.bottom = '48px'; //TODO: make this just above the row of buttons
  figCaption.style.display.margin = '0 auto';

  //return for show/hide
  return figCaption;
};

// Get the current Player width (fixed).
PlayerManager.prototype.getWidth = function() {
  return this.canvasSize.width;
}

// Get the current Player height (fixed).
PlayerManager.prototype.getHeight = function() {
  return this.canvasSize.height;
}

// Set the Player size (all possible sizes)
PlayerManager.prototype.setSize = function(width, height) {
  //container
  this.dom.style.width = width + 'px';
  this.dom.style.height = height + 'px';
  this.canvasSize.width = width;
  this.canvasSize.height = height;
  //canvas
  this.canvas.width = width;
  this.canvas.height = height;
  this.canvas.style.width = width;
  this.canvas.style.height = height;
}

PlayerManager.prototype.resize = function(hasDOM) {
  var width, height;
  if (Util.isFullScreen()) {
    // Player size = fullscreen = window size in fullscreen mode.
    width = window.innerWidth;
    height = window.innerHeight;
  } else {
    if (hasDOM) {
      // Player size is fixed.
      // TODO: enable a relative sizing option for responsive design layouts.
      width = this.getWidth();
      height = this.getHeight();
    } else {
      width = window.innerWidth;
      height = window.innerHeight;
      // Player size always bound to window size.
      this.setSize(width, height);
    }
  }
  return {width:width, height:height};
}

// Run on entering fullscreen.
PlayerManager.prototype.enterFullScreen = function() {
  console.log('player entering fullscreen')
  return Util.hideDOM(this, Util.containerClasses.dom);
}

// Run on exiting fullscreen.
PlayerManager.prototype.exitFullScreen = function() {
  console.log('player exiting fullscreen');
  return Util.showDOM(this, Util.containerClasses.dom);
}

PlayerManager.prototype.loadIcons_ = function() {
  // Preload additional non-Button Player icons, as needed.
  this.ICONS = {};
};

module.exports = PlayerManager;
