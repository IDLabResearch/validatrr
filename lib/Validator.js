/**
 * Created by bjdmeest on 29/10/2015.
 */
const async = require('async'),
  path = require('path'),
  tmp = require('tmp'),
  fs = require('fs-extra'),
  EyeHandler = require('../lib/EyeHandler'),
  OntologyVault = require('../lib/OntologyVault');
const debug = require('debug')('N3Unit:validator');

class Validator {
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
    this.vault = new OntologyVault();
  }

  removeReasoningParam(key) {
    this.opts.reasoningParams = this.opts.reasoningParams.filter(param => {
      return param.key !== key;

    });
  }

  validate(ttl, ontologyFilter = null, cb) {
    const self = this;
    // prefix-checking
    getUsedOntologies(ttl, ontologyFilter, function (err, ontologies) {
      if (err) {
        return cb(err);
      }
      debug('Got the ontologies');

      self.validateByOntologies(ttl, ontologies, null, cb);
    });
  }

  validateByOntologies(ttl, ontologies, extraFiles = [], cb) {
    const self = this;

    tmp.tmpName({dir: self.opts.tmpPath}, function (err, ttlFile) {
      if (err) {
        return cb(err);
      }
      fs.writeFileSync(ttlFile, ttl);

      self.validateFileByOntologies(ttlFile, ontologies, extraFiles, cb);
    });
  }

  validateFileByOntologies(ttlFile, ontologies, extraFiles = [], cb) {
    const self = this;

    self._getDataFiles(ttlFile, ontologies, function (dataFiles) {
      dataFiles = dataFiles.concat(extraFiles || []);
      // execute EYE reasoning
      self.handler.reason(self.opts.reasoningParams, dataFiles, self.opts.queryPath, cb);
    });
  }

  validateStream(ttl, ontologyFilter = null, cb) {
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
  }

  validateStreamFile(ttlFile, ontologyFilter = null, extraFiles = [], cb) {
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
          dataFiles = dataFiles.concat(extraFiles);
          debug('Ready to reason!');
          // execute EYE reasoning
          self.handler.reasonStream(self.opts.reasoningParams, dataFiles, self.opts.queryPath, cb);
        });
      });
    });
  }

  validateStreamFileByOntologies(ttlFile, ontologies, extraFiles = [], cb) {
    const self = this;
    this._getDataFiles(ttlFile, ontologies, function (dataFiles) {
      dataFiles = dataFiles.concat(extraFiles);
      debug('Ready to reason!');
      // execute EYE reasoning
      self.handler.reasonStream(self.opts.reasoningParams, dataFiles, self.opts.queryPath, cb);
    });
  }

  _getDataFiles(ttlFile, ontologies, cb) {
    const self = this;

    const dataFiles = [];
    async.each(ontologies, function (ontology, done) {
      debug('fetching ' + ontology.uri + ' (' + ontology.prefix + ')');
      if (ontology.uri) {
        self.vault.fetchByUrl(ontology.uri, function (err, ontoTtlPath) {
          if (!err) {
            dataFiles.push({
              path: ontoTtlPath,
              type: 'ttl'
            });
          }
          return done();
        });
      }
      else if (ontology.prefix) {
        self.vault.fetchByPrefix(ontology.prefix, function (err, ontoTtlPath) {
          if (!err) {
            dataFiles.push({
              path: ontoTtlPath,
              type: 'ttl'
            });
          }
          return done();
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

      debug('got all data locally');

      return cb(dataFiles);
    });
  }
}

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
    if (key.indexOf('Mapping_') >= 0) {
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
