/* eslint-disable no-console */
'use strict';

const RabQ = require('../../../index');

const routingKey = process.argv[2] || 'error';

const rabQ = new RabQ({
  hostname: 'localRabbitMQ',
  exchange: 'direct_logs'
});

rabQ.on('error', err => {
  console.error(err);
});
rabQ.on('log', log => {
  console[log.level](log.msg, log.err || '');
});

rabQ.start()
  .then(() => {
    rabQ.publish(routingKey, {});

    setTimeout(() => {
      rabQ.stop();
      process.exit(0);
    }, 500);
  });
