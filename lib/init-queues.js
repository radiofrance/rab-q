'use strict';

module.exports = (conn, ch, rabQ) => {
  if (rabQ.queues) {
    return Promise.resolve([conn, ch]);
  }

  return ch.assertQueue('', {exclusive: true})
    .then(qOk => ch.bindQueue(qOk.queue, rabQ.exchange, '').then(() => qOk.queue))
    .then(queueGenerate => {
      rabQ.queues = [queueGenerate];
      return Promise.resolve([conn, ch]);
    });
};
