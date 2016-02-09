var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env.js');

suite.addBatch({
	'rotateLeft' : {
		'topic' : function () {
			return CBuffer;
		},
		'simple rotateLeft' : function (CBuffer) {
			assert.deepEqual(CBuffer(1, 2, 3).rotateLeft(2).toArray(), [3, 1, 2]);
			assert.deepEqual(CBuffer(1, 2, 3).rotateLeft().toArray(), [2, 3, 1]);
		}
	}
});

suite.export(module);
