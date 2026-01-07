import { Command } from '../dto/Command';
import { QueueStateChange } from '../dto/QueueStateChange';
import { ExecutorFactory } from '../registry/ExecutorRegistry';
import { IChangeRepository } from '../repositories/ChangeRepository';
import { RedisUtils } from '../utils/RedisUtils';
import { Logger } from '../utils/Logger';
import { NotFoundException } from '../utils/errors';
import { IQueueRepository } from '../repositories/QueueRepository';

const logger = Logger.create('StateManager');

export class StateManager {
  /**
   * Execute a new command (uses current implementation)
   * Executors create and save change entities themselves
   * Redis lock ensures only one command executes per queue at a time
   */
  public static async executeCommand(
    command: Command,
    changeRepository: IChangeRepository,
    queueRepository: IQueueRepository
  ): Promise<QueueStateChange> {
    // Acquire Redis lock for this queue
    return await RedisUtils.withQueueLock(command.queueId, async () => {
      // Fetch current state from repository
      const currentState = await queueRepository.getQueueState(command.queueId);
      if (!currentState && command.action !== 'CREATE_QUEUE') {
        throw new NotFoundException(
          `Queue with ID ${command.queueId} not found`
        );
      }

      // Get Executor with version (current implementation)
      const { executor, version } = ExecutorFactory.getExecutor(command.action);
      logger.info(`Executing ${command.action} (v${version})`);

      // Executor creates change, applies logic, saves entities, and updates hash
      const { queueState: _, change } = await executor.executeCommand(
        currentState,
        command,
        changeRepository,
        version
      );

      return change;
    });
  }
}
