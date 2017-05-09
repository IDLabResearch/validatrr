/**
 * Created by bjdmeest on 29/10/2015.
 */
const async = require('async'),
  path = require('path'),
  tmp = require('tmp'),
  fs = require('fs-extra'),
  EyeHandler = require('../lib/EyeHandler'),
  OntologyVault = require('../lib/OntologyVault');

function Validator(opts) {
  opts = opts || {};
  opts.tmpPath = opts.tmpPath || path.resolve(__dirname, '../tmp');
  fs.ensureDirSync(opts.tmpPath);
  opts.queryPath = opts.queryPath || path.resolve(__dirname, '../resources/rule.n3');
  opts.extraFiles = opts.extraFiles || [];
  opts.reasoningParams = opts.reasoningParams || [{key: '--nope'}, {key: '--no-qvars'}];

  this.opts = opts;
  let eyeOpts = {};
  if (opts.ram) {
    eyeOpts.ram = opts.ram;
  }
  this.handler = new EyeHandler(eyeOpts);
  this.vault = new OntologyVault();
}

Validator.prototype.constructor = Validator;

Validator.prototype.validate = function (ttl, ontologyFilter = null, cb) {
  const self = this;
  // prefix-checking
  getUsedOntologies(ttl, ontologyFilter, function (err, ontologies) {
    if (err) {
      return cb(err);
    }

    tmp.tmpName({dir: self.tmpPath}, function (err, ttlFile) {
      if (err) {
        return cb(err);
      }
      fs.writeFileSync(ttlFile, ttl);
      self._getDataFiles(ttlFile, ontologies, function (dataFiles) {
        // execute EYE reasoning
        self.handler.reason(self.opts.reasoningParams, dataFiles, self.opts.queryPath, cb);
      });
    });
  });
};

Validator.prototype.validateStream = function (ttl, ontologyFilter = null, cb) {
  const self = this;
  // prefix-checking
  getUsedOntologies(ttl, ontologyFilter, function (err, ontologies) {
    if (err) {
      return cb(err);
    }

    tmp.tmpName({dir: self.tmpPath}, function (err, ttlFile) {
      if (err) {
        return cb(err);
      }
      fs.writeFileSync(ttlFile, ttl);
      self._getDataFiles(ttlFile, ontologies, function (dataFiles) {
        // execute EYE reasoning
        self.handler.reasonStream(self.opts.reasoningParams, dataFiles, self.opts.queryPath, cb);
      });
    });
  });
};

Validator.prototype.validateStreamFile = function (ttlFile, ontologyFilter = null, cb) {
  const self = this;

  fs.readFile(ttlFile, 'utf8', function (err, ttl) {
    if (err) {
      return cb(err);
    }
    // prefix-checking
    getUsedOntologies(ttl, ontologyFilter, function (err, ontologies) {
      if (err) {
        return cb(err);
      }

      self._getDataFiles(ttlFile, ontologies, function (dataFiles) {
        // execute EYE reasoning
        self.handler.reasonStream(self.opts.reasoningParams, dataFiles, self.opts.queryPath, cb);
      });
    });
  });
};

Validator.prototype.validateStreamFileByOntologies = function (ttlFile, ontologies, cb) {
  const self = this;
  this._getDataFiles(ttlFile, ontologies, function (dataFiles) {
    // execute EYE reasoning
    self.handler.reasonStream(self.opts.reasoningParams, dataFiles, self.opts.queryPath, cb);
  });
};

Validator.prototype._getDataFiles = function (ttlFile, ontologies, cb) {
  const self = this;

  const dataFiles = [];
  async.each(ontologies, function (ontology, done) {
    if (ontology.uri) {
      self.vault.fetchByUrl(ontology.uri, function (err, ontoTtlPath) {
        if (err) {
          return done(err);
        }
        dataFiles.push({
          path: ontoTtlPath,
          type: 'ttl'
        });
        return done();
      });
    }
    else if (ontology.prefix) {
      self.vault.fetchByPrefix(ontology.prefix, function (err, ontoTtlPath) {
        if (err) {
          return done(err);
        }
        dataFiles.push({
          path: ontoTtlPath,
          type: 'ttl'
        });
        done();
      });
    }
    else {
      return done(new Error('found an ontology without prefix or uri? ' + JSON.stringify(ontology)));
    }
  }, function (err) {
    if (err) {
      return cb(err);
    }
    dataFiles.push({
      path: ttlFile,
      type: 'ttl'
    });

    for (let i = 0; i < self.opts.extraFiles.length; i++) {
      dataFiles.push({
        path: self.opts.extraFiles[i],
        type: path.extname(self.opts.extraFiles[i]).slice(1)
      });
    }

    return cb(dataFiles);
  });
};

function getUsedOntologies(ttl, filter = null, cb) {
  const ontologies = {};
  let regex = /<(https?:\/\/[^>]+[#\/])/g;

  let matches;
  while (matches = regex.exec(ttl)) {
    if (!ontologies[matches[1]]) {
      ontologies[matches[1]] = {
        uri: matches[1],
        count: 0
      };
    }
    ontologies[matches[1]].count++;
  }

  regex = /"(https?:\/\/[^{"]+[#\/])/g;

  while (matches = regex.exec(ttl)) {
    if (!ontologies[matches[1]]) {
      ontologies[matches[1]] = {
        uri: matches[1],
        count: 0
      };
    }
    ontologies[matches[1]].count++;
  }

  let result = [];
  for (const key in ontologies) {
    if (!ontologies.hasOwnProperty(key)) {
      continue;
    }

    if (key.match(/^https?:\/\/([^\.]+\.)?ex(ample)?\.com/)) {
      continue;
    }
    result.push(ontologies[key]);
  }

  if (filter) {
    result = result.filter(function (res) {
      return filter.indexOf(res.uri) >= 0;
    });
  }

  return cb(null, result);
}

module.exports = Validator;
