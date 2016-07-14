'use strict';
var gulp = require('gulp');
var filter = require('gulp-filter');
var browserSync = require('browser-sync').create();
var plugin = require('./src/plugin.js');
var buildGlob = require('./src/glob.js');
var config = require('./src/config.js');
var Store = require('./src/store');

var store = new Store;

var running = false;
var queue = [];

function watch(root, opts, cb) {
    var delay = 200;
    var safePathReg = /[\\\/][_\-.\s\w]+$/i;

    function debounce(func, wait) {
        var timeout, args = [], context, timestamp;

        function later() {
            // 据上一次触发时间间隔
            var last = Date.now() - timestamp;

            // 上次被包装函数被调用时间间隔last小于设定时间间隔wait
            if (last < wait && last > 0) {
                timeout = setTimeout(later, wait - last);
            } else {
                timeout = null;
                func.apply(context, args);
                args = [];
                context = null;
            }
        };

        return function () {
            context = this;

            args = args ? args.concat([].slice.call(arguments)) : [].slice.call(args);

            timestamp = Date.now();
            // 如果延时不存在，重新设定延时
            if (!timeout) {
                timeout = setTimeout(later, wait);
            }
        };
    };

    function listener(type) {
        return function () {
            var args = [].slice.call(arguments);

            if (running) {
                queue.push({
                    type: type,
                    args: args
                });

                return;
            }

            running = true;

            args.forEach(function (path, i) {
                if (!safePathReg.test(path)) {
                    args.splice(i, 1);
                }
            });

            if (args.length > 0) {
                cb(type, args);
            }
        };
    }

    require('chokidar')
        .watch(root, opts)
        .on('change', debounce(listener('change'), delay))
        .on('unlink', debounce(listener('unlink'), delay))
        .on('add', debounce(listener('add'), delay));
}

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
            .pipe(browserSync.reload({stream: true}))
            .on('finish', function () {
                running = false;
                queue.length = 0;
            });
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
                }, function (type, paths) {
                    var util = require('./src/util.js');
                    var cssFlag;

                    if (paths.length === 0) {
                        return;
                    }

                    if (type === 'unlink') {
                        paths.forEach(function (path) {
                            store.remove(path);
                        });
                        return;
                    }

                    cssFlag = paths.every(function (path) {
                        var extname = util.extname(path);

                        if (!util.isCss(extname)) {
                            gulp.series('release', function (cb) {
                                browserSync.reload();
                                cb();
                            })();
                            return false;
                        }
                        return true;
                    });

                    if (cssFlag) {
                        gulp.series('release')();
                    }
                });
                cb();
            });
        }
    ]));
}
module.exports = execute;
