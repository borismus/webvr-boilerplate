function QuaternionIntegrator() {
}

QuaternionIntegrator.prototype.integrate = function(currentQ, adjustedGyro, deltaT) {
  var nextQ = this.eulerStateTransition_(currentQ, adjustedGyro, deltaT);

  // Normalize the quaternion.
  nextQ.normalize();
  if (nextQ.w < 0) {
    nextQ.conjugate();
    nextQ.w *= -1;
  }
  return nextQ;
};

/**
 * NOTE: this may be way less accurate with 60 Hz compared to the native 200 Hz.
 * Consider using Runge-Kutta.
 */
QuaternionIntegrator.prototype.eulerStateTransition_ =
    function(previousQ, adjustedGyro, stepSize) {
  
  var K1 = this.stateTimeDerivative_(stepSize, previousQ, adjustedGyro);
  return this.addQuaternions_(previousQ, K1);
};

QuaternionIntegrator.prototype.addQuaternions_ = function(q1, q2) {
  var out = new THREE.Quaternion();
  out.set(q1.x + q2.x, q1.y + q2.y, q1.z + q2.z, q1.w + q2.w); 
  return out;
};

/**
 * TODO: How does this work!? It is apparently not a tensor:
 *
 * https://en.wikipedia.org/wiki/Angular_velocity#Angular_velocity_tensor
 */
QuaternionIntegrator.prototype.omega_ = function(w) {
  var out = new THREE.Matrix4();
  /*
  0.,    w(2), -w(1), w(0),
  -w(2), 0.,    w(0), w(1),
  w(1), -w(0),  0.,   w(2),
  -w(0),-w(1), -w(2), 0.;
  */
  out.set(0,    w.z, -w.y,  w.x,
          w.z,  0,    w.x,  w.y,
          w.y, -w.x,  0,    w.z,
         -w.x, -w.y, -w.z,  0);
  return out;        
};

QuaternionIntegrator.prototype.stateTimeDerivative_ =
    function(stepSize, quaternion, adjustedGyro) {
  var out = new THREE.Vector4();
  // Quaternion time derivative.

  /*state_derivative->block<4, 1>(0, 0) =
      0.5 * geometry_toolbox::Omega(gyro_measurements.block<3, 1>(0, 0) +
                                    (gyro_measurements.block<3, 1>(3, 0) -
                                     gyro_measurements.block<3, 1>(0, 0)) *
                                        t / step_size) *
      state.block<4, 1>(0, 0);
      */
  var omegaMatrix = this.omega_(adjustedGyro);
  // Whoa: transformation in quaternion space.
  omegaMatrix.multiplyScalar(0.5);
  out.copy(quaternion);
  out.applyMatrix4(omegaMatrix);

  // This is a scaling factor that applies to each step of Runge-Kutta. We
  // perform it here to save duplicating code in the Runge-Kutta function.
  out.multiplyScalar(stepSize);

  return out;
};
