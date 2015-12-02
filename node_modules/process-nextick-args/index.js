'use strict';

if (process.version && parseInt(process.version.split('.')[0].slice(1), 10) > 0) {
  module.exports = process.nextTick;
} else {
  module.exports = nextTick;
}

function nextTick(fn) {
  var args = new Array(arguments.length - 1);
  var i = 0;
  while (i < args.length) {
    args[i++] = arguments[i];
  }
  process.nextTick(function afterTick() {
    fn.apply(null, args);
  });
}
