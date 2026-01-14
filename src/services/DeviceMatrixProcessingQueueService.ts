import { Queue, QueueOptions } from 'bullmq';
import { Logger } from '../utils/Logger';
import { redisConnectionOptions } from '../config/RedisClient';

const logger = Logger.create('QueueService');

/**
 * Job data interface for track processing
 */
export interface TrackProcessingJobData {
  rawMatrixId: string;
}

/**
 * Queue name constant
 */
export const DEVICE_MATRIX_PROCESSING_QUEUE = 'device-matrix-processing';

/**
 * Queue options
 */
const queueOptions: QueueOptions = {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 1000, // Keep last 1000 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 5000, // Keep last 5000 failed jobs
    },
  },
};

/**
 * Queue Service for managing track processing jobs
 */
class QueueService {
  private processingQueue: Queue<TrackProcessingJobData>;

  constructor() {
    this.processingQueue = new Queue<TrackProcessingJobData>(
      DEVICE_MATRIX_PROCESSING_QUEUE,
      queueOptions
    );

    this.processingQueue.on('error', (error) => {
      logger.error('Queue error:', error);
    });
  }

  /**
   * Add a job to process a raw matrix record
   * @param rawMatrixId - The ID of the raw DeviceMatrix document
   * @returns Job ID
   */
  async addJob(rawMatrixId: string): Promise<string> {
    const job = await this.processingQueue.add(
      DEVICE_MATRIX_PROCESSING_QUEUE,
      { rawMatrixId },
      {
        jobId: rawMatrixId, // Use rawMatrixId as jobId to prevent duplicates
        priority: 1,
      }
    );

    return job.id || rawMatrixId;
  }

  /**
   * Add multiple jobs in bulk
   * @param rawMatrixIds - Array of raw matrix IDs
   */
  async addBulkJobs(rawMatrixIds: string[]): Promise<void> {
    const jobs = rawMatrixIds.map((id) => ({
      name: DEVICE_MATRIX_PROCESSING_QUEUE,
      data: { rawMatrixId: id },
      opts: {
        jobId: id,
        priority: 1,
      },
    }));

    await this.processingQueue.addBulk(jobs);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.processingQueue.getWaitingCount(),
      this.processingQueue.getActiveCount(),
      this.processingQueue.getCompletedCount(),
      this.processingQueue.getFailedCount(),
      this.processingQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    await this.processingQueue.pause();
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    await this.processingQueue.resume();
  }

  /**
   * Close the queue connection
   */
  async close(): Promise<void> {
    await this.processingQueue.close();
  }

  /**
   * Get the processing queue instance
   */
  getQueue(): Queue<TrackProcessingJobData> {
    return this.processingQueue;
  }
}

// Export singleton instance
export const queueService = new QueueService();
export default queueService;
