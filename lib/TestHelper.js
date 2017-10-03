/* global it */

const fs = require('fs'),
  path = require('path'),
  Validator = require('../lib/Validator');
const N3 = require("n3");
const expect = require('chai').expect;
const async = require("async");

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

function createProfileValidator(profile, output = '') {
  let basePath = path.resolve(__dirname, '..');

  let distPath = path.resolve(basePath, 'dist', 'n3unit.pvm');
  let queryPath = path.resolve(basePath, 'resources', 'rules', 'query' + (output ? '_' + output : '') + '.n3');
  let profilePath = path.resolve(basePath, 'profiles', profile + '.n3');
  const logCodes = path.resolve(__dirname, '../resources/rml/logCodes.ttl'); // TODO configurable

  let validationOpts = {
    queryPath,
    extraFiles: [distPath, profilePath, logCodes]
  };

  return new Validator(validationOpts);
}

function fetchFiles(basePath, cb) {
  const bugFiles = [];
  fs.readdir(basePath, function (err, files) {
    for (let i = 0; i < files.length; i++) {
      const inputFile = files[i];
      const matches = /^(.+)_wrong.ttl$/i.exec(inputFile);
      if (matches) {
        bugFiles.push({
          name: path.resolve(basePath, inputFile),
          file: path.resolve(basePath, inputFile),
          output: path.resolve(basePath, matches[1] + '_output.ttl')
        });
      }
    }
    cb(bugFiles);
  });
}

function fetchNestedFiles(basePath, cb) {
  const bugFiles = [];
  fs.readdir(basePath, function (err, files) {
    async.forEachLimit(files, 4, function (file, done) {
      fs.stat(path.resolve(basePath, file), function (err, stat) {
        if (stat.isDirectory()) {
          const rulePath = path.resolve(basePath, file);
          fs.readdir(rulePath, function (err, files) {
            for (let i = 0; i < files.length; i++) {
              const inputFile = files[i];
              const matches = /^input-(\d+).ttl$/.exec(inputFile);
              if (matches) {
                bugFiles.push({
                  name: file + '/' + inputFile,
                  file: path.resolve(rulePath, inputFile),
                  output: path.resolve(rulePath, 'output-' + matches[1] + '.ttl')
                });
              }
            }
            done();
          });
        }
      });
    }, function (err) {
      cb(err, bugFiles);
    });
  });
}

function walkFiles(bugFiles, processFile = null, validator = null) {
  processFile = processFile || function () {
    };
  validator = validator || createRMLValidator();
  for (let i = 0; i < bugFiles.length; i++) {
    (function (opt) {
      it(opt.name + ' should be solved', function (done) {
        this.timeout(10000);
        fs.readFile(opt.file, 'utf8', function (err, ttl) {
          if (err) {
            throw err;
          }
          validator.validate(ttl, null, function (err, out) {
            if (err) {
              throw err;
            }
            processFile(opt.file, out);
            fs.readFile(opt.output, 'utf8', function (err, base) {
              if (err) {
                throw err;
              }
              toNTriples(out, {skolem: true, sort: true}, function (err, outN) {
                if (err) {
                  throw err;
                }
                toNTriples(base, {skolem: true, sort: true}, function (err, baseN) {
                  if (err) {
                    throw err;
                  }
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

function createPaths(arr, config, base) {
  let res = [];
  arr.forEach(p => {
    res.push(path.resolve(base, p.replace('%s', config)));
  });
  return res;
}

function check(done, fn) {
  try {
    fn();
  }
  catch (e) {
    done(e);
  }
}

function compareTtl(from, to, done) {
  toNTriples(from, {skolem: true, sort: true}, function (err, fromN) {
    if (err) {
      throw err;
    }
    toNTriples(to, {skolem: true, sort: true}, function (err, toN) {
      if (err) {
        throw err;
      }
      const fromNlines = fromN.split('\n');
      const toNLines = toN.split('\n');
      try {
        expect(fromNlines).to.deep.equal(toNLines);
        done();
      } catch (e) {
        return done(e);
      }
    });
  });
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
      // TODO there's _got_ to be a better way
      out = out.replace(/http:\/\/eulersharp\.sourceforge\.net\/\.well-known\/genid\/([a-zA-Z0-9:_]+)#sk_(\d+)/g, 'http://example.com/blank/A');
      out = out.replace(/http:\/\/eulersharp\.sourceforge\.net\/\.well-known\/genid\/([a-zA-Z0-9:_]+)#bn_(\d+)/g, 'http://example.com/blank/B');
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
  createProfileValidator: createProfileValidator,
  fetchFiles: fetchFiles,
  fetchNestedFiles: fetchNestedFiles,
  walkFiles: walkFiles,
  createPaths: createPaths,
  compareTtl: compareTtl
};
