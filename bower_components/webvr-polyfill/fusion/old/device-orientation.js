/**
 * A 'deviceorientation' event-based orientation provider.
 */
function DeviceOrientation() {
  window.addEventListener('deviceorientation', this.onDeviceOrientationChange.bind(this));
  window.addEventListener('orientationchange', this.onScreenOrientationChange.bind(this));

  this.screenOrientation = window.orientation;
  this.deviceOrientation = {};

  // Helper objects for calculating orientation.
  this.finalQuaternion = new THREE.Quaternion();
  this.deviceEuler = new THREE.Euler();
  this.screenTransform = new THREE.Quaternion();
  // -PI/2 around the x-axis.
  this.worldTransform = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

  this.output = new THREE.Vector3();
}

DeviceOrientation.prototype.getOrientation = function() {
  this.getQuaternion();

  this.output.set(0, 0, -1);
  this.output.applyQuaternion(this.finalQuaternion);

  return this.output;
};

DeviceOrientation.prototype.getQuaternion = function() {
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

DeviceOrientation.prototype.onDeviceOrientationChange =
    function(deviceOrientation) {
  this.deviceOrientation = deviceOrientation;
};

DeviceOrientation.prototype.onScreenOrientationChange =
    function(screenOrientation) {
  this.screenOrientation = window.orientation;
};

