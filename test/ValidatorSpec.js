/* global describe, it, run */

/**
 * Created by bjdmeest on 2/11/2015.
 */
const expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  TestHelper = require('../lib/TestHelper');

const dbMappingsPath = path.resolve(__dirname, '../resources/Mapping_en_Infobox_artist.ttl');

describe('Validator', function () {
  this.timeout(60000);
  const validator = TestHelper.createRMLValidator();
  validator.removeReasoningParam('--nope');
  describe('validate RML validator', function () {
    it('should work', function (done) {
      fs.readFile(dbMappingsPath, 'utf8', function (err, ttl) {
        expect(err).to.be.null;
        var t0 = new Date();
        validator.validate(ttl, null, function (err, out) {
          expect(err).to.be.null;
          console.log(out);
          console.log((new Date()).getTime() - t0.getTime());
          done();
        });
      });
    });
  });

  describe.skip('validate profile', function () {
    const validator = TestHelper.createProfileValidator('rml-rdfunit', 'rdfunit');
    const basePath = path.resolve(__dirname, '../resources/rml/rules');
    TestHelper.fetchNestedFiles(basePath, function (err, bugFiles) {
      describe('rml-rdfunit test cases', function () {
        TestHelper.walkFiles(bugFiles, function (inputFile, out) {
          console.log(out);
          fs.writeFileSync(inputFile.replace(/input-(\d+).ttl$/, 'out-$1.ttl'), out, 'utf8');
        }, validator);
      });
      run();
    });
  });
});
