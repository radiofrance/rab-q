/* eslint-disable no-console */
'use strict';

const RabQ = require('../../../index');

const routingKey = process.argv[2] || 'quick.orange.rabbit';

const rabQ = new RabQ({
  hostname: 'localRabbitMQ',
  exchange: 'topic_logs'
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
