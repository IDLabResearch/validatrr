const spawn = require('child_process').spawn;
const path = require('path');
const os = require("os");
const fs = require("fs");
const N3 = require('n3');

let profile = 'owl';
let distPath = path.resolve(__dirname, 'dist', 'n3unit-owl.pvm');
let ontologyPath = path.resolve(__dirname, 'test', profile, 'ontology.ttl');
let profilePath = path.resolve(__dirname, 'profiles', profile + '.n3');
let dataPath = path.resolve(__dirname, 'test', profile, 'INVFUNC_Wrong.ttl');
let queryPath = path.resolve(__dirname, '..', 'constraint-rules', 'examples', 'query.n3');

let files = [{
  type: 'pvm',
  path: distPath
}, {
  type: 'ttl',
  path: ontologyPath
}, {
  type: 'n3',
  path: profilePath
}];

const profileDir = path.resolve(__dirname, 'test', profile);
let testFiles = fs.readdirSync(profileDir);

let realStart = new Date();

let tested = 0;

let p = Promise.resolve();
testFiles.forEach(function (file) {
  if (file.toLowerCase().indexOf('correct') > 0 || file.toLowerCase().indexOf('wrong') > 0) {
    tested++;
    let myFiles = JSON.parse(JSON.stringify(files));
    myFiles.push({type: 'ttl', path: path.resolve(profileDir, file)});
    p = p.then(function () {
      // console.log(`doing ${file}`);
      let start = new Date();
      return eye(myFiles, queryPath).then(function ({out, err, numbers}) {
        let end = new Date();
        let timing = end.getTime() - start.getTime();
        // console.log(`it took ${timing}`);
        var parser = N3.Parser();
        var store = N3.Store();
        return new Promise(function (fulfill, reject) {
          parser.parse(out, function (err, triple, prefixes) {
            if (triple) {
              store.addTriple(triple);
            }
            else {
              if (store.getTriples().length === 0 && file.toLowerCase().indexOf('correct') > 0) {
                fulfill(true);
              } else if (store.getTriples().length > 0 && file.toLowerCase().indexOf('wrong') > 0) {
                fulfill(true);
              }
              else {
                fulfill(false);
                console.error(out);
              }
            }
          });
        });
        // console.log(out);
        // console.error(err);
      }).then(function (success) {
        if (success) {
          // console.log(`success for ${file}`);
        }
        else {
          console.error(`failure for ${file}`);
        }
      }).catch(function (err) {
        console.error(err);
      });
    });
  }
  else {
    p = p.then(function () {
      return Promise.resolve();
    });
  }
});

p.then(function() {
  let realEnd = new Date();
  let timing = realEnd.getTime() - realStart.getTime();
  console.log(`it took ${timing} for ${tested} files (${timing / tested} per file)`);
});

function eye(files = [], query = null) {

  const eyePath = os.platform() === 'win32' ? "C:/Program Files/eye/bin/eye.cmd" : '/opt/eye/bin/eye.sh';
  const swiplPath = os.platform() === 'win32' ? "swipl" : '/usr/bin/swipl';

  const type = files[0].type === 'pvm' ? 'pvm' : '';
  const args = createArgs(files, query);
  return new Promise(function (fulfill, reject) {
    let child;
    if (type === 'pvm') {
      child = spawn(swiplPath, args);
    }
    else {
      child = spawn(eyePath, args);
    }
    let output = '';
    let errorLog = '';
    child.stdout.on('data', function (data) {
      output += data;
    });

    child.stderr.on('data', function (data) {
      errorLog += data;
    });

    child.on('exit', function () {
      const numbers = errorLog.match(/reasoning (\d+)[\s\S]+?(\d+)/);
      if (errorLog.indexOf('** ERROR **') >= 0) {
        reject(errorLog);
      }
      fulfill({out: output, err: errorLog, numbers});
    });
  });

  function createArgs(files, query) {
    const thisArgs = [];
    let i = 0;
    if (files[0].type === 'pvm') {
      thisArgs.push('-x');
      thisArgs.push(files[0].path.replace(/\\/g, '/'));
      thisArgs.push('--');
      i = 1;
    }
    for (i; i < files.length; i++) {
      if (files[i].type === 'n3p') {
        thisArgs.push('--plugin');
      }
      thisArgs.push(files[i].path.replace(/\\/g, '/'));
    }
    if (query) {
      thisArgs.push('--query');
      thisArgs.push(query.replace(/\\/g, '/'));
    }
    thisArgs.push('--nope');
    return thisArgs;
  }
}
