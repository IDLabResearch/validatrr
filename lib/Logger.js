const colors = require('colors');

Logger.LEVEL = {
    DEBUG: 0,
    LOG: 1,
    WARN: 2,
    ERR: 3
};

function Logger(opts) {
    opts = opts || {};
    opts.level = Logger.LEVEL.WARN;

    this.opts = opts;
}

function outputLog(data, color) {
    data = '' + data || '';
    color = color || 'white';
    const time = new Date();
    let millis = '' + time.getMilliseconds();
    for (let i = millis.length; i < 3; i++) {
        millis = '0' + millis;
    }
    data = data.replace(/"/g, '\\"');
    data = '[' + time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + '.' + millis + '] ' + data;
    try {
        console.log(eval('"' + data + '".' + color));
    }
    catch (e) {
        console.log(data);
    }
}

Logger.prototype.constructor = Logger;

Logger.prototype.debug = function (data, color) {
    if (this.opts.level <= Logger.LEVEL.DEBUG) {
        color = color || 'white';
        outputLog(data, color);
    }
};

Logger.prototype.log = function (data, color) {
    if (this.opts.level <= Logger.LEVEL.LOG) {
        color = color || 'green';
        outputLog(data, color);
    }
};

Logger.prototype.warn = function (data, color) {
    if (this.opts.level <= Logger.LEVEL.WARN) {
        color = color || 'yellow';
        outputLog(data, color);
    }
};

Logger.prototype.err = function (data, color) {
    if (this.opts.level <= Logger.LEVEL.ERR) {
        color = color || 'red';
        outputLog(data, color);
    }
};

module.exports = Logger;
