'use strict';
var objectAssign = require('object-assign');


// var cache = {};
var release = {
    describe: 'build and deploy your project',
    options: {
        glob: {
            alias: 'g',
            type: 'array',
            describe: 'to compile the file glob',
            'default': '**'
        },
        mod: {
            alias: 'm',
            demand: false,
            type: 'boolean',
            describe: 'enable modular'
        },
        dest: {
            alias: 'd',
            demand: false,
            type: 'string',
            describe: 'release output destination',
            'default': 'output'
        },
        optimize: {
            alias: 'o',
            demand: false,
            type: 'boolean',
            describe: 'with optimizing'
        },
        solution: {
            alias: 's',
            demand: false,
            type: 'string',
            describe: 'mount solution'
        },
        conf: {
            type: 'string',
            describe: 'manually set path of sphinxconf.js or sphinxconf.json',
            inConfFile: false
        },
        cwd: {
            type: 'string',
            describe: 'set project root',
            'default': process.cwd(),
            inConfFile: false
        },
        namespace: {
            type: 'string',
            describe: 'Specifies the namespace of the module',
            'default': 'ns'
        }

    },
    override: false
};

var server = {
    describe: 'launch web server',
    options: {

    },
    override: false
};

server.options = objectAssign({
    livereload: {
        alias: 'L',
        type: 'boolean',
        demand: false,
        describe: 'automatically reload your browser',
        'default': true
    },
    qrcode: {
        type: 'boolean',
        describe: 'generate qrcode'
    },
    startpath: {
        demand: false,
        type: 'string',
        describe: 'open the browser window at URL + startpath'
    },
    port: {
        alias: 'p',
        type: 'number',
        describe: 'server listen port'
    }
}, release.options);

var cmdConf = {
    release: release,
    server: server
        //init: init
};

module.exports = cmdConf;
