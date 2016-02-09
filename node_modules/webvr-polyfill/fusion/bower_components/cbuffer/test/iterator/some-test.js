var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env.js');

suite.addBatch({
	'some' : {
		'topic' : function () {
			return CBuffer;
		},
		'some' : function (CBuffer) {
			var tmp;

			// TODO: first need to finish some implementation
		}
	}
});

suite.export(module);
