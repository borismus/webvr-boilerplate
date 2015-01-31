#!/usr/bin/env bash
# Fetch the latest versions of three.js, VRControls and VREffect from the
# three.js repository.

curl -o js/VRControls.js https://raw.githubusercontent.com/mrdoob/three.js/master/examples/js/controls/VRControls.js
curl -o js/VREffect.js https://raw.githubusercontent.com/mrdoob/three.js/master/examples/js/effects/VREffect.js
curl -o js/three.min.js http://threejs.org/build/three.min.js
curl -o js/webvr-polyfill.js https://raw.githubusercontent.com/borismus/webvr-polyfill/master/build/webvr-polyfill.js
