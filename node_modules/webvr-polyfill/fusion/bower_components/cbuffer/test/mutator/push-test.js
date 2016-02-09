var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env');

suite.addBatch({
	'push' : {
		'topic' : function () {
			return CBuffer;
		},
		'push items' : function (CBuffer) {
			var tmp;

			tmp = CBuffer(3);
			tmp.push(1, 2, 3);
			assert.deepEqual(tmp.data, [1, 2, 3]);
			tmp.push(4);
			assert.deepEqual(tmp.data, [4, 2, 3]);
		},
		'push properties' : function (CBuffer) {
			var tmp;

			tmp = CBuffer(3);
			tmp.push(1, 2);
			assert.equal(tmp.size, 2);
			assert.equal(tmp.start, 0);
			assert.equal(tmp.end, 1);
		}
	}
});

suite.export(module);
