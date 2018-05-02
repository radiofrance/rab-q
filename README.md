<h1 align="center">rab-q</h1>

<div align="center">
  :rabbit2: :dash: :dash: :dash: :dash: :turtle:
</div>
<div align="center">
  <strong>Bunnies love turtles</strong>
</div>
<div align="center">
  A tiny (opinionated) wrapper over amqplib for RabbitMQ publish-subscribe pattern
</div>

<br />

<div align="center">
  <!-- NPM version -->
  <a href="https://npmjs.org/package/rab-q">
    <img src="https://img.shields.io/npm/v/rab-q.svg?style=flat-square"
      alt="NPM version" />
  </a>
  <!-- Build Status -->
  <a href="https://travis-ci.org/radiofrance/rab-q">
    <img src="https://img.shields.io/travis/radiofrance/rab-q/master.svg?style=flat-square"
      alt="Build Status" />
  </a>
  <!-- Test Coverage -->
  <a href="https://codecov.io/github/radiofrance/rab-q">
    <img src="https://img.shields.io/codecov/c/github/radiofrance/rab-q/master.svg?style=flat-square"
      alt="Test Coverage" />
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/rab-q">
    <img src="https://img.shields.io/npm/dm/rab-q.svg?style=flat-square"
      alt="Downloads" />
  </a>
  <!-- Standard -->
  <a href="http://www.radiofrance.fr/">
    <img src="https://img.shields.io/badge/radio-france-blue.svg?style=flat-square&colorA=0046e2&colorB=000000"
      alt="RadioFrance" />
  </a>
</div>

## Table of Contents
* [Features](#features)
* [Our use case at @RadioFrance](#our-use-case-at-radiofrance)
* [Installation](#installation)
* [Usage](#usage)
* [API](#api)
* [Events](#events)
* [See Also](#see-also)

## Features
* __minimal dependencies:__ only [`amqplib`](https://github.com/squaremo/amqp.node) and [`uuid`](https://github.com/kelektiv/node-uuid) are needed
* __promises-based:__ async/await support makes it easy to use
* __small api:__ 4 methods only, there's not much to learn :wink:
* __instantiation-able:__ the library itself is a Class ; get as many independent instance as needed
* __events logging:__ choose your own log transport
* __disconnections-proof:__ auto reconnect/resend when errors happen

## Our use case at @RadioFrance
This wrapper was tailored made for our microservices architecture.

We use RabbitMQ as the bus in the publish-subscribe pattern. A message is never sent directly to a queue, it is always sent to a configured *exchange*.

Every message should be acknowledged by returning a value : `ACK`, `NACK`, `REJECT` (`message.ACK`, `message.NACK` or `message.REJECT` in the *message* object).

A non-acknowledged message will be redelivered one time to the *exchange*. A rejected message will be directly deleted or redirected to the [dead letter exchange](https://www.rabbitmq.com/dlx.html) if configured.

Our queues and exchanges are defined by a external engine. `rab-q` doesn't provide API to create, assert or delete these.

## Installation
```sh
$ npm install rab-q
```

## Usage
```js
const RabQ = require('rab-q');

const rabQ = new RabQ({
  exchange: 'your_topic_exchange',
  queues: 'queue_bind_to_exchange'
});

rabQ.on('error', err => {
  console.error(err);
});
rabQ.on('log', log => {
  console[log.level](log.msg, log.err || '');
});

rabQ.subscribesTo(/.*/, message => {
  // Do stuff!

  // Then acknowledge message by returning a constant
  return message.ACK;
});

rabQ.start()
  .then(() => {
    rabQ.publish('yourRoutingKeyHere', {your: 'message'});
  });
```

## API

### new RabQ(options)

#### options

##### username

Type: `string`<br>
Default: `guest`

User to connect on RabbitMQ.

##### password

Type: `string`<br>
Default: `guest`

Password associate to username.

##### hostname

Type: `string`<br>
Default: `localhost`

Hostname to trying to get connection.

##### port

Type: `number`<br>
Default: `5672`

Port of connection.

##### vhost

Type: `string`<br>
Default: `/`

Selected virtual host.

##### exchange

*Required*<br>
Type: `string`<br>

Exchange to publish messages.

##### queues

Type: `Array<string>` `string`

Consumes messages from these queues.

If this option is omitted or has a *falsey* value, server will create random names.

##### maxMessages

Type: `number`<br>
Default: `1000`

Defines the number of messages prefetched by channel. Once the max number of messages is reached, RabbitMQ will wait for some messages to be acknowledged before proceeding with new messages.

##### nackDelay

Type: `number`<br>
Default: `0`

Defines a delay in milliseconds before a message is rejected with NACK.

##### reconnectInterval

Type: `number` *(milliseconds)*<br>
Default: `0`

Time in milliseconds before trying to reconnect when connection is lost.

##### autoAck

Type: `boolean`<br>
Default: `false`

Enables auto acknowledgment.

##### autoReconnect

Type: `boolean`<br>
Default: `true`

Enables auto reconnection if an error happens while connecting to the server.

##### validators

Type: `Object of function`<br>

###### validators.consumer

Type: `boolean`<br>
Default: `return true`

Function run before each message treatment. If it return a false value, the message is reject.

### rabQ.start()

Starts a connection.

Returns a promise resolved with `true` for a successful connection or `false` if a connection already exists.

### rabQ.stop()

Stops and closes a connection.

### rabQ.publish(routingKey, content, headers)

Publishes a message on exchange `rabQ.exchange`.

#### routingKey

*Required*<br>
Type: `string`

A regular expression to match the routing keys of consumed messages.

#### content

*Required*<br>
Type: `Object`

A message object to send to the exchange.

#### headers

Type: `Object`<br>
Default: `{}`

Adds RabbitMQ headers to the message.

You can provide a property `x-query-token` to trace the lifecyle of a request. If not provided a new UUID will be generated.

### rabQ.subscribesTo(patternMatch, action)

Adds a Subscriber on consumed messages filtered by the routing key

#### patternMatch

*Required*<br>
Type: `RegExp`

A regular expression to match on the routing keys of consumed messages.

#### action(message)

*Required*<br>
Type: `Function`

A function should acknowledge (or not) messages by returning either a value or a resolved promise with value. (`'ACK'`, `'NACK'` or `'REJECT'`)

`message` is a object with following properties:
* __ACK__ `string`: the constant returned for a positive acknowledgment
* __NACK__ `string`: the constant returned for a negative acknowledgment. _NACK will re-queuing message one time._
* __REJECT__ `string`: the constant returned for a rejection without redelivery.
* __content__ `Object`: content of the received message
* __rk__ `string`: routing key of the message
* __queue__ `string`: queue name where the message is consumed
* __token__ `string`: a UUID to identify the message
* __consumeAt__ `number`: timestamp when the message is consumed

## Events

### `'log'`

Emits a log object with the following properties:
* __level__ `string`: can be `info`, `warn`, `error`
* __token__ `string`: the UUID to identify the message
* __msg__ `string`: the message,
* __err__ `Object`: the original error if log level is _error_

### `'error'`

Emits an Error if something goes wrong with the connection. If you don't catch this event the process will sto

## See Also
* [RabbitMQ Website](http://www.rabbitmq.com/)
* [`amqplib`](https://github.com/squaremo/amqp.node)

## License
[CECILL-B](https://spdx.org/licenses/CECILL-B.html)
