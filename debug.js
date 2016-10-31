// var stream = require('stream');
// var util = require('util');

// // node v0.10+ use native Transform, else polyfill
// var Transform = stream.Transform ||
//     require('readable-stream').Transform;

// function Upper(options) {
//     // allow use without new
//     if (!(this instanceof Upper)) {
//         return new Upper(options);
//     }
//     this.data = [];
//     // init Transform
//     Transform.call(this, options);
// }
// util.inherits(Upper, Transform);

// Upper.prototype._transform = function (chunk, enc, cb) {
//     var upperChunk = chunk.toString();

//     if (upperChunk % 2 == 0) {
//         //this.push(upperChunk);
//         this.data.push(upperChunk);
//     }
//     cb();
// };
// Upper.prototype._flush = function (chunk, enc, cb) {
//     this.push(JSON.stringify(this.data));
//     cb();
// };

// var upper = new Upper();

// upper.pipe(process.stdout);

// var count = 0;
// var t = setInterval(function () {
//     count += 1;
//     upper.write(count.toString());
//     if (count == 10) {
//         upper.end();
//         clearInterval(t);
//     }
// }, 500);
