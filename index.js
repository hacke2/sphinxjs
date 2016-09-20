'use strict';
var gulp = require('gulp');
var plugin = require('./src/plugin.js');
var glob = require('./src/glob.js');
var config = require('./src/config.js');
var ifElse = require('gulp-if-else');
var bs;

function execute(env) {
    gulp.task('release', gulp.series([
        function (cb) {

            config.set('glob', null);
            config.load(env.configPath);

            if (!config.get('sc')) {
                glob.buildGlob(config.get('cwd'), config.get('dest'));
            } else {
                glob.buildScGlob(config.get('sc'), config.get('cwd'), config.get('dest'), gulp.lastRun('release'));
            }

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
            })
            .stream
            .pipe(ifElse(bs && config.get('livereload'), function () {
                return bs.stream({match: '**/*.*'});
            }));
        }
    ]));

    gulp.task('server', gulp.series([
        'release',
        function (cb) {
            var opts = {
                open: 'external',
                server: {
                    baseDir: config.get('dest'),
                    directory: true,
                    middleware: [
                        function (req, res, next) {
                            res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                            res.setHeader('Expires', '-1');
                            res.setHeader('Pragma', 'no-cache');
                            next();
                        },
                    ]
                },
                logPrefix: 'SPHINX SERVER'
            };

            if (config.get('port')) {
                opts['port'] = Number(config.get('port'));
                opts['ui'] = {port: (opts['port'] + 1)};
            }

            if (config.get('startpath')) {
                opts['startPath'] = config.get('startpath');
            }

            bs = require('browser-sync').create();
            bs.init(opts, function () {

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
