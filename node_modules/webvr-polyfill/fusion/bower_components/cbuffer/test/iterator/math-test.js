var vows = require('vows'),
    assert = require('assert')
    suite = vows.describe('CBuffer');

require('../env.js');

suite.addBatch({
	'sum' : {
		'topic' : function () {
			return CBuffer;
		},
		'Calculate sum' : function (CBuffer) {
			var tmp;
			tmp = new CBuffer(1,2,3,4);
			assert.equal (tmp.sum(),10);
		},
		'Calculate sum on zero items' : function (CBuffer) {
			var tmp;
			tmp = new CBuffer(10);
			assert.equal (tmp.sum(),0);
		}
	},
	'avg' : {
		'topic' : function () {
			return CBuffer;
		},
		'Calculate average' : function (CBuffer) {
			var tmp;
			tmp = new CBuffer(1,2,3,4);
			assert.equal (tmp.avg(),2.5);
		},
		'Calculate average on zero items(devision by zero)' : function (CBuffer) {
			var tmp;
			tmp = new CBuffer(10);
			assert.equal (tmp.avg(),0);
		}
	},
	'median' : {
		'topic' : function () {
			return CBuffer;
		},
		'Calculate median even buffer length' : function (CBuffer) {
			var tmp;
			tmp = new CBuffer(1,2,3,4);
			assert.equal (tmp.median(),2.5);
		},
		'Calculate median uneven buffer length' : function (CBuffer) {
			var tmp;
			tmp = new CBuffer(1,2,3);
			assert.equal (tmp.median(),2);
		},
		'Calculate median on zero items(devision by zero)' : function (CBuffer) {
			var tmp;
			tmp = new CBuffer(10);
			assert.equal (tmp.median(),0);
		}
	}
});

suite.export(module);
