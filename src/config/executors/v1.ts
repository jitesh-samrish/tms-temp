import { ExecutorFactory } from '../../registry/ExecutorRegistry';
import { CreateTripExecutor } from '../../command.executors/CreateTripExecutor';
import { StartTripExecutor } from '../../command.executors/StartTripExecutor';
import { CompleteTripExecutor } from '../../command.executors/CompleteTripExecutor';
import { CancelTripExecutor } from '../../command.executors/CancelTripExecutor';
import { TripRepository } from '../../repositories/TripRepository';
import { TripPlanRepository } from '../../repositories/TripPlanRepository';
import { Logger } from '../../utils/Logger';

const logger = Logger.create('ExecutorRegistry-V1');

/**
 * Register all command executors for version 1
 */
export function registerV1Executors(): void {
  logger.info('Registering version 1 command executors...');

  const VERSION_1 = 1;

  // Create repository instances
  const tripRepository = new TripRepository();
  const tripPlanRepository = new TripPlanRepository();

  // Register all command implementations for version 1
  ExecutorFactory.register(
    'CREATE_TRIP',
    new CreateTripExecutor(tripRepository, tripPlanRepository),
    VERSION_1
  );
  ExecutorFactory.register(
    'START_TRIP',
    new StartTripExecutor(tripRepository),
    VERSION_1
  );
  ExecutorFactory.register(
    'COMPLETE_TRIP',
    new CompleteTripExecutor(tripRepository),
    VERSION_1
  );
  ExecutorFactory.register(
    'CANCEL_TRIP',
    new CancelTripExecutor(tripRepository),
    VERSION_1
  );

  logger.info('Version 1 command executors registered successfully');
}
