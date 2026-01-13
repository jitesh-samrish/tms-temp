import Redis, { RedisOptions } from 'ioredis';
import { Logger } from '../utils/Logger';

const logger = Logger.create('RedisClient');
import { ServerConfig } from './ServerConfig';

export class RedisClient {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis({
        host: ServerConfig.REDIS_HOST,
        port: ServerConfig.REDIS_PORT,
        lazyConnect: true, // Don't crash immediately if Redis isn't running for the demo
      });

      this.instance.on('error', (err) => {
        logger.error('Redis connection error', err);
      });
    }
    return this.instance;
  }
}

export const redisConnectionOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};
