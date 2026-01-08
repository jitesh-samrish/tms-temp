import { Command } from '../dto/Command';
import { TripStateChange } from '../dto/TripStateChange';
import { ExecutorFactory } from '../registry/ExecutorRegistry';
import { IChangeRepository } from '../repositories/ChangeRepository';
import { RedisUtils } from '../utils/RedisUtils';
import { Logger } from '../utils/Logger';
import { NotFoundException } from '../utils/errors';
import { ITripRepository } from '../repositories/TripRepository';

const logger = Logger.create('StateManager');

export class StateManager {
  /**
   * Execute a new command (uses current implementation)
   * Executors create and save change entities themselves
   * Redis lock ensures only one command executes per trip at a time
   * For CREATE_TRIP, we lock on tripPlanId instead of tripId
   */
  public static async executeCommand(
    command: Command,
    changeRepository: IChangeRepository,
    tripRepository: ITripRepository
  ): Promise<TripStateChange> {
    // Determine the lock key based on the action
    const lockKey =
      command.action === 'CREATE_TRIP'
        ? command.payload['tripPlanId'] // Lock on trip plan ID for creation
        : command.tripId; // Lock on trip ID for other actions

    // Acquire Redis lock for this trip or trip plan
    return await RedisUtils.withTripLock(lockKey, async () => {
      // Fetch current state from repository (skip for CREATE_TRIP)
      const currentState =
        command.action === 'CREATE_TRIP'
          ? undefined
          : await tripRepository.getTripState(command.tripId);

      if (!currentState && command.action !== 'CREATE_TRIP') {
        throw new NotFoundException(`Trip with ID ${command.tripId} not found`);
      }

      // Get Executor with version
      const { executor, version } = ExecutorFactory.getExecutor(command.action);
      logger.info(`Executing ${command.action} (v${version})`);

      // Executor creates change, applies logic, saves entities, and updates hash
      const { tripState: _, change } = await executor.executeCommand(
        currentState,
        command,
        changeRepository,
        version
      );

      return change;
    });
  }
}
