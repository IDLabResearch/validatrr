/**
 * Created by bjdmeest on 2/11/2015.
 */
const fs = require('fs'),
  path = require('path'),
  TestHelper = require('./lib/TestHelper');

const validator = TestHelper.createRMLValidator();

fs.readFile(path.resolve(__dirname, '../resources/rml/rules/1_no-rdf-type/input-2.ttl'), 'utf8', function (err, ttl) {
  if (err) {
    throw err;
  }
  const t0 = new Date();
  validator.validate(ttl, function (err, out) {
    if (err) {
      throw err;
    }
    console.log(out);
    console.log((new Date()).getTime() - t0.getTime());
  });
});
