'use strict';
var qrcode = require('qrcode-terminal');
var gutil = require('gulp-util');

module.exports = function(browserSync) {
    var opts = browserSync.instance.ui.options.toString(),
        ip = opts.match(/"ui-external"[^}]*}/)[0].match(/http.*:/)[0],
        port = opts.match(/"mode": "server"[^}]*}/)[0].match(/\d{4}/)[0],
        url = ip + port;

    qrcode.generate(url, function (qrcode) {
        gutil.log('\n' + qrcode);
    });
}
