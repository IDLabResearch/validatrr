/* global describe, run, it */

const fs = require('fs'),
  path = require('path'),
  TestHelper = require('../lib/TestHelper');
const ValidationFactory = require('../lib/ValidationFactory');

describe('individual bugs', function () {
  this.timeout(3000);
  const basePath = path.resolve(__dirname, './bugs');
  const patternMap = '%s.mapping.rml.ttl';
  const outMap = '%s.out.ttl';
  const returnMap = '%s.test-output.ttl';
  const factory = new ValidationFactory();
  const rmlValidator = factory.createRMLValidator();
  it('should fix #3', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 3, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #8', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 8, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #19', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 19, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #20', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 20, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #100', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 100, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #101', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 101, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #102', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 102, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #103', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 103, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #104', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 104, basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #105', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 105, basePath);
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

function checkMap(validator, inputPath, shouldPath, outPath = null, done) {
  validator.validate({path: inputPath}, null, null, function (err, out) {
    if (err) {
      throw err;
    }
    if (outPath) {
      fs.writeFileSync(outPath, out, 'utf8');
    }
    fs.readFile(shouldPath, 'utf8', function (err, base) {
      if (err) {
        if (err.code === 'ENOENT') {
          fs.writeFileSync(shouldPath, '', 'utf8');
          base = '<a> <b> <c> .';
        } else {
          throw err;
        }
      }
      TestHelper.compareTtl(out, base, done);
    });
  });
}
