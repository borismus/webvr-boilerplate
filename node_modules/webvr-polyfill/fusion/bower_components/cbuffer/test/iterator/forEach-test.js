var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env.js');

suite.addBatch({
	'forEach' : {
		'topic' : function () {
			return CBuffer;
		},
		'forEach' : function (CBuffer) {
			var tmp;

			// TODO: first need to finish forEach implementation
		}
	}
});

suite.export(module);
