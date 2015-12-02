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
 * The Player is a wrapper for the VR-enabled canvas, 
 * plus its controls. It is implemented as an html5
 * <figure> element with a <figcaption> describing 
 * the VR scene. It also stores the last known style 
 * of its canvas, for loop updates.
 */
function PlayerManager(canvas, id, caption) {
  this.loadIcons_();

  // Save a canvas reference.
  this.canvas = canvas;
  canvas.style.position = 'relative';

  // Save the size of canvas between redrawing.
  this.canvasStyle= {};
  this.saveCanvasStyle();

  // Warning when HTML5 canvas not supported.
  this.canvasWarn = 'Your browser does not support HTML5 Canvas. You need to upgrade to view this content.';

  // TODO: warning for VR not supported in <figcaption>

  // If our canvas isn't wrapped in a Player container, add it.
  if(canvas.parentNode.className != Util.containerClasses.player) {
    var player = document.createElement('figure');
    player.className = Util.containerClasses.player;
    canvas.parentNode.insertBefore(player, canvas);
  } else {
    player = canvas.parentNode;
  }

  // Set the Player id, if present.
  if(id) player.id = id;

  // Additional Player styles (needed to position controls).
    player.style.position = 'relative';
    player.style.display = 'block';
    player.style.width = this.canvas.style.width; //same as canvas

  // Set the error message if web browser doesn't support canvas.
  canvas.textContent == (canvas.textContent || this.canvasWarn);

  // Set ARIA describedby attribute.
  // From: https://dev.opera.com/articles/accessible-html5-video-with-javascripted-captions/
  player.setAttribute('aria-describedby', id + '-caption');

  // Add Buttons (positioned absolutely inside Player container).
  this.controls = new ButtonManager(player);

  // Add <figcaption>, with id matching ARIA 'describedby' attribute.
  // Can be hidden, or used as an 'info' button after CSS styling.
  var figCaption = Util.findChildrenByType(player, 'figcaption');

  if(figCaption && figCaption[0]) {
    figCaption = figCaption[0];
  }
  else {
    figCaption = document.createElement('figcaption');
    player.appendChild(figCaption);
  }
  if(!figCaption.id) {
    figCaption.id = player.getAttribute('aria-describedby');
  }
  if(!figCaption.className.indexOf(Util.containerClasses.caption)) {
    Util.addClass(figCaption, Util.containerClasses.caption);
  }
  if(!figCaption.textContent && caption) {
    figCaption.textContent = caption;
  }

  // Default caption styles
  console.log("about to set style of caption")
  figCaption.style.display = 'block';
  figCaption.style.display.margin = '0 auto';

  this.isVisible = true;
};

// Get current integer values for DOM element width and height, and store them.
PlayerManager.prototype.getCanvasStyle = function() {
  return this.canvasStyle;
};

// Save the current DOM element size for later comparison in event loop.
PlayerManager.prototype.saveCanvasStyle = function() {
  this.canvasStyle.width = parseInt(this.canvas.clientWidth);
  this.canvasStyle.height = parseInt(this.canvas.clientHeight);
};

PlayerManager.prototype.loadIcons_ = function() {
  // Preload additional non-Button Player assets, if needed.
  this.ICONS = {};
};

module.exports = PlayerManager;
