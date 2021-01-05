import test from 'ava';
import delay from 'delay';

import RabQ from '..';

import minimalOptions from './config.json';

test('constructor with default options', t => {
  t.notThrows(() => {
    const p = new RabQ(minimalOptions);
    t.deepEqual({
      username: p.username,
      password: p.password,
      hostname: p.hostname,
      port: p.port,
      vhost: p.vhost,
      exchange: p.exchange,
      queues: p.queues
    }, minimalOptions);

    t.is(p.maxMessages, 1000);
    t.is(p.nackDelay, 0);
    t.is(p.reconnectInterval, 30000);
    t.is(p.autoAck, false);
    t.is(p.autoReconnect, true);
  });
});

test('constructor with overrides options', t => {
  let c;

  c = Object.assign({}, minimalOptions);
  c.maxMessages = 132;
  t.notThrows(() => {
    const p = new RabQ(c);
    t.is(p.maxMessages, 132);
  });

  c = Object.assign({}, minimalOptions);
  c.nackDelay = 456;
  t.notThrows(() => {
    const p = new RabQ(c);
    t.is(p.nackDelay, 456);
  });

  c = Object.assign({}, minimalOptions);
  c.reconnectInterval = 978;
  t.notThrows(() => {
    const p = new RabQ(c);
    t.is(p.reconnectInterval, 978);
  });

  c = Object.assign({}, minimalOptions);
  c.autoAck = true;
  t.notThrows(() => {
    const p = new RabQ(c);
    t.is(p.autoAck, true);
  });

  c = Object.assign({}, minimalOptions);
  c.autoReconnect = false;
  t.notThrows(() => {
    const p = new RabQ(c);
    t.is(p.autoReconnect, false);
  });
});

test('throw error if failed to start', async t => {
  const c = Object.assign({}, minimalOptions, {queues: 'notExists'});
  const p = new RabQ(c);
  await t.throws(p.start());
});

test('start connection', async t => {
  const p = new RabQ(minimalOptions);
  await t.notThrows(p.start().then(isNewConnection => {
    t.true(isNewConnection);
  }));
});

test('retry to connect until success', t => {
  const c = Object.assign({}, minimalOptions, {vhost: 'wrongVHost', reconnectInterval: 500});

  let countRetry = 0;
  const p = new RabQ(c);
  p.on('error', err => {
    if (err.toString().includes('Failed to connect')) {
      countRetry++;
    }
  });

  t.notThrows(p.start());

  return delay(1500)
    .then(() => {
      t.true(countRetry > 1);
    });
});

test('no retry to connect', t => {
  const c = Object.assign({}, minimalOptions, {vhost: 'wrongVHost', reconnectInterval: 500, autoReconnect: false});

  let countRetry = 0;
  const p = new RabQ(c);
  p.on('error', err => {
    if (err.toString().includes('Failed to connect')) {
      countRetry++;
    }
  });

  t.notThrows(p.start());

  return delay(1000)
    .then(() => {
      t.true(countRetry === 1);
    });
});

test('no start if connection already exist', async t => {
  const p = new RabQ(minimalOptions);
  await t.notThrows(p.start());
  const isNewConnection = await p.start();
  t.false(isNewConnection);
});

test('stop connection', async t => {
  const p = new RabQ(minimalOptions);
  await p.start();
  await t.notThrows(p.stop().then(isConnectionClosed => {
    t.true(isConnectionClosed);
  }));
});

test('no stop if no connection exist', async t => {
  const p = new RabQ(minimalOptions);
  await t.notThrows(p.stop().then(isConnectionClosed => {
    t.false(isConnectionClosed);
  }));
});

test('add subscribers', async t => {
  const p = new RabQ(minimalOptions);
  t.is(p.subscribers.length, 0);

  p.subscribesTo(/.*/, () => {});

  t.is(String(p.subscribers[0].patternMatch), String(/.*/));
  t.is(typeof p.subscribers[0].do, 'function');
  t.is(p.subscribers[0].before, undefined);
  t.is(p.subscribers[0].after, undefined);

  p.subscribesTo(/.unicorn*/, {
    before: () => {},
    do: () => {},
    after: () => {}
  });

  t.is(String(p.subscribers[1].patternMatch), String(/.unicorn*/));
  t.is(typeof p.subscribers[1].do, 'function');
  t.is(typeof p.subscribers[1].before, 'function');
  t.is(typeof p.subscribers[1].after, 'function');
});

test('healthcheck valid connection', async t => {
  const p = new RabQ(minimalOptions);
  await p.start();
  await t.notThrows(p.healthcheck());
});

test('healthcheck throws when error', async t => {
  const p = new RabQ(minimalOptions);

  p.on('error', () => {});
  await p.start();

  p.exchange = 'undefinedExchange';

  await t.throws(p.healthcheck());
});

test('check queue retrieve informations', async t => {
  const p = new RabQ(minimalOptions);
  await p.start();
  await t.notThrows(p.checkQueue('firstQueue'));
});

test('publish content', async t => {
  const p = new RabQ(minimalOptions);
  await p.start();
  t.notThrows(() => p.publish('fake', {cat: 'Simon'}));
  t.falsy(p.messagesToSend[Object.keys(p.messagesToSend)[0]]);
});

test('store content if publish wihout connection', t => {
  const p = new RabQ(minimalOptions);
  t.notThrows(() => p.publish('fake', {cat: 'Simon'}));
  t.truthy(p.messagesToSend[Object.keys(p.messagesToSend)[0]]);
});

test('publish store content when connection established', async t => {
  const p = new RabQ(minimalOptions);
  p.messagesToSend.randomId = {
    exchange: minimalOptions.exchange,
    routingKey: 'fake',
    content: {horse: 'Be'}
  };
  t.truthy(p.messagesToSend.randomId);
  await p.start();
  t.falsy(p.messagesToSend.randomId);
});
