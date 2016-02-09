var vows = require('vows'),
	assert = require('assert'),
	suite = vows.describe('CBuffer');

require('../env');

suite.addBatch({
	'slice': {
		topic: function() {
			return CBuffer(1, 3, 5, 7, 11);
		},
		'no arguments returns array of data': function(buffer) {
			assert.deepEqual(buffer.slice(), [1, 3, 5, 7, 11]);
		},
		'handles postive start and end indexs': function(buffer) {
			assert.deepEqual(buffer.slice(0), [1, 3, 5, 7, 11]);
			assert.deepEqual(buffer.slice(0, 3), [1, 3, 5]);
			assert.deepEqual(buffer.slice(1, 3), [3, 5]);
		},
		'handles negative start and end indexs': function(buffer) {
			assert.deepEqual(buffer.slice(-2), [7, 11]);
			assert.deepEqual(buffer.slice(0, -2), [1, 3, 5]);
		},
		'handles indexes outside of the buffer size': function(buffer) {
			assert.deepEqual(buffer.slice(0, 10), [1, 3, 5, 7, 11]);
			assert.deepEqual(buffer.slice(0, -7), []);
			assert.deepEqual(buffer.slice(-10), [1, 3, 5, 7, 11]);
		},
		'works with partial CBuffers': {
			topic: function() {
				var buffer = CBuffer(10);
				buffer.push(1, 2, 3);
				return buffer;
			},
			'handles partial CBuffers': function(buffer) {
				assert.deepEqual(buffer.slice(1, 3), [2, 3]);
			}
		},
		'handles circular cases': {
			topic: function() {
				var buffer = CBuffer(-1, 0, 1, 3, 5);
				buffer.push(7, 9);
				return buffer;
			},
			'handles circular buffers': function(buffer) {
				assert.deepEqual(buffer.slice(), [1, 3, 5, 7, 9]);
				assert.deepEqual(buffer.slice(0), [1, 3, 5, 7, 9]);
				assert.deepEqual(buffer.slice(1, 3), [3, 5]);
				assert.deepEqual(buffer.slice(-3), [5, 7, 9]);
				assert.deepEqual(buffer.slice(-4, -1), [3, 5, 7]);
				assert.deepEqual(buffer.slice(-1, 1), []);
				assert.deepEqual(buffer.slice(-4, -4), []);
				assert.deepEqual(buffer.slice(-4, -5), []);
			}
		}
	}
});

suite.export(module);
