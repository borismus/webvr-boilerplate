VR_APP['MAX_MESSAGES'] = 5;
//var socket = io();

VR_APP['screens'] = {};
//VR_APP['messages'] = [];

VR_APP['message_handler'] = function(msg){
    msg['initialized'] = false;
    VR_APP['messages'].push(msg);
}

//socket.on('message', VR_APP['message_handler']);

// Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
// Only enable it if you actually need to.
VR_APP['renderer'] = new THREE.WebGLRenderer();
VR_APP['renderer'].setPixelRatio(window.devicePixelRatio);

// Append the canvas element created by the renderer to document body element.
document.body.appendChild(VR_APP['renderer'].domElement);

// Create a three.js scene.
VR_APP['scene'] = new THREE.Scene();

// Create a three.js camera.
VR_APP['camera'] = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

// Apply VR headset positional data to camera.
VR_APP['controls'] = new THREE.VRControls(VR_APP['camera']);

// Apply VR stereo rendering to renderer.
VR_APP['effect'] = new THREE.CardboardEffect(VR_APP['renderer']);
VR_APP['effect'].setSize(window.innerWidth, window.innerHeight);

// Create a VR manager helper to enter and exit VR mode.
var params = {
    hideButton: false, // Default: false.
    isUndistorted: false // Default: false.
};
VR_APP['manager'] = new WebVRManager(VR_APP['renderer'], VR_APP['effect'], params);

var fontLoader = new THREE.FontLoader();
fontLoader.load('/node_modules/three/examples/fonts/helvetiker_regular.typeface.js', function(fnt){
    VR_APP['font'] = fnt;
});
