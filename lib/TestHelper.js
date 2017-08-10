/* global it */

const fs = require('fs'),
  path = require('path'),
  N3 = require('n3'),
  expect = require('chai').expect,
  Validator = require('../lib/Validator');

function createRMLValidator() {
  const rulePath = path.resolve(__dirname, '../resources/rml/rule.n3');
  const extraRules = path.resolve(__dirname, '../resources/rml/extraRules.n3');
  const logCodes = path.resolve(__dirname, '../resources/rml/logCodes.ttl');

  const validator = new Validator();
  validator.opts.extraFiles.push(extraRules);
  validator.opts.extraFiles.push(logCodes);
  validator.opts.queryPath = rulePath;

  return validator;
}

function walkFiles(bugFiles, processFile) {
  processFile = processFile || function () {
    };
  const validator = createRMLValidator();
  for (let i = 0; i < bugFiles.length; i++) {
    (function (opt) {
      it(opt.name + ' should be solved', function (done) {
        this.timeout(10000);
        fs.readFile(opt.file, 'utf8', function (err, ttl) {
          if (err) {
            throw err;
          }
          validator.validate(ttl, function (err, out) {
            if (err) {
              throw err;
            }
            processFile(opt.file, out);
            fs.readFile(opt.output, 'utf8', function (err, base) {
              toNTriples(out, {skolem: true}, function (err, outN) {
                toNTriples(base, {skolem: true}, function (err, baseN) {
                  const outNLines = outN.split('\n');
                  const baseNLines = baseN.split('\n');
                  check(done, function () {
                    expect(outNLines.length).to.equal(baseNLines.length);
                  });
                  for (let i = 0; i < outNLines.length; i++) {
                    (function (i) {
                      check(done, function () {
                        expect(outNLines[i]).to.equal(baseNLines[i]);
                      });
                    })(i);
                  }
                  done();
                });
              });
            });
          });
        });
      });
    })(bugFiles[i]);
  }
}

function check(done, fn) {
  try {
    fn();
  }
  catch (e) {
    done(e);
  }
}

function toNTriples(ttl, opts, cb) {
  opts = opts || {};
  const defaultOpts = {
    skolem: false,
    sort: false
  };
  opts = Object.assign({}, defaultOpts, opts);
  const parser = N3.Parser();
  const writer = N3.Writer({format: 'N-Triples'});
  parser.parse(ttl, function (err, triple) {
    if (triple) {
      writer.addTriple(triple);
    }
    else {
      writer.end(function (err, out) {
        fixOpts(out);
      });
    }
  });

  function fixOpts(out) {
    if (opts.skolem) {
      out = out.replace(/http:\/\/eulersharp\.sourceforge\.net\/\.well-known\/genid\/([a-zA-Z0-9:_]+)#/g, 'http://example.com/blank/');
    }
    if (opts.sort) {
      const lines = out.split('\n');
      lines.sort();
      out = lines.join('\n');
    }
    cb(null, out);
  }
}

module.exports = {
  createRMLValidator: createRMLValidator,
  walkFiles: walkFiles
};