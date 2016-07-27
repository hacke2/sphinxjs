'use strict';
var gulp = require('gulp');
var filter = require('gulp-filter');
var browserSync = require('browser-sync').create();
var plugin = require('./src/plugin.js');
var buildGlob = require('./src/glob.js');
var config = require('./src/config.js');
var Store = require('./src/store');
var watch = require('./src/watch');

var store = new Store;

function execute(env) {
    var dest,
        cwd;

    gulp.task('release', gulp.series([
        function (cb) {
            config.set('glob', null);
            config.load(env.configPath);
            cwd = config.get('cwd');
            dest = config.get('dest');
            buildGlob(cwd, dest);
            cb();
        },
        function (cb) {
            var glob = config.get('glob'),
                Solution;

            Solution = plugin.loadSolution();
            return new Solution(glob, {
                cwd: cwd,
                dest: dest,
                optimize: config.get('optimize'),
                lastRun: gulp.lastRun('release'),
                sourcemap: config.get('sourcemap')
            }, store)
            .stream
            .pipe(filter('**/*.css'))
            .pipe(browserSync.reload({stream: true}));
        }
    ]));

    gulp.task('server', gulp.series([
        'release',
        function (cb) {
            browserSync.init({
                open: 'external',
                server: dest,
                directory: true
            }, function () {
                var ewm = require('./src/ewm.js');

                // 生成二维码
                ewm(browserSync);
                watch(cwd, {
                    ignored: [
                        /[\/\\](\.)/,
                        require('path').join(cwd, dest)
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
                cb();
            });
        }
    ]));
}
module.exports = execute;
