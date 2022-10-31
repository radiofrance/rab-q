# Use async and await

`rab-q` is written with Promise. You can easily use async function to start/stop connection.

```js
const RabQ = require('rab-q');
const fakeLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};

async function initConnection(options) {
  const r = new RabQ(options, fakeLogger);

  r.subscribesTo(/.*/, message => {
    // Do stuff

    return message.ACK;
  });

  await r.start();

  return r;
}

async function main() {
  const rabQ = await initConnection({
    exchange: 'amq.direct'
  });

  console.log('rabQ started');

  await rabQ.stop();
  console.log('rabQ stop');

}

main();
```
