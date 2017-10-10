#!/usr/bin/env node
var path = require('path');
var SpecTester = require('./SpecTester');
const TestHelper = require("../lib/TestHelper");
let validator = TestHelper.createProfileValidator('owl', 'count');
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
}).run();
