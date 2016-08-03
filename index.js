'use strict';
var gulp = require('gulp');
var filter = require('gulp-filter');
var browserSync = require('browser-sync').create();
var connect = require('gulp-connect');
var plugin = require('./src/plugin.js');
var buildGlob = require('./src/glob.js');
var config = require('./src/config.js');
var Store = require('./src/store');
var watch = require('./src/watch');

var store = new Store;

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
                Solution,
                stream;

            Solution = plugin.loadSolution();

            stream = new Solution(glob, {
                cwd: config.get('cwd'),
                dest: config.get('dest'),
                optimize: config.get('optimize'),
                lastRun: gulp.lastRun('release'),
                sourcemap: config.get('sourcemap'),
                es6: config.get('es6')
            }, store)
            .stream;

            if (config.get('sync')) {
                stream = stream
                .pipe(filter('**/*.css'))
                .pipe(browserSync.reload({stream: true}));
            } else {
                /* stream = stream
                .pipe(connect.reload());*/
            }

            return stream;
        }
    ]));

    function bs() {
        browserSync.init({
            open: 'external',
            server: config.get('dest'),
            directory: true
        }, function () {
            var ewm = require('./src/ewm.js');

            // 生成二维码
            ewm(browserSync);
            watch(config.get('cwd'), {
                ignored: [
                    /[\/\\](\.)/,
                    require('path').join(config.get('cwd'), config.get('dest'))
                ],
                ignoreInitial: true
            }, function (paths) {
                var cssFlag;
                var util = require('./src/util.js');

                if (paths.length === 0) {
                    return;
                }

                /* if (type === 'unlink') {
                    paths.forEach(function (path) {
                        store.remove(path);
                    });
                    return;
                }*/

                cssFlag = paths.every(function (path) {
                    var extname = util.extname(path);

                    if (!util.isCss(extname)) {
                        return false;
                    }
                    return true;
                });

                if (cssFlag) {
                    return gulp.series('release');
                } else {
                    return gulp.series('release', function (cb) {
                        browserSync.reload();
                        cb();
                    });
                }
            });
        });
    }

    function ct() {
        connect.server({
            root: config.get('dest'),
            // livereload: config.get('livereload'),
            port: 3000
        });

        gulp.watch(config.get('cwd'), {
            ignored: [
                /[\/\\](\.)/,
                require('path').join(config.get('cwd'), config.get('dest'))
            ],
            ignoreInitial: true
        }, gulp.task('release'));
    }

    gulp.task('server', gulp.series([
        'release',
        function (cb) {
            if (config.get('sync')) {
                bs();
            } else {
                ct();
            }
            cb();
        }
    ]));
}
module.exports = execute;
