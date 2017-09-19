import test from 'ava';
import delay from 'delay';

import RabQ from '../.';
import getConnection from '../lib/get-connection';
import initQueues from '../lib/init-queues';
import setConsumer from '../lib/set-consumer';

import minimalOptions from './config.json';

async function makeRabQ(settings) {
  const p = new RabQ(settings);
  // p.on('log', log => {
  //   console.log(log.msg + ' ' + log.err);
  // });
  // p.on('error', err => {
  //   console.log(err);
  // });
  await p.start();
  return p;
}

test.todo('check if message is ack, nack, or reject by log emitted or/and number msg in queue and dead letter exchange');

test('set consumer without subscribers', async t => {
  const c = Object.assign({}, minimalOptions);
  delete c.queues;
  const p = new RabQ(c);
  const [conn, ch] = await getConnection(c);
  await initQueues(conn, ch, p);

  await t.notThrows(setConsumer(conn, ch, p));
});

test('set consumer with minimal form subscriber', async t => {
  t.plan(9);

  const contentToSend = {toto: 'tata'};

  const p = await makeRabQ(minimalOptions);

  p.subscribesTo(/test1\.random\.routingKey\.test1/, message => {
    t.deepEqual(message.content, contentToSend);
    t.is(message.rk, 'test1.random.routingKey.test1');
    t.is(message.queue, 'firstQueue');
    t.truthy(message.token);
    t.truthy(message.originMsg);
    t.truthy(message.consumeAt);
    t.is(Object.keys(p.unackedMessages).length, 1);
    t.truthy(message.rabQ);
    return Promise.resolve(message.ACK);
  });

  p.publish('test1.random.routingKey.test1', contentToSend);

  return delay(1000)
    .then(() => {
      t.is(Object.keys(p.unackedMessages).length, 0);
    });
});

test('set consumer with complete form subscriber', async t => {
  t.plan(3);

  const contentToSend = {toto: 'tata'};
  const c = Object.assign({}, minimalOptions);
  c.queues = 'secondQueue';
  const p = await makeRabQ(c);

  p.subscribesTo(/test2\.randomBis\.routingKey\.test2/, {
    before: message => {
      t.is(message.queue, 'secondQueue');
      message.content.awesome = 'kitten';
      return Promise.resolve();
    },
    do: message => {
      t.is(message.content.awesome, 'kitten');
      return Promise.resolve(message.ACK);
    },
    after: (message, returnCode) => {
      t.is(returnCode, message.ACK);
      return Promise.resolve(returnCode);
    }
  });

  p.publish('test2.randomBis.routingKey.test2', contentToSend);

  return delay(1000);
});

test('unacked message stored', async t => {
  t.plan(4);

  const contentToSend = {toto: 'tata'};
  const c = Object.assign({}, minimalOptions);
  c.queues = 'unackedQueue';
  const p = await makeRabQ(c);

  p.subscribesTo(/unacked\.randomUnacked\.routingKey\.unacked/, message => {
    t.is(message.rk, 'unacked.randomUnacked.routingKey.unacked');
    t.is(message.queue, 'unackedQueue');
    t.true(Object.keys(p.unackedMessages).length > 0);
    return new Promise(() => {});
  });

  p.publish('unacked.randomUnacked.routingKey.unacked', contentToSend);

  return delay(1000)
    .then(() => {
      t.true(Object.keys(p.unackedMessages).length > 0);
    });
});

test('autoAck mode', async t => {
  t.plan(7);

  const contentToSend = {toto: 'tata'};

  const c = Object.assign({}, minimalOptions);
  c.autoAck = true;
  delete c.queues;

  const p = await makeRabQ(c);

  p.subscribesTo(/.*/, message => {
    t.deepEqual(message.content, contentToSend);
    t.is(message.rk, '');
    t.is(message.queue, p.queues[0]);
    t.truthy(message.token);
    t.truthy(message.originMsg);
    t.truthy(message.consumeAt);
    t.truthy(message.rabQ);
  });

  p.publish('', contentToSend);

  return delay(1000);
});
