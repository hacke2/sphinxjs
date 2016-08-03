'use strict';
var gulp = require('gulp');
var plugin = require('./src/plugin.js');
var buildGlob = require('./src/glob.js');
var config = require('./src/config.js');
var Store = require('./src/store');

var store = new Store;
var bs;

function execute(env) {
    gulp.task('release', gulp.series([
        function (cb) {
            config.set('glob', null);
            config.load(env.configPath);
            buildGlob(config.get('cwd'), config.get('dest'));
            cb();
        },
        function (cb) {
            var glob = config.get('glob'),
                Solution;

            Solution = plugin.loadSolution();

            return new Solution(glob, {
                cwd: config.get('cwd'),
                dest: config.get('dest'),
                optimize: config.get('optimize'),
                // lastRun: gulp.lastRun('release'),
                sourcemap: config.get('sourcemap'),
                es6: config.get('es6')
            }, store)
            .stream
            .on('finish', function () {
                config.get('livereload') && bs && bs.reload();
            });
        }
    ]));

    gulp.task('server', gulp.series([
        'release',
        function (cb) {
            bs = require('browser-sync').create();
            bs.init({
                open: 'external',
                server: config.get('dest'),
                directory: true
            }, function () {

                if (config.get('qrcode')) {
                    var ewm = require('./src/ewm.js');

                    // 生成二维码
                    ewm(bs);
                }

                gulp.watch(config.get('cwd'), {
                    ignored: [
                        /[\/\\](\.)/,
                        require('path').join(config.get('cwd'), config.get('dest'))
                    ],
                    ignoreInitial: true
                }, gulp.task('release'));
            });

            cb();
        }
    ]));
}
module.exports = execute;
