/* global describe, run */

const fs = require('fs'),
  path = require('path'),
  TestHelper = require('../lib/TestHelper');

describe('all bugs', function () {
  const basePath = path.resolve(__dirname, './bugs');
  fs.readdir(basePath, function (err, files) {
    const bugFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const matches = /^(\d+).mapping+.rml+.ttl$/.exec(file);
      if (matches) {
        bugFiles.push({name: file, file: path.resolve(basePath, file), output: path.resolve(basePath, matches[1] + '.out.ttl')});
      }
    }
    describe('bugs from files', function () {
      TestHelper.walkFiles(bugFiles, function (inputFile, out) {
        fs.writeFileSync(path.resolve(inputFile.replace('.mapping.rml.ttl', '.output.ttl')), out, 'utf8');
        console.log(out);
      });
    });
    run();
  });
});
