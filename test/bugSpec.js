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
  it('should fix #correct.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'correct.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #correct.02', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'correct.02', basePath);
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
  it('should fix #owl-asymp.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-asymp.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-asymp.02', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-asymp.02', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-card.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-card.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-card.02', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-card.02', basePath);
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
  it('should fix #owl-disjp.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-disjp.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-disjp.02', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-disjp.02', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-irrefp.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-irrefp.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-irrefp.02', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-irrefp.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-typedep.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-typedep.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #owl-typepdep.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'owl-typepdep.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #rdfs-range.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'rdfs-range.01', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #rdfs-range.02', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'rdfs-range.02', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #rdfs-range.03', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'rdfs-range.03', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #rdfs-range.04', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'rdfs-range.04', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #rdfs-range.05', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'rdfs-range.05', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #rdfs-range.06', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'rdfs-range.06', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #rdfs-range.07', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'rdfs-range.07', basePath);
    checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
  });
  it('should fix #rr-type.01', function (done) {
    let paths = TestHelper.createPaths([patternMap, outMap, returnMap], 'rr-type.01', basePath);
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
