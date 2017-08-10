/* global describe, run */

const fs = require('fs'),
  path = require('path'),
  async = require('async'),
  TestHelper = require('../lib/TestHelper');

describe('all rules', function () {
  const basePath = path.resolve(__dirname, '../resources/rml/rules');
  const bugFiles = [];
  fs.readdir(basePath, function (err, files) {
    async.forEachLimit(files, 4, function (file, done) {
      fs.stat(path.resolve(basePath, file), function (err, stat) {
        if (stat.isDirectory()) {
          const rulePath = path.resolve(basePath, file);
          fs.readdir(rulePath, function (err, files) {
            for (let i = 0; i < files.length; i++) {
              const inputFile = files[i];
              const matches = /^input-(\d+).ttl$/.exec(inputFile);
              if (matches) {
                bugFiles.push({
                  name: file + '/' + inputFile,
                  file: path.resolve(rulePath, inputFile),
                  output: path.resolve(rulePath, 'output-' + matches[1] + '.ttl')
                });
              }
            }
            done();
          });
        }
      });
    }, function (err) {
      describe('rule test cases', function () {
        TestHelper.walkFiles(bugFiles, function (inputFile, out) {
          console.log(out);
          fs.writeFileSync(inputFile.replace(/input-(\d+).ttl$/, 'out-$1.ttl'), out, 'utf8');
        });
      });
      run();
    });
  });
});
