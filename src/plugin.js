/**
 * sphinx的解决方案和插件加载实现
 *
 * Authors:
 *     明礼 <guomilo@gmail.com>
 */

'use strict';

var PluginExtend = require('plugin-extend');
var objectAssign = require('object-assign');
var chalk = require('chalk');
var pluginExtend = new PluginExtend({
    prefix: 'sphinx-sln'
});

var newExtend = {
    getSlnCmd: function (sln) {
        var ret = this.getPlugin(sln + ':command');

        if (typeof ret == 'function') {
            return ret();
        }
        return;
    },
    getSlnTask: function (sln) {
        var ret = this.getPlugin(sln + ':task');

        if (!ret) {
            ret = require('./task/base.js');
            console.log(chalk.yellow('[warning] ' + sln + ' solution does not exist, will use the default program'));
        }

        return ret;
    },
    getSlnScaffold: function (sln) {
        return this.getPlugin(sln + ':init');
    }
};

module.exports = objectAssign(pluginExtend, newExtend);
