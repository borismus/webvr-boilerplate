var vows = require('vows'),
    assert = require('assert'),
    suite = vows.describe('CBuffer');

require('../env');

suite.addBatch({
	'sortedIndex': {
		'works with simple sorted case': {
			topic: function() {
				return CBuffer(1, 3, 5, 7, 11);
			},
			'no iterator provided': function(buffer) {
				assert.equal(buffer.sortedIndex(-1), 0);
				assert.equal(buffer.sortedIndex(1.5), 1);
			},
			'returns index of existing items': function(buffer) {
				assert.equal(buffer.sortedIndex(1), 0);
				assert.equal(buffer.sortedIndex(5), 2);
				assert.equal(buffer.sortedIndex(11), 4);
			},
			'around the corner': function(buffer) {
				assert.equal(buffer.sortedIndex(-1), 0);
				assert.equal(buffer.sortedIndex(12), 4);
			},
			'takes an iterator': function() {
				var buffer = CBuffer(7, 5, 11, 3, 1);
				function iter(a, b) {
					return Math.abs(a - 8) - Math.abs(b - 8);
				}
				assert.equal(buffer.sortedIndex(6, iter), 1);
			},

			'non-full circular buffer': {
				topic: function() {
					var buffer = CBuffer(20);
					buffer.push(1, 2, 3, 4, 5, 6, 7, 8);
					return buffer;
				},
				'works with partially complete buffers': function(buffer) {
					assert.equal(buffer.sortedIndex(3), 2);
					assert.equal(buffer.sortedIndex(8), 7);
				}
			},

			'supports classic repeative item case': {
				topic: function() {
					return CBuffer(0, 0, 0, 1, 1, 1, 1, 1, 1, 3);
				},
				'supports repative item': function(buffer) {
					assert.equal(buffer.sortedIndex(2), 9);
				}
			}
		},

		'handles circular cases': {
			'mid circular case': {
				topic: function() {
					var buffer = CBuffer(-1, 0, 1, 3, 5);
					buffer.push(7, 9);
					return buffer;
				},
				'simple circular buffer': function(buffer) {
					assert.equal(buffer.sortedIndex(0), 0);
					assert.equal(buffer.sortedIndex(2), 1);
					assert.equal(buffer.sortedIndex(4), 2);
					assert.equal(buffer.sortedIndex(7), 3);
					assert.equal(buffer.sortedIndex(8), 4);
					assert.equal(buffer.sortedIndex(10), 4);
				},
				'circular buffer on the pivot': function(buffer) {
					assert.equal(buffer.sortedIndex(4.999), 2);
					assert.equal(buffer.sortedIndex(5), 2);
					assert.equal(buffer.sortedIndex(6), 3);
				},
				'returns index of existing item': function(buffer) {
					assert.equal(buffer.sortedIndex(7), 3);
				}
			},

			'almost sorted data cases (1 item out of place)': {
				topic: function() {
					var buffer = CBuffer(-3, -1, 0, 1, 3, 5, 7);
					buffer.push(7, 9, 11, 13, 15, 17);
					return buffer;
				},
				'single item out of place': function(buffer) {
					assert.equal(buffer.sortedIndex(0), 0);
					assert.equal(buffer.sortedIndex(17), 6);
				}
			}
		}


	}
});

suite.export(module);
