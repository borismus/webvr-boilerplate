#!/usr/bin/env bash
# Fetch the latest versions of three.js, VRControls and VREffect from the
# three.js repository.

curl -o js/deps/VRControls.js https://raw.githubusercontent.com/mrdoob/three.js/master/examples/js/controls/VRControls.js
curl -o js/deps/VREffect.js https://raw.githubusercontent.com/mrdoob/three.js/master/examples/js/effects/VREffect.js
curl -o js/deps/three.js https://raw.githubusercontent.com/mrdoob/three.js/master/build/three.js
