/**
 * A JavaScript port of
 * depot/google3/third_party/tango/experimental/joel/orientation_filter_mahony/lib.
 */

// Minimum time step between sensor updates. This corresponds to 1000 Hz.
MIN_TIMESTEP_S = 0.001;

// Maximum time step between sensor updates. This corresponds to 1 Hz.
MAX_TIMESTEP_S = 1.00;

// Currently set to identity. Can change if we want to mix with mag.
ACCELERATION = 1;  

GRAVITY = 9.81;

EPSILON = 1e-5;

DEBUG = true;


// Helper method to validate the time steps of sensor timestamps.
function isTimestampDeltaValid(timestampDeltaS) {
  if (isNaN(timestampDeltaS)) {
    return false;
  }
  if (timestampDeltaS <= MIN_TIMESTEP_S) {
    return false;
  }
  if (timestampDeltaS > MAX_TIMESTEP_S) {
    return false;
  }
  return true;
}

/*
 * Returns the result of vec1 * vec2^T.
 * https://en.wikipedia.org/wiki/Outer_product
 *
 * @param {Vector3} vec1
 * @param {Vector3} vec2
 * @return {Matrix4} Matrix
 */
function outerProduct4(vec1, vec2) {
  var out = new THREE.Matrix4();
  // TODO: Is the identity surrounding it correct?
  out.set(vec1.x * vec2.x, vec1.x * vec2.y, vec1.x * vec2.z, 0,
          vec1.y * vec2.x, vec1.y * vec2.y, vec1.y * vec2.z, 0,
          vec1.z * vec2.x, vec1.z * vec2.y, vec1.z * vec2.z, 0,
          0,               0,               0,               1);
  return out;
}

/**
 * @param {Vector3} vector
 * @param {Vector3} planeNormal
 */
function projectToPlane(vector, planeNormal) {
  //return vector - plane_normal * vector.dot(plane_normal);
  var tmp = new THREE.Vector3();
  var out = new THREE.Vector3();
  tmp.copy(planeNormal);
  tmp.multiplyScalar(vector.dot(planeNormal))
  out.copy(vector);
  out.sub(tmp);
  return out;
}

/**
 * @return {Matrix4} The difference between the two matrices.
 */
function subtractMatrices(m1, m2) {
  var e1 = m1.elements;
  var e2 = m2.elements;
  var out = new THREE.Matrix4();
  var e3 = out.elements;
  for (var i = 0; i < e1.length; i++) {
    e3[i] = e1[i] - e2[i];
  }
  return out;
};

/**
 * An OrientationFilter for fusing accelerometer and gyroscope data from the
 * devicemotion API.
 * 
 * @param {Number} kProp controls the gravity estimation
 * feedback. A high value increases the influence of the gravity estimation on
 * the orientation.
 * @param {Number} kInt the bias estimation feedback. A high
 * value decreases the time to adopt to gyroscope bias but can result in a
 * tilting horizon.
 */
function OrientationFilter(kProp, kInt) {
  this.kProp = kProp;
  this.kInt = kInt;

  // Raw measurements.
  this.currentAccelMeasurement = new SensorSample();
  this.currentGyroMeasurement = new SensorSample();
  this.currentMagMeasurement = new SensorSample();
  this.previousGyroMeasurement = new SensorSample();


  this.isOrientationInitialized = false;

  // Corresponds to state_[0:4].
  this.currentQuaternion = new THREE.Quaternion();
  this.nextQuaternion = new THREE.Quaternion();

  // Corresponds to state_[4:7].
  this.currentGyroBias = new THREE.Vector3();
  this.nextGyroBias = new THREE.Vector3();

  this.quaternionIntegrator = new QuaternionIntegrator();
}

OrientationFilter.prototype.addAccelMeasurement = function(vector, timestampS) {
  this.currentAccelMeasurement.set(vector, timestampS);
};

OrientationFilter.prototype.addGyroMeasurement = function(vector, timestampS) {
  this.currentGyroMeasurement.set(vector, timestampS);

  var deltaT = timestampS - this.previousGyroMeasurement.timestampS;
  if (isTimestampDeltaValid(deltaT)) {
    this.run_();
  }
  
  this.previousGyroMeasurement.copy(this.currentGyroMeasurement);
};

OrientationFilter.prototype.addMagMeasurement = function(vector, timestampS) {
  this.currentMagMeasurement.set(vector, timestampS);
};

OrientationFilter.prototype.getOrientation = function() {
  return this.currentQuaternion;
};

OrientationFilter.prototype.run_ = function() {
  // Initialize the orientation filter.
  if (!this.isOrientationInitialized &&
      this.currentAccelMeasurement.timestampS > 0.0 &&
        this.currentMagMeasurement.timestampS > 0.0) {
    this.isOrientationInitialized = this.orientationFromAccelAndMag_();
  }

  // Only start to propagate once the orientation has already been initialized
  // by the accel / mag.
  if (this.isOrientationInitialized) {
    this.filterPropagate_();
  }
};

