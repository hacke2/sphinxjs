'use strict';
var asyncDone = require('async-done');

function debounce(func, wait) {
    var timeout, args = [], context, timestamp;

    function later() {
        // 据上一次触发时间间隔
        var last = Date.now() - timestamp;

        // 上次被包装函数被调用时间间隔last小于设定时间间隔wait
        if (last < wait && last > 0) {
            timeout = setTimeout(later, wait - last);
        } else {
            func.apply(context, args);
            timeout = null;
            args = [];
            context = null;
        }
    };

    return function () {
        context = this;

        args = args.concat([].slice.call(arguments));

        timestamp = Date.now();
        // 如果延时不存在，重新设定延时
        if (!timeout) {
            timeout = setTimeout(later, wait);
        }
    };
};

function watch(glob, opts, cb) {
    var delay = 200;
    var safePathReg = /[\\\/][_\-.\s\w]+$/i;
    var running = false;
    var queue = [];
    var watcher = require('chokidar').watch(glob, opts);

    function runComplete(err) {
        running = false;

        if (err) {
            watcher.emit('error', err);
        }

        if (queue.length > 0) {
            onChange.apply(null, queue);
            queue.length = 0;
        }
    }

    function onChange() {
        var args = [].slice.call(arguments);

        args.forEach(function (path, i) {
            if (!safePathReg.test(path)) {
                args.splice(i, 1);
            }
        });

        if (args.length === 0) {
            return;
        }

        if (running) {
            queue = queue.concat(args);
            return;
        }

        running = true;
        asyncDone(cb(args), runComplete);
    };

    var fn = debounce(onChange, delay);

    watcher
        .on('change', fn)
        .on('unlink', fn)
        .on('add', fn)
        .on('error', function (err) {
            console.log(err);
        });

    return watcher;
}

module.exports = watch;
