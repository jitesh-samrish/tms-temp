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
   * Get next token number with DB fallback (no lock - lock managed by caller)
   * 1. Checks Redis for counter
   * 2. If not in Redis, loads from DB and syncs to Redis
   * 3. Increments in Redis
   * 4. Returns the new value (caller must save to DB after successful processing)
   */
  public static async getNextTokenNumber(
    tokenGeneratorId: string,
    getFromDB: () => Promise<number>
  ): Promise<number> {
    const redis = RedisClient.getInstance();
    const key = `token_gen:${tokenGeneratorId}:token_number`;

    // Check if counter exists in Redis
    const currentValue = await redis.get(key);

    if (currentValue === null) {
      // Counter not in Redis, load from DB
      const dbValue = await getFromDB();
      logger.info(
        `Token counter not in Redis for generator ${tokenGeneratorId}, loaded ${dbValue} from DB`
      );

      // Set Redis counter to DB value
      await redis.set(key, dbValue.toString());
      await redis.expire(key, this.COUNTER_TTL_SECONDS);
    }

    // Increment atomically in Redis
    const newTokenNumber = await redis.incr(key);
    logger.debug(
      `Generated token number ${newTokenNumber} for generator ${tokenGeneratorId}`
    );

    return newTokenNumber;
  }

  /**
   * Acquire lock on token generator
   */
  public static async acquireGeneratorLock(
    tokenGeneratorId: string
  ): Promise<any> {
    const lockKey = `lock:token_gen:${tokenGeneratorId}`;
    const redlock = this.getRedlock();

    const lock = await redlock.acquire([lockKey], this.LOCK_TTL_MS);
    logger.debug(`Acquired lock for token generator ${tokenGeneratorId}`);
    return lock;
  }

  /**
   * Release lock on token generator
   */
  public static async releaseGeneratorLock(
    lock: any,
    tokenGeneratorId: string
  ): Promise<void> {
    try {
      await lock.release();
      logger.debug(`Released lock for token generator ${tokenGeneratorId}`);
    } catch (error) {
      logger.warn(
        `Failed to release lock for generator ${tokenGeneratorId}:`,
        error
      );
    }
  }

  /**
   * Decrement token number (used when token generation fails)
   * Note: Caller should already hold the lock
   */
  public static async decrementTokenNumber(
    tokenGeneratorId: string
  ): Promise<void> {
    const redis = RedisClient.getInstance();
    const key = `token_gen:${tokenGeneratorId}:token_number`;

    const currentValue = await redis.get(key);
    if (currentValue !== null && parseInt(currentValue) > 0) {
      await redis.decr(key);
      logger.debug(
        `Decremented token number for generator ${tokenGeneratorId}`
      );
    }
  }

  /**
   * Decrement sequence number (used when sequence generation fails)
   */
  public static async decrementSequence(queueId: string): Promise<void> {
    const redis = RedisClient.getInstance();
    const key = `queue:${queueId}:sequence`;

    const currentValue = await redis.get(key);
    if (currentValue !== null && parseInt(currentValue) > 0) {
      await redis.decr(key);
      logger.debug(`Decremented sequence for queue ${queueId}`);
    }
  }

  /**
   * Set token number in Redis (used after successful DB save)
   */
  public static async setTokenNumber(
    tokenGeneratorId: string,
    value: number
  ): Promise<void> {
    const redis = RedisClient.getInstance();
    const key = `token_gen:${tokenGeneratorId}:token_number`;
    await redis.set(key, value.toString());
    await redis.expire(key, this.COUNTER_TTL_SECONDS);
    logger.debug(
      `Set token number to ${value} for generator ${tokenGeneratorId}`
    );
  }

  /**
   * Set sequence in Redis (used after successful DB save)
   */
  public static async setSequence(
    queueId: string,
    value: number
  ): Promise<void> {
    const redis = RedisClient.getInstance();
    const key = `queue:${queueId}:sequence`;
    await redis.set(key, value.toString());
    await redis.expire(key, this.COUNTER_TTL_SECONDS);
    logger.debug(`Set sequence to ${value} for queue ${queueId}`);
  }

  /**
   * Get next sequence number with DB fallback
   * 1. Checks Redis for counter
   * 2. If not in Redis, loads from DB and syncs to Redis
   * 3. Increments in Redis
   * 4. Returns the new value (caller must save to DB after successful processing)
   */
  public static async getNextSequence(
    queueId: string,
    getFromDB: () => Promise<number>
  ): Promise<number> {
    const redis = RedisClient.getInstance();
    const key = `queue:${queueId}:sequence`;

    // Check if counter exists in Redis
    const currentValue = await redis.get(key);

    if (currentValue === null) {
      // Counter not in Redis, load from DB
      const dbValue = await getFromDB();
      logger.info(
        `Sequence counter not in Redis for queue ${queueId}, loaded ${dbValue} from DB`
      );

      // Set Redis counter to DB value
      await redis.set(key, dbValue.toString());
      await redis.expire(key, this.COUNTER_TTL_SECONDS);
    }

    // Increment atomically in Redis
    const newSequence = await redis.incr(key);
    logger.debug(`Generated sequence ${newSequence} for queue ${queueId}`);

    return newSequence;
  }

  /**
   * Reset sequence counter for a queue
   * Key format: queue:{queueId}:sequence
   */
  public static async resetSequence(queueId: string): Promise<void> {
    const redis = RedisClient.getInstance();
    const key = `queue:${queueId}:sequence`;
    await redis.del(key);
    logger.info(`Reset sequence counter for queue ${queueId}`);
  }

  /**
   * Reset token number counter for a token generator
   * Key format: token_gen:{tokenGeneratorId}:token_number
   */
  public static async resetTokenNumber(
    tokenGeneratorId: string
  ): Promise<void> {
    const redis = RedisClient.getInstance();
    const key = `token_gen:${tokenGeneratorId}:token_number`;
    await redis.del(key);
    logger.info(
      `Reset token number counter for token_generator_id ${tokenGeneratorId}`
    );
  }

  /**
   * Get current token number without incrementing
   */
  public static async getCurrentTokenNumber(
    tokenGeneratorId: string
  ): Promise<number> {
    const redis = RedisClient.getInstance();
    const key = `token_gen:${tokenGeneratorId}:token_number`;

    const value = await redis.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Get current sequence without incrementing
   */
  public static async getCurrentSequence(queueId: string): Promise<number> {
    const redis = RedisClient.getInstance();
    const key = `queue:${queueId}:sequence`;

    const value = await redis.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Remove counters for a queue (called when queue is closed or reset)
   */
  public static async removeQueueCounters(
    queueId: string,
    tokenGeneratorId: string
  ): Promise<void> {
    const redis = RedisClient.getInstance();
    const tokenKey = `token_gen:${tokenGeneratorId}:token_number`;
    const sequenceKey = `queue:${queueId}:sequence`;

    await redis.del(tokenKey, sequenceKey);
    logger.debug(`Removed counters for queue ${queueId}`);
  }

  /**
   * Reset counters for a queue to zero
   */
  public static async resetQueueCounters(
    queueId: string,
    tokenGeneratorId: string
  ): Promise<void> {
    const redis = RedisClient.getInstance();
    const tokenKey = `token_gen:${tokenGeneratorId}:token_number`;
    const sequenceKey = `queue:${queueId}:sequence`;

    await redis.set(tokenKey, 0, 'EX', this.COUNTER_TTL_SECONDS);
    await redis.set(sequenceKey, 0, 'EX', this.COUNTER_TTL_SECONDS);
    logger.debug(`Reset counters for queue ${queueId}`);
  }

  /**
   * Initialize counters for a new queue
   */
  public static async initializeQueueCounters(
    queueId: string,
    tokenGeneratorId: string,
    startingNumber: number = 0
  ): Promise<void> {
    const redis = RedisClient.getInstance();
    const tokenKey = `token_gen:${tokenGeneratorId}:token_number`;
    const sequenceKey = `queue:${queueId}:sequence`;

    // Use SETNX to only set if key doesn't exist, with expiration
    const tokenSet = await redis.setnx(tokenKey, startingNumber);
    const sequenceSet = await redis.setnx(sequenceKey, startingNumber);

    // Set expiration if keys were created
    if (tokenSet) {
      await redis.expire(tokenKey, this.COUNTER_TTL_SECONDS);
    }
    if (sequenceSet) {
      await redis.expire(sequenceKey, this.COUNTER_TTL_SECONDS);
    }

    logger.debug(`Initialized counters for queue ${queueId}`);
  }

  /**
   * Acquire a lock for a specific queue
   * @param queueId The ID of the queue to lock
   * @param duration Lock duration in milliseconds (default: 30 seconds)
   * @returns The lock instance
   */
  static async acquireQueueLock(queueId: string, duration: number = 30000) {
    const lockKey = `lock:queue:${queueId}`;
    const redlock = this.getRedlock();

    logger.debug(`Attempting to acquire lock for queue ${queueId}`);
    const lock = await redlock.acquire([lockKey], duration);
    logger.debug(`Lock acquired for queue ${queueId}`);

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
   * Execute a function with a queue lock
   * @param queueId The ID of the queue to lock
   * @param fn The function to execute while holding the lock
   * @param duration Lock duration in milliseconds (default: 30 seconds)
   * @returns The result of the function
   */
  static async withQueueLock<T>(
    queueId: string,
    fn: () => Promise<T>,
    duration: number = 30000
  ): Promise<T> {
    const lock = await this.acquireQueueLock(queueId, duration);

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
