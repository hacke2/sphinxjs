'use strict';
var chalk = require('chalk');
var pkg = require('./package.json');

function showLogo(c, opts) {
    var lines = [],
        space,
        prefix,
        suffix,
        bigfont = require('bigfont');

    opts = opts || {};
    space = opts.lineStyle < 0 ? ' ' : '';
    prefix = opts.prefix || '';
    suffix = opts.suffix || '';

    c.split('').forEach(function (text, index) {
        var colorName = Array.isArray(opts.colors) && opts.colors[index],
            color = colorName in chalk ? chalk[colorName] : chalk['cyan'],
            temp = bigfont.lattice(text, opts);

        temp.split(/\n/).forEach(function (text, index) {
            if (!lines[index]) {
                lines[index] = '';
            }
            if (text) {
                lines[index] += space + color(text);
            }
        });
    });
    if (prefix || suffix) {
        lines = lines.map(function (line) {
            return prefix + line + suffix;
        });
    }
    return lines.join('\n');
}

module.exports = function (logo) {
    console.log('\n\r  v' + pkg.version + '\n');
    console.log(showLogo(logo || 'SPHINX', {
        space: '',
        lineStyle: -1,
        blockStyle: 2,
        colors: ['red', 'yellow', 'red', 'green', 'red']
    }));
    console.log('\n');
    process.exit(0);
};
