/**
 * Created by bjdmeest on 29/10/2015.
 */
const fs = require("fs-extra"),
  path = require('path'),
  tmp = require('tmp'),
  spawn = require('child_process').spawn,
  async = require('async'),
  request = require('request'),
  Logger = require('../lib/Logger');

function OntologyVault(opts) {
  opts = opts || {};
  this.ontPath = opts.ontPath || path.resolve(__dirname, '../resources/ontologies/');
  fs.ensureDirSync(this.ontPath);
  this.prefixPath = path.resolve(this.ontPath, 'prefix.json');
  if (!fs.existsSync(this.prefixPath)) {
    fs.writeFileSync(this.prefixPath, '{}');
  }
  this.prefixes = opts.prefixes || JSON.parse(fs.readFileSync(this.prefixPath, 'utf8'));
  this.logger = new Logger({level: Logger.LEVEL.LOG});
}

OntologyVault.prototype.constructor = OntologyVault;

OntologyVault.prototype.fetchByPrefix = function (prefix, cb) {
  this.logger.debug('Fetching by prefix ' + prefix);
  const self = this;
  const lovInfoQuery = 'http://lov.okfn.org/dataset/lov/api/v2/vocabulary/info?vocab=' + prefix;
  request.get({
    url: lovInfoQuery,
    json: true
  }, function (err, res, lovResult) {
    if (err) {
      return cb(err);
    }
    let url = lovResult.uri || '',
      ttlUrl = null;
    if (lovResult.versions && lovResult.versions[0]) {
      ttlUrl = lovResult.versions[0].fileURL;
    }
    const outPath = path.resolve(self.ontPath, ttlHashCode(url));
    fs.exists(outPath, function (exists) {
      if (exists) {
        return cb(null, outPath);
      }
      return self._saveTtl(prefix, url, ttlUrl, cb);
    });
  });
};

OntologyVault.prototype._saveTtl = function (prefix, url, ttlUrl, cb) {
  this.logger.debug('Saving ttl of ' + url);
  const outPath = path.resolve(this.ontPath, ttlHashCode(url));
  const self = this;
  if (ttlUrl) {
    request.get(ttlUrl, function (err, res, ttl) {
      if (err) {
        return cb(err);
      }
      fs.writeFile(outPath, ttl, function (err) {
        cb(err, outPath);
      });
    })
  }
  else {
    self._getTtlOntology(url, function (err, ttl) {
      if (err) {
        return cb(err);
      }
      fs.writeFile(outPath, ttl, function (err) {
        cb(err, outPath);
      });
    });
  }
};

