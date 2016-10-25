/**
 * Authors:
 *     明礼 <guomilo@gmail.com>
 */
'use strict';

var fs = require('fs');
var pth = require('path');
var _ = require('./util');

function buildScGlob(target, root, dest, lastRun) {
    var contents;
    var execHtml;
    var lang;
    var globs = [target];

    target = pth.join(root, target);

    if (!_.exists(target)) {
        return '**';
    }

    execHtml = require('./inline').execHtml;
    lang = require('./lang');

    contents = fs.readFileSync(target, 'utf8');
    contents = execHtml(contents);

    contents.replace(lang.reg, function (all, type, depth, url, extra) {
        var info,
            subpath;

        if (type === 'embed') {
            info = _.uri(url, _.dirname(target), root);

            if (info.extname === '.html' && info.dirname.indexOf(root) === 0) {
                var dirname = info.dirname;

                subpath = dirname.substring(root.length);
                console.log(subpath);
                globs.push(
                    pth.join(subpath, '**')
                    .replace(/^\//, '')
                    .replace(/shortcuts/, '+(shortcuts)')
                );

                if (/\/hy_/.test(dirname)) {
                    dirname = pth.resolve(dirname, '../common');
                    subpath = dirname.substring(root.length);
                    globs.push(
                        pth.join(subpath, '**')
                        .replace(/^\//, '')
                        .replace(/shortcuts/, '+(shortcuts)')
                    );
                }

                globs.push('+(symbol)/**');
            }
        }
    });

    function filter(pattern) {
        var glob = require('glob');
        var matches = glob.sync(pattern);

        if (matches.length === 0) {
            return false;
        }
        return !matches.every(function (file) {
            return fs.lstatSync(file).mtime <= lastRun;
        });
    }

    if (filter('+(js|tmpl)/**')) {
        globs.push('+(js|tmpl)/**');
    }

    if (filter('+(css|img)/**')) {
        globs.push('+(css|img)/**');
    }

    return globs;

}
module.exports = {
    buildScGlob: buildScGlob
};
