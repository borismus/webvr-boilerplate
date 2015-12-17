/**
 * TODO(smus): Implement coefficient inversion.
 */
function Distortion(coefficients) {
  this.coefficients = coefficients;
}

/**
 * Calculates the inverse distortion for a radius.
 * </p><p>
 * Allows to compute the original undistorted radius from a distorted one.
 * See also getApproximateInverseDistortion() for a faster but potentially
 * less accurate method.
 *
 * @param {Number} radius Distorted radius from the lens center in tan-angle units.
 * @return {Number} The undistorted radius in tan-angle units.
 */
Distortion.prototype.distortInverse = function(radius) {
  // Secant method.
  var r0 = radius / 0.9;
  var r1 = radius * 0.9;
  var dr0 = radius - this.distort(r0);
  while (Math.abs(r1 - r0) > 0.0001 /** 0.1mm */) {
    var dr1 = radius - this.distort(r1);
    var r2 = r1 - dr1 * ((r1 - r0) / (dr1 - dr0));
    r0 = r1;
    r1 = r2;
    dr0 = dr1;
  }
  return r1;
}


/**
 * Distorts a radius by its distortion factor from the center of the lenses.
 *
 * @param {Number} radius Radius from the lens center in tan-angle units.
 * @return {Number} The distorted radius in tan-angle units.
 */
Distortion.prototype.distort = function(radius) {
  return radius * this.distortionFactor_(radius);
}

/**
 * Returns the distortion factor of a point.
 *
 * @param {Number} radius Radius of the point from the lens center in tan-angle units.
 * @return {Number} The distortion factor. Multiply by this factor to distort points.
 */
Distortion.prototype.distortionFactor_ = function(radius) {
  var result = 1.0;
  var rFactor = 1.0;
  var rSquared = radius * radius;

  for (var i = 0; i < this.coefficients.length; i++) {
    var ki = this.coefficients[i];
    rFactor *= rSquared;
    result += ki * rFactor;
  }

  return result;
}

module.exports = Distortion;
