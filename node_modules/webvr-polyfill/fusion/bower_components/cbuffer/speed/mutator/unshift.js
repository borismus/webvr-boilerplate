const SIZE = 1e5;

var CBuffer = require('../../cbuffer'),
    test = require('../test'),
    cb = new CBuffer(SIZE),
    arr = new Array();

test('unshift 1e5 - CBuffer', function () {
	cb.empty();
}, function () {
	var i = SIZE;
	while(cb.unshift(i), --i >= 0);
});

test('unshift 1e5 - Array  ', function () {
	arr.length = 0;
}, function () {
	var i = SIZE;
	while(arr.unshift(i), --i >= 0);
});
