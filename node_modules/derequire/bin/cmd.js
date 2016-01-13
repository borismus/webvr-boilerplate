#!/usr/bin/env node

var derequire = require('../');
var concat = require('concat-stream');
var fs = require('fs');

var argv = require('yargs')
  .options('t', {
      alias : 'to',
      default : '_dereq_',
      describe: 'token to change the variable into'
  })
   .options('f', {
      alias : 'from',
      default : 'require',
      describe: 'token to find and change'
  })
   .help('h')
   .alias('h', 'help')
   .version(require('../package.json').version, 'v')
   .alias('v', 'version')
   .argv;

var file = argv._[0];
var input;
if (file && file !== '-') {
  input = fs.createReadStream(file);
} else {
  input = process.stdin;
}

input.pipe(concat(function(buf) {
  process.stdout.write(derequire(buf, argv.t, argv.f));
}));
