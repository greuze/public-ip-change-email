var nodemailer = require('nodemailer');
var logger = require('logops');
var exec = require('child_process').exec;
var config = require('./config.js');

function sendChangeIpEmail(transporter, ip) {
    // Setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"Public IP Change" ' + config.smtp.auth.user, // Sender address
        to: config.to, // List of receivers
        subject: 'New Public IP is ' + ip, // Subject line
        text: 'Public IP address has changed to ' + ip, // Plaintext body
        html: '<b>Public IP address has changed to ' + ip + '</b>' // HTML body
    };

    // Send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info) {
        if(error) {
            return logger.error(error);
        }
        logger.debug('Message sent:', info.response);
    });
}

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport(config.smtp);
var ip;

function main() {
    exec('dig +short myip.opendns.com @resolver1.opendns.com', function (err, stdout, stderr) {
        if (err) {
            logger.error('Error getting public IP address', err);
            sendChangeIpEmail(transporter, 'ERROR');
        } else {
            // Remove new line
            var newIp = stdout.replace(/\n/g, '');
            if (newIp !== ip) {
                logger.info('New public Ip', newIp);
                ip = newIp;
                sendChangeIpEmail(transporter, ip);
            } else {
                logger.debug('Ip remains');
            }
            // Next run will be at 'delay' minutes
            setTimeout(main, config.delay * 60 * 1000);
        }
    });
}
main();