'use strict';

const EventEmitter = require('events');

const {ConfirmChannel} = require('amqplib/lib/channel_model.js');
const uuid = require('uuid');
const pWaitFor = require('p-wait-for');

const assertExchangeExists = require('./lib/assert-exchange-exists');
const assertQueuesExists = require('./lib/assert-queues-exists');
const getConnection = require('./lib/get-connection');
const initQueues = require('./lib/init-queues');
const listenEvents = require('./lib/listen-events');
const resendMessages = require('./lib/resend-messages');
const setConsumer = require('./lib/set-consumer');
const validateOptions = require('./lib/validate-options');

const _channel = new WeakMap();
const _connection = new WeakMap();

class RabQ extends EventEmitter {
  constructor(opts, logger) {
    super();
    this.subscribers = [];
    this.messagesToSend = {};
    this.unackedMessages = {};

    validateOptions(opts);

    this.protocol = opts.protocol || 'amqp';
    this.hostname = opts.hostname || 'localhost';
    this.port = opts.port || 5672;
    this.username = opts.username || 'guest';
    this.password = opts.password || 'guest';
    this.socketOptions = opts.socketOptions;
    this.vhost = opts.vhost || '/'; // Name of virtual host in RabbitMQ to access queues
    this.acceptPlainText = opts.acceptPlainText || false;

    this.exchange = opts.exchange; // Name of exchange who distribute messages to queues through routing key

    this.queues = opts.queues; // Array of queue name. If undefined a autogenerate queue is created

    this.maxMessages = opts.maxMessages || 10; // Define count of message prefetched by channel. Once max reached RabbitMQ waits somes messages are acknowledged to proceed send messages.
    this.nackDelay = opts.nackDelay || 0; // Define a time delay in milliseconds before reject a message with NACK status to avoid immediate requeue
    this.reconnectInterval = opts.reconnectInterval || 30 * 1000; // Time in milliseconds before trying reconnect when connection lost
    this.autoAck = opts.autoAck || false; // Enable auto acknowledged message with ConfirmChannel
    this.autoReconnect = opts.autoReconnect !== false; // Enable auto reconnection if error happened on connection (default: true)

    this.validators = opts.validators || {};
    if (!this.validators.consumer) { // Function to validate all incoming message
      this.validators.consumer = () => true; // By default, all message are valid
    }

    this.beforeHook = opts.beforeHook || (() => {});
    this.afterHook = opts.afterHook || (() => {});
    this.prePublish = opts.prePublish || null;
    this.xQueryTokenFallback = opts.xQueryTokenFallback || (() => uuid.v4());

    _connection.set(this, undefined);
    _channel.set(this, undefined);

    this.on('log', log => {
      logger.info(null, log.token, log.msg, log.err);
    });

    this.on('error', err => {
      logger.error(null, null, 'pubsub error', err);
    });
  }

  start() {
    if (_connection.get(this)) {
      return false;
    }

    this.emit('log', {
      level: 'info',
      uuid: null,
      token: null,
      msg: `Connecting to RabbitMQ ... (${this.protocol}://${this.hostname}:${this.port}/${encodeURIComponent(this.vhost)})`
    });

    const settings = {
      protocol: this.protocol,
      hostname: this.hostname,
      port: this.port,
      username: this.username,
      password: this.password,
      vhost: this.vhost,
      socketOptions: this.socketOptions
    };

    return Promise.resolve()
      .then(() => assertExchangeExists(settings, this.exchange))
      .then(() => assertQueuesExists(settings, this.queues))
      .then(() => getConnection(settings))
      .then(([conn, ch]) => { // Save channel and connection to current instance of rab-q
        _channel.set(this, ch);
        _connection.set(this, conn);

        return Promise.resolve(([conn, ch]));
      })
      .then(([conn, ch]) => listenEvents(conn, ch, this))
      .then(([conn, ch]) => resendMessages(conn, ch, this))
      .then(([conn, ch]) => initQueues(conn, ch, this))
      .then(([conn, ch, currentQueues]) => setConsumer(conn, ch, currentQueues, this))
      .then(() => {
        this.isStarted = true;

        this.emit('log', {
          level: 'info',
          uuid: null,
          token: null,
          msg: `Connected (vhost : ${this.vhost}, exchange: ${this.exchange})`
        });

        return true;
      })
      .catch(err => {
        // Retry
        if (!err.message && err.fields) {
          err.message = err.fields.replyText;
        }

        this.emit('error', new Error(`Failed to connect (amqp://${this.hostname}:${this.port}/${encodeURIComponent(this.vhost)}) ${err.message}`));

        if (!this.autoReconnect) {
          return;
        }

        setTimeout(() => {
          this.stop()
            .then(() => this.start());
        }, this.reconnectInterval);
      });
  }

