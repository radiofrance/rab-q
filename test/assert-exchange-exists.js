import test from 'ava';

import assertExchangeExists from '../lib/assert-exchange-exists';

import minimalOptions from './config.json';

test('throw error if exchange is unreacheable', async t => {
  await t.throws(assertExchangeExists(minimalOptions, 'cat'));
});

test('assert exchange is reacheable', async t => {
  await t.notThrows(assertExchangeExists(minimalOptions, 'rf'));
});
