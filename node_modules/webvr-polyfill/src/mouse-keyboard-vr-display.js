/*
 * Copyright 2016 Google Inc. All Rights Reserved.
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

var VRDisplay = require('./base.js').VRDisplay;
var MathUtil = require('./math-util.js');
var Util = require('./util.js');

// How much to rotate per key stroke.
var KEY_SPEED = 0.15;
var KEY_ANIMATION_DURATION = 80;

// How much to rotate for mouse events.
var MOUSE_SPEED_X = 0.5;
var MOUSE_SPEED_Y = 0.3;

/**
 * VRDisplay based on mouse and keyboard input. Designed for desktops/laptops
 * where orientation events aren't supported. Cannot present.
 */
function MouseKeyboardVRDisplay() {
  this.displayName = 'Mouse and Keyboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;

  // Attach to mouse and keyboard events.
  window.addEventListener('keydown', this.onKeyDown_.bind(this));
  window.addEventListener('mousemove', this.onMouseMove_.bind(this));
  window.addEventListener('mousedown', this.onMouseDown_.bind(this));
  window.addEventListener('mouseup', this.onMouseUp_.bind(this));

  // "Private" members.
  this.phi_ = 0;
  this.theta_ = 0;

  // Variables for keyboard-based rotation animation.
  this.targetAngle_ = null;
  this.angleAnimation_ = null;

  // State variables for calculations.
  this.orientation_ = new MathUtil.Quaternion();

  // Variables for mouse-based rotation.
  this.rotateStart_ = new MathUtil.Vector2();
  this.rotateEnd_ = new MathUtil.Vector2();
  this.rotateDelta_ = new MathUtil.Vector2();
  this.isDragging_ = false;

  this.orientationOut_ = new Float32Array(4);
}
MouseKeyboardVRDisplay.prototype = new VRDisplay();

MouseKeyboardVRDisplay.prototype.getImmediatePose = function() {
  this.orientation_.setFromEulerYXZ(this.phi_, this.theta_, 0);

  this.orientationOut_[0] = this.orientation_.x;
  this.orientationOut_[1] = this.orientation_.y;
  this.orientationOut_[2] = this.orientation_.z;
  this.orientationOut_[3] = this.orientation_.w;

  return {
    position: null,
    orientation: this.orientationOut_,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

MouseKeyboardVRDisplay.prototype.onKeyDown_ = function(e) {
  // Track WASD and arrow keys.
  if (e.keyCode == 38) { // Up key.
    this.animatePhi_(this.phi_ + KEY_SPEED);
  } else if (e.keyCode == 39) { // Right key.
    this.animateTheta_(this.theta_ - KEY_SPEED);
  } else if (e.keyCode == 40) { // Down key.
    this.animatePhi_(this.phi_ - KEY_SPEED);
  } else if (e.keyCode == 37) { // Left key.
    this.animateTheta_(this.theta_ + KEY_SPEED);
  }
};

MouseKeyboardVRDisplay.prototype.animateTheta_ = function(targetAngle) {
  this.animateKeyTransitions_('theta_', targetAngle);
};

MouseKeyboardVRDisplay.prototype.animatePhi_ = function(targetAngle) {
  // Prevent looking too far up or down.
  targetAngle = Util.clamp(targetAngle, -Math.PI/2, Math.PI/2);
  this.animateKeyTransitions_('phi_', targetAngle);
};

/**
 * Start an animation to transition an angle from one value to another.
 */
MouseKeyboardVRDisplay.prototype.animateKeyTransitions_ = function(angleName, targetAngle) {
  // If an animation is currently running, cancel it.
  if (this.angleAnimation_) {
    cancelAnimationFrame(this.angleAnimation_);
  }
  var startAngle = this[angleName];
  var startTime = new Date();
  // Set up an interval timer to perform the animation.
  this.angleAnimation_ = requestAnimationFrame(function animate() {
    // Once we're finished the animation, we're done.
    var elapsed = new Date() - startTime;
    if (elapsed >= KEY_ANIMATION_DURATION) {
      this[angleName] = targetAngle;
      cancelAnimationFrame(this.angleAnimation_);
      return;
    }
    // loop with requestAnimationFrame
    this.angleAnimation_ = requestAnimationFrame(animate.bind(this))
    // Linearly interpolate the angle some amount.
    var percent = elapsed / KEY_ANIMATION_DURATION;
    this[angleName] = startAngle + (targetAngle - startAngle) * percent;
  }.bind(this));
};

MouseKeyboardVRDisplay.prototype.onMouseDown_ = function(e) {
  this.rotateStart_.set(e.clientX, e.clientY);
  this.isDragging_ = true;
};

// Very similar to https://gist.github.com/mrflix/8351020
MouseKeyboardVRDisplay.prototype.onMouseMove_ = function(e) {
  if (!this.isDragging_ && !this.isPointerLocked_()) {
    return;
  }
  // Support pointer lock API.
  if (this.isPointerLocked_()) {
    var movementX = e.movementX || e.mozMovementX || 0;
    var movementY = e.movementY || e.mozMovementY || 0;
    this.rotateEnd_.set(this.rotateStart_.x - movementX, this.rotateStart_.y - movementY);
  } else {
    this.rotateEnd_.set(e.clientX, e.clientY);
  }
  // Calculate how much we moved in mouse space.
  this.rotateDelta_.subVectors(this.rotateEnd_, this.rotateStart_);
  this.rotateStart_.copy(this.rotateEnd_);

  // Keep track of the cumulative euler angles.
  this.phi_ += 2 * Math.PI * this.rotateDelta_.y / screen.height * MOUSE_SPEED_Y;
  this.theta_ += 2 * Math.PI * this.rotateDelta_.x / screen.width * MOUSE_SPEED_X;

  // Prevent looking too far up or down.
  this.phi_ = Util.clamp(this.phi_, -Math.PI/2, Math.PI/2);
};

MouseKeyboardVRDisplay.prototype.onMouseUp_ = function(e) {
  this.isDragging_ = false;
};

MouseKeyboardVRDisplay.prototype.isPointerLocked_ = function() {
  var el = document.pointerLockElement || document.mozPointerLockElement ||
      document.webkitPointerLockElement;
  return el !== undefined;
};

MouseKeyboardVRDisplay.prototype.resetPose = function() {
  this.phi_ = 0;
  this.theta_ = 0;
};

module.exports = MouseKeyboardVRDisplay;
