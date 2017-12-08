/* global describe, run, it */

const fs = require('fs'),
  path = require('path'),
  TestHelper = require('../lib/TestHelper');

let checkMap = TestHelper.checkMap;

describe('individual bugs', function () {
  this.timeout(8000);
  const basePath = path.resolve(__dirname, './bugs');
  const patternMap = '%s.mapping.rml.ttl';
  const outMap = '%s.out.ttl';
  const returnMap = '%s.test-output.ttl';
  const rmlValidator = TestHelper.createRMLValidator();
  it('should fix #3', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 3, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #6', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 6, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #7.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], '7.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #7.02', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], '7.02', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #8', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 8, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #9.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], '9.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #10.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], '10.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #10.02', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], '10.02', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #19', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 19, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-disjc.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-disjc.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-disjc.02', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-disjc.02', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-disjc.03', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-disjc.03', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #one-lang.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'one-lang.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #one-lang.02', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'one-lang.02', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-disjp.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-disjp.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-disjp.02', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-disjp.02', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #104', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 104, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #106', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 106, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #107', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 107, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
});

describe('all bugs', function () {
  const basePath = path.resolve(__dirname, './bugs');
  fs.readdir(basePath, function (err, files) {
    const bugFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const matches = /^(\d+).mapping+.rml+.ttl$/.exec(file);
      if (matches) {
        bugFiles.push({
          name: file,
          file: path.resolve(basePath, file),
          output: path.resolve(basePath, matches[1] + '.out.ttl')
        });
      }
    }
    describe('bugs from files', function () {
      TestHelper.walkFiles(bugFiles, function (inputFile, out) {
        fs.writeFileSync(path.resolve(inputFile.replace('.mapping.rml.ttl', '.test-output.ttl')), out, 'utf8');
        console.log(out);
      });
    });
    run();
  });
});
