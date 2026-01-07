declare module 'winston3-logstash-transport' {
  import Transport from 'winston-transport';
  import { TransportStreamOptions } from 'winston-transport';

  interface LogstashTransportOptions extends TransportStreamOptions {
    mode?: 'udp' | 'udp4' | 'udp6' | 'tcp' | 'tcp4' | 'tcp6';
    localhost?: string;
    host?: string;
    port?: number;
    applicationName?: string;
    pid?: number | string;
    silent?: boolean;
    maxConnectRetries?: number;
    timeoutConnectRetries?: number;
    label?: string;
    sslEnable?: boolean;
    sslKey?: string;
    sslCert?: string;
    sslCA?: string | string[];
    sslPassPhrase?: string;
    rejectUnauthorized?: boolean;
    trailingLineFeed?: boolean;
    trailingLineFeedChar?: string;
    formatted?: boolean;
    json?: boolean;
  }

  class WinstonLogStash extends Transport {
    constructor(options?: LogstashTransportOptions);
  }

  export = WinstonLogStash;
}
