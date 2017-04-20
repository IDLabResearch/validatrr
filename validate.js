const spawn = require('child_process').spawn;
const path = require('path');
const os = require("os");
const fs = require("fs");
const N3 = require('n3');
const Validator = require('./lib/Validator');

let profile = 'owl';
let distPath = path.resolve(__dirname, 'dist', 'n3unit-owl.pvm');
let queryPath = path.resolve(__dirname, '..', 'constraint-rules', 'examples', 'query.n3');
let profilePath = path.resolve(__dirname, 'profiles', profile + '.n3');

let validator = new Validator({
  queryPath,
  extraFiles: [distPath, profilePath]
});

let sourcePath = path.resolve(__dirname, '..', 'dataset-downloader', 'output/1000/foaf/897fe17c9c53b2890eeb0328d5d0ad63/897fe17c9c53b2890eeb0328d5d0ad63');

let sourceData = fs.readFileSync(sourcePath, 'utf8');

const startTime = new Date();
validator.validate(sourceData, ['http://purl.org/dc/terms/'], function (err, stdout, stderr) {
  const endTime = new Date();
  if (err) {
    throw err;
  }
  console.log(stdout);
  console.error(stderr);
  console.log(`done in ${endTime.getTime() - startTime.getTime()}!`);
});
