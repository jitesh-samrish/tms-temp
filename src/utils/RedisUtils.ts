import Redlock from 'redlock';
import { RedisClient } from '../config/RedisClient';
import { Logger } from './Logger';

const logger = Logger.create('RedisUtils');

export class RedisUtils {
  private static readonly COUNTER_TTL_SECONDS = 3 * 24 * 60 * 60; // 3 days
  private static readonly LOCK_TTL_MS = 5000; // 5 seconds lock TTL
  private static redlock: Redlock;

  /**
   * Initialize Redlock instance
   */
  private static getRedlock(): Redlock {
    if (!this.redlock) {
      const redis = RedisClient.getInstance();
      this.redlock = new Redlock([redis], {
        driftFactor: 0.01,
        retryCount: 10,
        retryDelay: 200,
        retryJitter: 200,
        automaticExtensionThreshold: 500,
      });
    }
    return this.redlock;
  }

  public static async addToStream(
    streamName: string,
    data: Record<string, any>
  ): Promise<string | null> {
    try {
      const redis = RedisClient.getInstance();
      // XADD streamName * key value key value ...
      // We stringify the data to store it as a single JSON blob in the stream message
      // The * indicates that Redis should generate the ID based on the current timestamp
      // The payload field holds the actual data
      const id = await redis.xadd(
        streamName,
        '*',
        'payload',
        JSON.stringify(data)
      );
      logger.debug(`Pushed to stream ${streamName} with ID: ${id}`);
      return id;
    } catch (error) {
      logger.warn('Failed to push to stream (Is Redis running?)', error);
      return null;
    }
  }

  /**
   * Acquire a lock for a specific trip
   * @param tripId The ID of the trip to lock
   * @param duration Lock duration in milliseconds (default: 30 seconds)
   * @returns The lock instance
   */
  static async acquireTripLock(tripId: string, duration: number = 30000) {
    const lockKey = `lock:trip:${tripId}`;
    const redlock = this.getRedlock();

    logger.debug(`Attempting to acquire lock for trip ${tripId}`);
    const lock = await redlock.acquire([lockKey], duration);
    logger.debug(`Lock acquired for trip ${tripId}`);

    return lock;
  }

  /**
   * Release a lock
   * @param lock The lock instance to release
   */
  static async releaseLock(lock: any): Promise<void> {
    try {
      await lock.release();
      logger.debug('Lock released successfully');
    } catch (err) {
      logger.error('Error releasing lock', err);
      throw err;
    }
  }

  /**
   * Execute a function with a trip lock
   * @param tripId The ID of the trip to lock
   * @param fn The function to execute while holding the lock
   * @param duration Lock duration in milliseconds (default: 30 seconds)
   * @returns The result of the function
   */
  static async withTripLock<T>(
    tripId: string,
    fn: () => Promise<T>,
    duration: number = 30000
  ): Promise<T> {
    const lock = await this.acquireTripLock(tripId, duration);

    try {
      const result = await fn();
      return result;
    } finally {
      await this.releaseLock(lock);
    }
  }

  static async checkSessionExists(sessionId: string): Promise<boolean> {
    try {
      const redis = RedisClient.getInstance();
      const key = `session:${sessionId}`;
      const session = await redis.get(key);
      return session !== null;
    } catch (err: any) {
      logger.error('Check session error', err);
      return false;
    }
  }
}
