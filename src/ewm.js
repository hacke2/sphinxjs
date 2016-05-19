'use strict';
var qrcode = require('qrcode-terminal');
var gutil = require('gulp-util');
var chalk = gutil.colors;

module.exports = function (browserSync) {
    var localMap = browserSync.instance.options,
        localUrl;

    localUrl = localMap.getIn(['urls', 'external']);
    if (localUrl) {
        qrcode.generate(localUrl, function (qrcode) {
            var strs = [];

            strs.push('\n\n');

            strs.push('------------------BrowserSync URLs 二维码-------------------\n\n');

            strs.push(chalk.bold('External:') + chalk.magenta(localUrl + '\n\n'));

            strs.push(qrcode + '\n\n');

            strs.push('--------------------------------------------------------------\n');

            gutil.log(strs.join(''));
        });
    }
};
