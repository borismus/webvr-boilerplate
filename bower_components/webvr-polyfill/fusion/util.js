var Util = window.Util || {};

Util.getQuaternionAxis = function(quat) {
  // x = qx / sqrt(1-qw*qw)
  // y = qy / sqrt(1-qw*qw)
  // z = qz / sqrt(1-qw*qw)
  var d = Math.sqrt(1 - quat.w * quat.w);
  return new THREE.Vector3(quat.x / d, quat.y / d, quat.z / d);
};

Util.getQuaternionAngle = function(quat) {
  // angle = 2 * acos(qw)
  // If w is greater than 1 (THREE.js, how can this be?), arccos is not defined.
  if (quat.w > 1) {
    console.warn('getQuaternionAngle: w > 1');
    return 0;
  }
  var angle = 2 * Math.acos(quat.w);
  return angle;
};

Util.isIOS = function() {
  return /iPad|iPhone|iPod/.test(navigator.platform);
};
