#!/usr/bin/env node
var path = require('path');
var SpecTester = require('./SpecTester');
const TestHelper = require("../lib/TestHelper");
let validator = TestHelper.createProfileValidator('owl');
validator.opts.extraFiles.push(path.resolve(__dirname, '../resources/rdfs.n3'));
validator.opts.extraFiles.push(path.resolve(__dirname, '../resources/rules/reasoning/rdfsResource.n3'));
// validator.opts.extraFiles.push(path.resolve(__dirname, '../resources/rules/reasoning/rdfsSubClassOf.n3'));
var t0 = new Date();
new SpecTester({
  name: 'owl-rdfunit',
  title: 'RDFUnit - OWL profile',
  manifest: path.resolve(__dirname, '../tests/owl-rdfunit/manifest.ttl'),
  report: {
    extra: path.resolve(__dirname, '../tests/owl-rdfunit/application.ttl'),
    assertor: 'https://ben.de-meester.org/#me',
    app: 'http://www.example.com/fnos#n3unit',
    appName: 'n3unit',
  },
  functions: {
    'http://www.example.com/fnos#rdfunit_owl': function (actionStream, cb) {
      validator.validateByOntologies(actionStream, null, null, cb);
    }
  }
}).run(function(e, code) {
  var t1 = new Date();
  console.log(`time: ${t1.getTime() - t0.getTime()} ms`);
  if (e) {
    console.error('ERROR'.red);
    console.error((error.stack || error.toString()).red);
    process.exit(1);
  }
  process.exit(code);
});
