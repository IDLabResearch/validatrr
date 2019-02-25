/* global describe, run */

const fs = require('fs'),
  path = require('path'),
  async = require('async'),
  TestHelper = require('../lib/TestHelper'),
  Validator = require('../lib/Validator');

describe('all rules', function () {
  const basePath = path.resolve(__dirname, '../resources/rules');
  const bugFiles = [];
  fs.readdir(basePath, function (err, files) {
    async.forEachLimit(files, 4, function (file, done) {
      fs.stat(path.resolve(basePath, file), function (err, stat) {
        if (err) {
          return done(err);
        }
        if (stat.isDirectory()) {
          const rulePath = path.resolve(basePath, file);
          try {
            fs.statSync(path.resolve(rulePath, 'constraint.ttl'));
            const validator = createValidator(path.resolve(rulePath, 'constraint.ttl'));
            bugFiles.push({
              name: file,
              file: path.resolve(rulePath, 'data.ttl'),
              output: path.resolve(basePath, '../../tests/owl-rdfunit/output_wrong_1.ttl'),
              validator
            });
          } catch (e) {
            // nothing
          }
        }
        done();
      });
    }, function (err) {
      if (err) {
        throw err;
      }
      describe('rule test cases', function () {
        TestHelper.walkFiles(bugFiles, function (inputFile, out) {
          console.log(out);
          // fs.writeFileSync(inputFile.replace(/input-(\d+).ttl$/, 'out-$1.ttl'), out, 'utf8');
        });
      });
      run();
    });
  });
});

describe.only('A42', function () {
  validate('A42_Optional_Properties', 'correct');
});

describe.only('A43', function () {
  validate('A43_Repeatable_Properties', 'wrong_1');
});

describe.only('A44', function () {
  validate('A44_Conditional_Properties', 'wrong_1');
});

describe.only('A45', function () {
  validate('A45_Recommended_Properties', 'wrong_1');
});

describe.only('A78', function () {
  validate('A78_Conjunction', 'wrong_1');
});

describe.only('A79', function () {
  validate('A79_Disjunction', 'wrong_1');
});

describe.only('A80', function () {
  validate('A80_Negation', 'wrong_1');
});

describe.only('A81', function () {
  validate('A81_Default_Values', 'correct');
});


function validate(name, output) {
  const basePath = path.resolve(__dirname, '../resources/rules');
  const rulePath = path.resolve(basePath, name);
  const validator = createValidator(path.resolve(rulePath, 'constraint.ttl'));
  const bugFiles = [];
  bugFiles.push({
    name: name,
    file: path.resolve(rulePath, 'data.ttl'),
    output: path.resolve(basePath, `../../tests/owl-rdfunit/output_${output}.ttl`),
    validator
  });
  TestHelper.walkFiles(bugFiles, function (inputFile, out) {
    console.log(out);
    // fs.writeFileSync(inputFile.replace(/input-(\d+).ttl$/, 'out-$1.ttl'), out, 'utf8');
  });
}

function createValidator(constraintPath) {
  let basePath = path.resolve(__dirname, '..');

  let distPath = path.resolve(basePath, 'dist', 'n3unit.pvm');
  let queryPath = path.resolve(basePath, 'resources', 'rules', 'query_count.n3');
  const logCodes = path.resolve(__dirname, '../resources/rml/logCodes.ttl'); // TODO configurable

  let validationOpts = {
    queryPath,
    extraFiles: [distPath, constraintPath, logCodes]
  };

  return new Validator(validationOpts);
}
