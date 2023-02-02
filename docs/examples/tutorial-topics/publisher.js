/* eslint-disable no-console */
'use strict';

const RabQ = require('../../../index');
const fakeLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};

const routingKey = process.argv[2] || 'quick.orange.rabbit';

const rabQ = new RabQ({
  hostname: 'localRabbitMQ',
  exchange: 'topic_logs'
}, fakeLogger);

rabQ.start()
  .then(() => {
    rabQ.publish(routingKey, {});

    setTimeout(() => {
      rabQ.stop();
      process.exit(0);
    }, 500);
  });
