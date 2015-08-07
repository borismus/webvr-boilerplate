# WebVR Boilerplate

A sane [THREE.js][three]-based starting point for VR experiences that work well
in both Google Cardboard and other VR displays. Also provides a fallback for
experiencing the same content without requiring a VR device.

This project relies heavily on the [webvr-polyfill][polyfill] to provide VR
support even if no VR device is available.

[three]: http://threejs.org/
[polyfill]: https://github.com/borismus/webvr-polyfill

# Projects that use the boilerplate

[![WebVR Boilerplate](content_images/boilerplate.png)][wb]
[![Moving Music](content_images/moving-music.png)][mm]
[![EmbedVR](content_images/photosphere.png)][evr]
[![Sechelt](content_images/sechelt.png)][s]

[wb]: http://borismus.github.io/webvr-boilerplate/
[mm]: http://borismus.github.io/moving-music/
[evr]: #
[s]: http://borismus.github.io/sechelt/


# Getting started

The easiest way to start is to fork this repository or copy its contents into a
new directory.

Alternatively, you can start from scratch. The key parts that the boilerplate
provides are:

1. Include webvr-polyfill.js in your project.
2. Include webvr-manager.js and instantiate a WebVRManager object,
   passing in your VREffect instance as well as THREE.js' WebGLRenderer (from
   the THREE.js effect library) as first argument.

For example,

    var effect = new THREE.VREffect(renderer);
    var manager = new WebVRManager(renderer, effect);

The manager handles going in and out of VR mode. Instead of calling
`renderer.render()` or `effect.render()`, you call `manager.render()`, which
renders in monocular view by default, or side-by-side binocular view when in VR
mode.

# Features

- Enter and exit VR mode (in WebVR and WebVR-polyfill compatible environments).
- Immersive fullscreen, orientation locking and sleep prevention.
- Distortion correction, enabled in iOS only since it's hard to determine DPI or
  physical size on Android devices.


# Thanks / credits!

- [Dmitry Kovalev][dk] for implementing [lens distortion correction][distortion].
- [Brandon Jones][bj] and [Vladimir Vukicevic][vv] for their work on the [WebVR
  spec][spec]
- [Diego Marcos][dm] for VREffect and VRControls.
- [mrdoob][doob] for THREE.js.

[dk]: https://plus.google.com/+DmitryKovalev1
[distortion]: https://github.com/borismus/webvr-boilerplate/blob/master/src/cardboard-distorter.js
[bj]: https://twitter.com/tojiro
[vv]: https://twitter.com/vvuk
[spec]: http://mozvr.github.io/webvr-spec/webvr.html
[dm]: https://twitter.com/dmarcos
[doob]: https://twitter.com/mrdoob
