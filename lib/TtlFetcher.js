/**
 * Created by bjdmeest on 8/02/2016.
 */
const request = require('request'),
  async = require('async'),
  rdfExt = require('rdf-ext'),
  RDFXMLParser = require('rdf-parser-rdfxml'),
  TurtleSerializer = require('rdf-serializer-ntriples');
const debug = require('debug')('N3Unit:fetcher');

const TurtleFetcher = function () {

};

TurtleFetcher.prototype.constructor = TurtleFetcher;

TurtleFetcher.prototype.fetchByPrefix = function (prefix, cb) {
  if (!prefix) {
    return cb(new Error('Prefix must be provided'));
  }
  getLovTtl(prefix, function (err, url, ttl) {
    if (err) {
      return cb(err);
    }
    if (ttl) {
      return cb(null, ttl);
    }
    if (!url) {
      return cb(new Error('Cannot find url of prefix ' + prefix));
      // TODO try prefix.cc next?
    }
    getTtl(url, function (err, ttl) {
      cb(err, ttl, url);
    });
  });
};

function getLovTtl(query, cb) {
  const lovInfoQuery = 'http://lov.okfn.org/dataset/lov/api/v2/vocabulary/info?vocab=' + query;
  request.get({url: lovInfoQuery, json: true}, function (err, res, lovResult) {
    if (err) {
      return cb(err);
    }
    if (!lovResult.uri) {
      return cb('Cannot find uri for ' + query + ' in LOV');
    }
    let ttlUrl = null;
    if (lovResult.versions && lovResult.versions[0]) {
      ttlUrl = lovResult.versions[0].fileURL;
    }
    if (!ttlUrl) {
      return cb(null, lovResult.uri, null);
    }
    request.get(ttlUrl, function (err, res, ttl) {
      return cb(err, lovResult.uri, ttl);
    });
  });
}

TurtleFetcher.prototype.fetchByUrl = function (url, cb) {
  if (!url) {
    return cb(new Error('Url must be provided'));
  }
  debug('Fetching by url ' + url);
  getLovTtl(encodeURIComponent(url), function (err, lovUrl, ttl) {
    if (err) {
      return cb(err);
    }
    if (ttl) {
      return cb(null, ttl);
    }
    getTtl(url, function (err, ttl) {
      cb(err, ttl, lovUrl);
    });
  });
};

function getTtl(url, cb) {
  debug('get ttl ontology (not LOV) of ' + url);
  if (url.indexOf('#') !== -1) {
    url = url.slice(0, url.indexOf('#'));
  }
  let ttl = null;
  async.series([
    function (done) {
      debug('first try .ttl of ' + url);
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
      debug('then try accept ttl/owl ' + url);
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
                  owlToTtl(result, function (err, myTtl) {
                    if (!err) {
                      ttl = myTtl;
                    }
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
            owlToTtl(result, function (err, myTtl) {
              if (!err) {
                ttl = myTtl;
              }
              return done();
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
      debug('then try .owl ' + url);
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
        owlToTtl(result, function (err, myTtl) {
          if (!err) {
            ttl = myTtl;
          }
          return done();
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
}

function owlToTtl(owl, cb) {
  debug('get ttl from owl ' + owl);
  rdfExt.parsers = rdfExt.parsers || new rdfExt.Parsers();
  rdfExt.serializers = rdfExt.serializers || new rdfExt.Serializers();
  rdfExt.parsers['application/rdf+xml'] = RDFXMLParser;
  rdfExt.serializers['text/turtle'] = TurtleSerializer;
  rdfExt.parsers.parse('application/rdf+xml', owl).then(function (graph) {
    return rdfExt.serializers.serialize('text/turtle', graph);
  }).then(function (ttl) {
    cb(null, ttl);
  }).catch(err => {
    cb(err);
  });
}

TurtleFetcher.prototype._getTtlOntology = getTtl;
TurtleFetcher.prototype._owlToTtl = owlToTtl;

module.exports = TurtleFetcher;
