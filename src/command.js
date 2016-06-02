/**
 * Authors:
 *     明礼 <guomilo@gmail.com>
 */

'use strict';
var yargs = require('yargs'),
    chalk = require('chalk'),
    argvOptions, commander;

argvOptions = {
    M: {
        alias: 'module',
        demand: false,
        type: 'boolean',
        describe: chalk.gray('opening modular')
    },
    d: {
        alias: 'dest',
        demand: false,
        type: 'string',
        describe: chalk.gray('release output destination')
    },
    o: {
        alias: 'optimize',
        demand: false,
        type: 'boolean',
        describe: chalk.gray('with optimizing')
    },
    s: {
        alias: 'solution',
        demand: false,
        type: 'string',
        describe: chalk.gray('mount solution')
    },

    g: {
        alias: 'glob',
        type: 'array',
        describe: chalk.gray('fiter release file')
    },
    sphinxconf: {
        type: 'string',
        describe: chalk.gray('Manually set path of sphinxconf')
    },
    cwd: {
        type: 'string',
        'default': process.cwd(),
        describe: chalk.gray('set project root')
    },
    email: {
        type: 'boolean',
        describe: chalk.gray('send error to your set email')
    }
};
commander = {
    release: {
        command: 'release',
        describe: chalk.gray('build and deploy your project'),
        builder: function () {
            return yargs
                .options(argvOptions)
                .usage(chalk.bold('\nUsage:') + ' $0 release [options]')
                .help('h')
                .describe('h', chalk.gray('show help information'));
        },
        handler: function (argv) {
        }
    },
    server: {
        command: 'server',
        describe: chalk.gray('launch web server'),
        builder: function () {
            return yargs
                .options(argvOptions)
                .usage(chalk.bold('\nUsage:') + ' $0 server [options]')
                .help('h')
                .describe('h', chalk.gray('show help information'));
        },
        handler: function (argv) {
        }
    }
};
module.exports = commander;
