var through = require('through');
var os = require('os');
var path = require('path');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;

module.exports = function(fileName, global){
  if (!fileName) throw new PluginError('gulp-concat',  'Missing fileName option for gulp-jsify');

  var buffer = [];
  var firstFile = null;

  function bufferContents(file){
    if (file.isNull()) return; // ignore
    if (file.isStream()) return this.emit('error', new PluginError('gulp-concat',  'Streaming not supported'));

    if (!firstFile) firstFile = file;

    var contents = file.contents.toString('utf8');
    var json = JSON.stringify(contents);
    var parts = path.basename(file.path).split(/\./g);
    var name = JSON.stringify(parts.slice(0, -1).join('.'));

    buffer.push(name + ': ' + json);
  }

  function endStream(){
    if (buffer.length === 0) return this.emit('end');

    var joinedContents = global + ' = {' + buffer.join(',\n') + '};\n';
    var joinedPath = path.join(firstFile.base, fileName);

    var joinedFile = new File({
      cwd: firstFile.cwd,
      base: firstFile.base,
      path: joinedPath,
      contents: new Buffer(joinedContents)
    });

    this.emit('data', joinedFile);
    this.emit('end');
  }

  return through(bufferContents, endStream);
};
