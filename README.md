# WebVR Boilerplate

A [THREE.js][three]-based starting point for VR experiences that work well in
both Google Cardboard and other VR headsets. Also provides a fallback for
experiencing the same content without requiring a VR device.

This project relies heavily on the [webvr-polyfill][polyfill] to provide VR
support if the [WebVR API](spec) is not implemented.

[three]: http://threejs.org/
[polyfill]: https://github.com/borismus/webvr-polyfill

## Projects that use the webvr-polyfill or webvr-boilerplate

Assorted platforms:

- [A-Frame](https://github.com/aframevr/aframe/) - Building blocks for the
virtual reality web
- [Archilogic](http://spaces.archilogic.com/3d/template/new?mode=edit&view-menu=none) - Floor plans into 3D virtual tours
- [Vizor](http://vizor.io/) - Create and share VR in your browser

Assorted real-world examples:

- [Breakthrough](http://breakthrough.nationalgeographic.com/) - Cutting-edge science that will change our lives in the very near future (by National Geographic)
- [Chinese New Year](https://chinesenewyear.withgoogle.com/) - Create a virtual lantern and share your wishes (by Google)
- [Discovering Gale Crater](http://graphics.latimes.com/mars-gale-crater-vr/) - A virtual reality audio tour of the Gale Crater (by LA Times)
- [Sechelt](https://mozvr.github.io/sechelt/) - A visualization of an inlet near the town of Sechelt, BC (by Mozilla)

Assorted samples:

- [WebVR 1.0 Samples](https://toji.github.io/webvr-samples/) - Simple example applications to demonstrate various aspects of the WebVR API


## Features

As of WebVR 1.0, this project relies on the polyfill for even more. Core
features like [lens distortion][distortion] and device detection have moved into the polyfill.
This project now acts as a getting started example, and provides a reasonable
user experience for getting in and out of Virtual Reality and Magic Window
modes.

As a convenience, the WebVRManager emits certain `modechange` events, which can
be subscribed using `manager.on('modechange', callback)`.


## Getting started

The easiest way to start is to fork this repository or copy its contents into a
new directory.

The boilerplate is also available via npm. Easy install:

    npm install webvr-boilerplate


## Thanks

- [Brandon Jones][bj] and [Vladimir Vukicevic][vv] for their work on the [WebVR
  spec][spec].
- [Ricardo Cabello][doob] for THREE.js.
- [Diego Marcos][dm] for VREffect and VRControls.
- [Dmitriy Kovalev][dk] for help with [lens distortion correction][distortion].

[dk]: https://github.com/dmitriykovalev/
[distortion]: https://github.com/borismus/webvr-polyfill/blob/master/src/distortion/distortion.js
[bj]: https://twitter.com/tojiro
[vv]: https://twitter.com/vvuk
[spec]: https://mozvr.github.io/webvr-spec/
[dm]: https://twitter.com/dmarcos
[doob]: https://twitter.com/mrdoob
