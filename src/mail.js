'use strict';
var nodeMail = require('nodemailer');
var gutil = require('gulp-util');
var config = require('./config.js');

function Mail() {
    this.smtpConfig = config.get(['mail', 'smtp']);
    this.mailOptions = config.get(['mail', 'option']);
    this.mailTransport = nodeMail.createTransport(this.smtpConfig);
    this.message = [];
    this.enabled = config.get('email');
}

Mail.prototype = {
    send: function (title, callback) {
        var message;

        if (this.message.length == 0 || !this.enabled) {
            return;
        }
        message = this.message.join('');
        this.mailOptions.subject = title || 'sphinx';
        this.mailOptions.html = message;
        this.mailOptions.text = message;
        this.mailTransport.sendMail(this.mailOptions, function (err) {
            if (err) {
                gutil.log('Unable to send email: ' + err);
            }

            typeof callback == 'function' && callback(err);
        });
        this.message = [];

    },
    collectMessage: function (message) {
        this.message.push(message + '<br/>');
    }
};

module.exports = Mail;
