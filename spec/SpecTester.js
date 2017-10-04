#!/usr/bin/env node
var N3 = require('n3'),
  fs = require('fs'),
  url = require('url'),
  path = require('path'),
  request = require('request'),
  exec = require('child_process').exec,
  async = require('async');
require('colors');
const TestHelper = require("../lib/TestHelper");

// How many test cases may run in parallel?
var workers = 1;

// Prefixes
var prefixes = {
  mf:   'http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#',
  rdf:  'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  rdft: 'http://www.w3.org/ns/rdftest#',
  dc:   'http://purl.org/dc/terms/',
  doap: 'http://usefulinc.com/ns/doap#',
  earl: 'http://www.w3.org/ns/earl#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  xsd:  'http://www.w3.org/2001/XMLSchema#',
};

// List predicates
var first = prefixes.rdf + 'first',
  rest = prefixes.rdf + 'rest',
  nil = prefixes.rdf + 'nil';

// Base class for objects that execute W3C spec test cases
function SpecTester(settings) {
  if (!(this instanceof SpecTester))
    return new SpecTester(settings);
  settings = settings || {};
  for (var key in settings)
    this['_' + key] = settings[key];

  // Create the folders that will contain the spec files and results
  [
    this._testFolder   = path.join(__dirname, '../tests/', this._name),
    this._reportFolder = path.join(__dirname, '..', 'reports'),
  ]
    .forEach(function (folder) { fs.existsSync(folder) || fs.mkdirSync(folder); });
}


// # Test suite execution

// Fetches the manifest, executes all tests, and reports results
SpecTester.prototype.run = function () {
  var self = this;
  console.log(this._title.bold);

  // 1. Fetch the tests, execute them, and generate the report
  async.waterfall([
      // 1.1 Fetch and parse the manifest
      self._fetch.bind(self, self._manifest.match(/[^\/]*$/)[0]),
      self._parseManifest.bind(self),

      // 1.2 Execute all tests in the manifest
      function executeTests(manifest, callback) {
        async.mapLimit(manifest.tests, workers,
          // 1.2.1 Execute an individual test
          function (test, callback) {
            async.series({
                actionStream: self._fetch.bind(self, test.action),
                resultStream: self._fetch.bind(self, test.result),
              },
              function (error, results) {
                if (error) return callback(error);
                self._performTest(test, results.actionStream, callback);
              });
          },
          // 1.2.2 Show the summary of all performed tests
          function showSummary(error, tests) {
            var score = tests.reduce(function (sum, test) { return sum + test.success; }, 0);
            manifest.skipped.forEach(function (test) { self._verifyResult(test); });
            console.log(('* passed ' + score +
              ' out of ' + manifest.tests.length + ' tests' +
              ' (' + manifest.skipped.length + ' skipped)').bold);
            callback(error, tests);
          });
      },

      // 2. Generate the EARL report
      function (tests, callback) { self._generateEarlReport(tests, callback); },

      // 3. Return with the proper exit code
      function (tests) {
        process.exit(tests.every(function (test) { return test.success; }) ? 0 : 1);
      },
    ],
    function (error) {
      if (error) {
        console.error('ERROR'.red);
        console.error((error.stack || error.toString()).red);
        process.exit(1);
      }
    });
};

// Fetches and caches the specified file, or retrieves it from disk
SpecTester.prototype._fetch = function (filename, callback) {
  if (!filename) return callback(null, null);
  // TODO generalize: load into a graph (array?) either local, remote, or blank node
  var self = this;
  if (Array.isArray(filename)) {
    return async.mapLimit(filename, workers, function (file, callback) {
      self._fetch(file, callback);
    }, function (err, contents) {
      callback(err, contents.join("\n"));
    });
  }
  var localFile = path.resolve(this._testFolder, filename);
  fs.exists(localFile, function (exists) {
    if (exists)
      fs.readFile(localFile, 'utf8', callback);
    else
      request.get(url.resolve(self._manifest, filename),
        function (error, response, body) { callback(error, body); })
        .pipe(fs.createWriteStream(localFile));
  });
};

