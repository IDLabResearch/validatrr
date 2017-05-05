var expect = require("chai").expect;
const Validator = require('../lib/Validator');
var path = require("path");
var fs = require("fs-extra");
var async = require("async");
var execSync = require("child_process").execSync;

var outPath = path.resolve(__dirname, '../tmp');
fs.ensureDir(outPath);

console.log('Gathering the rule files...');
execSync('node gather.js');

console.log('Running the tests');

describe("RDFUnit Validator", function () {
  describe("OWL Profile", function () {
    it('works for all cases', function (done) {
      var profile = 'owl';
      var basePath = path.resolve(__dirname, profile);
      var ontologyPath = path.resolve(basePath, 'ontology.ttl');
      testProfile(profile, basePath, ontologyPath, done);
    });
  });
});

function testProfile(profile, basePath, ontologyPath, cb) {
  let distPath = path.resolve(__dirname, '../dist', 'n3unit-' + profile + '.pvm');
  let queryPath = path.resolve(__dirname, '../resources', 'rules', 'query.n3');
  let profilePath = path.resolve(__dirname, '../profiles', profile + '.n3');

  let validationOpts = {
    queryPath,
    extraFiles: [distPath, profilePath]
  };

  let validator = new Validator(validationOpts);

  var ontologyURI = 'http_example.com_ontology-test-' + profile;
  var writable = fs.createWriteStream(path.resolve(__dirname, '../resources/ontologies', ontologyURI + '.ttl'));
  fs.createReadStream(ontologyPath).pipe(writable);
  writable.on('finish', function () {
    fs.readdir(basePath, function (err, files) {
      async.eachSeries(files, function (file, cb) {
        console.log(`[${(new Date()).toISOString()}]\ttesting ${file}`);
        if (file.toLowerCase().indexOf('correct') >= 0) {
          validate(validator, path.resolve(basePath, file), ontologyURI, function (count) {
            expect(count).to.equal(0);
            cb();
          });
        }
        if (file.toLowerCase().indexOf('wrong') >= 0) {
          validate(validator, path.resolve(basePath, file), ontologyURI, function (count) {
            expect(count).to.be.above(0);
            cb();
          });
        }
      }, cb);
    });
  });
}

function validate(validator, file, ontology, cb) {
  validator.validateStreamFile(file, [ontology], function (err, child) {
    if (err) {
      throw err;
    }
    var out = '';
    var errLog = '';
    child.stdout.on('data', function (data) {
      out += data;
    });
    child.stderr.on('data', function (data) {
      errLog += data;
    });
    child.on('close', function (code) {
      if (code !== 0) {
        throw new Error("Couldn't reason: code " + code);
      }
      var outFile = path.resolve(outPath, 'tmp-' + path.basename(file) + '.n3');
      var outErrFile = path.resolve(outPath, 'tmp-' + path.basename(file) + '_err.n3');
      fs.writeFile(outFile, out, function (err) {
        if (err) {
          throw err;
        }
        fs.writeFile(outErrFile, errLog, function (err) {
          if (err) {
            throw err;
          }
          console.log(`[${(new Date()).toISOString()}]\twritten output of ${file} to ${outFile}`);
          let count = Number(out.match(/:errorCount :count (\d+) ./)[1]);
          cb(count);
        });
      });
    });
  });

}