  stop() {
    const connection = _connection.get(this);

    if (!connection) {
      return Promise.resolve(false);
    }
    const ch = _channel.get(this);

    const cancelPromises = ch.consumerTag.map(tag => {
      return ch.cancel(tag)
        .then(() => {
          return pWaitFor(() => {
            return Object.keys(this.unackedMessages).length === 0;
          });
        });
    });
    return Promise.all(cancelPromises)
      .then(() => {
        _channel.set(this, undefined);
        _connection.set(this, undefined);
        return connection.close();
      })
      .then(() => true)
      .catch(() => {
        // If unexpected stop, reset variable to allow restart
        _channel.set(this, undefined);
        _connection.set(this, undefined);
      });
  }

  subscribesTo(patternMatch, action) {
    // TODO validate patternMatch is regex and action is fn or obj{before:fn, do:fn, after:fn}
    if (typeof action === 'function') {
      this.subscribers.push({
        patternMatch,
        do: action
      });
    } else {
      this.subscribers.push({
        patternMatch,
        before: action.before,
        do: action.do,
        after: action.after
      });
    }
  }

  healthcheck() {
    const ch = _channel.get(this);

    return ch.checkExchange(this.exchange);
  }

  checkQueue(name) {
    const ch = _channel.get(this);

    return ch.checkQueue(name);
  }

  publish(routingKey, content, properties = {}, messageId = uuid.v4()) {
    const ch = _channel.get(this);

    // if no headers in properties, we consider we were given the headers object (old way)
    if (!properties.headers) {
      properties = {
        headers: {...properties}
      };
    }

    if (!properties.headers['x-query-token']) {
      properties.headers['x-query-token'] = this.xQueryTokenFallback();
    }

    if (this.prePublish) {
      ({routingKey, content, properties} = this.prePublish(routingKey, content, properties));
    }

    this.emit('log', {
      level: 'info',
      uuid: content.uuid,
      token: properties.headers['x-query-token'],
      msg: `Publishing message with routingKey "${routingKey}" to exchange "${this.exchange}"`
    });

    try {
      const stringContent = this.acceptPlainText && typeof content === 'string' ? content : JSON.stringify(content);
      ch.publish(this.exchange, routingKey, Buffer.from(stringContent), properties, err => {
        if (err) {
          // Store message when error happened
          this.messagesToSend[messageId] = {
            exchange: this.exchange,
            routingKey,
            content,
            properties
          };
          this.emit('log', {
            level: 'error',
            uuid: content.uuid,
            token: properties.headers['x-query-token'],
            msg: `Error publishing message with routingKey "${routingKey}" to exchange "${this.exchange}"`,
            err
          });
        }
      });
    } catch (e) {
      // Store message when error happened
      this.messagesToSend[messageId] = {
        exchange: this.exchange,
        routingKey,
        content,
        properties
      };
      this.emit('log', {
        level: 'error',
        uuid: content.uuid,
        token: properties.headers['x-query-token'],
        msg: `Error publishing message (CATCH) with routingKey "${routingKey}" to exchange "${this.exchange}"`,
        err: e
      });
    }
  }
}

module.exports = RabQ;
module.exports.RabQ = RabQ;
module.exports.ConfirmChannel = ConfirmChannel;