// Parses the tests manifest into tests
SpecTester.prototype._parseManifest = function (manifestContents, callback) {
  // Parse the manifest into triples
  var manifest = {}, testStore = new N3.Store(), self = this;
  // TODO maybe also additional contents?
  new N3.Parser({ format: 'text/turtle' }).parse(manifestContents, function (error, triple) {
    // Store triples until there are no more
    if (error)  return callback(error);
    if (triple) return testStore.addTriple(triple.subject, triple.predicate, triple.object);

    // Once all triples are there, get the first item of the test list
    var tests = manifest.tests = [],
      skipped = manifest.skipped = [],
      itemHead = testStore.getObjects('', prefixes.mf + 'entries')[0];
    // Loop through all test items
    let listItems = self._retrieveArray(testStore, itemHead);
    listItems.forEach(function (itemValue) {
      var itemTriples = testStore.getTriples(itemValue, null, null),
        test = { id: itemValue.replace(/^#/, '') };
      itemTriples.forEach(function (triple) {
        var propertyMatch = triple.predicate.match(/#(.+)/);
        if (propertyMatch) {
          test[propertyMatch[1]] = self._isArray(testStore, triple.object) ? self._retrieveArray(testStore, triple.object) : triple.object;
        }
      });
      test.skipped = test.skipped === '"true"^^http://www.w3.org/2001/XMLSchema#boolean';
      (!test.skipped ? tests : skipped).push(test);
    });
    return callback(null, manifest);
  });
};

SpecTester.prototype._isArray = function (store, itemHead) {
  return store.getObjects(itemHead, first).length !== 0;
};

SpecTester.prototype._retrieveArray = function (store, itemHead) {
  var listItems = [];
  while (itemHead && itemHead !== nil) {
    // Find the next item in the list
    listItems.push(store.getObjects(itemHead, first)[0]);

    // Find the next test item
    itemHead = store.getTriples(itemHead, rest, null)[0].object;
  }
  return listItems;
};


// # Individual test execution

// Performs the test by parsing the specified document
SpecTester.prototype._performTest = function (test, actionStream, callback) {
  // Try to parse the specified document
  var resultFile = path.join(this._testFolder, test.id + '-result.ttl'), self = this;
  if (!this._functions[test.function]) {
    throw new Error('Cannot perform unsupported ' + test.function);
  }
  this._functions[test.function](actionStream, function(err, out) {
    fs.writeFile(resultFile, out, 'utf8', function (err) {
      self._verifyResult(test, resultFile, test.result && path.join(self._testFolder, test.result), callback);
    });
  });
};

// Verifies and reports the test result
SpecTester.prototype._verifyResult = function (test, resultFile, correctFile, callback) {
  // Negative tests are successful if an error occurred
  if (test.skipped || test.negative) {
    displayResult(null, !!test.error);
  }
  // Positive tests are successful if the results are equal,
  // or if the correct solution is not given but no error occurred
  else if (!correctFile)
    displayResult(null, !test.error);
  else if (!resultFile)
    displayResult(null, false);
  else
    this._compareResultFiles(resultFile, correctFile, displayResult);

  // Display the test result
  function displayResult(error, success, comparison) {
    console.log(N3.Util.getLiteralValue(test.name).bold + ':',
      N3.Util.getLiteralValue(test.comment),
      (test.skipped ? 'SKIP'.yellow : (success ? 'ok'.green : 'FAIL'.red)).bold);
    if (!test.skipped && (error || !success)) {
      console.log((correctFile ? fs.readFileSync(correctFile, 'utf8') : '(empty)').grey);
      console.log('  was expected, but got'.bold.grey);
      console.log((resultFile ? fs.readFileSync(resultFile, 'utf8') : '(empty)').grey);
      console.log(('  error: '.bold + (test.error || '(none)')).grey);
      if (comparison)
        console.log(('  comparison: ' + comparison).grey);
    }
    test.success = success;
    callback && callback(null, test);
  }
};

// Verifies whether the two result files are equivalent
SpecTester.prototype._compareResultFiles = function (actual, expected, callback) {
  // Try a full-text comparison (fastest)
  async.series({
      actualContents:   fs.readFile.bind(fs,   actual, 'utf8'),
      expectedContents: fs.readFile.bind(fs, expected, 'utf8'),
    },
    function (error, results) {
      // If the full-text comparison was successful, graphs are certainly equal
      if (results.actualContents.trim() === results.expectedContents.trim())
        callback(error, !error);
      // Otherwise, check for proper equality with SWObjects
      else {
        // SWObjects doesn't support N-Quads, so convert to TriG if necessary
        if (/\.nq/.test(expected)) {
          fs.writeFileSync(actual   += '.trig', quadsToTrig(results.actualContents));
          fs.writeFileSync(expected += '.trig', quadsToTrig(results.expectedContents));
        }
        exec('sparql -d ' + expected + ' --compare ' + actual,
          function (error, stdout) {
            if (error) {
              TestHelper.compareTtl(fs.readFileSync(actual, 'utf8'), fs.readFileSync(expected, 'utf8'), function (err) {
                if (err) {
                  return callback(err, false, '');
                }
                return callback(null, true, '');
              })
            } else {
              return callback(error, /^matched\s*$/.test(stdout), stdout);
            }
          });
      }
      function quadsToTrig(nquad) {
        return nquad.replace(/^([^\s]+)\s+([^\s]+)\s+(.+)\s+([^\s"]+)\s*\.$/mg, '$4 { $1 $2 $3 }');
      }
    });
};



// # EARL report generation

// Generate an EARL report with the given test results
SpecTester.prototype._generateEarlReport = function (tests, callback) {
  // Create the report file
  var date = '"' + new Date().toISOString() + '"^^' + prefixes.xsd + 'dateTime',
    app = 'https://github.com/RubenVerborgh/N3.js#n3js', appName = 'n3js',
    assertor = 'http://ruben.verborgh.org/#me', manifest = this._manifest + '#';
  if (this._report) {
    if (this._report.app) {
      app = this._report.app;
    }
    if (this._report.appName) {
      appName = this._report.appName;
    }
    if (this._report.assertor) {
      assertor = this._report.assertor;
    }
  }
  var reportFile = path.join(this._reportFolder, appName + '-earl-report-' + this._name + '.ttl'),
    report = new N3.Writer(fs.createWriteStream(reportFile), {prefixes: prefixes});
  if (this._report) {
    if (this._report.extra) {
      var extraFiles = [].concat(this._report.extra);
      async.mapSeries(extraFiles,
        function (file, done) {
          fs.readFile(file, 'utf8', done);
        },
        function (error, extraContents) {
          async.eachSeries(extraContents, function (extraContent, done) {
            new N3.Parser({format: 'text/turtle'}).parse(extraContent, function (error, triple) {
              // Store triples until there are no more
              if (error) return callback(error);
              if (triple) return report.addTriple(triple.subject, triple.predicate, triple.object);
              done();
            });
          }, addTests);
        });
    } else {
      addTests();
    }
  } else {
    addTests();
  }

  function addTests() {

    report.addTriple(assertor, prefixes.rdf + 'type', prefixes.earl + 'Assertor');

    tests.forEach(function (test, id) {
      var testUrl = manifest + test.id;
      report.addTriple(testUrl, prefixes.rdf + 'type', prefixes.earl + 'TestCriterion');
      report.addTriple(testUrl, prefixes.rdf + 'type', prefixes.earl + 'TestCase');
      report.addTriple(testUrl, prefixes.dc + 'title', test.name);
      report.addTriple(testUrl, prefixes.dc + 'description', test.comment);
      if (Array.isArray(test.action)) {
        test.action.forEach(function (action) {
          report.addTriple(testUrl, prefixes.mf + 'action', url.resolve(manifest, action));
        });
      } else {
        report.addTriple(testUrl, prefixes.mf + 'action', url.resolve(manifest, test.action));
      }
      if (test.result)
        report.addTriple(testUrl, prefixes.mf + 'result', url.resolve(manifest, test.result));
      report.addTriple(testUrl, prefixes.earl + 'assertions', '_:assertions' + id);
      report.addTriple('_:assertions' + id, prefixes.rdf + 'first', '_:assertion' + id);
      report.addTriple('_:assertions' + id, prefixes.rdf + 'rest', prefixes.rdf + 'nil');
      report.addTriple('_:assertion' + id, prefixes.rdf + 'type', prefixes.earl + 'Assertion');
      report.addTriple('_:assertion' + id, prefixes.earl + 'assertedBy', assertor);
      report.addTriple('_:assertion' + id, prefixes.earl + 'test', manifest + test.id);
      report.addTriple('_:assertion' + id, prefixes.earl + 'subject', app);
      report.addTriple('_:assertion' + id, prefixes.earl + 'mode', prefixes.earl + 'automatic');
      report.addTriple('_:assertion' + id, prefixes.earl + 'result', '_:result' + id);
      report.addTriple('_:result' + id, prefixes.rdf + 'type', prefixes.earl + 'TestResult');
      report.addTriple('_:result' + id, prefixes.earl + 'outcome', prefixes.earl + (test.success ? 'passed' : 'failed'));
      report.addTriple('_:result' + id, prefixes.dc + 'date', date);
    });
    report.end(function () {
      callback(null, tests);
    });
  }
};

module.exports = SpecTester;
