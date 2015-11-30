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
 * <figure> element.
 */
function PlayerManager(canvas, id, caption) {
  this.loadIcons_();

  //if our canvas isn't wrapped in a player div, add it
  if(canvas.parentNode.className != Util.containerClasses.player) {
    var player = document.createElement('figure');

    player.className = Util.containerClasses.player;
    canvas.parentNode.insertBefore(player, canvas);
  } else {
    player = canvas.parentNode;
  }
  //set the id, if present
  if(id) {
    player.id = id;
  }
  else {
    id = ''; 
  }
  //set the message if web browser doesn't support canvas
  if(canvas.textContent == '') {
    canvas.textContent = 'Your browser does not support HTML5 Canvas. You need to upgrade to view this content.';
  }
  //set ARIA describedby attribute
  //https://dev.opera.com/articles/accessible-html5-video-with-javascripted-captions/
  canvas.setAttribute('aria-describedby', id + ' description');
  //add buttons
  this.controls = new ButtonManager(player);

  //add figure caption, with id matching ARIA describedby
  if(caption) {
    var c = document.createElement('figcaption');
    c.id = id + ' description';
    c.textContent = caption;
    player.appendChild(c);
  }

  this.isVisible = true;

}

PlayerManager.prototype.loadIcons_ = function() {
  // Preload some hard-coded SVG.
  this.ICONS = {};
};


module.exports = PlayerManager;
