'use strict';
var through = require('through2');
var _ = require('./util');
var inline = require('./inline');
var ext = require('./ext');
var lang = require('./lang');
var fs = require('fs');
var props = require('./props');
var objectAssign = require('object-assign');
var File = require('vinyl');

var exists;

module.exports = function (cache, compile) {

    // 更新文件依赖信息
    function updateDeps(file) {
        var sphinx = file.sphinx;
        var meta = sphinx.meta;
        var extname = _.extname(meta.path);
        var contents, dirname, cwd;
        var c;

        cache.add(meta.path, {
            deps: [],
            props: {
                path: meta.path,
                cwd: meta.cwd,
                base: meta.base
            }
        });

        // 图片无依赖
        if (_.isImage(extname)) {
            return;
        }

        c = cache.find(meta.path);
        dirname = _.dirname(meta.path);
        cwd = meta.cwd;
        contents = file.contents.toString();

        switch (extname) {
            case ext.js:
                contents = inline.execJs(contents);
                break;
            case ext.css:
            case ext.scss:
            case ext.sass:
                contents = inline.execCss(contents);
                break;
            case ext.html:
                contents = inline.execHtml(contents);
                break;
        }

        contents.replace(lang.reg, function (all, type, depth, url, extra) {
            var info = _.uri(url, dirname, cwd);

            if (info.realpath && info.exists) {
                if (type === 'embed' || type === 'jsEmbed') {
                    c.deps.push(info.realpath);
                }
                if (type === 'require') {
                    c.deps.push(info.realpath);
                }
            }
        });
    }

    function getDeps(file) {
        var sphinx = file.sphinx;
        var meta = sphinx.meta;
        var rets = [];

        var c = cache.find(meta.path);

        if (c && c.deps.length > 0) {
            rets = rets.concat(c.deps);
        }

        cache.each(function (item, key) {
            if (item.deps.indexOf(meta.path) !== -1) {
                rets.push(key);
            }
        });

        exists.push(meta.path);

        return rets;
    }

    // 生成stream文件
    function addFile(deps, cb) {
        var stream = through.obj(function (file, enc, cb) {
            this.push(file);
            cb();
        });

        deps.forEach(function (path) {
            var obj = {};

            if (exists.indexOf(path) !== -1) {
                return;
            }

            objectAssign(obj, cache.find(path).props);
            obj['stat'] = fs.lstatSync(path);
            obj['contents'] = fs.readFileSync(path);

            stream.write(new File(obj));
            exists.push(path);
        });

        stream = stream.pipe(props());
        stream = compile(stream);
        stream.on('data', function (file) {
            cb(file);
        });

    }

    return through.obj(function (file, enc, cb) {
        var deps = [];

        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.push(file);
            return cb();
        }

        if (file.isBuffer()) {

            if (cache.count() !== 0) {
                updateDeps(file);
                deps = getDeps(file);

                addFile(deps, function (file) {
                    this.write(file);
                }.bind(this));

            }
            this.push(file);
            return cb();
        }
    }, function (cb) {
        exists = [];
        cb();
    });
};
