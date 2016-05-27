'use strict';
var pkg = require('./package.json');
var config = require('./src/config.js');
var Liftoff = require('liftoff');
var gutil = require('gulp-util');
var gulp = require('gulp');
var chalk = gutil.colors;
var prettyTime = require('pretty-hrtime');
var tasks = config.get('_');
var yargs = require('yargs');
var cli = new Liftoff({
    name: 'sphinx',
    configName: 'sphinx-conf',
    extensions: {
        '.js': null,
        '.json': null
    }
});

tasks.splice(1);
if (isCommand(tasks)) {
    cli.launch({
        cwd: config.get('cwd'),
        configPath: config.get('sphinxconf')
    }, invoke);
} else {
    yargs.showHelp();
}

function invoke(env) {
    var version = [];

    if (config.get('version') && tasks.length === 0) {
        console.log('\n\r  v' + pkg.version + '\n');
        version.push('\t┏┛ ┻━━━━━┛ ┻┓');
        version.push('\t┃           ┃');
        version.push('\t┃　 　━     ┃');
        version.push('\t┃  ┳┛   ┗┳　┃');
        version.push('\t┃　 　　　  ┃');
        version.push('\t┃     ┻　　 ┃');
        version.push('\t┗━┓　　┏━━━━┛');
        version.push('\t  ┃　　┃');
        version.push('\t  ┃　　┗━━━━━━━━┓');
        version.push('\t  ┃　　　　　　 ┣┓');
        version.push('\t  ┃　　　　     ┏┛');
        version.push('\t  ┗━┓ ┓ ┏━┳ ┓ ┏━┛');
        version.push('\t    ┃ ┫ ┫ ┃ ┫ ┫');
        version.push('\t    ┗━┻━┛ ┗━┻━┛\n\r');
        console.log(chalk.yellow(version.join('\n')));
        process.exit(0);
    }

    // 加载配置文件
    require('./index')(env);

    gulp.on('start', function (e) {
        if (e.name === '<anonymous>') {
            return;
        }
        gutil.log('Starting', '\'' + chalk.cyan(e.name) + '\'...');
    });
    gulp.on('stop', function (e) {
        var time;

        if (e.name === '<anonymous>') {
            return;
        }

        time = prettyTime(e.duration);

        gutil.log(
            'Finished', '\'' + chalk.cyan(e.name) + '\'',
            'after', chalk.magenta(time)
        );
    });
    gulp.on('error', function (e) {
        var msg, time;

        if (e.name === '<anonymous>') {
            return;
        }

        msg = formatError(e);
        time = prettyTime(e.duration);

        gutil.log(
            '\'' + chalk.cyan(e.name) + '\'',
            chalk.red('errored after'),
            chalk.magenta(time)
        );
        gutil.log(msg || e.error.stack);
    });
    process.nextTick(function () {
        try {
            gulp.parallel(tasks)(function (err) {
                if (err) {
                    process.exit(1);
                }
            });
        } catch (e) {
        };
    });

}

function isCommand(tasks) {
    var commands = yargs.getCommandInstance().getCommands();

    if (tasks.length > 0) {
        if (!commands.length || commands.length && commands.indexOf(tasks[0]) >= 0) {
            return true;
        }
    } else if (yargs.argv.version || yargs.argv.help) {
        return true;
    }
    return false;

}

function formatError(e) {
    if (!e.error) {
        return e.message;
    }

    // PluginError
    if (typeof e.error.showStack === 'boolean') {
        return e.error.toString();
    }

    // Normal error
    if (e.error.stack) {
        return e.error.stack;
    }

    // Unknown (string, number, etc.)
    return new Error(String(e.error)).stack;
}
