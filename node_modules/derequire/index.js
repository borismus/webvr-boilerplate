'use strict';

var acorn = require('acorn');
var escope = require('escope');

var requireRegexp = /\brequire\b/;

function write(arr, str, offset) {
  for (var i = 0, l = str.length; i < l; i++) {
    arr[offset + i] = str[i];
  }
}

function rename(code, tokenTo, tokenFrom) {

  var tokens;
  if (!Array.isArray(tokenTo)) {
    tokens = [{
      from: tokenFrom || 'require',
      to: tokenTo || '_dereq_'
    }];
  } else {
    tokens = tokenTo;
  }

  tokens.forEach(function(token) {
    if (token.to.length !== token.from.length) {
      throw new Error('"' + token.to + '" and "' + token.from + '" must be the same length');
    }
  });

  if (tokens.length === 1 &&
      tokens[0].from === 'require' &&
      !requireRegexp.test(code)) {
    return code;
  }

  var ast;
  try {
    ast = acorn.parse(code, {
      ecmaVersion: 6,
      ranges: true,
      allowReturnOutsideFunction: true
    });
  } catch(err) {
    // this should probably log something and/or exit violently
    return code;
  }

  //
  // heavily inspired by https://github.com/estools/esshorten
  //

  code = String(code).split('');

  var manager = escope.analyze(ast, {optimistic: true, ecmaVersion: 6});

  for (var i = 0, iz = manager.scopes.length; i < iz; i++) {
    var scope = manager.scopes[i];

    for (var j = 0, jz = scope.variables.length; j < jz; j++) {
      var variable = scope.variables[j];

      if (variable.tainted || variable.identifiers.length === 0) {
        continue;
      }

      for (var k = 0, kz = tokens.length; k < kz; k++) {
        var token = tokens[k];

        if (variable.name !== token.from) {
          continue;
        }

        for (var l = 0, lz = variable.identifiers.length; l < lz; l++) {
          var def = variable.identifiers[l];
          write(code, token.to, def.range[0]);
        }

        for (var m = 0, mz = variable.references.length; m < mz; m++) {
          var ref = variable.references[m];
          write(code, token.to, ref.identifier.range[0]);
        }
      }
    }
  }

  return code.join('');
}

module.exports = rename;
