/**
 * Authors:
 *     明礼 <guomilo@gmail.com>
 */

'use strict';

var gutil = require('gulp-util');
var Immutable = require('immutable');
var argv = Immutable.fromJS(require('./cli.js'));
var defaultConfig = Immutable.fromJS({
    glob: null,
    dest: 'dist',
    solution: '',
    plugins: {
        postrelease: [{
            name: 'm2c',
            isGulp: false
        }]
    },
    pluginSettings: {
        postrelease: {
            m2c: {
                fileBasedRoot: true
            }
        }
    },
    mail: {
        smtp: {
            host: 'smtp.qq.com',
            port: 465,
            secure: true,
            auth: {
                user: 'guomilo@qq.com',
                pass: 'huffnjiuzeuabhie'
            }
        },
        option: {
            from: 'guomilo@qq.com',
            to: 'mingli.guoml@alibaba-inc.com'
        }
    }
});

function Config() {
    var config = defaultConfig;

    return {
        load: function (path) {
            var conf;

            if (path) {
                try {
                    conf = Immutable.fromJS(require(path));
                    delete require.cache[path];
                    config = config.mergeDeep(conf);

                    return true;

                } catch (e) {
                    gutil.log('Loading or Parsing the configuration file "' + path + '" is incorrect: ' + e.message);
                    return false;
                }
            } else {

                gutil.log('missiong config file [sphinx-conf.js] or [sphinx-conf.json]');
                return false;
            }
        },

        merge: function (conf) {
            config = config.mergeDeep(conf);
        },
        get: function (key) {
            var result;

            result = this.getArgv(key);

            if (!result) {
                result = this.getConfig(key);
            }
            return result;

        },
        getArgv: function (key) {
            var result = Array.isArray(key) ?
                argv.getIn(key) :
                argv.get(key);

            if (result && result.toJS) {
                return result.toJS();
            }
            return result;

        },
        getConfig: function (key) {
            var result = Array.isArray(key) ?
                config.getIn(key) :
                config.get(key);

            if (result && result.toJS) {
                return result.toJS();
            }
            return result;
        },
        set: function (key, value) {
            config = Array.isArray(key) ? config.setIn(key, value) : config.set(key, value);
        }
    };
}

module.exports = Config();

