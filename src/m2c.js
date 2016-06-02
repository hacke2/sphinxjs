/**
 * Authors:
 *     明礼 <guomilo@gmail.com>
 */

'use strict';
var through = require('through2');
var jsm2c = require('jsm2c');
var gutil = require('gulp-util');
var util = require('./util.js');
var list = {};

function processor(stream, config, cb) {
    var file, content;

    try {
        jsm2c.setGetContentHandler(function (path) {
            if (this.realpath in list) {
                return list[this.realpath].contents;
            }
        });
        for (var pth in list) {
            file = list[pth];
            content = jsm2c.parse(pth, config);

            if (content) {
                file.contents = new Buffer(content);
            }

            stream.push(file);
        }
    } catch (e) {
        cb(new gutil.PluginError('m2c', e.stack || e.error.stack));
        return;
    }
    list = {};

    return cb();
}

module.exports = function (config) {
    return through.obj(function (file, enc, cb) {
        var extname;

        if (file.isNull()) {
            this.push(file);
            return cb();
        }
        extname = util.extname(file.path);
        if (!util.isJs(extname) && !util.isHtml(extname)) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            var cStream = file.contents, chunks = [],
                onreadable = function () {
                    var chunk;

                    while (null !== (chunk = cStream.read())) {
                        chunks.push(chunk);
                    }
                };

            cStream.on('readable', onreadable);
            cStream.once('end', function () {
                cStream.removeListener('readable', onreadable);
                file.contents = Buffer.concat(chunks);
                list[file.path] = file;
                cb();

            });
        }
        if (file.isBuffer()) {
            list[file.path] = file;
            cb();
        }

    }, function (cb) {

        return processor(this, config, cb);

    });
};

