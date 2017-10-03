/**
 * @interface
 */
const fs = require("fs-extra");
const path = require('path');
const EyeHandler = require('./EyeHandler');

class AbstractValidator {
  constructor(opts) {
    opts = opts || {};
    opts = Object.assign({},
      {
        tmpPath: path.resolve(__dirname, '../tmp'),
        queryPath: path.resolve(__dirname, '../resources/rule.n3'),
        extraFiles: [],
        reasoningParams: [{key: '--nope'}, {key: '--no-qvars'}]
      }, opts);
    fs.ensureDirSync(opts.tmpPath);

    this.opts = opts;
    let eyeOpts = {};
    if (opts.ram) {
      eyeOpts.ram = opts.ram;
    }
    this.handler = new EyeHandler(eyeOpts);
  }

  validate(data = [], constraints = null, opts = null, cb = () => {
  }) {
    constraints = constraints || [];
    if (!Array.isArray(data)) {
      data = [data];
    }
    let self = this;
    getDataFiles(data, function (err, dataFiles) {
      getDataFiles(constraints, function (err, constraintFiles) {
        getDataFiles(self.opts.extraFiles, function (err, extraFiles) {
          self.handler.reason(self.opts.reasoningParams, dataFiles.concat(constraintFiles, extraFiles), self.opts.queryPath, cb);
        });
      });
    });
  }
}

const EyeAllowed = ['application/pvm', 'text/n3p', 'text/n3', 'text/turtle'];
const EyeHandlerType = {
  'application/pvm': 'pvm',
  'text/n3p': 'n3p',
  'text/n3': 'n3',
  'text/turtle': 'ttl',
};

function getMime(filePath) {
  switch (path.extname(filePath)) {
    case '.pvm':
      return 'application/pvm';
    case '.n3p':
      return 'text/n3p';
    case '.n3':
      return 'text/n3';
    case '.ttl':
      return 'text/turtle';
    default:
      return 'application/octet-stream'
  }
}

function getEyeHandlerType(mime) {
  if (!EyeHandlerType[mime]) {
    // TODO
    throw new Error('TODO: default Eye handler type?');
  }
  return EyeHandlerType[mime];
}


function getDataFiles(arr, cb) {
  let files = [];

  arr.forEach(function (element) {
    if (element.path) {
      if (!element.mime) {
        element.mime = getMime(element.path);
      }

      if (EyeAllowed.indexOf(element.mime) < 0) {
        // TODO
        throw new Error('TODO: support conversion');
      }

      files.push({
        path: path.resolve(element.path),
        type: getEyeHandlerType(element.mime)
      });
    } else {
      // TODO
      throw new Error('TODO: support non-path data files');
    }
  });

  cb(null, files);
}

module.exports = AbstractValidator;
