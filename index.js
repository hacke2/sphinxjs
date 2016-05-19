'use strict';
var gulp = require('gulp');
var filter = require('gulp-filter');
var chokidar = require('chokidar');
var browserSync = require('browser-sync').create();
var plugin = require('./src/plugin.js');
var buildGlob = require('./src/glob.js');
var config = require('./src/config.js');
var Base = require('./src/task/base.js');
var util = require('./src/util.js');
var ewm = require('./src/ewm.js');
var sphinx = {
    config: config,
    Base: Base,
    util: util
};

if (!global.sphinx) {
    Object.defineProperty(global, 'sphinx', {
        enumerable: true,
        writable: false,
        value: sphinx
    });
}

function execute(env) {
    var taskPlugin, aGlobs, dest, task,
        cwd;

    config.load(env.configPath);
    task = config.get('task');
    cwd = config.get('cwd');
    taskPlugin = plugin.loadTaskPlugin(task);
    aGlobs = config.get('glob');

    dest = config.get('dest');

    if (aGlobs && aGlobs.length > 0) {
        config.set('include', [{
            glob: aGlobs
        }]);
    }

    gulp.task('config', function (cb) {
        var include;

        include = config.get('include');
        if (!include || !Array.isArray(include) || !include.length || !('glob' in include[0])) {
            config.set('include', [{
                glob: buildGlob(cwd, dest)
            }]);
        }
        cb();
    });

    function watch(root) {
        var ignored = require('path').join(root, dest),
            timer;

        function listener(type) {
            return function (path) {

                clearTimeout(timer);
                timer = setTimeout(function () {
                    var extname = util.extname(path);

                    if (!util.isCss(extname)) {
                        gulp.series('release', browserSync.reload)();
                    } else {
                        gulp.series('release')();
                    }
                }, 500);
            };
        }

        chokidar.watch(root, {
            ignored: ignored,
            ignoreInitial: true
        })
        .on('change', listener('change'))
        .on('unlink', listener('unlink'))
        .on('add', listener('add'));
    }

    gulp.task('build', function (cb) {
        var include = config.get('include');

        if (taskPlugin.error) {
            cb(taskPlugin.error);
        }

        return new taskPlugin.Task(include, {
            cwd: cwd,
            dest: dest,
            optimize: config.get('optimize')
        })
        .stream
        .pipe(filter('**/*.css'))
        .pipe(browserSync.reload({stream: true}));
    });

    gulp.task('browserSync', function (cb) {
        browserSync.init({
            open: 'external',
            server: dest
        }, function () {
            ewm(browserSync);
            watch(cwd);
            cb();
        });
    });
    gulp.task('release', gulp.series('config', 'build'));
    gulp.task('server', gulp.series('release', 'browserSync'));
}
module.exports = execute;
