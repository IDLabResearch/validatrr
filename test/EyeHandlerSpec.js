/* global describe, it */

/**
 * Created by bjdmeest on 29/10/2015.
 */
const expect = require('chai').expect,
  EyeHandler = require('../lib/EyeHandler');

describe('EyeHandler', function () {
  const handler = new EyeHandler();
  describe('reason', function () {
    it('should work', function (done) {
      handler.reason([{key: '--nope'}], null, null, function (err, out) {
        expect(err).to.be.null;
        done();
      });
    });
  });
});