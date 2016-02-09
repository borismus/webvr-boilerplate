const SIZE = 1e5;

var CBuffer = require('../../cbuffer'),
    test = require('../test'),
    cb = new CBuffer(SIZE),
    arr = [];

test('pop 1e5 - CBuffer', function () {
	cb.empty();
	for (var i = 0; i < SIZE; i++) {
		cb.push(1);
	}
}, function () {
	for (var i = SIZE; i >= 0; i--) {
		cb.pop();
	}
});

test('pop 1e5 - Array  ', function () {
	arr.length = 0;
	for (var i = 0; i < SIZE; i++) {
		arr.push(1);
	}
}, function () {
	for (var i = SIZE; i >= 0; i--) {
		arr.pop();
	}
});
