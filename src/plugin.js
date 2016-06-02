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
        dir = _.path.join(dir, '.sphinxjs');
        if (!_.exists(dir)) {
            _.fs.mkdirSync(dir);
            _.fs.writeFileSync(_.path.join(dir, 'package.json'), JSON.stringify({
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
        return require(_.path.join(this.getPluginOrSolutionDir(), 'node_modules', name));
    },
    loadSolution: function () {
        var solution = this._load(config.get('solution'), true);

        if (solution instanceof Error) {
            return {
                error: solution
            };
        } else {
            return {
                solution: solution
            };
        }

    },
    loadPlugin: function () {
        // 暂时hold
    },
    _load: function (name, isSolution) {
        if (name) {
            name = 'sphinx-' + (isSolution ? 'task' : 'plugin') + '-' + name;
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
                        return new Error('load solution [' + name + '] error : ' + e2.message);
                    }

                }
            }

        } else {
            return require('./task/');
        }
    },
    _install: function (name) {
        var dir = this.getPluginOrSolutionDir();

        gutil.log('Being install solution ' + name);
        shell.cd(dir);
        shell.exec('npm install ' + name);
        shell.cd(config.get('cwd'));
    }

};

