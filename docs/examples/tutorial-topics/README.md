# [Topics](https://www.rabbitmq.com/tutorials/tutorial-five-javascript.html)

Extends the previous tutorial to routing with wildcarded patterns.

## Prerequisite configuration

* Exchange `topic_logs` with type `topic`
* Queues `Q1`, `Q2`
* Binding `*.orange.*` to `Q1`
* Binding `*.*.rabbit` and `lazy.#` to `Q2`

If management plugin is installed you can use these cURL request to create prerequisite.

```sh
$ curl -i -u guest:guest -H "content-type:application/json" -XPUT -d'{"type":"topic","durable":false}' http://localhost:15672/api/exchanges/%2f/topic_logs
$ curl -i -u guest:guest -H "content-type:application/json" -XPUT http://localhost:15672/api/queues/%2f/Q1
$ curl -i -u guest:guest -H "content-type:application/json" -XPUT http://localhost:15672/api/queues/%2f/Q2
$ curl -i -u guest:guest -H "content-type:application/json" -XPOST -d '{"routing_key":"*.orange.*"}' http://localhost:15672/api/bindings/%2f/e/topic_logs/q/Q1
$ curl -i -u guest:guest -H "content-type:application/json" -XPOST -d '{"routing_key":"*.*.rabbit"}' http://localhost:15672/api/bindings/%2f/e/topic_logs/q/Q2
$ curl -i -u guest:guest -H "content-type:application/json" -XPOST -d '{"routing_key":"lazy.#"}' http://localhost:15672/api/bindings/%2f/e/topic_logs/q/Q2
```

## Run

Start subscriber with `node subscriber.js` then in other terminal run publisher by `node publisher.js`.

Without argument publisher will send message with routing key `quick.orange.rabbit`.

With binding between exchange and queues we have these behaviors:

* `quick.orange.rabbit` will be consume by `Q1` and `Q2`
* `lazy.orange.elephant` will be consume by `Q1` and `Q2`
* `quick.orange.fox` will be consume by `Q1`
* `lazy.brown.fox` will be consume by `Q2`
* `lazy.pink.rabbit` will be consume by `Q2`
* `quick.brown.fox` doesn't match any binding so it will be discarded
