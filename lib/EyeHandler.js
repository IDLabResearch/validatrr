/**
 * Created by bjdmeest on 29/10/2015.
 */
const exec = require('child_process').exec,
  spawn = require('child_process').spawn,
  os = require('os');
const debug = require('debug')('N3Unit:eye');

const fileOrder = {
  'pvm': 5,
  'n3p': 3,
  'n3': 2,
  'ttl': 1
};

class EyeHandler {
  constructor(opts) {
    opts = opts || {};
    opts.eyePvmPath = opts.eyePvmPath || os.platform() === 'win32' ? '"C:/Program Files/eye/lib/eye.pvm"' : '/opt/eye/lib/eye.pvm';
    opts.swiplPath = opts.swiplPath || os.platform() === 'win32' ? '"C:/Program Files/swipl/bin/swipl.exe"' : '/usr/bin/swipl';
    this.opts = opts;
  }

  reason(opts, dataFiles, query, cb) {
    opts = opts || {};
    dataFiles = dataFiles || [];

    for (let i = 0; i < dataFiles.length; i++) {
      dataFiles[i].path = '"' + dataFiles[i].path + '"';
    }

    debug('parsing input parameters');

    const parameters = argsDataFiles(dataFiles, opts, this.opts.swiplPath, this.opts.eyePvmPath, this.opts.ram);
    let cmd = parameters.cmd;
    let args = parameters.args;

    if (query) {
      args.push('--query');
      args.push('"' + query + '"');
    }

    const buffer = 1024 * 1024 * 2; // 2 MB

    debug('executing following arguments: ' + cmd + ' ' + args.join(' '));

    exec(cmd + ' ' + args.join(' '), {maxBuffer: buffer}, function (err, stdout, stderr) {
      cb(err, stdout, stderr);
    });
  }

  reasonStream(opts, dataFiles, query, cb) {
    opts = opts || {};
    dataFiles = dataFiles || [];

    debug('parsing input parameters');

    const parameters = argsDataFiles(dataFiles, opts, this.opts.swiplPath, this.opts.eyePvmPath, this.opts.ram);
    let cmd = parameters.cmd;
    let args = parameters.args;

    if (query) {
      args.push('--query');
      args.push(query);
    }

    args = args.map(function (arg) {
      return arg.replace(/\\/g, '/');
    });

    debug('executing following arguments: ' + cmd + ' ' + args.join(' '));

    try {
      let child = spawn(cmd, args, {shell: true});
      cb(null, child);
    } catch (e) {
      cb(e);
    }
  }

}

function argsDataFiles(files, opts, swiplPath, eyePvmPath, ram) {
  let i;
  files.sort(function (a, b) {
    return fileOrder[b.type] - fileOrder[a.type];
  });

  if (files.length > 1 && files[1].type === 'pvm') {
    throw new Error('multiple pvm files entered!');
  }
  const args = [];
  let pvmPath = eyePvmPath;

  if (ram) {
    args.push('-G' + ram);
    args.push('-T' + ram);
    args.push('-L' + ram);
  }

  if (files[0] && files[0].type === 'pvm') {
    pvmPath = files[0].path;
    files.splice(0, 1);
  }
  args.push('-x');
  args.push(pvmPath);
  args.push('--');

  for (i = 0; i < opts.length; i++) {
    args.push(opts[i].key);
    if (opts.value) {
      args.push(opts[i].value);
    }
  }

  for (i = 0; i < files.length; i++) {
    if (files[i].type === 'n3p') {
      args.push('--plugin');
    }
    args.push(files[i].path);
  }

  return {
    args: args,
    cmd: swiplPath
  };
}

module.exports = EyeHandler;
