var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env.js');

suite.addBatch({
	'' : {
		'topic' : function () {
			return CBuffer;
		},
		'' : function (CBuffer) {
		}
	}
});

suite.export(module);
