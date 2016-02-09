var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env');

suite.addBatch({
	'unshift' : {
		'topic' : function () {
			return CBuffer;
		},
		'unshift items' : function (CBuffer) {
			var tmp;

			tmp = CBuffer(3);
			tmp.unshift(1, 2, 3);
			assert.deepEqual(tmp.data, [3, 2, 1]);
			tmp.unshift(4);
			assert.deepEqual(tmp.data, [3, 2, 4]);
		},
		'unshift properties' : function (CBuffer) {
			var tmp;

			tmp = CBuffer(3);
			tmp.unshift(1, 2);
			assert.equal(tmp.size, 2);
			assert.equal(tmp.start, 1);
			assert.equal(tmp.end, 2);
		}
	}
});

suite.export(module);
