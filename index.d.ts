import {MessageProperties} from 'amqplib';

type ACK = 'ACK';
type NACK = 'NACK';
type REJECT = 'REJECT';

type Result = ACK | NACK | REJECT;

type Message = {
  ACK: ACK;
  NACK: NACK;
  REJECT: REJECT;
  content: Record<any, any>;
  rk: string;
  queue: string;
  token: string;
  consumeAt: number;
  originMsg: any;
};

export interface RabQConfig {
  username?: string;
  password?: string;
  protocol?: string;
  hostname?: string;
  port?: number;
  socketOptions?: any;
  vhost?: string;
  exchange?: string;
  queues?: string[] | string;
  maxMessages?: number;
  nackDelay?: number;
  reconnectInterval?: number;
  autoAck?: boolean;
  autoReconnect?: boolean;
  validators?: {
    consumer: (exchange: string, queue: string, parsedMesage: Message) => boolean;
  };
  beforeHook?: (message: Message) => void;
  afterHook?: (message: Message, subscriberResult: Result) => void;
  prePublish?: (routingkey: string, content: Record<any, any>, properties?: MessageProperties) => void;
}

interface Logger {
  debug(
    uuid: string | null,
    token: string | null,
    message: string,
    error?: unknown,
  ): void;
  info(
    uuid: string | null,
    token: string | null,
    message: string,
    error?: unknown,
  ): void;
  warn(
    uuid: string | null,
    token: string | null,
    message: string,
    error?: unknown,
  ): void;
  error(
    uuid: string | null,
    token: string | null,
    message: string,
    error?: unknown,
  ): void;
}

export default class RabQ {
  start: () => Promise<boolean>;
  stop: () => Promise<boolean>;
  publish: (routingkey: string, content: Record<any, any>, properties?: MessageProperties) => void;
  subscribesTo: (patternMatch: RegExp, action: {
    do: (message: Message) => Result | Promise<Result>;
  }) => void;

  constructor(config: RabQConfig, logger: Logger);

  on(event: 'log', callback: (log: {
    level: 'info' | 'warn' | 'error';
    token: 'string';
    msg: 'string';
    err: any;
  }) => void): void;
  on(event: 'error', callback: (error: Error) => void): void;
}
