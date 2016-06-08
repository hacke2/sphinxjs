/**
 * sphinx的解决方案和插件加载实现
 *
 * Authors:
 *     明礼 <guomilo@gmail.com>
 */

'use strict';
var shell = require('shelljs');
var config = require('./config.js');
var gutil = require('gulp-util');
var _ = require('./util.js');
var fs = require('fs');
var path = require('path');

module.exports = {
    getPluginOrSolutionDir: function () {
        var dir = this.dir;

        if (dir) {

            return dir;
        } else {
            if ('HOME' in process.env) {
                dir = process.env['HOME'];
            } else {
                dir = process.env['HOMEERIVE'] + process.env['HOMEPATH'];
            }
        }
        dir = path.join(dir, '.sphinxjs');
        if (!_.exists(dir)) {
            fs.mkdirSync(dir);
            fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
                name: 'sphinx-plugin-solution',
                description: 'sphinxjs的插件和扩展的安装目录',
                license: 'MIT',
                repository: {}
            }));
            this.dir = dir;
        }
        return dir;
    },
    _loadPOrSInPSDir: function (name) {
        return require(path.join(this.getPluginOrSolutionDir(), 'node_modules', name));
    },
    loadSolution: function () {
        var name, solution;

        name = config.get('solution');
        if (!name) {
            return require('./task/index.js');
        }
        name = 'sphinx-solution-' + name;
        solution = this._load(name);

        if (solution && solution instanceof Error) {
            gutil.log('Not install or Found ' + name + ', will use the default solution');
            return require('./task/index.js');
        } else {
            return solution;
        }
    },
    loadPlugin: function (stream, type) {

        var plugins = config.get(['plugins', type]),
            plugin, settings;

        if (!Array.isArray(plugins)) {
            if (_.is(plugins, 'string')) {
                plugins = [{
                    name: plugins,
                    isGulp: false
                }];
            } else if (_.is(plugins, 'object') && name in plugins) {
                plugins = [plugins];
            } else {
                return stream;
            }
        }
        for (var i = 0, len = plugins.length, obj, pName; i < len; i++) {
            obj = plugins[i];

            if (!obj.name) {
                continue;
            }
            if (!obj.isGulp) {
                pName = 'sphinx-' + type + '-' + obj.name;
            } else {
                pName = 'gulp-' + obj.name;
            }
            plugin = this._load(pName);

            if (plugin && !(plugin instanceof Error)) {
                settings = config.get(['pluginSettings', obj.name]);
                stream = stream.pipe(plugin(settings));
            }
        }
        return stream;
    },
    _load: function (name) {
        if (name && typeof name == 'string') {
            try {
                return this._loadPOrSInPSDir(name);
            } catch (e) {
                try {

                    // 加载全局
                    return require(name);
                } catch (e1) {
                    try {

                        // 安装插件或依赖
                        this._install(name);
                        return this._loadPOrSInPSDir(name);
                    } catch (e2) {
                        return new Error('load [' + name + '] error : ' + e2.message);
                    }
                }
            }
        }
    },
    _install: function (name) {
        var dir = this.getPluginOrSolutionDir();

        gutil.log('Being install ' + name);
        shell.cd(dir);
        shell.exec('npm install ' + name);
        shell.cd(config.get('cwd'));
    }

};

