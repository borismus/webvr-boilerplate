var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env');

suite.addBatch({
	'indexOf' : {
		'topic' : function () {
			return CBuffer;
		},
		'find item' : function (CBuffer) {
			assert.equal(CBuffer(1, 2, 3).indexOf(2), 1);
			assert.equal(CBuffer('a', 'b', 'c').indexOf('c'), 2);
			assert.equal(CBuffer(1, 2, 3).indexOf('1'), -1);
			assert.equal(CBuffer(1, 2, 3).indexOf(4), -1);
		}
	}
});

suite.export(module);
