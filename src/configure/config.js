'use strict';

var gutil = require('gulp-util');
var objectAssign = require('object-assign-deep');
var config;
var cmdConf = require('./cmd-conf.js');
var _ = require('../util.js');
var lastLoadTime = 0;
var commandArgvs = {};
var initConf = {
    mail: {}
};

var cache = {};

var model = {};

Object.keys(cmdConf).forEach(function (key) {
    initConf = objectAssign(initConf, cmdConf[key].options);
});

config = {
    init: function (conf) {
        initConf = conf;
    },
    load: function (path, missing) {
        var conf,
            lastTime;

        missing = _.is(missing, 'undefined') ? true : missing;

        if (path) {
            if (lastLoadTime >= (lastTime = _.mtime(path).getTime())) {
                return false;
            }
            try {
                conf = require(path);

                delete require.cache[path];
                model = objectAssign(model, conf);
                cache = {};
                defineProperties(conf);
                lastLoadTime = lastTime;
                return true;
            } catch (e) {
                gutil.log('Loading or Parsing the configuration file "' + path + '" is incorrect: ' + e.message);
                return false;
            }
        } else {
            missing && gutil.log('missing config file [sphinx-conf.js] or [sphinx-conf.json]');
            return false;
        }
    },
    mergeCliArgs: function (conf) {

        if (conf) {
            commandArgvs = conf;
            defineProperties(conf);
        }
    },
    mergeCmdConf: function (conf) {
        var options = {};

        if (conf) {
            Object.keys(conf).forEach(function (key) {
                if (conf[key].options) {
                    objectAssign(options, conf[key].options);

                }
            });
            mergeConf(options);
        }
    }

};

function defineProperties(data) {
    Object.keys(data).forEach(function (key) {
        defineProperty(key);
    });
}

function defineProperty(key) {

    if (key in config) {
        return;
    }
    Object.defineProperty(config, key, {
        configurable: false,
        enumerable: false,
        get: function () {
            return cache[key] || commandArgvs[key] || model[key];
        },
        set: function (value) {
            cache[key] = value;
        }
    });
}

function mergeConf(conf) {
    Object.keys(conf).forEach(function (key) {
        var item = conf[key],
            value;

        // if ('inConfFile' in item && !item.inConfFile) {
        //     return;
        // }

        if ('default' in item) {
            value = item.default;
        }
        model[key] = value;
        defineProperty(key);
    });
}

mergeConf(initConf);

module.exports = config;
