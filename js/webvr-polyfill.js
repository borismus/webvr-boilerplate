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

function WebVRPolyfill() {
  // Feature detect for existing WebVR API.
  if (navigator.getVRDevices) {
    return;
  }

  // Check if we are a device that can be polyfilled.
  if (!this.isCompatibleDevice()) {
    return;
  }

  // Initialize our virtual VR devices.
  this.devices = [new HMDVRDevice(), new PositionSensorVRDevice()];

  // Provide navigator.getVRDevices.
  navigator.getVRDevices = this.getVRDevices.bind(this);

  // Provide the HMDVRDevice and PositionSensorVRDevice objects.
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
 * Determine if a device is Cardboard-compatible.
 */
WebVRPolyfill.prototype.isCompatibleDevice = function() {
  // For now, support all iOS and Android devices.
  return /Android/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent);;
};

/**
 * The base class for all VR devices.
 */
function VRDevice() {
  this.hardwareUnitId = 'cardboard';
}

/**
 * The HMD itself, providing rendering parameters.
 */
function HMDVRDevice() {
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
HMDVRDevice.prototype = new VRDevice();

HMDVRDevice.prototype.getRecommendedEyeFieldOfView = function(whichEye) {
  return this.recommendedFOV;
};

HMDVRDevice.prototype.getEyeTranslation = function(whichEye) {
  if (whichEye == 'left') {
    return this.eyeTranslationLeft;
  }
  if (whichEye == 'right') {
    return this.eyeTranslationRight;
  }
};


/**
 * The positional sensor, implemented using web Device* APIs.
 */
function PositionSensorVRDevice() {
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
}
PositionSensorVRDevice.prototype = new VRDevice();

/**
 * Returns {orientation: {x,y,z,w}, position: null}.
 * Position is not supported since we can't do 6DOF.
 */
PositionSensorVRDevice.prototype.getState = function() {
  return {
    orientation: this.getOrientation(),
    position: null
  }
};

PositionSensorVRDevice.prototype.onDeviceOrientationChange =
    function(deviceOrientation) {
  this.deviceOrientation = deviceOrientation;
};

PositionSensorVRDevice.prototype.onScreenOrientationChange =
    function(screenOrientation) {
  this.screenOrientation = window.orientation;
};

PositionSensorVRDevice.prototype.getOrientation = function() {
  if (this.deviceOrientation == null) {
    return null;
  }
  // Rotation around the z-axis.
  var alpha = THREE.Math.degToRad(this.deviceOrientation.alpha);
  // Front-to-back (in portrait) rotation.
  var beta = THREE.Math.degToRad(this.deviceOrientation.beta);
  // Left to right (in portrait) rotation.
  var gamma = THREE.Math.degToRad(this.deviceOrientation.gamma);
  var orient = THREE.Math.degToRad(this.screenOrientation);

  // Use three.js to convert to quaternion. Lifted from
  // https://github.com/richtr/threeVR/blob/master/js/DeviceOrientationController.js
  this.deviceEuler.set(beta, alpha, - gamma, 'YXZ');
  this.finalQuaternion.setFromEuler(this.deviceEuler);
  this.minusHalfAngle = -orient / 2;
  this.screenTransform.set(0, Math.sin(this.minusHalfAngle), 0, Math.cos(this.minusHalfAngle));
  this.finalQuaternion.multiply(this.screenTransform);
  this.finalQuaternion.multiply(this.worldTransform);

  return this.finalQuaternion;
};


new WebVRPolyfill();

})();
