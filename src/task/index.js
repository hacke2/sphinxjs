'use strict';
var util = require('util');
var Base = require('./base');
var config = require('../configure/config.js');
var _ = require('../util.js');
var m2c = require('../m2c.js');

function Task(obj, conf) {
    Base.apply(this, arguments);
};

util.inherits(Task, Base);

Task.prototype.handler = {
    m2c: {
        filter: function (path) {
            var extname = _.extname(path);

            return _.isJs(extname) || _.isHtml(extname);
        },
        postrelease: function (stream) {

            if (config.module) {
                return stream.pipe(m2c({
                    root: this._cwd,
                    ns: this._ns || 'sm',
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


