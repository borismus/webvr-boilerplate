var ANDROID_DB = {
  // Nexus 5:
  // Nexus 4:
  // Moto X2:
  // Moto X:
};

/**
 * Gives the correct device DPI based on screen dimensions and user agent.
 */
function DeviceInfo() {
  // TODO(smus): On Android, create a lookup table for common devices.
  // On iOS, use screen dimensions to determine iPhone/iPad model.
}

DeviceInfo.prototype.getDPI = function() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  var width = screen.availWidth;
  var height = screen.availHeight;
  return 316;
};

module.exports = DeviceInfo;
