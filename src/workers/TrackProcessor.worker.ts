import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import {
  TRACK_PROCESSING_QUEUE,
  TrackProcessingJobData,
} from '../services/TrackProcessingQueueService';
import { DeviceMatrix } from '../models/DeviceMatrix.model';
import { ProcessedDeviceMatrix } from '../models/ProcessedDeviceMatrix.model';
import { calculateDistance } from '../utils/geo.util';
import { kalmanService } from '../services/KalmanService';
import { Logger } from '../utils/Logger';
import { redisConnectionOptions } from '../config/RedisClient';

const logger = Logger.create('TrackProcessorWorker');

/**
 * Minimum distance threshold for stop detection (in meters)
 */
const STOP_THRESHOLD_METERS = 5;

/**
 * Maximum age of last known location to consider (in seconds)
 */
const MAX_LAST_LOCATION_AGE_SECONDS = 300; // 5 minutes

/**
 * Process a track record
 */
async function processTrack(job: Job<TrackProcessingJobData>) {
  const { rawMatrixId } = job.data;

  try {
    // 1. Query DeviceMatrix to get the raw document
    const rawMatrix = await DeviceMatrix.findById(rawMatrixId).lean();

    if (!rawMatrix) {
      throw new Error(`Raw matrix not found: ${rawMatrixId}`);
    }

    // 2. Query ProcessedDeviceMatrix to find the last known location for this device
    const lastProcessed = await ProcessedDeviceMatrix.findOne({
      deviceId: rawMatrix.deviceId,
    })
      .sort({ timestamp: -1 })
      .limit(1)
      .lean();

    // 3. Filtering Logic
    if (!lastProcessed) {
      // No previous point exists - save immediately
      await saveProcessedMatrix(rawMatrix);
      logger.info(`First point saved for device: ${rawMatrix.deviceId}`);
      return { action: 'saved_first_point', rawMatrixId };
    }

    // Check if raw point is older than last processed (out-of-order)
    const timeDiffSeconds =
      (rawMatrix.timestamp.getTime() - lastProcessed.timestamp.getTime()) /
      1000;

    if (timeDiffSeconds < 0) {
      // Received point is older than last processed - skip
      logger.info(
        `Skipping out-of-order point for device ${
          rawMatrix.deviceId
        }: raw timestamp is ${Math.abs(timeDiffSeconds).toFixed(
          0
        )}s older than last processed`
      );
      return { action: 'skipped_out_of_order', rawMatrixId };
    }

    // Check if last processed location is too old (stale)
    const lastProcessedAge =
      (Date.now() - lastProcessed.timestamp.getTime()) / 1000;

    if (lastProcessedAge > MAX_LAST_LOCATION_AGE_SECONDS) {
      // Last processed point is too old - treat current point as a fresh start
      // Reset Kalman filter for this device
      kalmanService.resetDevice(rawMatrix.deviceId.toString());

      await saveProcessedMatrix(rawMatrix, undefined, {
        lastProcessedAge,
        stalePreviousPoint: true,
      });

      logger.info(
        `Last processed point is stale (${lastProcessedAge.toFixed(
          0
        )}s old) for device ${rawMatrix.deviceId}, treating as fresh start`
      );
      return { action: 'saved_after_stale', rawMatrixId, lastProcessedAge };
    }

    // 4. Calculate distance from the last point
    const distance = calculateDistance(
      {
        latitude: lastProcessed.coordinates.latitude,
        longitude: lastProcessed.coordinates.longitude,
      },
      {
        latitude: rawMatrix.coordinates.latitude,
        longitude: rawMatrix.coordinates.longitude,
      }
    );

    // 5. Stop Detection: If distance < threshold, ignore or update metadata
    if (distance < STOP_THRESHOLD_METERS) {
      // Device hasn't moved significantly - update lastSeen metadata only
      await ProcessedDeviceMatrix.findByIdAndUpdate(lastProcessed._id, {
        $set: {
          'metadata.lastSeen': rawMatrix.timestamp,
          'metadata.stopCount': (lastProcessed.metadata?.stopCount || 0) + 1,
        },
      });

      logger.info(
        `Stop detected for device ${
          rawMatrix.deviceId
        }, distance: ${distance.toFixed(2)}m`
      );
      return { action: 'stop_detected', rawMatrixId, distance };
    }

    // 6. Smoothing: Pass the raw coordinates through the KalmanService
    const deviceIdStr = rawMatrix.deviceId.toString();
    const filteredCoordinates = kalmanService.filter(deviceIdStr, {
      latitude: rawMatrix.coordinates.latitude,
      longitude: rawMatrix.coordinates.longitude,
    });

    // 7. Save the final result to ProcessedDeviceMatrix
    await saveProcessedMatrix(rawMatrix, filteredCoordinates, {
      distance,
      timeDiffSeconds,
      speed: distance / timeDiffSeconds, // m/s
      filtered: true,
    });

    logger.info(
      `Processed point for device ${
        rawMatrix.deviceId
      }, distance: ${distance.toFixed(2)}m, speed: ${(
        distance / timeDiffSeconds
      ).toFixed(2)}m/s`
    );

    return {
      action: 'processed_and_saved',
      rawMatrixId,
      distance,
      speed: distance / timeDiffSeconds,
    };
  } catch (error) {
    logger.error(`Error processing track ${rawMatrixId}:`, error);
    throw error; // Re-throw to trigger retry mechanism
  }
}

/**
 * Save processed matrix to database
 */
async function saveProcessedMatrix(
  rawMatrix: any,
  filteredCoordinates?: { latitude: number; longitude: number },
  additionalMetadata?: Record<string, any>
) {
  const coordinates = filteredCoordinates || rawMatrix.coordinates;

  const processedMatrix = new ProcessedDeviceMatrix({
    timestamp: rawMatrix.timestamp,
    deviceId: rawMatrix.deviceId,
    tripId: rawMatrix.tripId,
    coordinates: {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    },
    metadata: {
      ...rawMatrix.metadata,
      ...additionalMetadata,
      processedAt: new Date(),
      rawMatrixId: rawMatrix._id,
    },
  });

  await processedMatrix.save();
}

/**
 * Track Processor Worker
 */
export class TrackProcessorWorker {
  private worker: Worker<TrackProcessingJobData>;

  constructor() {
    this.worker = new Worker<TrackProcessingJobData>(
      TRACK_PROCESSING_QUEUE,
      processTrack,
      {
        connection: redisConnectionOptions,
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '10'),
        limiter: {
          max: 100, // Max 100 jobs
          duration: 1000, // per second
        },
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for the worker
   */
  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} failed with error:`, error.message);
    });

    this.worker.on('error', (error) => {
      logger.error('Worker error:', error);
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn(`Job ${jobId} stalled`);
    });
  }

  /**
   * Close the worker
   */
  async close() {
    await this.worker.close();
  }

  /**
   * Get worker instance
   */
  getWorker(): Worker<TrackProcessingJobData> {
    return this.worker;
  }
}

/**
 * Start the worker (for standalone worker process)
 */
export async function startWorker() {
  // Connect to MongoDB
  if (!mongoose.connection.readyState) {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/tms'
    );
    logger.info('MongoDB connected');
  }

  const worker = new TrackProcessorWorker();
  logger.info('Track Processor Worker started');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing worker...');
    await worker.close();
    await mongoose.connection.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, closing worker...');
    await worker.close();
    await mongoose.connection.close();
    process.exit(0);
  });

  return worker;
}

// If this file is run directly, start the worker
if (require.main === module) {
  startWorker().catch((error) => {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  });
}
