'use strict';

module.exports = (opts = {}) => {
  if (opts.protocol && opts.protocol !== 'amqp' && opts.protocol !== 'amqps') {
    throw new Error(`opts.protocol should be 'amqp' or 'amqps'. Currently "${typeof opts.protocol}".`);
  }
  if (opts.hostname && typeof opts.hostname !== 'string') {
    throw new Error(`opts.hostname should be a string. Currently "${typeof opts.hostname}".`);
  }
  if (opts.port && typeof opts.port !== 'number') {
    throw new Error(`opts.port should be a number. Currently "${typeof opts.port}"`);
  }
  if (opts.username && typeof opts.username !== 'string') {
    throw new Error(`opts.username should be a string. Currently "${typeof opts.username}".`);
  }
  if (opts.password && typeof opts.password !== 'string') {
    throw new Error(`opts.password should be a string. Currently "${typeof opts.password}".`);
  }
  if (opts.vhost && typeof opts.vhost !== 'string') {
    throw new Error(`opts.vhost should be a string. Currently "${typeof opts.vhost}".`);
  }

  if (!opts.exchange || typeof opts.exchange !== 'string') {
    throw new Error(`opts.exchange shoudle be a string. Currently "${opts.exchange}"`);
  }

  // Check queues opts. Can be undefined for autogenerate queue, a string or a array string
  if (opts.queues && !Array.isArray(opts.queues)) {
    opts.queues = [opts.queues];
  }

  if (opts.maxMessages && !Number.isInteger(opts.maxMessages)) {
    throw new Error(`opts.maxMessages should be a number. Currently "${typeof opts.maxMessages}"`);
  }
  if (opts.nackDelay && !Number.isInteger(opts.nackDelay)) {
    throw new Error(`opts.nackDelay should be a number. Currently "${typeof opts.nackDelay}"`);
  }
  if (opts.reconnectInterval && !Number.isInteger(opts.reconnectInterval)) {
    throw new Error(`opts.reconnectInterval should be a number. Currently "${typeof opts.reconnectInterval}"`);
  }
  if (typeof opts.autoAck !== 'boolean' && opts.autoAck) {
    throw new Error(`opts.autoAck should be a boolean. Currently "${typeof opts.autoAck}"`);
  }
  if (typeof opts.acceptPlainText !== 'boolean' && opts.acceptPlainText) {
    throw new Error(`opts.acceptPlainText should be a boolean. Currently "${typeof opts.acceptPlainText}"`);
  }
  if (typeof opts.autoReconnect !== 'boolean' && opts.autoReconnect) {
    throw new Error(`opts.autoReconnect should be a boolean. Currently "${typeof opts.autoReconnect}"`);
  }
  if (opts.validators) {
    if (typeof opts.validators === 'object') {
      if (opts.validators.consumer && typeof opts.validators.consumer !== 'function') {
        throw new Error(`opts.validators.consumer should be a function. Currently "${typeof opts.validators.consumer}"`);
      }
    } else {
      throw new Error(`opts.validators should be a object. Currently "${typeof opts.validators}"`);
    }
  }
};
