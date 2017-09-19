import test from 'ava';

import getConnection from '../lib/get-connection';

import minimalOptions from './config.json';

test('throw error if connection error', async t => {
  const c = Object.assign({}, minimalOptions, {hostname: 'notResolved'});
  await t.throws(getConnection(c));
});

test('get connection and channel', async t => {
  await t.notThrows(getConnection(minimalOptions)
    .then(([conn, ch]) => {
      t.truthy(conn);
      t.truthy(ch);
    }));
});
