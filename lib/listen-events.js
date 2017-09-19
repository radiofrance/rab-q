'use strict';

module.exports = (conn, ch, rabQ) => {
  conn.on('error', err => {
    rabQ.emit('error', new Error(`Connection errored (amqp://${rabQ.hostname}:${rabQ.port}/${encodeURIComponent(rabQ.vhost)}) ${err.message}`));
  });

  ch.on('close', () => {
    rabQ.emit('log', {
      level: 'info',
      uuid: null,
      token: null,
      msg: `Connection closed (amqp://${rabQ.hostname}:${rabQ.port}/${encodeURIComponent(rabQ.vhost)})`
    });

    if (rabQ.isStarted) {
      setTimeout(() => {
        rabQ.stop()
          .then(() => rabQ.start());
      }, rabQ.reconnectInterval);
    }
  });

  return Promise.resolve([conn, ch]);
};
