'use strict';

require('dotenv').config({silent: true});

var logger = require('logops');

var config = {
    smtp: {
        host: process.env.IPCHANGE_SMTP_HOST,
        port: parseInt(process.env.IPCHANGE_SMTP_PORT),
        secure: process.env.IPCHANGE_SMTP_SECURE === 'true',
        auth: {
            user: process.env.IPCHANGE_SMTP_USER,
            pass: process.env.IPCHANGE_SMTP_PASS
        }
    },
    to: process.env.IPCHANGE_TO,
    delay: process.env.IPCHANGE_DELAY
};

function getConfigErrors(configBlock, rawPath) {
    var path = rawPath || '';
    var errors = 0;
    for(var propertyName in configBlock) {
        var propertyValue = configBlock[propertyName];
        if (propertyValue === undefined ||
            (typeof propertyValue === 'number' && isNaN(propertyValue)) ||
            (typeof propertyValue === 'string' && propertyValue === '')) {
            logger.error('Required config property \'%s/%s\' is not set properly', path, propertyName);
            errors++;
        } else if (typeof propertyValue === 'object') {
            errors += getConfigErrors(propertyValue, path + '/' + propertyName);
        } else if (/password/i.test(propertyName)) {
            logger.debug('Config property "%s/%s" is', path, propertyName, '******');
        } else {
            logger.debug('Config property "%s/%s" is', path, propertyName, propertyValue);
        }
    }
    return errors;
}

var configErrors = getConfigErrors(config);
if (configErrors) {
    logger.fatal('Configuration load found %d errors, program will exit', configErrors);
    process.exit();
}

module.exports = config;
