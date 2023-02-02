/* eslint-disable no-console */
'use strict';

const RabQ = require('../../../index');
const fakeLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};

const rabQ = new RabQ({
  hostname: 'localRabbitMQ',
  exchange: 'topic_logs',
  queues: ['Q1', 'Q2']
}, fakeLogger);

rabQ.subscribesTo(/.*/, message => {
  // Do stuff!
  console.log(`Message consume from queue "${message.queue}" with routing key "${message.rk}"`);
  // Then acknowledge message by returning a constant
  return message.ACK;
});

rabQ.start();
