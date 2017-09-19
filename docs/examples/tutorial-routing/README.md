# [Routing](https://www.rabbitmq.com/tutorials/tutorial-four-javascript.html)

Using RabbitMQ as a routing ('somecast') mechanism. emit_log_direct sends a log message with a severity, and all receive_logs_direct processes receive log messages for the severities on which they are listening.

## Prerequisite configuration

* Exchange `direct_logs` with type `direct`
* Queues `Q1`, `Q2`
* Binding `error` to `Q1`
* Binding `info` to `Q2`
* Binding `warning` to `Q2`
* Binding `error` to `Q2`

If management plugin is installed you can use these cURL request to create prerequisite.

```sh
$ curl -i -u guest:guest -H "content-type:application/json" -XPUT -d'{"type":"direct","durable":false}' http://localhost:15672/api/exchanges/%2f/direct_logs
$ curl -i -u guest:guest -H "content-type:application/json" -XPUT http://localhost:15672/api/queues/%2f/Q1
$ curl -i -u guest:guest -H "content-type:application/json" -XPUT http://localhost:15672/api/queues/%2f/Q2
$ curl -i -u guest:guest -H "content-type:application/json" -XPOST -d '{"routing_key":"error"}' http://localhost:15672/api/bindings/%2f/e/direct_logs/q/Q1
$ curl -i -u guest:guest -H "content-type:application/json" -XPOST -d '{"routing_key":"info"}' http://localhost:15672/api/bindings/%2f/e/direct_logs/q/Q2
$ curl -i -u guest:guest -H "content-type:application/json" -XPOST -d '{"routing_key":"warning"}' http://localhost:15672/api/bindings/%2f/e/direct_logs/q/Q2
$ curl -i -u guest:guest -H "content-type:application/json" -XPOST -d '{"routing_key":"error"}' http://localhost:15672/api/bindings/%2f/e/direct_logs/q/Q2
```

## Run

Start subscriber with `node subscriber.js` then in other terminal run publisher by `node publisher.js`.

Without argument publisher will send message with routing key `error`.

With binding between exchange and queues we have these behaviors:

* `error` will be consume by `Q1` and `Q2`
* `warning` will be consume by `Q2`
* `info` will be consume by `Q2`
