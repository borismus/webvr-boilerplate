var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env.js');

suite.addBatch({
	'rotateRight' : {
		'topic' : function () {
			return CBuffer;
		},
		'simple rotateRight' : function (CBuffer) {
			assert.deepEqual(CBuffer(1, 2, 3).rotateRight(2).toArray(), [2, 3, 1]);
			assert.deepEqual(CBuffer(1, 2, 3).rotateRight().toArray(), [3, 1, 2]);
		}
	}
});

suite.export(module);
