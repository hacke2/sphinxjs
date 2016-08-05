/**
 * Authors:
 *     明礼 <guomilo@gmail.com>
 */
'use strict';

var fs = require('fs');
var config = require('./config.js');
var pth = require('path');
var _ = require('./util');

function formatPath(path) {
    var rPath = path.replace(/[\\\/]/g, '/');

    return rPath;
}

function buildGlob(root, dest, deep) {
    var globs = [],
        files;

    if (config.get('glob')) {
        return;
    }

    dest = formatPath(pth.relative(root, dest || config.get('dest'))).split('/')[0];
    deep = deep || 2;
    globs.push('**.**');
    (function getBolbs(dir, curDeep) {
        files = fs.readdirSync(dir);

        files.forEach(function (name) {
            var path,
                stat,
                rPath,
                glob;

            if (name.indexOf('.') == 0 || (curDeep == 1 && dest == name)) {
                return;
            }

            path = dir + '/' + name;
            stat = fs.statSync(path);
            rPath = formatPath(pth.relative(root, path));
            if (rPath.indexOf('/') > 0) {
                rPath = '+(' + rPath.replace(/\//, ')/');
            } else {
                rPath = '+(' + rPath + ')';
            }
            if (stat.isDirectory()) {
                if (curDeep < deep) {
                    getBolbs(path, curDeep + 1);
                } else {
                    glob = rPath + '/**';
                    glob && globs.push(glob, glob + '.**');
                }

            } else {
                glob = rPath;
                glob && globs.push(glob);
            }

        });
    }(root, 1));

    config.set('glob', globs);
}

function buildScGlob(target, root, dest, lastRun) {
    var contents;
    var execHtml;
    var lang;
    var globs = [];

    target = pth.join(root, target);

    if (!_.exists(target)) {
        buildGlob(root, dest);
        return;
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

                // console.log(fs.lstatSync(dirname));

                subpath = dirname.substring(root.length);
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
            }
        }
    });

    globs.push('+(js)/**');
    globs.push('+(css)/**');
    globs.push('+(symbol)/**');
    globs.push('+(tmpl)/**');
    globs.push('+(img)/**');

    config.set('glob', globs);
}
module.exports = {
    buildGlob: buildGlob,
    buildScGlob: buildScGlob
};

