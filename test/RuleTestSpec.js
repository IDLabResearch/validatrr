/* global describe, it */

const path = require('path'),
  TestHelper = require('../lib/TestHelper');

describe('individual rules', function () {
  const basePath = path.resolve(__dirname, '../resources/rml/rules');
  const patternMap = 'input-%s.ttl';
  const outMap = 'output-%s.ttl';
  const returnMap = 'out-%s.ttl';
  const rmlValidator = TestHelper.createRMLValidator();
  runDescribe('1_no-rdf-type', [1, 2, 3, 4, 5]);
  runDescribe('1b_disjoint', [1]);
  runDescribe('2_incorrect-domain', [1, 2]);
  runDescribe('3_missing dataType', [1, 2, 3, 4, 5]);
  runDescribe('3a_incorrect-datatype', [1, 2, 3, 4]);
  runDescribe('3b_correct-data-type-incompatible-data', [1]);
  runDescribe('4_literal-instead-of-object', [1]);
  runDescribe('5_wrong-range', [1, 2, 3]);
  runDescribe('6_generated-subject-should-have-class', [1]);
  runDescribe('7_rdf-langstring', [1, 2, 3]);
  runDescribe('8_predicate-as-object', [1, 2, 3, 4]);
  runDescribe('9_deprecated-property', [1, 2]);

  function runDescribe(name, tests) {
    describe(name, function () {
      let myPath = path.resolve(basePath, name);
      tests.forEach(testName => {
        runTest(testName, myPath);
      });
    });

    function runTest(name, myPath) {
      it('should fix #' + name, function (done) {
        let paths = TestHelper.createPaths([patternMap, outMap, returnMap], name, myPath);
        TestHelper.checkMap(rmlValidator, paths[0], paths[1], paths[2], done);
      });
    }
  }
});