OrientationFilter.prototype.orientationFromAccelAndMag_ = function() {
  var L_x = new THREE.Vector3();
  var L_y = new THREE.Vector3();
  var L_z = new THREE.Vector3();
  var L_R_G = new THREE.Matrix4();

  // East-North-Up frame of reference:
  //   - Gravity vector lies along +z axis
  //   - Horizontal component of Mag vector lies along +y axis
  //   - x-axis points east
  L_z.copy(this.currentAccelMeasurement.sample);
  L_z.normalize();
  L_x.copy(L_z);
  L_x.multiplyScalar(-1);
  var tmp = new THREE.Vector3();
  tmp.copy(this.currentMagMeasurement.sample);
  tmp.normalize();
  L_x.cross(tmp);
  if (L_x.length() == 0.0) {
    return false;
  }
  L_x.normalize();
  L_y.crossVectors(L_z, L_x);
  if (L_y.length() == 0.0) {
    return false;
  }

  // Construct the L_R_G matrix using L_{x,y,z} as columns.
  // Note: THREE.js matrices accept arguments in row major format, but
  // matrix.elements is in column major format. This is super confusing.
  // TODO: Verify row major or column major.
  //L_R_G.set(
  //  L_x.x, L_y.x, L_z.x, 0,
  //  L_x.y, L_y.y, L_z.y, 0,
  //  L_x.z, L_y.z, L_z.z, 0,
  //  0,     0,     0,     1);
  L_R_G.makeBasis(L_x, L_y, L_z);

  // Compute and assign the quaternion of orientation from the resulting
  // rotation matrix.
  this.currentQuaternion.setFromRotationMatrix(L_R_G);

  return true;
};

OrientationFilter.prototype.filterPropagate_ = function() {
  deltaT = this.currentGyroMeasurement.timestampS -
      this.previousGyroMeasurement.timestampS;
  if (!isTimestampDeltaValid(deltaT)) {
    return;
  }

  // Bias compensate the gyro data. Since imu_measurement format is
  // [prev_x, prev_y, prev_z, curr_x, curr_y, curr_z] this can be accomplished
  // by subtracting the bias_x, bias_y, bias_z from the appropriate elements.
  var rateCorrection = this.computeRateCorrection_();

  // gyro_measurements.head<3>() = previous_gyro_measurement_.sample;
  // gyro_measurements.head<3>() +=
  //     (-state_.tail<3>() + k_prop_ * rate_correction);
  var adjustedGyro = new THREE.Vector3();
  // TODO: Switched to currentGyroMeasurement, maybe this is better.
  adjustedGyro.copy(this.currentGyroMeasurement.sample);
  var gyroDelta = new THREE.Vector3();
  gyroDelta.copy(rateCorrection);
  gyroDelta.multiplyScalar(this.kProp);
  gyroDelta.sub(rateCorrection);
  adjustedGyro.add(gyroDelta);

  //quaternion_integrator_.Integrate(current_q, gyro_measurements, delta_t,
  //                                 &next_q);
  var nextQ = this.quaternionIntegrator.integrate(
      this.currentQuaternion, adjustedGyro, deltaT);

  this.nextQuaternion.copy(nextQ);
  // next_state_.tail<3>() = state_.tail<3>() - k_int_ * delta_t * rate_correction;
  this.nextGyroBias.copy(rateCorrection);
  this.nextGyroBias.multiplyScalar(-this.kInt * deltaT)
  this.nextGyroBias.add(this.currentGyroBias);

  /*
  if (this.currentAccelMeasurement.sample.length() > EPSILON) {
    // Slow movements in yaw direction can impair the bias estimate.  The
    // projection onto the gravity plane resets the yaw bias estimation to zero.
    var normalized = new THREE.Vector3();
    normalized.copy(this.currentAccelMeasurement.sample).normalize();
    this.nextGyroBias = projectToPlane(this.nextGyroBias, normalized);
  }
  */

  // state_ = next_state_;
  this.currentGyroBias.copy(this.nextGyroBias);
  this.currentQuaternion.copy(this.nextQuaternion);

  var bias = this.currentGyroBias;
  //console.log('Gyro bias: [%f, %f, %f]', bias.x, bias.y, bias.z);
};

OrientationFilter.prototype.computeRateCorrection_ = function() {
  var accelMeasured = new THREE.Vector3();
  accelMeasured.copy(this.currentAccelMeasurement.sample);
  var accelMagnitude = accelMeasured.length();
  accelMeasured.normalize();

  var L_R_G = new THREE.Matrix4();
  L_R_G.makeRotationFromQuaternion(this.currentQuaternion);
  var accelEstimated = new THREE.Vector3();
  // Third column of this matrix is the estimated accelerometer.
  // Cheat sheet: Matrix4.elements ordering.
  // 0,  4,  8,  12
  // 1,  5,  9,  13
  // 2,  6,  10, 14
  // 3,  7,  11, 15
  //var elts = L_R_G.elements;
  //accelEstimated.set(elts[8], elts[9], elts[10]);
  var basisX = new THREE.Vector3();
  var basisY = new THREE.Vector3();
  var basisZ = new THREE.Vector3();
  L_R_G.extractBasis(basisX, basisY, basisZ);
  accelEstimated.copy(basisZ);

  var gain = ACCELERATION / (1 + Math.abs(accelMagnitude - GRAVITY));

  // Create the angular velocity tensor and get the omega vector out of it.
  // TODO: Figure this out... 
  // Plot the vector difference between estimated and measured vectors.
  var omegaAccel = subtractMatrices(
      outerProduct4(accelMeasured, accelEstimated),
      outerProduct4(accelEstimated, accelMeasured));
  omegaAccel.multiplyScalar(gain / 2);

  // Debug only.
  if (DEBUG) {
    this.angleDeltaAccelEstimate = accelEstimated.angleTo(accelMeasured);
    this.accelEstimated = accelEstimated;
    this.measuredToEstimatedVector = new THREE.Vector3();
    this.measuredToEstimatedVector.subVectors(accelMeasured, accelEstimated);
  }

  // Vector should be ( -[2, 1], -[0, 2], -[1, 0] ).
  // Pick out the omega coefficients out of the Omega matrix.
  var elts = omegaAccel.elements;
  return new THREE.Vector3(-elts[6], -elts[8], -elts[1]);
};
