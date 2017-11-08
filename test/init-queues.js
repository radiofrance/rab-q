import test from 'ava';

import RabQ from '../.';
import getConnection from '../lib/get-connection';
import initQueues from '../lib/init-queues';

import minimalOptions from './config.json';

test('init queues if not defined in options', async t => {
  const c = Object.assign({}, minimalOptions);
  delete c.queues;

  const p = new RabQ(c);

  const [conn, ch] = await getConnection(c);

  t.falsy(p.queues);
  await t.notThrows(initQueues(conn, ch, p)
    .then(([,, currentQueues]) => {
      t.falsy(p.queues);
      t.true(Array.isArray(currentQueues));
      t.is(typeof currentQueues[0], 'string');
    }));
});

test('init queues do nothing if already defined', async t => {
  const p = new RabQ(minimalOptions);

  const [conn, ch] = await getConnection(minimalOptions);

  t.true(Array.isArray(p.queues));
  t.is(p.queues[0], 'firstQueue');
  await t.notThrows(initQueues(conn, ch, p)
    .then(([,, currentQueues]) => {
      t.true(Array.isArray(currentQueues));
      t.is(currentQueues[0], 'firstQueue');
    }));
});
