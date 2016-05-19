'use strict';

var gutil = require('gulp-util');
var Immutable = require('immutable');
var argv = Immutable.Map(require('./cli.js'));
var defaultConfig = Immutable.Map({
    include: null,
    dest: 'dist',
    task: ''
});

function Config() {
    var config = defaultConfig;

    return {
        load: function (path) {
            var conf;

            if (path) {
                try {
                    conf = Immutable.Map(require(path));

                    config = config.mergeDeep(conf);

                } catch (e) {
                    gutil.log('Loading or Parsing the configuration file "' + path + '" is incorrect: ' + e.message);
                }
            } else {
                gutil.log('missiong config file [sphinx-conf.js] or [sphinx-conf.json]');
            }
        },

        merge: function (conf, deep) {
            config = deep ? config.mergeDeep(conf) : config.merge(conf);
        },
        get: function (key) {
            var result;

            result = Array.isArray(key) ?
                argv.getIn(key) :
                argv.get(key);

            if (result) {
                return result;
            } else {
                return Array.isArray(key) ?
                config.getIn(key) :
                config.get(key);
            }
        },
        set: function (key, value) {
            config = Array.isArray(key) ? config.setIn(key, value) : config.set(key, value);
        }
    };
}

module.exports = Config();

