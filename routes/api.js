/**
 * Created by bjdmeest on 29/10/2015.
 */
const express = require('express');
const debug = require('debug')('N3Unit:api');
const router = express.Router();
const fs = require('fs'),
  path = require('path'),
  TestHelper = require('../lib/TestHelper');
const multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage: storage});

const validator = TestHelper.createRMLValidator();

const logDir = path.resolve(__dirname, '../log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

/* GET home page. */
router.post('/validate', upload.single('mapping'), function (req, res, next) {
  debug('Got a call!');
  const logName = logDir + '/' + createSlug((new Date()).toISOString());
  let mappingString = '';
  if (req.body.mapping) {
    mappingString = req.body.mapping;
  } else if (req.file) {
    mappingString = req.file.buffer.toString();
  }
  if (mappingString) {
    fs.writeFile(logName + '_mapping.ttl', mappingString, function (writeErr) {
      if (writeErr) {
        throw writeErr;
      }
      debug('Stored the mapping');
      validator.validate(mappingString, null, function (err, ttl) {
        debug('Validated');
        if (err) {
          return fs.writeFile(logName + '_output.ttl', err.message, function (writeErr) {
            if (writeErr) {
              throw writeErr;
            }
            return res.end(err.message);
          });
        }
        fs.writeFile(logName + '_output.ttl', ttl, function (writeErr) {
          if (writeErr) {
            throw writeErr;
          }
          return res.end(ttl);
        });
      });
    });
  }
  else {
    res.sendStatus(417);
  }
});

function createSlug(str) {
  return str.toString().toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

module.exports = router;
