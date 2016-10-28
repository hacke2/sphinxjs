'use strict';
var gulp = require('../../gulp');

module.exports = {
    release: handler,
    server: handler
};

function handler(task, argv) {
    try {
        gulp.parallel(task)(function (err) {
            if (err) {
                process.exit(1);
            }
        });
    } catch (e) {};
};
