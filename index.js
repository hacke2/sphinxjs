'use strict';
var gulp = require('./gulp');
var gutil = require('gulp-util');
var path = require('path');
var chalk = gutil.colors;
var prettyTime = require('pretty-hrtime');
var config = require('./src/configure/config.js');
var ifElse = require('gulp-if-else');
var fs = require('fs');
var nunjucks = require('nunjucks');
var env = new nunjucks.configure(config.cwd);

env.addExtension('ComponentExtension', require('nunjucks-component-extension'));

var bs;

function execute(env, sln) {
    gulp.on('start', function (e) {
        if (e.name === '<anonymous>') {
            return;
        }
        gutil.log('Starting', '\'' + chalk.cyan(e.name) + '\'...');
    });
    gulp.on('stop', function (e) {
        var time;

        if (e.name === '<anonymous>') {
            return;
        }

        time = prettyTime(e.duration);

        gutil.log(
            'Finished', '\'' + chalk.cyan(e.name) + '\'',
            'after', chalk.magenta(time)
        );
    });
    gulp.on('error', function (e) {
        var msg, time;

        if (e.name === '<anonymous>') {
            return;
        }

        msg = formatError(e);
        time = prettyTime(e.duration);

        gutil.log(
            '\'' + chalk.cyan(e.name) + '\'',
            chalk.red('errored after'),
            chalk.magenta(time)
        );
        gutil.log(msg || e.error.stack);
        process.exit(0);
    });

    gulp.task('release', gulp.series([
        function (cb) {
            config.load(env.configPath);
            cb();
        },
        function (cb) {
            var glob = config.glob,
                Solution = sln,
                globHandler = function () {
                    var dest = config.dest,
                        cwd = config.cwd,

                        dGlob;

                    dest = path.resolve(cwd, dest);
                    if (dest.indexOf(cwd) == 0) {
                        dest = path.relative(cwd, dest);
                    } else {
                        return;
                    }
                    dGlob = '!(' + dest + ')/**';
                    if (Array.isArray(glob)) {
                        if (glob.indexOf(dGlob) == -1) {
                            glob.push(dGlob);
                        }
                    } else {
                        glob = [glob, dGlob];
                    }
                    config.glob = glob;

                };

            globHandler();
            // Solution = plugin.loadSolution();
            return new Solution(glob, {
                cwd: config.cwd,
                dest: config.dest,
                optimize: config.optimize,
                // lastRun: gulp.lastRun('release'),
                sourcemap: config.sourcemap
                    // es6: config.get('es6')
            })
            .stream
            .pipe(ifElse(bs && config.livereload, function () {
                return bs.stream({
                    match: '**/*.*'
                });
            }));
        }
    ]));

    gulp.task('server', gulp.series([
        'release',
        function (cb) {

            var opts = {
                    open: 'external',
                    server: {
                        baseDir: config.dest,
                        directory: true,
                        middleware: [
                            function (req, res, next) {
                                res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                                res.setHeader('Expires', '-1');
                                res.setHeader('Pragma', 'no-cache');
                                next();
                            },
                            function (req, res, next) {
                                var url = req.url;
                                var filePath = path.join(config.cwd, url);

                                // 说明是.html后缀
                                if (url.indexOf('.html') === (url.length - 5)) {

                                    render(filePath).then(function (str) {
                                        var buf = new Buffer(str);

                                        res.charset = res.charset || 'utf-8';
                                        res.setHeader('Content-Type', res.getHeader('Content-Type') || 'text/html');
                                        res.setHeader('Content-Length', buf.length);
                                        res.end(buf);
                                    }).catch(function (e) {
                                        if (e) {
                                            res.writeHead(500, {'Content-Type': 'text/plain'});
                                            res.end(e);
                                        } else {
                                            res.writeHead(404, {'Content-Type': 'text/plain'});
                                            res.end('404 error! File not found.');
                                        }
                                    });

                                } else {
                                    next();
                                }
                            }
                        ]
                    },
                    logPrefix: 'SPHINX SERVER'
                },
                port, startpath;

            if ((port = config.port)) {
                opts['port'] = Number(port);
                opts['ui'] = {
                    port: port + 1
                };
            }

            if ((startpath = config.startpath)) {
                opts['startPath'] = startpath;
            }

            bs = require('browser-sync').create();

            // console.dir(bs.instance.utils.getHostIp());

            bs.init(opts, function () {

                if (config.qrcode) {
                    var ewm = require('./src/ewm.js');

                    // 生成二维码
                    ewm(bs);
                }

                gulp.watch(config.cwd, {
                    ignored: [
                        /[\/\\](\.)/,
                        require('path').join(config.cwd, config.dest)
                    ],
                    ignoreInitial: true
                }, gulp.task('release'));
            });

            cb();
        }
    ]));
}

function formatError(e) {
    if (!e.error) {
        return e.message;
    }

    // PluginError
    if (typeof e.error.showStack === 'boolean') {
        return e.error.toString();
    }

    // Normal error
    if (e.error.stack) {
        return e.error.stack;
    }

    // Unknown (string, number, etc.)
    return new Error(String(e.error)).stack;
}

function render(filePath) {
    return new Promise(function (resolve, reject) {
        fs.exists(filePath, function (exists) {
            if (exists) {
                nunjucks.render(filePath, function (err, str) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(str);
                    }
                });
            } else {
                reject();
            }

        });
    });
}

module.exports = execute;
