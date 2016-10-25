// var co = require('co');

// function* b() {
//     var t = yield xx();
//     console.log(t);
// }
// var t = b();
// t.next();
// t.next(6);

// function xx() {
//     console.log('33');
//     return function () {
//         console.log('22');
//     };
// }

// var pkg = require('plugin-extend/package.json');
// console.dir(pkg);
// var npm = require('npm-install-package');

// npm(['bibo'], { silent: true }, function () {});

// var _progress = require('cli-progress');

// // create a new progress bar instance 
// var bar1 = new _progress.Bar();
// var t = 200;
// var c = 1;
// // start the progress bar with a total value of 200 and start value of 0 
// // bar1.start(200, 0);

// // // update the current value in your application.. 
// // bar1.update(100);

// setInterval(function () {
//     t = t + 2;
//     bar1.start(t, c);
//     bar1.update((c = c + 4))
//     if (c >= t) {
//         process.exit(0);
//     }
// }, 300);

// stop the progress bar 
// bar1.stop();
var inquirer = require('inquirer');
var BottomBar = inquirer.ui.BottomBar;
var cmdify = require('cmdify');

var loader = [
    '/ Installing',
    '| Installing',
    '\\ Installing',
    '- Installing'
];
var i = 4;
var ui = new BottomBar({ bottomBar: loader[i % 4] });

setInterval(function () {
    ui.updateBottomBar(loader[i++ % 4]);
}, 300);

var spawn = require('child_process').spawn;

var cmd = spawn(cmdify('npm'), ['-g', 'install', 'inquirer'], { stdio: 'pipe' });
cmd.stdout.on('data', function (d) {
    console.log(d.toString());
})
cmd.on('close', function () {
    ui.updateBottomBar('Installation done!\n');
    process.exit();
});
