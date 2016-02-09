var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env');

suite.addBatch({
	'lastIndexOf' : {
		'topic' : function () {
			return CBuffer;
		},
		'find item' : function (CBuffer) {
			assert.equal(CBuffer(1, 2, 3).lastIndexOf(2), 1);
			assert.equal(CBuffer('a', 'b', 'c').lastIndexOf('c'), 2);
			assert.equal(CBuffer(1, 2, 3).lastIndexOf('1'), -1);
			assert.equal(CBuffer(1, 2, 3).lastIndexOf(4), -1);
		}
	}
});

suite.export(module);
