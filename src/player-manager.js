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
function PlayerManager(canvas, effect, params) {

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

  // Save a local reference to the canvas
  this.canvas = canvas;

  // Assign IDs and classes to the Player elements.
  this.uid = Util.getUniqueId(this.playerClasses.player);
  console.log("PLAYER UID:" + this.uid);

};

PlayerManager.prototype = new Emitter();

PlayerManager.prototype.onInit_ = function() {
  console.log("init event from manager, for Player");
};

PlayerManager.prototype.onResized_ = function() {
  console.log("resize event from manager, for Player");
};

// Run on entering fullscreen.
PlayerManager.prototype.requestFullscreen_ = function() {
  console.log('Player.enterFullScreen()');
};

// Run on exiting fullscreen.
PlayerManager.prototype.exitFullscreen_ = function() {
  console.log('Player.exitFullScreen()');
};

PlayerManager.prototype.onViewerChanged_ = function() {
  console.log('Player.onViewerChanged');
};

  // Preload additional non-Button Player icons, as needed.
PlayerManager.prototype.loadIcons_ = function() {
  this.ICONS = {};
};

module.exports = PlayerManager;
