var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env');

suite.addBatch({
	'shift' : {
		'topic' : function () {
			return CBuffer;
		},
		'shift items' : function (CBuffer) {
			var tmp;

			tmp = CBuffer(1, 2, 3);
			assert.equal(tmp.shift(), 1);
			assert.deepEqual(tmp.toArray(), [2, 3]);

			tmp = CBuffer(1, 2, 3);
			tmp.push(4);
			assert.equal(tmp.shift(), 2);
			assert.deepEqual(tmp.toArray(), [3, 4]);
		},
		'shift properties' : function (CBuffer) {
			var tmp;

			tmp = CBuffer(1, 2, 3);
			tmp.shift();
			assert.equal(tmp.size, 2);
			assert.equal(tmp.start, 1);
			assert.equal(tmp.end, 2);

			tmp = CBuffer(1, 2, 3);
			tmp.push(4);
			tmp.shift();
			assert.equal(tmp.size, 2);
			assert.equal(tmp.start, 2);
			assert.equal(tmp.end, 0);
		}
	}
});

suite.export(module);
