import { QueueState } from '../dto/QueueState';
import { QueueStateChange } from '../dto/QueueStateChange';
import { Command } from '../dto/Command';
import { IChangeRepository } from '../repositories/ChangeRepository';

export interface CommandExecutor {
  // Used when executing a new command
  // Executor creates and saves the change entity
  // Returns both the updated state and the change event
  executeCommand(
    queueState: QueueState | undefined,
    command: Command,
    changeRepository: IChangeRepository,
    version: number
  ): Promise<{ queueState: QueueState; change: QueueStateChange }>;
}
