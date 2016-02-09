var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env');

suite.addBatch({
	'pop' : {
		'topic' : function () {
			return CBuffer;
		},
		'pop items' : function (CBuffer) {
			var tmp;

			tmp = CBuffer(1, 2, 3);
			assert.equal(tmp.pop(), 3);

			tmp = CBuffer(1, 2, 3);
			tmp.pop();
			assert.deepEqual(tmp.toArray(), [1, 2]);

			tmp = CBuffer(3);
			assert.isUndefined(tmp.pop());
		},
		'pop properties' : function (CBuffer) {
			var tmp;

			tmp = CBuffer(1, 2, 3);
			tmp.pop();
			assert.equal(tmp.end, 1);
			assert.equal(tmp.size, 2);
		}
	}
});

suite.export(module);
