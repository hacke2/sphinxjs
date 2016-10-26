/**
 * Authors:
 *     明礼 <guomilo@gmail.com>
 */

'use strict';
var nodeMail;
var gutil = require('gulp-util');
var config = require('./configure/config.js');
var _ = require('./util.js');
var messageList = [];

module.exports = {
    collectMessage: function (message) {
        messageList.push(message + '<br/>');
    },
    send: function (opts, callback) {
        var smtp, options, enabled, transport, message,
            mailConf = config.mail || {};

        if (!nodeMail) {
            nodeMail = require('nodemailer');
        }
        opts = opts || {};

        smtp = opts.smtp || mailConf.smtp || {};
        options = opts.options || mailConf.options || {};
        enabled = opts.enabled || mailConf.enabled;
        if (_.isEmpty(smtp) || _.isEmpty(options)) {
            return;
        }
        if (messageList.length == 0 || !enabled) {
            return;
        }
        transport = nodeMail.createTransport(smtp);
        message = messageList.join('');
        options.subject = opts.title || 'sphinx';
        options.html = message;
        options.text = message;
        transport.sendMail(options, function (err) {
            if (err) {
                gutil.log('Unable to send email: ' + err);
            }
            messageList = [];
            typeof callback == 'function' && callback(err);
        });
    }
};

