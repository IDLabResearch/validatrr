#!/usr/bin/env node
var path = require('path');
var SpecTester = require('./SpecTester');
new SpecTester({
  name: 'owl-rdfunit',
  title: 'RDFUnit - OWL profile',
  manifest: path.resolve(__dirname, '../tests/owl-rdfunit/manifest.ttl'),
}).run();
