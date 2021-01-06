'use strict';

module.exports = (conn, ch, rabQ) => {
  Object.keys(rabQ.messagesToSend).forEach(msgId => {
    rabQ.publish(rabQ.messagesToSend[msgId].routingKey, rabQ.messagesToSend[msgId].content, rabQ.messagesToSend[msgId].properties, msgId);
    delete rabQ.messagesToSend[msgId];
  });

  return Promise.resolve(([conn, ch]));
};
