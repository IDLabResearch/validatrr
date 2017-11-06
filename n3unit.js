const path = require('path');
const EyeHandler = require('./lib/EyeHandler');

let data = [
//   'tests/shacl/core/node/and-001.ttl', // TODO
//   'tests/shacl/core/node/and-002.ttl', // TODO
//   'tests/shacl/core/node/class-001.ttl',
//   'tests/shacl/core/node/class-002.ttl',
//   'tests/shacl/core/node/class-003.ttl',
//   'tests/shacl/core/node/closed-001.ttl', // TODO
//   'tests/shacl/core/node/closed-002.ttl', // TODO
//   'tests/shacl/core/node/datatype-001.ttl', // TODO can't parse non-integer values, doesn't automatically assing xsd:integer to numbers
//   'tests/shacl/core/node/datatype-002.ttl',
//   'tests/shacl/core/node/disjoint-001.ttl',
//   'tests/shacl/core/node/equals-001.ttl', // TODO
//   'tests/shacl/core/node/hasValue-001.ttl', // TODO
//   'tests/shacl/core/node/in-001.ttl', // TODO
//   'tests/shacl/core/node/languageIn-001.ttl', // TODO
//   'tests/shacl/core/node/maxExclusive-001.ttl', // TODO
//   'tests/shacl/core/node/maxInclusive-001.ttl', // TODO
//   'tests/shacl/core/node/maxLength-001.ttl', // TODO
//   'tests/shacl/core/node/minExclusive-001.ttl', // TODO
//   'tests/shacl/core/node/minInclusive-001.ttl', // TODO
//   'tests/shacl/core/node/minInclusive-002.ttl', // TODO
//   'tests/shacl/core/node/minInclusive-003.ttl', // TODO
//   'tests/shacl/core/node/minLength-001.ttl', // TODO
//   'tests/shacl/core/node/node-001.ttl', // TODO
//   'tests/shacl/core/node/nodeKind-001.ttl', // TODO
//   'tests/shacl/core/node/not-001.ttl', // TODO
//   'tests/shacl/core/node/not-002.ttl', // TODO
//   'tests/shacl/core/node/or-001.ttl', // TODO
//   'tests/shacl/core/node/pattern-001.ttl', // TODO
//   'tests/shacl/core/node/pattern-002.ttl', // TODO
//   'tests/shacl/core/node/xone-001.ttl', // TODO
//   'tests/shacl/core/node/xone-duplicate.ttl', // TODO
//   'tests/shacl/core/node/qualified-001.ttl', // TODO
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

