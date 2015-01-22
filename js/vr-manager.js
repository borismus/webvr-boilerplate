/**
 * Helper for getting in and out of VR mode.
 *
 * 1. Detects whether or not VR mode is possible by feature detecting for
 * WebVR (or polyfill).
 *
 * 2. If WebVR is available, provides means of entering VR mode:
 * - Double click
 * - Double tap
 * - Click "Enter VR" button
 *
 * 3. If WebVR is not available, shows how to get a VR compatible browser.
 * - Oculus (FF Nightly, Chrome+VR), Cardboard (Chrome, Safari).
 *
 * 4. Provides best practices while in VR mode.
 * - Full screen
 * - Orientation lock
 * - Wake lock
 *
 * 5. To leave VR mode, you exit full-screen mode (desktop: escape, mobile:
 * drag from top).
 */
function VRManager(effect) {
  // Save the THREE.js effect for later.
  this.effect = effect;
  // Create the button regardless.
  this.vrButton = this.createVRButton();

  // Check if the browser is compatible with WebVR.
  if (this.isWebVRCompatible()) {
    this.setClass('compatible');
    // If it is, activate VR mode.
    this.activateVR();
  } else {
    this.setClass('not-compatible');
  }
}

/**
 * True if this browser supports WebVR.
 */
VRManager.prototype.isWebVRCompatible = function() {
  return 'getVRDevices' in navigator ||
      'mozGetVRDevices' in navigator ||
      'webkitGetVRDevices' in navigator;
};

VRManager.prototype.isVRMode = function() {
  return !!(document.isFullScreen ||
      document.webkitIsFullScreen || document.mozFullScreen);
};

VRManager.prototype.createVRButton = function() {
  var button = document.createElement('button');
  button.id = 'vr';
  document.body.appendChild(button);
  return button;
};

VRManager.prototype.setClass = function(className) {
  this.vrButton.className = '';
  this.vrButton.classList.add(className);
};

/**
 * Makes it possible to go into VR mode.
 */
VRManager.prototype.activateVR = function() {
  // Make it possible to enter VR via double click.
  window.addEventListener('dblclick', this.enterVR.bind(this));
  // Or via double tap.
  window.addEventListener('touchend', this.onTouchEnd.bind(this));
  // Or via clicking on the VR button.
  this.vrButton.addEventListener('click', this.onButtonClick.bind(this));
  // Or by hitting the 'f' key.
  window.addEventListener('keydown', this.onKeyDown.bind(this));

  // Whenever we enter fullscreen, this is tantamount to entering VR mode.
  document.addEventListener('webkitfullscreenchange',
      this.onFullscreenChange.bind(this));
  document.addEventListener('mozfullscreenchange',
      this.onFullscreenChange.bind(this));
};

VRManager.prototype.onTouchEnd = function(e) {
  // TODO: Implement better double tap that takes distance into account.
  // https://github.com/mckamey/doubleTap.js/blob/master/doubleTap.js

  var now = new Date();
  if (now - this.lastTouchTime < 300) {
    this.enterVR();
  }
  this.lastTouchTime = now;
};

VRManager.prototype.onButtonClick = function() {
  this.toggleVRMode();
};

VRManager.prototype.onKeyDown = function(e) {
  if (e.keyCode == 70) { // 'f'
    this.toggleVRMode();
  }
};

VRManager.prototype.toggleVRMode = function() {
  if (!this.isVRMode()) {
    // Enter VR mode.
    this.enterVR();
  } else {
    this.exitVR();
  }
};

VRManager.prototype.onFullscreenChange = function(e) {
  var isVRMode = this.isVRMode();
  console.log('isVRMode', isVRMode);
  if (isVRMode) {
    // Orientation lock.
    screen.orientation.lock('landscape');
    // Set style on button.
    this.setClass('in-vr');
  } else {
    screen.orientation.unlock();
    this.setClass('compatible');
  }

};

VRManager.prototype.enterVR = function() {
  this.effect.setFullScreen(true);
};

VRManager.prototype.exitVR = function() {
  this.effect.setFullScreen(false);
};
