#!/usr/bin/env bash
# Fetch the latest versions of three.js, VRControls and VREffect from the
# three.js repository.

curl -o js/deps/VRControls.js https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/controls/VRControls.js
curl -o js/deps/VREffect.js https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/effects/VREffect.js
curl -o js/deps/three.js http://threejs.org/build/three.js
#curl -o js/webvr-polyfill.js https://raw.githubusercontent.com/borismus/webvr-polyfill/master/build/webvr-polyfill.js
