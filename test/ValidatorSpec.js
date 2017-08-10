/* global describe, it */

/**
 * Created by bjdmeest on 2/11/2015.
 */
const expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  TestHelper = require('../lib/TestHelper');

const dbMappingsPath = path.resolve(__dirname, '../resources/rml/dbpedia-mappings-en.ttl');

describe.skip('Validator', function () {
  this.timeout(60000);
  const validator = TestHelper.createRMLValidator();
  describe('validate', function () {
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
});
