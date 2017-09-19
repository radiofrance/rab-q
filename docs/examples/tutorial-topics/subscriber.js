/* eslint-disable no-console */
'use strict';

const RabQ = require('../../../index');

const rabQ = new RabQ({
  hostname: 'localRabbitMQ',
  exchange: 'topic_logs',
  queues: ['Q1', 'Q2']
});

rabQ.on('error', err => {
  console.error(err);
});
rabQ.on('log', log => {
  console[log.level](log.msg, log.err || '');
});

rabQ.subscribesTo(/.*/, message => {
  // Do stuff!
  console.log(`Message consume from queue "${message.queue}" with routing key "${message.rk}"`);
  // Then acknowledge message by returning a constant
  return message.ACK;
});

rabQ.start();
