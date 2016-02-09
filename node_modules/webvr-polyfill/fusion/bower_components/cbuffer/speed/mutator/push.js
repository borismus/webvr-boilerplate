const SIZE = 1e5;

var CBuffer = require('../../cbuffer'),
    test = require('../test'),
    cb = new CBuffer(SIZE),
    arr = [];

test('push 1e5 - CBuffer', function () {
	cb.empty();
}, function () {
	var i = SIZE;
	while (cb.push(i * 0.1), --i >= 0);
});

test('push 1e5 - Array  ', function () {
	arr.length = 0;
}, function () {
	var i = SIZE;
	while (arr.push(i * 0.1), --i >= 0);
});
