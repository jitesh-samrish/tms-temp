import Redis from 'ioredis';
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
