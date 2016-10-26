'use strict';

var spawn = require('cross-spawn');

try {
    spawn('npm', ['install', '-g', 'sphinx-sln-sc'], {
        stdio: 'inherit'
    }).on('error', function (error) {

    }).on('close', function () {

    });
} catch (e) {

}
