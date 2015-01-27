# WebVR Boilerplate

A starting point for web-based VR experiences that work well in both
Google Cardboard and Oculus Rift. Also provides a good fallback for
experiencing the same content without requiring a VR device.


# Features

### WebVR polyfill:

- Provides an CardboardHMDVRDevice with the correct parameters
  for Cardboard rendering.
- On mobile, provides a virtual GyroPositionSensorVRDevice, which tracks
  using DeviceOrientationEvent.
- On desktop, provides a virtual MouseKeyboardPositionSensorVRDevice,
  which uses mouse and arrow keys to look around the scene.
- Feature detects (and UA sniffs) to determine which of the above to
  inject into the page.

### WebVR manager:

- Feature detects for WebVR (or the polyfill).
- If WebVR is available, places a generic button in the top right
  corner, which, when clicked, takes you to VR mode.
- Other means of getting into VR mode: double click anywhere, double tap
  anywhere.
- Sets good defaults for VR mode: full screen, orientation lock, wake
  lock.


# Instructions

1. Include webvr-polyfill.js in your project.
2. Include webvr-manager.js and instantiate a WebVRManager object,
   passing in your VREffect instance as first argument.

For example,

    var effect = new THREE.VREffect(renderer);
    var mgr = new WebVRManager(effect);

For more information, see index.html, which should be well commented and
self-explanatory.

# Related projects

- A yeoman-based getting started template: <https://github.com/dmarcos/vrwebgl>
- LEAP's VR quickstart: <https://github.com/leapmotion-examples/javascript/blob/master/v2/vr-quickstart/index.html>
- A WebVR Polyfill that is unfortunately incomplete: <https://github.com/thomasfoster96/WebVR-polyfill>
- A three.js + VR starting point: <https://github.com/MozVR/vr-web-examples/tree/master/threejs-vr-boilerplate>


# Useful resources

- Cardboard Java SDK: https://github.com/googlesamples/cardboard-java
- Brandon's info on Chrome's WebVR implementation: http://blog.tojicode.com/2014/07/bringing-vr-to-chrome.html
- Vlad's quick guide to the WebVR API: http://blog.bitops.com/blog/2014/06/26/first-steps-for-vr-on-the-web/
- The WebVR IDL: https://github.com/vvuk/gecko-dev/blob/oculus/dom/webidl/VRDevice.webidl
