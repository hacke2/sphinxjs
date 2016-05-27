'use strict';
var gulp = require('gulp');
var filter = require('gulp-filter');
var browserSync = require('browser-sync').create();
var plugin = require('./src/plugin.js');
var buildGlob = require('./src/glob.js');
var config = require('./src/config.js');
var Base = require('./src/task/base.js');
var util = require('./src/util.js');
var sphinx = {
    config: config,
    Base: Base,
    util: util
};

// 任务锁，避免多次release
var lock = false;
var queue = [];

if (!global.sphinx) {
    Object.defineProperty(global, 'sphinx', {
        enumerable: true,
        writable: false,
        value: sphinx
    });
}

function execute(env) {
    var taskPlugin, dest, task,
        cwd;

    function watch(root) {
        var safePathReg = /[\\\/][_\-.\s\w]+$/i,
            timer;

        function listener(type) {
            return function (path) {
                function cb() {
                    lock = true;
                    clearTimeout(timer);
                    timer = setTimeout(function () {
                        var extname = util.extname(path);

                        if (!util.isCss(extname)) {
                            gulp.series('release', browserSync.reload)();
                        } else {
                            gulp.series('release')();
                        }
                    }, 500);
                }
                if (safePathReg.test(path)) {
                    if (lock) {
                        if (queue.length >= 3) {
                            queue.shift();
                        }
                        queue.push(cb);
                    } else {
                        cb();
                    }
                }
            };
        }
        require('chokidar')
            .watch(root, {
                ignored: [
                    /[\/\\](\.)/,
                    require('path').join(root, dest)
                ],
                ignoreInitial: true
            })
            .on('change', listener('change'))
            .on('unlink', listener('unlink'))
            .on('add', listener('add'));
    }

    gulp.task('release', gulp.series([
        function (cb) {
            var tk;

            tk = config.get('task');
            cwd = config.get('cwd');
            dest = config.get('dest');

            if (tk != task) {
                taskPlugin = plugin.loadTaskPlugin(tk);
                task = tk;
            }

            if (!config.get('glob')) {
                config.set('glob', buildGlob(cwd, dest));
            }

            cb();
        },
        function (cb) {
            var glob = config.get('glob');

            if (taskPlugin.error) {
                cb(taskPlugin.error);
            }

            return new taskPlugin.Task(glob, {
                cwd: cwd,
                dest: dest,
                optimize: config.get('optimize')
            })
            .stream
            .pipe(filter('**/*.css'))
            .pipe(browserSync.reload({stream: true}))
            .on('finish', function () {
                lock = false;
                if (queue.length > 0) {
                    queue.shift()();
                }
            });
        }
    ]));

    gulp.task('server', gulp.series([
        'release',
        function (cb) {
            browserSync.init({
                open: 'external',
                server: dest
            }, function () {
                var ewm = require('./src/ewm.js');

                // 生成二维码
                ewm(browserSync);
                watch(cwd);
                cb();
            });
        }
    ]));
}
module.exports = execute;
