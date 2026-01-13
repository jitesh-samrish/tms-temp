/**
 * Worker Entry Point
 * This file starts the BullMQ worker process for processing GPS tracking data
 * Run with: npm run worker
 */

import { startWorker } from './workers/TrackProcessor.worker';
import { Logger } from './utils/Logger';

const logger = Logger.create('WorkerMain');

logger.info('Starting Track Processing Worker...');

startWorker()
  .then(() => {
    logger.info('Worker process initialized successfully');
  })
  .catch((error) => {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  });

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection in worker:`, reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
