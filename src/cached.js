'use strict';
var through = require('through2');
var crypto = require('crypto');
var Store = require('./store.js');
var cache = new Store;

module.exports = function () {
    return through.obj(function (file, enc, cb) {
        var md5,
            key;

        if (file.isNull()) {
            return cb();
        }

        if (file.isStream()) {
            this.push(file);
            return cb();
        }

        if (file.isBuffer()) {
            md5 = crypto
                .createHash('md5')
                .update(file.contents.toString())
                .digest('hex');

            key = file.path;

            if (cache.find(key) !== md5) {
                cache.add(key, md5);
                this.push(file);
            }

            return cb();
        }
    });
};
