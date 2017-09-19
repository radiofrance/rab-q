'use strict';

const getConnection = require('../lib/get-connection');

module.exports = (settings, exchange) => {
  return getConnection(settings)
    .then(([conn, ch]) => new Promise((resolve, reject) => {
      ch.on('error', err => {
        conn.close();
        return reject(err);
      });

      // ConfirmChannel provide callback
      // see http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish
      // TODO: use ch.assertExchange or ch.checkExchange ?
      ch.publish(exchange, 'fake', new Buffer(JSON.stringify({})), {}, () => {
        conn.close();
        return resolve();
      });
    }));
};
