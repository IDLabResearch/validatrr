const path = require('path');
const EyeHandler = require('./lib/EyeHandler');

let data = [
  // 'tests/shacl/core/node/class-001.ttl',
  // 'tests/shacl/core/node/class-002.ttl',
  'tests/shacl/core/node/class-003.ttl',
];

let baseRulesPath = path.resolve(__dirname, 'dist/n3unit.pvm');
let transPath = path.resolve(__dirname, 'resources/transShacl.n3');

let queryPath = path.resolve(__dirname, 'resources/rules/query.n3');

let eye = new EyeHandler();

let dataFiles = [];
data.forEach(dat => {
  let datPath = path.resolve(__dirname, dat);
  dataFiles.push({path: datPath, type: 'ttl'});
});
dataFiles.push({path: baseRulesPath, type: 'pvm'});
dataFiles.push({path: transPath, type: 'n3'});

eye.reason([{key: '--nope'}], dataFiles, queryPath, function (err, stdout, stderr) {
  console.log(stderr);
  console.log(stdout);
});

