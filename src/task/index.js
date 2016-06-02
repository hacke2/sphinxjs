'use strict';
var autoprefixer = require('autoprefixer');
var tmpl = require('gulp-template');
var postcss = require('gulp-postcss');
var util = require('util');
var Base = require('./base');
var config = require('../config.js');
var ext = require('../ext.js');
var _ = require('../util.js');
// var objectAssign = require('object-assign');
var m2c = require('../m2c.js');

function Task(obj, conf) {
    Base.apply(this, arguments);
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
    },
    m2c: {
        filter: function (path) {
            var extname = _.extname(path);

            return _.isJs(extname) || _.isHtml(extname);
        },
        postrelease: function (stream) {

            if (config.get('module')) {
                return stream.pipe(m2c({
                    root: config.get('cwd'),
                    fileBasedRoot: true
                }));
            } else {
                return stream;
            }

        }
    }

};

Task.prototype.constructor = Task;

module.exports = Task;
