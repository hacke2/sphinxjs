'use strict';
var autoprefixer = require('autoprefixer');
var tmpl = require('gulp-template');
var postcss = require('gulp-postcss');
var util = require('util');
var Base = require('./base');
var m2c = require('../m2c.js');
var config = require('../config.js');
var ext = require('../ext.js');
var _ = require('../util.js');
var objectAssign = require('object-assign');

function Task(obj, conf) {
    Base.apply(this, arguments);
    if (config.get('module')) {
        var m2cConf = config.get('m2c') || {ns: 'sm'};

        this.on('compiled', function (stream, cb, flag) {
            m2cConf = objectAssign(m2cConf, {
                fileBasedRoot: true,
                isOptimizer: !!flag
            });
            stream = stream.pipe(m2c(m2cConf));
            cb(stream);
        });
    }
};

util.inherits(Task, Base);

Task.prototype.handler = {
    css: {
        compile: function (stream) {
            return stream
                .pipe(postcss([
                    autoprefixer({
                        browsers: ['Android >= 2', 'iOS >= 3']
                    })
                ]));
        }
    },

    tmpl: {
        filter: function (path) {
            var extname = _.extname(path);

            return extname === ext.tmpl;
        },

        compile: function (stream) {
            return stream
                .pipe(tmpl.precompile({
                    variable: 'obj'
                }));
        },

        optimize: function (stream) {
            return stream;
        }
    },

    tpl: {

        filter: function (path) {
            var extname = _.extname(path);

            return extname === ext.tpl;
        },

        compile: function (stream) {
            return stream;
        },

        optimize: function (stream) {
            return stream;
        }
    }

};
module.exports = Task;
