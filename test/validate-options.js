import test from 'ava';

import validateOptions from '../lib/validate-options';

import minimalOptions from './config.json';

test('options validate', t => {
  t.notThrows(() => {
    validateOptions(minimalOptions);
  });
});

test('options queues become array', t => {
  const c = Object.assign({}, minimalOptions);
  c.queues = minimalOptions.queues[0];

  t.is(typeof c.queues, 'string');
  validateOptions(c);
  t.true(Array.isArray(c.queues));
});

test('options mandatory', t => {
  t.throws(() => {
    validateOptions();
  });
  t.throws(() => {
    validateOptions({});
  });

  const c = Object.assign({}, minimalOptions);
  delete c.exchange;
  t.throws(() => {
    validateOptions(c);
  });
});

test('options optional validate', t => {
  let c;

  c = Object.assign({}, minimalOptions);
  c.username = ['unicorn'];
  t.throws(() => {
    validateOptions(c);
  });

  c = Object.assign({}, minimalOptions);
  c.password = 123456;
  t.throws(() => {
    validateOptions(c);
  });

  c = Object.assign({}, minimalOptions);
  c.hostname = {};
  t.throws(() => {
    validateOptions(c);
  });

  c = Object.assign({}, minimalOptions);
  c.port = {};
  t.throws(() => {
    validateOptions(c);
  });

  c = Object.assign({}, minimalOptions);
  c.vhost = true;
  t.throws(() => {
    validateOptions(c);
  });

  c = Object.assign({}, minimalOptions);
  c.maxMessages = 'unicorn';
  t.throws(() => {
    validateOptions(c);
  });

  c = Object.assign({}, minimalOptions);
  c.nackDelay = [46];
  t.throws(() => {
    validateOptions(c);
  });

  c = Object.assign({}, minimalOptions);
  c.reconnectInterval = {obj: 'uncorn'};
  t.throws(() => {
    validateOptions(c);
  });

  c = Object.assign({}, minimalOptions);
  c.autoAck = 'notBoolean';
  t.throws(() => {
    validateOptions(c);
  });

  c = Object.assign({}, minimalOptions);
  c.autoReconnect = 'notBoolean';
  t.throws(() => {
    validateOptions(c);
  });

  c = Object.assign({}, minimalOptions);
  c.validators = 'notObject';
  t.throws(() => {
    validateOptions(c);
  });

  c = Object.assign({}, minimalOptions);
  c.validators = {
    consumer: 'notFunction'
  };
  t.throws(() => {
    validateOptions(c);
  });
});
