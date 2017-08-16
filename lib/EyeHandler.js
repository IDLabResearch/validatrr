/**
 * Created by bjdmeest on 29/10/2015.
 */
const exec = require('child_process').exec,
  spawn = require('child_process').spawn,
  os = require('os');

const EyeHandler = function (opts) {
  opts = opts || {};
  opts.eyePath = opts.eyePath || os.platform() === 'win32' ? '"C:/Program Files/eye/bin/eye.cmd"' : '/opt/eye/bin/eye.sh';
  opts.swiplPath = opts.swiplPath || os.platform() === 'win32' ? '"C:/Program Files/swipl/bin/swipl.exe"' : '/usr/bin/swipl';
  this.opts = opts;
};

EyeHandler.prototype.constructor = EyeHandler;

const fileOrder = {
  'pvm': 5,
  'n3p': 3,
  'n3': 2,
  'ttl': 1
};

EyeHandler.prototype.reason = function (opts, dataFiles, query, cb) {
  opts = opts || {};
  dataFiles = dataFiles || [];

  for (let i = 0; i < dataFiles.length; i++) {
    dataFiles[i].path = '"' + dataFiles[i].path + '"';
  }

  const parameters = argsDataFiles(dataFiles, opts, this.opts.swiplPath, this.opts.eyePath, this.opts.ram);
  let cmd = parameters.cmd;
  let args = parameters.args;

  if (query) {
    args.push('--query');
    args.push('"' + query + '"');
  }

  const buffer = 1024 * 1024 * 2; // 2 MB

  exec(cmd + ' ' + args.join(' '), {maxBuffer: buffer}, function (err, stdout, stderr) {
    cb(err, stdout, stderr);
  });
};

EyeHandler.prototype.reasonStream = function (opts, dataFiles, query, cb) {
  opts = opts || {};
  dataFiles = dataFiles || [];

  const parameters = argsDataFiles(dataFiles, opts, this.opts.swiplPath, this.opts.eyePath, this.opts.ram);
  let cmd = parameters.cmd;
  let args = parameters.args;

  if (query) {
    args.push('--query');
    args.push(query);
  }

  args = args.map(function (arg) {
    return arg.replace(/\\/g, '/');
  });

  try {
    let child = spawn(cmd, args);
    cb(null, child);
  } catch (e) {
    cb(e);
  }
};

function argsDataFiles(files, opts, swiplPath, eyePath, ram) {
  let i;
  files.sort(function (a, b) {
    return fileOrder[b.type] - fileOrder[a.type];
  });

  if (files.length > 1 && files[1].type === 'pvm') {
    throw new Error('multiple pvm files entered!');
  }
  const args = [];
  let cmd;

  if (files[0] && files[0].type === 'pvm') {
    cmd = swiplPath;
    if (ram) {
      args.push('-G' + ram);
      args.push('-T' + ram);
      args.push('-L' + ram);
    }
    args.push('-x');
    args.push(files[0].path);
    args.push('--');
    files.splice(0, 1);
  }
  else {
    cmd = eyePath;
  }
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
    cmd: cmd
  };
}

module.exports = EyeHandler;
