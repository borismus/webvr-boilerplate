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
 *
 * Note: Renderer must have a canvas element to use.
 */
function PlayerManager(renderer, params) {

  this.playerClasses = {
    player: '-player',   //player suffix
    caption: '-caption', //<figcaption> suffix
    canvas: '-canvas',   //canvas suffix
  };

  /*
   * Used if the Player canvas has a fixed ratio of width and height.
   * 1. <canvas width="100" height="100">
   * 2. <style>
   *    .vr-container {
   *      position: relative; padding-bottom: 56.25%;
   *      padding-top: 30px;height: 0;overflow: hidden;
   *      }
   *    .vr-container iframe {
   *      position: absolute; top: 0; left: 0;
   *      width: 100%; height: 100%;
   *      }
   *    </style>
   */
  this.aspect = 0;

  // Flag for Player running alone in a browser window.
  this.fullWin = false;

  // Warning when HTML5 canvas not supported.
  this.canvasWarn = 'Your browser does not support HTML5 Canvas. You need to upgrade to view this content.';
  this.captionDefault = 'WebVR Boilerplate Player Scene';

  this.loadIcons_();

  // Get a local reference to the <canvas>.
  this.canvas = renderer.domElement;

  // Save a local reference to params.
  this.params = params;

  // Assign IDs and classes to the Player elements.
  this.uid = params.uid + this.playerClasses.player;

  // Initialize the Player container.
  this.initFigure();

  // Initialize internal Player elements.
  this.initCaption();

  // Initialize the Buttons and their container.
  this.initButtons();

  /**
   * Use the computed (not preset) size of the Player to set an aspect ratio.
   * If the Player is in the DOM, we maintain this aspect ratio statically, and don't
   * recalculate it. Otherwise, if the Player fills the window (its parent is document.body)
   * we recalculate the aspect ratio via window.innerWidth and window.innerHeight.
   */
  this.getCurrentAspect();

  // Attach a Button panel to the Player, and save an object reference.
  //window.player = this;
};

// Set player to emit events.
PlayerManager.prototype = new Emitter();

// Use the <figure> element for semantic wrapping.
PlayerManager.prototype.initFigure = function() {
  var c = this.canvas;

  // If our canvas isn't wrapped in a Player <figure> container, add it.
  if (c.parentNode.tagName != 'FIGURE') {
    this.dom = document.createElement('figure');
    c.parentNode.appendChild(this.dom);
    this.dom.appendChild(c);
  }
  else {
    // Supplied <canvas> is already inside a <figure> tag.
    this.dom = c.parentNode;
  }

  var d = this.dom;

  // Set the Player id and standard class.
  if (!d.id) {
      d.id = this.uid;
  }
  Util.addClass(d, this.params.prefix + this.playerClasses.player);

  // Set the Player canvas id and standard class
  if (!c.id) {
    c.id = this.uid + this.playerClasses.canvas;
  }
  Util.addClass(c, this.params.prefix + this.playerClasses.player + this.playerClasses.canvas);

  // Set the ARIA attribute for figure caption.
  d.setAttribute('aria-describedby', this.uid + this.playerClasses.caption);

  // Set the Player default CSS styles. By default, its width and height are
  // controlled by CSS stylesheets.
  var ds = d.style;
  var cs = c.style;

  // If our parent is document.body, add styles causing the Player to fill the window.
  if (this.isFullWin()) {
    ds.width = '100%';
    ds.height = '100%';
  }

  /**
   * If there are no CSS styles applied to the Player, use the <canvas> width and height.
   * This will default to 300 x 150 on all browsers if the width and height aren't
   * explcitly set in markup.
   *
   * The <canvas> size will initially be set up when we set up the THREE renderer, which
   * will override the width and height attributes in the canvas.
   */
  if(!this.getCurrentWidth() || !this.getCurrentHeight()) {
    ds.width = c.width + 'px';
    ds.height = c.height + 'px';
  }

  // Positioning of Buttons.
  ds.position = 'relative';
  ds.margin = '0px';
  ds.padding = '0px';

  // Set canvas to always fill the Player (all controls and captions overlay canvas).
  cs.width = '100%';
  cs.height = '100%';
  cs.margin = '0px';
  cs.padding = '0px';
};

