'use strict';

module.exports = (conn, ch, rabQ) => {
  if (rabQ.queues) {
    return Promise.resolve([conn, ch, rabQ.queues]);
  }

  return ch.assertQueue('', {exclusive: true})
    .then(qOk => ch.bindQueue(qOk.queue, rabQ.exchange, '').then(() => qOk.queue))
    .then(queueGenerate => Promise.resolve([conn, ch, [queueGenerate]]));
};
