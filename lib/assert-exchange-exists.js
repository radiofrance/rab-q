'use strict';

const getConnection = require('../lib/get-connection');

module.exports = (settings, exchange) => {
  return getConnection(settings)
    .then(([conn, ch]) => {
      ch.on('error', () => {
        conn.close();
      });

      return ch.checkExchange(exchange)
        .then(() => conn.close());
    });
};