// TODO: pure THREE.js HUD.
// http://www.evermade.fi/pure-three-js-hud/
// http://www.sitepoint.com/bringing-vr-to-web-google-cardboard-three-js/
// https://stemkoski.github.io/Three.js/#text3D
PlayerManager.prototype.initCaption = function() {
  var figCaption = Util.getChildrenByTagName(this.dom, 'figcaption');
  if (figCaption && figCaption[0]) {
    figCaption = figCaption[0];
  } else {
    figCaption = document.createElement('figcaption');
    this.dom.appendChild(figCaption);
  }

  // Link caption to its parent figure (required by ARIA).
  figCaption.id = this.dom.getAttribute('aria-describedby');

  // Set the standard class.
  Util.addClass(figCaption, this.params.prefix + this.playerClasses.player + this.playerClasses.caption);

  // Set the default styles.
  figCaption.style.position = 'absolute';
  figCaption.style.width = '100%';
  figCaption.style.bottom = '48px';
  figCaption.style.textAlign = 'center';

  // Add caption text, if supplied, otherwise default.
  if (this.params.caption) {
    figCaption.textContent = this.params.caption;
  } else {
    if (figCaption.textContent == '') {
      figCaption.textContent = this.captionDefault;
    }
  }
};

// Create buttons using the ButtonManager.
PlayerManager.prototype.initButtons = function() {
  this.buttons = new ButtonManager(this.params);
  this.dom.appendChild(this.buttons.dom);
};

// Test if Player is alone, or embedded in layout DOM.
PlayerManager.prototype.isFullWin = function() {
  return(this.dom.parentNode == document.body);
};

// Get the computed width of the Player.
PlayerManager.prototype.getCurrentWidth = function() {
  return parseFloat(getComputedStyle(this.dom).getPropertyValue('width'));
};

// Get the computed height of the Player.
PlayerManager.prototype.getCurrentHeight = function() {
  return parseFloat(getComputedStyle(this.dom).getPropertyValue('height'));
}

// Get the dynamically-computed aspect ratio of the Player based on CSS.
PlayerManager.prototype.getCurrentAspect = function() {
  var w = this.getCurrentWidth();
  var h = this.getCurrentHeight();
  if(w && h) {
    this.aspect = parseFloat(w / h); // Save it.
  } else {
    console.log('Warning: player does not have computed width and/or height yet.');
  }
};

/**
 * Get dynamically computed size and aspect ratio of the Player (allows
 * responsive CSS styling). If the Player is running standalone, it sizes
 * via window.innerWidth and window.innerHeight. If it is part of a DOM, it
 * sets width based on its CSS computed style, and sets height by using the
 * ORIGINAL aspect ratio used when the player is initialized.
 */
PlayerManager.prototype.getSize = function() {
  //TODO: might need to check for fixed-width canvas
  if (this.isFullWin()) {
    console.log("full window")
    return {
      aspect: window.innerWidth / window.innerHeight, //dynamic aspect inf full window.
      width: window.innerWidth,
      height: window.innerHeight
    };
  } else if (Util.isFullScreen()) {
    console.log("full screen")
    return {
      aspect: window.innerWidth / window.innerHeight, //dynamic aspect in fullscreen.
      width: window.innerWidth,
      height: window.innerHeight
    };
  } else {
    console.log("partial screen")
    var width = this.getCurrentWidth();
    return {
      aspect: this.aspect, // Static, controlled by width.
      width: width,
      height: width / this.aspect // Static, controlled by width.
    };
  }
};

// Set the Player size to fixed proportions.
PlayerManager.prototype.setSize = function(width, height) {
  // Canvas property.
  //this.canvas.width = width;
  //this.canvas.height = height;
  // CSS styles (the most important).
  this.dom.style.width = width + 'px';
  this.dom.style.height = height + 'px';
}

// Initialization event received from WebVRManager.
PlayerManager.prototype.onInit_ = function() {
  console.log('Player' + this.uid + ':init event received from manager');
};

// Mode change event received from WebVRManager.
PlayerManager.prototype.onModeChange_ = function(oldMode, newMode) {
  //console.log('Player' + this.uid + ':modechange from manager, old:' + oldMode + ' new:' + newMode);
};

// Resized event received from WebVRManager.
PlayerManager.prototype.onResized_ = function(width, height) {
  //console.log('Player' + this.uid + ':resize event from manager');
};

// Callback for entering fullscreen.
PlayerManager.prototype.enterFullscreen_ = function() {
  // Temporarily override any stylesheet-based CSS styles. Needed for webkit.
  this.dom.style.width = '100%';
  this.dom.style.height = '100%';
  //TODO: swap position of back button
  //console.log('Player' + this.uid + ':enter fullscreen from manager');
};

// Callback for exiting fullscreen.
PlayerManager.prototype.exitFullscreen_ = function() {
  // Restore CSS styles (remove overriding local styles).
  this.dom.style.width = '';
  this.dom.style.height = '';
  //console.log('Player' + this.uid + ':exit fullscreen from manager');
};

// Viewer changed.
PlayerManager.prototype.onViewerChanged_ = function() {
  //console.log('Player' + this.uid + '.onViewerChanged');
};

// Preload additional non-Button Player icons, as needed.
PlayerManager.prototype.loadIcons_ = function() {
  this.ICONS = {};
};

module.exports = PlayerManager;
