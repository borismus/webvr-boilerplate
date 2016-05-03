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
  var r0 = 0;
  var r1 = 1;
  var dr0 = radius - this.distort(r0);
  while (Math.abs(r1 - r0) > 0.0001 /** 0.1mm */) {
    var dr1 = radius - this.distort(r1);
    var r2 = r1 - dr1 * ((r1 - r0) / (dr1 - dr0));
    r0 = r1;
    r1 = r2;
    dr0 = dr1;
  }
  return r1;
};

/**
 * Distorts a radius by its distortion factor from the center of the lenses.
 *
 * @param {Number} radius Radius from the lens center in tan-angle units.
 * @return {Number} The distorted radius in tan-angle units.
 */
Distortion.prototype.distort = function(radius) {
  var r2 = radius * radius;
  var ret = 0;
  for (var i = 0; i < this.coefficients.length; i++) {
    ret = r2 * (ret + this.coefficients[i]);
  }
  return (ret + 1) * radius;
};

// Functions below roughly ported from
// https://github.com/googlesamples/cardboard-unity/blob/master/Cardboard/Scripts/CardboardProfile.cs#L412

// Solves a small linear equation via destructive gaussian
// elimination and back substitution.  This isn't generic numeric
// code, it's just a quick hack to work with the generally
// well-behaved symmetric matrices for least-squares fitting.
// Not intended for reuse.
//
// @param a Input positive definite symmetrical matrix. Destroyed
//     during calculation.
// @param y Input right-hand-side values. Destroyed during calculation.
// @return Resulting x value vector.
//
Distortion.prototype.solveLinear_ = function(a, y) {
  var n = a.length;

  // Gaussian elimination (no row exchange) to triangular matrix.
  // The input matrix is a A^T A product which should be a positive
  // definite symmetrical matrix, and if I remember my linear
  // algebra right this implies that the pivots will be nonzero and
  // calculations sufficiently accurate without needing row
  // exchange.
  for (var j = 0; j < n - 1; ++j) {
    for (var k = j + 1; k < n; ++k) {
      var p = a[j][k] / a[j][j];
      for (var i = j + 1; i < n; ++i) {
        a[i][k] -= p * a[i][j];
      }
      y[k] -= p * y[j];
    }
  }
  // From this point on, only the matrix elements a[j][i] with i>=j are
  // valid. The elimination doesn't fill in eliminated 0 values.

  var x = new Array(n);

  // Back substitution.
  for (var j = n - 1; j >= 0; --j) {
    var v = y[j];
    for (var i = j + 1; i < n; ++i) {
      v -= a[i][j] * x[i];
    }
    x[j] = v / a[j][j];
  }

  return x;
};

// Solves a least-squares matrix equation.  Given the equation A * x = y, calculate the
// least-square fit x = inverse(A * transpose(A)) * transpose(A) * y.  The way this works
// is that, while A is typically not a square matrix (and hence not invertible), A * transpose(A)
// is always square.  That is:
//   A * x = y
//   transpose(A) * (A * x) = transpose(A) * y   <- multiply both sides by transpose(A)
//   (transpose(A) * A) * x = transpose(A) * y   <- associativity
//   x = inverse(transpose(A) * A) * transpose(A) * y  <- solve for x
// Matrix A's row count (first index) must match y's value count.  A's column count (second index)
// determines the length of the result vector x.
Distortion.prototype.solveLeastSquares_ = function(matA, vecY) {
  var i, j, k, sum;
  var numSamples = matA.length;
  var numCoefficients = matA[0].length;
  if (numSamples != vecY.Length) {
    throw new Error("Matrix / vector dimension mismatch");
  }

  // Calculate transpose(A) * A
  var matATA = new Array(numCoefficients);
  for (k = 0; k < numCoefficients; ++k) {
    matATA[k] = new Array(numCoefficients);
    for (j = 0; j < numCoefficients; ++j) {
      sum = 0;
      for (i = 0; i < numSamples; ++i) {
        sum += matA[j][i] * matA[k][i];
      }
      matATA[k][j] = sum;
    }
  }

  // Calculate transpose(A) * y
  var vecATY = new Array(numCoefficients);
  for (j = 0; j < numCoefficients; ++j) {
    sum = 0;
    for (i = 0; i < numSamples; ++i) {
      sum += matA[j][i] * vecY[i];
    }
    vecATY[j] = sum;
  }

  // Now solve (A * transpose(A)) * x = transpose(A) * y.
  return this.solveLinear_(matATA, vecATY);
};

/// Calculates an approximate inverse to the given radial distortion parameters.
Distortion.prototype.approximateInverse = function(maxRadius, numSamples) {
  maxRadius = maxRadius || 1;
  numSamples = numSamples || 100;
  var numCoefficients = 6;
  var i, j;

  // R + K1*R^3 + K2*R^5 = r, with R = rp = distort(r)
  // Repeating for numSamples:
  //   [ R0^3, R0^5 ] * [ K1 ] = [ r0 - R0 ]
  //   [ R1^3, R1^5 ]   [ K2 ]   [ r1 - R1 ]
  //   [ R2^3, R2^5 ]            [ r2 - R2 ]
  //   [ etc... ]                [ etc... ]
  // That is:
  //   matA * [K1, K2] = y
  // Solve:
  //   [K1, K2] = inverse(transpose(matA) * matA) * transpose(matA) * y
  var matA = new Array(numCoefficients);
  for (j = 0; j < numCoefficients; ++j) {
    matA[j] = new Array(numSamples);
  }
  var vecY = new Array(numSamples);

  for (i = 0; i < numSamples; ++i) {
    var r = maxRadius * (i + 1) / numSamples;
    var rp = this.distort(r);
    var v = rp;
    for (j = 0; j < numCoefficients; ++j) {
      v *= rp * rp;
      matA[j][i] = v;
    }
    vecY[i] = r - rp;
  }

  var inverseCoefficients = this.solveLeastSquares_(matA, vecY);

  return new Distortion(inverseCoefficients);
};

module.exports = Distortion;
