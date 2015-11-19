// Amplified constants since they are from native code, which updates at 200 Hz.
// Here we get updates at 60 Hz.
const GRAVITY_ESTIMATION = 0.4;
const BIAS_ESTIMATION = 0.2;

MIN_TIMESTEP = 0.001;
MAX_TIMESTEP = 1;

function MahonyOrientation() {
  this.out = new THREE.Vector3(0, 0, -1);
  this.accelerometer = new THREE.Vector3();
  this.gyroscope = new THREE.Vector3();

  this.screenOrientation = window.orientation;

  window.addEventListener('devicemotion', this.onDeviceMotionChange_.bind(this));
  window.addEventListener('orientationchange', this.onScreenOrientationChange_.bind(this));

  this.orientationFilter = new OrientationFilter(GRAVITY_ESTIMATION, BIAS_ESTIMATION);

  this.finalQuaternion = new THREE.Quaternion();

  this.lastSensorTimestampS = null;
}

MahonyOrientation.prototype.onDeviceMotionChange_ = function(deviceMotion) {
  var accGravity = deviceMotion.accelerationIncludingGravity;
  var rotRate = deviceMotion.rotationRate;
  var timestampS = deviceMotion.timeStamp / 1000;

  if (!this.lastTimestampS) {
    this.orientationFilter.addMagMeasurement(new THREE.Vector3(0, 1, 0), timestampS); 
  }

  var deltaS = timestampS - this.lastTimestampS;
  if (deltaS <= MIN_TIMESTEP || deltaS > MAX_TIMESTEP) {
    console.warn('Invalid timestamps detected. Time step between successive ' +
                 'gyroscope sensor samples is very small or not monotonic');
    this.lastTimestampS = timestampS;
    return;
  }

  // Convert deviceMotion to the vectors that orientation filter expects.
  this.accelerometer.set(accGravity.x, accGravity.y, accGravity.z);
  //this.accelerometer.set(0, 0, 9.8);
  // For debugging, try setting a zeroed gyroscope.
  // TODO: I set this to be inverted, seems to work much better.
  this.gyroscope.set(-rotRate.alpha, -rotRate.beta, -rotRate.gamma);
  //this.gyroscope.set(0, 0, 0);

  this.orientationFilter.addAccelMeasurement(this.accelerometer, timestampS);
  this.orientationFilter.addGyroMeasurement(this.gyroscope, timestampS);

  this.lastTimestampS = timestampS;
};

MahonyOrientation.prototype.onScreenOrientationChange_ =
    function(screenOrientation) {
  this.screenOrientation = window.orientation;
};

MahonyOrientation.prototype.getOrientation = function() {
  var filterQuaternion = this.orientationFilter.getOrientation();
  this.finalQuaternion.copy(filterQuaternion);
  this.finalQuaternion.x = filterQuaternion.y;
  this.finalQuaternion.y = filterQuaternion.z;
  this.finalQuaternion.z = filterQuaternion.x;

  this.q1 = new THREE.Quaternion();
  this.q1.setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, -1, 0));
  this.finalQuaternion.multiply(this.q1);
  //this.finalQuaternion.multiply(this.q2);

  this.out.set(0, 0, -1);
  this.out.applyQuaternion(this.finalQuaternion);
  return this.out;
};
