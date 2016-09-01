'use strict';
var through = require('through2');
var crypto = require('crypto');
var Store = require('./store.js');
var cache = new Store;

function md5(str) {
    return crypto
        .createHash('md5')
        .update(str)
        .digest('hex');
}

module.exports = function () {
    return through.obj(function (file, enc, cb) {
        var str,
            key;

        if (file.isNull()) {
            return cb();
        }

        if (file.isStream()) {
            this.push(file);
            return cb();
        }

        if (file.isBuffer()) {
            str = md5(file.contents);
            key = file.path;

            if (cache.find(key) !== str) {
                cache.add(key, str);
                this.push(file);
            }

            return cb();
        }
    }, function (cb) {
        require('fs').writeFile(('/Users/msy/log/' + Date.now()), JSON.stringify(cache._store));
        return cb();
    });
};
