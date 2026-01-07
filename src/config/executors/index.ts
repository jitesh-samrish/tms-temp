import { ExecutorFactory } from '../../registry/ExecutorRegistry';
import { registerV1Executors } from './v1';
import { Logger } from '../../utils/Logger';

const logger = Logger.create('ExecutorRegistry');

/**
 * Central registry that orchestrates registration of all executor versions
 * Add new version registration functions here as they are created
 */
export function registerAllExecutors(): void {
  logger.info('Starting executor registration for all versions...');

  // Register executors for each version
  // Each version should register ALL command implementations, not just updates
  registerV1Executors();

  // Future versions can be added here
  // registerV2Executors();
  // registerV3Executors();

  // Sort versions after all registrations are complete
  ExecutorFactory.sortVersions();

  const versions = ExecutorFactory.getRegisteredVersions();
  logger.info(
    `Executor registration complete. Registered versions: [${versions.join(
      ', '
    )}]`
  );
}
