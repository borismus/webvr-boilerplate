var DeviceInfo = require('../src/device-info.js');

var di = new DeviceInfo();
var centroid = di.getLeftEyeCenter();

// Size the canvas. Render the centroid.
var canvas = document.querySelector('canvas');
var w = window.innerWidth;
var h = window.innerHeight;
var x = centroid.x * w/2;
var y = centroid.y * h;
var size = 10;

canvas.width = w;
canvas.height = h;

var ctx = canvas.getContext('2d');
ctx.clearRect(0, 0, w, h);
ctx.fillStyle = 'black';
ctx.fillRect(x - size/2, y - size/2, size, size);

console.log('Placing eye at (%d, %d).', x, y);
