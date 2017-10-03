const AbstractValidator = require('./AbstractValidator');
const path = require('path');

/**
 *
 * @constructor
 */
class ValidationFactory {
  /**
   * @todo
   * @param inputProfile
   * @param outputProfile
   * @return AbstractValidator
   */
  createByProfile(inputProfile, outputProfile = null) {
    outputProfile = outputProfile || inputProfile;
    return new AbstractValidator();
  }

  /**
   * @return AbstractValidator
   */
  createRMLValidator() {
    const rulePath = path.resolve(__dirname, '../resources/rml/rule.n3');
    const extraRules = path.resolve(__dirname, '../resources/rml/extraRules.n3');
    const logCodes = path.resolve(__dirname, '../resources/rml/logCodes.ttl');

    const validator = new AbstractValidator();
    validator.opts.extraFiles.push({path: extraRules});
    validator.opts.extraFiles.push({path: logCodes});
    validator.opts.queryPath = rulePath;

    return validator;
  }
}

module.exports = ValidationFactory;
