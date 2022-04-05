'use strict';

const amqp = require('amqplib');

module.exports = settings => {
  const uri = settings.protocol + '://' + encodeURIComponent(settings.username) + ':' + encodeURIComponent(settings.password) + '@' + settings.hostname + ':' + settings.port + '/' + encodeURIComponent(settings.vhost);

  return amqp.connect(uri)
    .then(conn => conn.createConfirmChannel()
      .then(ch => [conn, ch]));
};
