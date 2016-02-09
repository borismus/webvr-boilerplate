var CBuffer = require('../../cbuffer'),
    test = require('../test');

test('Array     ', function () {
	new CBuffer(4);
});

test('Arguments ', function () {
	new CBuffer(1,2,3,4);
});
