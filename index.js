var nodemailer = require('nodemailer');
var logger = require('logops');
var exec = require('child_process').exec;
var config = require('./config.js');
var os = require('os');

function sendChangeIpEmail(transporter, publicIp, privateIps) {
    // Setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"Public IP Change" ' + config.smtp.auth.user, // Sender address
        to: config.to, // List of receivers
        subject: 'New Public IP is ' + publicIp, // Subject line
        text: 'Public: ' + publicIp + ', privates: ' + privateIps, // Plaintext body
        html: 'Public: <b>' + publicIp + '</b>, privates: ' + privateIps // HTML body
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
var publicIp;

function getPrivateIps() {
    var ifaces = os.networkInterfaces();
    var privateIps = [];
    for (var ifaceName in ifaces) {
        privateIps = privateIps.concat(ifaces[ifaceName].filter(function(iface) {
            return iface.family === 'IPv4' && iface.internal === false;
        }));
    }
    return privateIps.map(function(iface) { return iface.address; }).join(',');
}

function main() {
    exec('dig +short myip.opendns.com @resolver1.opendns.com', function (err, stdout, stderr) {
        if (err) {
            logger.error('Error getting public IP address', err);
            sendChangeIpEmail(transporter, 'ERROR');
        } else {
            // Remove new line
            var newPublicIp = stdout.replace(/\n/g, '');
            if (newPublicIp !== publicIp) {
                publicIp = newPublicIp;
                var privateIps = getPrivateIps();
                logger.info('New public IP %s with private IPs %s', newPublicIp, privateIps);
                sendChangeIpEmail(transporter, publicIp, privateIps);
            } else {
                logger.debug('Ip remains');
            }
            // Next run will be at 'delay' minutes
            setTimeout(main, config.delay * 60 * 1000);
        }
    });
}
main();
