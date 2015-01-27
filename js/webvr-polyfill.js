/**
 * A polyfill for mobile WebVR (targeting Cardboard and similar devices)
 * using DeviceOrientation events.
 *
 * - If WebVR is already available, do nothing.
 * - If this is a mobile device capable of gyro tracking, inject this
 *   polyfill.
 * - Provide `function getVRDevices(vrCallback)`, which returns a
 *   HMDVRDevice and corresponding PositionSensorVRDevice.
 * - HMDVRDevice should provide the right geometry to render well on
 *   Cardboard via getRecommendedEyeFieldOfView and getEyeTranslation.
 * - PositionSensorVRDevice should provide a getState().orientation
 *   quaternion based on Device* events.
 *
 * Depends on three.js (for quaternions only). Dependency can be replaced
 * with quite a bit more code:
 * https://dev.opera.com/articles/w3c-device-orientation-usage/#quaternions
 *
 * Author: Boris Smus <boris@smus.com>
 */

(function() {

// Constants from vrtoolkit: https://github.com/googlesamples/cardboard-java.
var INTERPUPILLARY_DISTANCE = 0.06;
var DEFAULT_MAX_FOV_LEFT_RIGHT = 40;
var DEFAULT_MAX_FOV_BOTTOM = 40;
var DEFAULT_MAX_FOV_TOP = 40;

// How much to rotate per key stroke.
var KEY_SPEED = 0.15;
var KEY_ANIMATION_DURATION = 80;

// How much to rotate for mouse events.
var MOUSE_SPEED_X = 0.5;
var MOUSE_SPEED_Y = 0.3;

function WebVRPolyfill() {
  this.devices = [];

  // Feature detect for existing WebVR API.
  if (navigator.getVRDevices) {
    return;
  }

  // Initialize our virtual VR devices.
  if (this.isCardboardCompatible()) {
    this.devices.push(new CardboardHMDVRDevice());
  }

  // Polyfill using the right position sensor.
  if (this.isMobile()) {
    this.devices.push(new GyroPositionSensorVRDevice());
  } else {
    this.devices.push(new MouseKeyboardPositionSensorVRDevice());
  }

  // Provide navigator.getVRDevices.
  navigator.getVRDevices = this.getVRDevices.bind(this);

  // Provide the CardboardHMDVRDevice and PositionSensorVRDevice objects.
  window.HMDVRDevice = HMDVRDevice;
  window.PositionSensorVRDevice = PositionSensorVRDevice;
}

WebVRPolyfill.prototype.getVRDevices = function() {
  var devices = this.devices;
  return new Promise(function(resolve, reject) {
    try {
      resolve(devices);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Determine if a device is mobile.
 */
WebVRPolyfill.prototype.isMobile = function() {
  return /Android/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent);;
};

WebVRPolyfill.prototype.isCardboardCompatible = function() {
  // For now, support all iOS and Android devices.
  return this.isMobile();
};

/**
 * The base class for all VR devices.
 */
function VRDevice() {
  this.hardwareUnitId = 'polyfill';
}

/**
 * The base class for all VR HMD devices.
 */
function HMDVRDevice() {
}
HMDVRDevice.prototype = new VRDevice();

/**
 * The base class for all VR position sensor devices.
 */
function PositionSensorVRDevice() {
}
PositionSensorVRDevice.prototype = new VRDevice();


/**
 * The HMD itself, providing rendering parameters.
 */
function CardboardHMDVRDevice() {
  // Set display constants.
  this.eyeTranslationLeft = {
    x: INTERPUPILLARY_DISTANCE * -0.5,
    y: 0,
    z: 0
  };
  this.eyeTranslationRight = {
    x: INTERPUPILLARY_DISTANCE * 0.5,
    y: 0,
    z: 0
  };

  // From com/google/vrtoolkit/cardboard/FieldOfView.java.
  this.recommendedFOV = {
    upDegrees: DEFAULT_MAX_FOV_TOP,
    downDegrees: DEFAULT_MAX_FOV_BOTTOM,
    leftDegrees: DEFAULT_MAX_FOV_LEFT_RIGHT,
    rightDegrees: DEFAULT_MAX_FOV_LEFT_RIGHT
  };
}
CardboardHMDVRDevice.prototype = new HMDVRDevice();

CardboardHMDVRDevice.prototype.getRecommendedEyeFieldOfView = function(whichEye) {
  return this.recommendedFOV;
};

CardboardHMDVRDevice.prototype.getEyeTranslation = function(whichEye) {
  if (whichEye == 'left') {
    return this.eyeTranslationLeft;
  }
  if (whichEye == 'right') {
    return this.eyeTranslationRight;
  }
};


/**
 * The positional sensor, implemented using web DeviceOrientation APIs.
 */
function GyroPositionSensorVRDevice() {
  // Subscribe to deviceorientation events.
  window.addEventListener('deviceorientation', this.onDeviceOrientationChange.bind(this));
  window.addEventListener('orientationchange', this.onScreenOrientationChange.bind(this));
  this.deviceOrientation = null;
  this.screenOrientation = window.orientation;

  // Helper objects for calculating orientation.
  this.finalQuaternion = new THREE.Quaternion();
  this.deviceEuler = new THREE.Euler();
  this.screenTransform = new THREE.Quaternion();
  // -PI/2 around the x-axis.
  this.worldTransform = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

  // TODO: Try with DeviceMotionEvent, remove it if it fails.
  // Is devicemotion any better?
  window.addEventListener('devicemotion', this.onDeviceMotionChange.bind(this));
  this.totalRotation = {alpha: 0, beta: 0, gamma: 0};
}
GyroPositionSensorVRDevice.prototype = new PositionSensorVRDevice();

/**
 * Returns {orientation: {x,y,z,w}, position: null}.
 * Position is not supported since we can't do 6DOF.
 */
GyroPositionSensorVRDevice.prototype.getState = function() {
  return {
    orientation: this.getOrientation(),
    position: null
  }
};

GyroPositionSensorVRDevice.prototype.onDeviceOrientationChange =
    function(deviceOrientation) {
  this.deviceOrientation = deviceOrientation;
};

GyroPositionSensorVRDevice.prototype.onScreenOrientationChange =
    function(screenOrientation) {
  this.screenOrientation = window.orientation;
};

GyroPositionSensorVRDevice.prototype.onDeviceMotionChange =
    function(deviceMotion) {
  var rotationRate = deviceMotion.rotationRate;
  // Rotation around the y-axis.
  this.totalRotation.alpha += rotationRate.alpha;
  // Rotation around the z-axis.
  this.totalRotation.beta += rotationRate.beta;
  // Rotation around the x-axis.
  this.totalRotation.gamma += rotationRate.gamma;
};

GyroPositionSensorVRDevice.prototype.getOrientation = function() {
  if (this.deviceOrientation == null) {
    return null;
  }
  /*
  // Rotation around the z-axis.
  var alpha = THREE.Math.degToRad(this.totalRotation.alpha);
  // Front-to-back (in portrait) rotation (x-axis).
  var beta = THREE.Math.degToRad(-this.totalRotation.gamma);
  // Left to right (in portrait) rotation (y-axis).
  var gamma = THREE.Math.degToRad(this.totalRotation.beta);
  */

  // Rotation around the z-axis.
  var alpha = THREE.Math.degToRad(this.deviceOrientation.alpha);
  // Front-to-back (in portrait) rotation (x-axis).
  var beta = THREE.Math.degToRad(this.deviceOrientation.beta);
  // Left to right (in portrait) rotation (y-axis).
  var gamma = THREE.Math.degToRad(this.deviceOrientation.gamma);
  var orient = THREE.Math.degToRad(this.screenOrientation);

  // Use three.js to convert to quaternion. Lifted from
  // https://github.com/richtr/threeVR/blob/master/js/DeviceOrientationController.js
  this.deviceEuler.set(beta, alpha, -gamma, 'YXZ');
  this.finalQuaternion.setFromEuler(this.deviceEuler);
  this.minusHalfAngle = -orient / 2;
  this.screenTransform.set(0, Math.sin(this.minusHalfAngle), 0, Math.cos(this.minusHalfAngle));
  this.finalQuaternion.multiply(this.screenTransform);
  this.finalQuaternion.multiply(this.worldTransform);

  return this.finalQuaternion;
};


/**
 * Another virtual position sensor, this time implemented using keyboard and
 * mouse APIs. This is designed as for desktops/laptops where no Device*
 * events work.
 */
function MouseKeyboardPositionSensorVRDevice() {
  // Attach to mouse and keyboard events.
  window.addEventListener('keydown', this.onKeyDown_.bind(this));
  window.addEventListener('mousemove', this.onMouseMove_.bind(this));
  window.addEventListener('mousedown', this.onMouseDown_.bind(this));
  window.addEventListener('mouseup', this.onMouseUp_.bind(this));

  this.phi = 0;
  this.theta = 0;

  // Variables for keyboard-based rotation animation.
  this.targetAngle = null;

  // State variables for calculations.
  this.euler = new THREE.Euler();
  this.orientation = new THREE.Quaternion();

  // Variables for mouse-based rotation.
  this.rotateStart = new THREE.Vector2();
  this.rotateEnd = new THREE.Vector2();
  this.rotateDelta = new THREE.Vector2();
}
MouseKeyboardPositionSensorVRDevice.prototype = new PositionSensorVRDevice();

/**
 * Returns {orientation: {x,y,z,w}, position: null}.
 * Position is not supported for parity with other PositionSensors.
 */
MouseKeyboardPositionSensorVRDevice.prototype.getState = function() {
  this.euler.set(this.phi, this.theta, 0, 'YXZ');
  this.orientation.setFromEuler(this.euler);

  return {
    orientation: this.orientation,
    position: null
  }
};

MouseKeyboardPositionSensorVRDevice.prototype.onKeyDown_ = function(e) {
  // Track WASD and arrow keys.
  if (e.keyCode == 38 || e.keyCode == 87) { // W or Up key.
    this.animatePhi_(this.phi + KEY_SPEED);
  } else if (e.keyCode == 39 || e.keyCode == 68) { // D or Right key.
    this.animateTheta_(this.theta - KEY_SPEED);
  } else if (e.keyCode == 40 || e.keyCode == 83) { // S or Down key.
    this.animatePhi_(this.phi - KEY_SPEED);
  } else if (e.keyCode == 37 || e.keyCode == 65) { // A or Left key.
    this.animateTheta_(this.theta + KEY_SPEED);
  }
};

MouseKeyboardPositionSensorVRDevice.prototype.animateTheta_ = function(targetAngle) {
  this.animateKeyTransitions_('theta', targetAngle);
};

MouseKeyboardPositionSensorVRDevice.prototype.animatePhi_ = function(targetAngle) {
  this.animateKeyTransitions_('phi', targetAngle);
};

/**
 * Start an animation to transition an angle from one value to another.
 */
MouseKeyboardPositionSensorVRDevice.prototype.animateKeyTransitions_ = function(angleName, targetAngle) {
  // If an animation is currently running, cancel it.
  if (this.angleAnimation) {
    clearInterval(this.angleAnimation);
  }
  var startAngle = this[angleName];
  var startTime = new Date();
  // Set up an interval timer to perform the animation.
  this.angleAnimation = setInterval(function() {
    // Once we're finished the animation, we're done.
    var elapsed = new Date() - startTime;
    if (elapsed >= KEY_ANIMATION_DURATION) {
      this[angleName] = targetAngle;
      clearInterval(this.angleAnimation);
      return;
    }
    // Linearly interpolate the angle some amount.
    var percent = elapsed / KEY_ANIMATION_DURATION;
    this[angleName] = startAngle + (targetAngle - startAngle) * percent;
  }.bind(this), 1000/60);
};

MouseKeyboardPositionSensorVRDevice.prototype.onMouseDown_ = function(e) {
  this.rotateStart.set(e.clientX, e.clientY);
  this.isDragging = true;
};

// Very similar to https://gist.github.com/mrflix/8351020
MouseKeyboardPositionSensorVRDevice.prototype.onMouseMove_ = function(e) {
  if (!this.isDragging) {
    return;
  }
  this.rotateEnd.set(e.clientX, e.clientY);
  // Calculate how much we moved in mouse space.
  this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
  this.rotateStart.copy(this.rotateEnd);

  // Keep track of the cumulative euler angles.
  var element = document.body;
  this.phi += 2 * Math.PI * this.rotateDelta.y / element.clientHeight * MOUSE_SPEED_Y;
  this.theta += 2 * Math.PI * this.rotateDelta.x / element.clientWidth * MOUSE_SPEED_X;
};

MouseKeyboardPositionSensorVRDevice.prototype.onMouseUp_ = function(e) {
  this.isDragging = false;
};


new WebVRPolyfill();

})();
