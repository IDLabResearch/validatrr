/**
 * Created by bjdmeest on 29/10/2015.
 */
const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const debug = require('debug')('N3Unit:vault');
const TtlFetcher = require('./TtlFetcher');
const N3 = require('n3');

const fetcher = new TtlFetcher();

// TODO use TtlFetcher wif possible

function OntologyVault(opts) {
  opts = opts || {};
  this.ontPath = opts.ontPath || path.resolve(__dirname, '../resources/ontologies/');
  fs.ensureDirSync(this.ontPath);
  this.prefixPath = path.resolve(this.ontPath, 'prefix.json');
  if (!fs.existsSync(this.prefixPath)) {
    fs.writeFileSync(this.prefixPath, '{}');
  }
  this.prefixes = opts.prefixes || JSON.parse(fs.readFileSync(this.prefixPath, 'utf8'));
}

OntologyVault.prototype.constructor = OntologyVault;

OntologyVault.prototype.fetchByPrefix = function (prefix, cb) {
  debug('Fetching by prefix ' + prefix);
  const self = this;
  const lovInfoQuery = 'http://lov.okfn.org/dataset/lov/api/v2/vocabulary/info?vocab=' + prefix;
  debug(lovInfoQuery);
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
  debug('Saving ttl of ' + url);
  const outPath = path.resolve(this.ontPath, ttlHashCode(url));
  if (ttlUrl) {
    request.get(ttlUrl, function (err, res, ttl) {
      if (err) {
        return cb(err);
      }
      return storeTtl(outPath, ttl, cb);
    });
  }
  else {
    fetcher._getTtlOntology(url, function (err, ttl) {
      if (err) {
        return cb(err);
      }
      return storeTtl(outPath, ttl, cb);
    });
  }
};

function storeTtl(outPath, ttl, cb) {
  const parser = N3.Parser();
  parser.parse(ttl, function (error, triple, prefixes) {
    if (error) {
      ttl = '';
      return write();
    }
    if (!triple) {
      return write();
    }
  });

  function write() {
    return fs.writeFile(outPath, ttl, function (err) {
      cb(err, outPath);
    });
  }
}

function ttlHashCode(str) {
  return str ? str.replace(/\s+/g, '-').replace(/[\\\/:#]+/g, '_') + '.ttl' : 'none.ttl';
}

OntologyVault.prototype.fetchByUrl = function (url, cb) {
  if (!url) {
    return cb(new Error('Url must be provided'));
  }
  debug('Fetching by url ' + url);
  const self = this;
  const outPath = path.resolve(self.ontPath, ttlHashCode(url));
  fs.exists(outPath, function (exists) {
    if (exists) {
      debug('Found cached ' + url);
      return cb(null, outPath);
    }
    self.fetchByPrefixOrUrl(null, url, cb);
  });
};

OntologyVault.prototype.fetchByPrefixOrUrl = function (prefix, url, cb) {
  debug('fetching by prefix ' + prefix + ' or url ' + url);
  const self = this;
  const query = prefix || encodeURIComponent(url);
  const lovInfoQuery = 'http://lov.okfn.org/dataset/lov/api/v2/vocabulary/info?vocab=' + query;
  debug(lovInfoQuery);
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

module.exports = OntologyVault;
