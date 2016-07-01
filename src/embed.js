'use strict';
var through = require('through2');
var _ = require('./util');
var lang = require('./lang');
var Store = require('./store');

var store = new Store;

module.exports = function (cache) {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.push(file);
            return cb();
        }

        if (file.isBuffer()) {
            store.add(file.path, {
                file: file,
                piped: false
            });
            cb();
        }
    }, function (cb) {
        var stream = this;

        // 错误处理
        function error(message) {
            var util = require('gulp-util');

            cb(new util.PluginError('embed', message));
        };

        function embed(obj) {
            var file, contents, dirname, cwd,
                c, meta;

            if (obj.piped) {
                return;
            }

            file = obj.file;

            if (file.sphinx) {
                meta = file.sphinx.meta;
                cache.add(meta.path, {
                    deps: [],
                    props: {
                        path: meta.path,
                        cwd: meta.cwd,
                        base: meta.base
                    }
                });

                c = cache.find(meta.path);
            }

            // 非图片
            if (_.isImage(_.extname(file.path))) {
                obj.piped = true;
                stream.push(file);
                return;
            }

            contents = file.contents.toString();
            dirname = _.dirname(file.path);
            cwd = file.cwd;

            contents = contents.replace(lang.reg, function (all, type, depth, url, extra) {
                var info, obj, ret, message,
                    meta;

                info = _.uri(url, dirname, cwd);
                obj = store.find(info.release);

                if (obj && !obj.piped) {
                    embed(obj);
                }

                try {
                    switch (type) {
                        case 'embed':
                        case 'jsEmbed':
                            if (obj) {
                                ret = obj.file.contents;
                                if (!_.isText(info.rExtname)) {
                                    // 非文本文件 buffer
                                    ret = info.quote + _.base64(ret, info.rExtname) + info.quote;
                                } else {
                                    // 文本文件必须 toString()
                                    ret = ret.toString();
                                    if (type === 'jsEmbed' &&
                                        !_.isJsLike(info.rExtname)) {
                                        ret = JSON.stringify(ret);
                                    }

                                    if (obj.file.sphinx) {
                                        meta = obj.file.sphinx.meta;
                                        c.deps.push(meta.path);
                                    }
                                }
                            } else {
                                message = 'unable to embed non-existent file [' + url + '] in [' + file.path + ']';
                            }

                            break;
                        case 'uri':
                            if (info.url) {
                                ret = info.quote + info.url + info.quote;
                            } else {
                                ret = url;
                            }

                            break;
                        case 'require':
                            if (info.id) {
                                ret = info.quote + info.id + info.quote;

                                if (obj.file.sphinx) {
                                    meta = obj.file.sphinx.meta;
                                    c.deps.push(meta.path);
                                }
                            } else {
                                ret = url;
                            }

                            break;
                    }

                    if (message) {
                        error(message);
                    }
                } catch (e) {
                    error(e.message + ' in [' + file.path + ']');
                }

                return ret;
            });

            file.contents = new Buffer(contents);
            obj.piped = true;
            stream.push(file);
        }

        store.each(embed);

        // 清空
        store.clear();
        return cb();
    });
};
