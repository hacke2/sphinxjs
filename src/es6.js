'use strict';
var through = require('through2');
var babel = require('babel-core');
var babelPreset1 = require('babel-preset-stage-3');
var babelPreset2 = require('babel-preset-es2015');
var es6Tag = /'use es6';/;

function useEs6(file) {
    var contents = file.contents.toString();

    return es6Tag.test(contents);
}
function transformEs6(file) {
    var contents = file.contents.toString().replace(es6Tag, ''),
        result = babel.transform(contents, {
            presets: [babelPreset1, babelPreset2]
        }).code;

    file.contents = new Buffer(result);
}

module.exports = function () {
    return through.obj(function (file, enc, cb) {
        file.isBuffer() && useEs6(file) && transformEs6(file);
        this.push(file);
        return cb();
    });
};
