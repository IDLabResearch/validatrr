OntologyVault = require('./lib/OntologyVault');
const minimist = require('minimist');
const path = require("path");
const fs = require("fs");

const vault = new OntologyVault();
const argOptions = {
  string: ['prefix', 'url'],
  alias: {
    p: 'prefix',
    u: 'url'
  }
};

const argv = minimist(process.argv.slice(2), argOptions);
const prefices = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'resources/ontologies/prefix.json'), 'utf8'));

if (argv.prefix) {
  if (prefices[argv.prefix]) {
    vault.fetchByUrl(prefices[argv.prefix], function (err, ontoTtlPath) {
      console.log(`Written to ${ontoTtlPath}`);
    });
  }
  else {
    vault.fetchByPrefix(argv.prefix, function (err, ontoTtlPath) {
      console.log(`Written to ${ontoTtlPath}`);
    });
  }
}
else if (argv.u) {
  vault.fetchByUrl(argv.uri, function (err, ontoTtlPath) {
    console.log(`Written to ${ontoTtlPath}`);
  });
}
else {
  console.log('Either provide `-p [prefix]` or `-u [URI]` to fetch an ontology into turtle!');
}
