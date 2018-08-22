/* global describe, it */
/**
 * Created by bjdmeest on 30/10/2015.
 */
const expect = require('chai').expect,
  path = require('path'),
  fs = require('fs'),
  TtlFetcher = require('../lib/TtlFetcher');

describe('TtlFetcher', function () {
  const fetcher = new TtlFetcher();
  describe('fetchByPrefix', function () {
    it('should work', function (done) {
      fetcher.fetchByPrefix('rr', function (err, path) {
        expect(err).to.be.null;
        done();
      });
    });
  });
  describe('test', function () {
    this.timeout(60000);
    it('should work', function (done) {
      const owl = fs.readFileSync(path.resolve(__dirname, '../resources/rml/foaf.owl'), 'utf8');
      fetcher._owlToTtl(owl, function (err, ttl) {
        expect(err).to.be.null;
        return done();
      });
    });
  });
});