function ttlHashCode(str) {
  return str ? str.replace(/\s+/g, '-').replace(/[\\\/:#]+/g, '_') + '.ttl' : 'none.ttl';
}

OntologyVault.prototype.fetchByUrl = function (url, cb) {
  this.logger.debug('Fetching by url ' + url);
  const self = this;
  const outPath = path.resolve(self.ontPath, ttlHashCode(url));
  fs.exists(outPath, function (exists) {
    if (exists) {
      self.logger.debug('Found cached ' + url);
      return cb(null, outPath);
    }
    self.fetchByPrefixOrUrl(null, url, cb);
  });
};

OntologyVault.prototype.fetchByPrefixOrUrl = function (prefix, url, cb) {
  this.logger.debug('fetching by prefix ' + prefix + ' or url ' + url);
  const self = this;
  const query = prefix || encodeURIComponent(url);
  const lovInfoQuery = 'http://lov.okfn.org/dataset/lov/api/v2/vocabulary/info?vocab=' + query;
  request.get({
    url: lovInfoQuery,
    json: true
  }, function (err, res, lovResult) {
    if (err) {
      return cb(err);
    }
    url = url || lovResult.uri;
    let ttlUrl = null;
    if (lovResult.versions && lovResult.versions[0]) {
      ttlUrl = lovResult.versions[0].fileURL;
    }
    return self._saveTtl(prefix, url, ttlUrl, cb);
  });
};

OntologyVault.prototype._getTtlOntology = function (url, cb) {
  const that = this;
  this.logger.debug('get ttl ontology (not LOV) of ' + url);
  if (url.indexOf('#') !== -1) {
    url = url.slice(0, url.indexOf('#'));
  }
  let ttl = null;
  async.series([
    function (done) {
      // first try .ttl
      let ttlUrl = url;
      if (!ttlUrl.match(/\.ttl$/)) {
        ttlUrl = ttlUrl.replace(/\..{2,5}$/, ''); // remove old extension
        ttlUrl += '.ttl';
      }
      request.get(ttlUrl, function (err, res, result) {
        if ((err && err.code === 'ENOTFOUND') || (res && res.statusCode !== 200)) {
          return done();
        }
        ttl = result;
        done();
      });
    }, function (done) {
      if (ttl !== null) {
        return done();
      }
      // then try accept ttl/owl
      request.get({
        url: url,
        headers: ['Accept: text/turtle; application/owl+xml; */*']
      }, function (err, res, result) {
        if ((err && err.code === 'ENOTFOUND') || (res && res.statusCode !== 200)) {
          return done();
        }
        // TODO check ttl or xml better
        if (result.indexOf('<') === 0) { // OWL or HTML
          if (result.indexOf('<html') !== -1) { // HTML
            // find link headers
            const ttlMatch = result.match(/<link\s+href="([^"]*)"[^>]*type="text\/turtle"/);
            if (ttlMatch) {
              request.get(ttlMatch[1], function (err, res, result) {
                if (res.statusCode !== 200) {
                  return done();
                }
                ttl = result;
                return done();
              });
            }
            else {
              const owlMatch = result.match(/<link\s+href="([^"]*)"[^>]*type="application\/(?:rdf|owl)\+xml"/);
              if (owlMatch) {
                request.get(owlMatch[1], function (err, res, result) {
                  if (res.statusCode !== 200) {
                    return done();
                  }
                  that.owlToTtl(result, function (err, myTtl) {
                    if (err) {
                      return cb(err);
                    }
                    ttl = myTtl;
                    return done();
                  });
                });
              }
              else {
                return done();
              }
            }
          }
          else { // OWL?
            that.owlToTtl(result, function (err, myTtl) {
              if (err) {
                return cb(err);
              }
              ttl = myTtl;
              done();
            });
          }
        }
        else {
          ttl = result;
          done();
        }
      });
    }, function (done) {
      if (ttl !== null) {
        return done();
      }
      // then try .owl
      let owlUrl = url;
      if (!owlUrl.match(/\.owl$/)) {
        owlUrl = owlUrl.replace(/\..{2,5}$/, ''); // remove old extension
        owlUrl += '.ttl';
      }
      request.get(owlUrl, function (err, res, result) {
        if ((err && err.code === 'ENOTFOUND') || res.statusCode !== 200) {
          return done();
        }
        that.owlToTtl(result, function (err, myTtl) {
          if (err) {
            return done();
          }
          ttl = myTtl;
          done();
        });
      });
    }
  ], function () {
    if (!ttl) {
      // then cry, and take null as perfectly fine example.
      ttl = '';
      // return cb(new Error('Cannot find ontology ' + url));
    }
    ttl = ttl.replace(/@base .*#>\s*\.\s*$/m, ''); // weird error.. TODO fix this somewhere cleaner
    cb(null, ttl);
  });
};

OntologyVault.prototype.owlToTtl = function(owl, cb) {
  this.logger.debug('get ttl from owl ' + owl);
  tmp.tmpName({dir: path.resolve(__dirname, '../tmp')}, function (err, owlFile) {
    fs.writeFile(owlFile, owl, function (err) {
      if (err) {
        return cb(err);
      }
      const convert = spawn('python', [path.resolve(__dirname, '../resources/owl2ttl.py'), owlFile]);

      let ttl = '';
      convert.stdout.on('data', function (chunk) {
        ttl += chunk;
      });

      convert.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
      });

      convert.on('close', function (code) {
        if (code !== 0) {
          return cb(new Error('couldn\'t transform the RDF/XML to Turte :('));
        }
        cb(null, ttl);
      });
    });
  });
}

module.exports = OntologyVault;
