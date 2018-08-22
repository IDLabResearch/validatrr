/* global describe, it */
/**
 * Created by bjdmeest on 30/10/2015.
 */
const expect = require('chai').expect,
  path = require('path'),
  fs = require('fs'),
  OntologyVault = require('../lib/OntologyVault');

describe('OntologyVault', function () {
  const vault = new OntologyVault();
  describe('fetchByPrefix', function () {
    it('should work', function (done) {
      vault.fetchByPrefix('rr', function (err, path) {
        expect(err).to.be.null;
        done();
      });
    });
  });
});
