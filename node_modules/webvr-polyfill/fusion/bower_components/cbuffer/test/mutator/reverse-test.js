var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env');

suite.addBatch({
	'reverse' : {
		'topic' : function () {
			return CBuffer;
		},
		'reverse buffer' : function (CBuffer) {
			assert.deepEqual(CBuffer(1, 2, 3).reverse().data, [3, 2, 1]);
			assert.deepEqual(CBuffer(1, 2, 3, 4).reverse().data, [4, 3, 2, 1]);
		}
	}
});

suite.export(module);
