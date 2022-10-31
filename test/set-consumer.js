import test from 'ava';
import delay from 'delay';

import RabQ from '../.';
import getConnection from '../lib/get-connection';
import initQueues from '../lib/init-queues';
import setConsumer from '../lib/set-consumer';

import minimalOptions from './config.json';

const fakeLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};

async function makeRabQ(settings) {
  const p = new RabQ(settings, fakeLogger);
  await p.start();
  return p;
}

test.todo('check if message is ack, nack, or reject by log emitted or/and number msg in queue and dead letter exchange');

test('set consumer without subscribers', async t => {
  const c = Object.assign({}, minimalOptions);
  delete c.queues;
  const p = new RabQ(c, fakeLogger);
  const [conn, ch] = await getConnection(c);
  const [, , currentQueues] = await initQueues(conn, ch, p);

  await t.notThrows(setConsumer(conn, ch, currentQueues, p));
});

test('set consumer with minimal form subscriber', async t => {
  t.plan(7);

  const contentToSend = {toto: 'tata'};

  const p = await makeRabQ(minimalOptions);

  p.subscribesTo(/test1\.random\.routingKey\.test1/, async message => {
    t.deepEqual(message.content, contentToSend);
    t.is(message.rk, 'test1.random.routingKey.test1');
    t.is(message.queue, 'firstQueue');
    t.truthy(message.token);
    t.truthy(message.originMsg);
    t.truthy(message.consumeAt);
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

test('set consumer with message which does not validate', async t => {
  t.plan(1);

  const contentToSend = {toto: 'tata'};

  const c = Object.assign({}, minimalOptions);
  c.queues = 'thirdQueue';
  c.validators = {
    consumer: () => {
      return false;
    }
  };
  const p = await makeRabQ(c);

  p.subscribesTo(/test3\.random\.routingKey\.test3/, () => {
    t.not('Function not called', 'Function not called');
  });

  p.publish('test3.random.routingKey.test3', contentToSend);

  return delay(1000)
    .then(() => {
      t.is(Object.keys(p.unackedMessages).length, 0);
    });
});

test('set consumer with message which validate', async t => {
  t.plan(2);

  const contentToSend = {toto: 'tata'};

  const c = Object.assign({}, minimalOptions);
  c.queues = 'fourthQueue';
  c.validators = {
    consumer: () => {
      return true;
    }
  };
  const p = await makeRabQ(c);

  p.subscribesTo(/test4\.random\.routingKey\.test4/, message => {
    t.pass('Function called');
    return Promise.resolve(message.ACK);
  });

  p.publish('test4.random.routingKey.test4', contentToSend);

  return delay(1000)
    .then(() => {
      t.is(Object.keys(p.unackedMessages).length, 0);
    });
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
  t.plan(6);

  const contentToSend = {toto: 'tata'};

  const c = Object.assign({}, minimalOptions);
  c.autoAck = true;
  delete c.queues;

  const p = await makeRabQ(c);

  p.subscribesTo(/.*/, message => {
    t.deepEqual(message.content, contentToSend);
    t.is(message.rk, '');
    t.regex(message.queue, /amq\.gen-.*/);
    t.truthy(message.token);
    t.truthy(message.originMsg);
    t.truthy(message.consumeAt);
  });

  p.publish('', contentToSend);

  return delay(1000);
});

test('set before and after hooks', async t => {
  t.plan(2);

  const contentToSend = {toto: 'tata'};
  let afterHookMsg = null;

  const c = Object.assign({}, minimalOptions);
  c.queues = 'fithQueue';
  c.beforeHook = msg => {
    msg.test = 'before';
  };
  c.afterHook = (msg, result) => {
    afterHookMsg = msg.test + result;
  };

  const p = await makeRabQ(c);

  p.subscribesTo(/test5\.random\.routingKey\.test5/, message => {
    t.pass('Function called');
    return Promise.resolve(message.ACK);
  });

  p.publish('test5.random.routingKey.test5', contentToSend);

  return delay(1000)
    .then(() => {
      t.is(afterHookMsg, 'beforeACK');
    });
});

test('set prePublish', async t => {
  t.plan(2);

  const contentToSend = {toto: 'tata'};

  const c = Object.assign({}, minimalOptions);
  c.queues = 'sixthQueue';
  c.prePublish = (routingKey, content, properties) => {
    t.is(routingKey, 'test6.random.routingKey.test6');
    properties.headers.test = 'TEST';
    return {routingKey, content, properties};
  };

  const p = await makeRabQ(c);

  p.subscribesTo(/test6\.random\.routingKey\.test6/, message => {
    t.is(message.originMsg.properties.headers.test, 'TEST');
    return Promise.resolve(message.ACK);
  });

  p.publish('test6.random.routingKey.test6', contentToSend);

  return delay(1000);
});
