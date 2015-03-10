# WebVR Boilerplate

A starting point for web-based VR experiences that work well in both
Google Cardboard and Oculus Rift. Also provides a good fallback for
experiencing the same content without requiring a VR device.

Uses the [webvr-polyfill project][polyfill] to provide VR support even
if no VR device is available. This gives good fallbacks for Cardboard,
mobile devices and desktop devices.

[polyfill]: https://github.com/borismus/webvr-polyfill

# What's inside...

[**THREE.js** `three.min.js`](http://threejs.org/)

- WebGL helper library that greatly simplifies 3D graphics.

[**VRControls** `VRControls.js`](https://github.com/mrdoob/three.js/blob/master/examples/js/controls/VRControls.js)

- THREE.js controls which take advantage of the WebVR API.
- Usually attached to the THREE.Camera to look around the scene.

[**VREffect** `VREffect.js`](https://github.com/mrdoob/three.js/blob/master/examples/js/effects/VREffect.js)

- THREE.js effect which renders a scene with two cameras in it.
- Puts the two images side-by-side.

[**WebVR polyfill** `webvr-polyfill.js`](https://github.com/borismus/webvr-polyfill)

- For Cardboard rendering.
- On mobile, supports rotation via DeviceOrientation.
- On desktop, supports looking with the mouse or with arrow keys.

**WebVR manager** `webvr-manager.js` (lives in this repository)

- Feature detects for WebVR (or the polyfill).
- If WebVR is available, places an active WebVR button on the bottom.
- Other means of getting into VR mode: double click anywhere, double tap
  anywhere.
- For desktop, if an HMD is connected, goes into split-screen rendering
  mode. Otherwise, goes into immersive fullscreen mode (with pointer lock).
- For mobile, goes into Cardboard side-by-side rendering mode.

TODO: Provide a configuration UI for switching modes if we guessed
wrong.

# Instructions

1. Include webvr-polyfill.js in your project.
2. Include webvr-manager.js and instantiate a WebVRManager object,
   passing in your VREffect instance (from the THREE.js effect library)
   as first argument.

For example,

    var effect = new THREE.VREffect(renderer);
    var mgr = new WebVRManager(effect);

For more information, see index.html, which should be well commented and
self-explanatory.

# Related projects

- WebVR Polyfill: <https://github.com/borismus/webvr-polyfill>
- A yeoman-based getting started template: <https://github.com/dmarcos/vrwebgl>
- LEAP's VR quickstart: <https://github.com/leapmotion-examples/javascript/blob/master/v2/vr-quickstart/index.html>
- A WebVR Polyfill that is unfortunately incomplete: <https://github.com/thomasfoster96/WebVR-polyfill>
- A three.js + VR starting point: <https://github.com/MozVR/vr-web-examples/tree/master/threejs-vr-boilerplate>


# Useful resources

- Cardboard Java SDK: https://github.com/googlesamples/cardboard-java
- Brandon's info on Chrome's WebVR implementation: http://blog.tojicode.com/2014/07/bringing-vr-to-chrome.html
- Vlad's quick guide to the WebVR API: http://blog.bitops.com/blog/2014/06/26/first-steps-for-vr-on-the-web/
- The WebVR IDL: https://github.com/vvuk/gecko-dev/blob/oculus/dom/webidl/VRDevice.webidl
