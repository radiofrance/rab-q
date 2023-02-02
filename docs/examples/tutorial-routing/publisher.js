/* eslint-disable no-console */
'use strict';

const RabQ = require('../../../index');

const routingKey = process.argv[2] || 'error';

const fakeLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};

const rabQ = new RabQ({
  hostname: 'localRabbitMQ',
  exchange: 'direct_logs'
}, fakeLogger);

rabQ.start()
  .then(() => {
    rabQ.publish(routingKey, {});

    setTimeout(() => {
      rabQ.stop();
      process.exit(0);
    }, 500);
  });
