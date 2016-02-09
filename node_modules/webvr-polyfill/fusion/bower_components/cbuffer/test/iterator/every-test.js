var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env.js');

suite.addBatch({
	'every' : {
		'topic' : function () {
			return CBuffer;
		},
		'every items' : function (CBuffer) {
			var tmp;

			tmp = new CBuffer(1,2,3,4);
			assert.ok(tmp.every(function (a) {
				return ~~a === a;
			}));

			assert.ifError(tmp.every(function (a) {
				return a < 4;
			}));
		}
	}
});

suite.export(module);
