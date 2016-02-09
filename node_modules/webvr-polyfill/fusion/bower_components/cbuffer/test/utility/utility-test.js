var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env.js');

suite.addBatch({
	'utility' : {
		'topic' : function () {
			return CBuffer;
		},
		'empty' : function (CBuffer) {
			var tmp;

			tmp = new CBuffer(1,2,3);
			tmp.empty();
			assert.equal(tmp.size, 0);
		},
		'fill' : function (CBuffer) {
			var  tmp;

			tmp = new CBuffer(3);
			tmp.fill(1);
			assert.deepEqual(tmp.toArray(), [1,1,1]);
		},
		'first' : function (CBuffer) {
			var tmp;

			tmp = new CBuffer(1,2,3);
			assert.equal(tmp.first(), 1);
		},
		'last' : function (CBuffer) {
			var tmp;

			tmp = new CBuffer(1,2,3);
			assert.equal(tmp.last(), 3);
		},
		'get' : function (CBuffer) {
			var tmp;

			tmp = new CBuffer(1,2,3);
			assert.equal(tmp.get(2), 3);
		},
		'set' : function (CBuffer) {
			var tmp;

			tmp = new CBuffer(1,2,3);
			tmp.set(1, 2);
			assert.equal(tmp.get(1), 2);
		},
		'toArray' : function (CBuffer) {
			assert.ok(CBuffer(1).toArray() instanceof Array);
		},
		'overflow' : function (CBuffer) {
			// TODO: this needs to be an async test
		}
	}
});

suite.export(module);
