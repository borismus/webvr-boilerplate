const SIZE = 1e5;

var CBuffer = require('../../cbuffer'),
    test = require('../test'),
    cb = new CBuffer(SIZE),
    arr = [],
    i;

for (i = SIZE; i > 0; i--) {
	arr.push(i);
	cb.push(i);
}

test('reverse - CBuffer', function () {
	cb.reverse();
});

test('reverse - Array  ', function () {
	arr.reverse();
});
