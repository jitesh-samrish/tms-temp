import { TripState } from '../dto/TripState';
import { TripStateChange } from '../dto/TripStateChange';
import { Command } from '../dto/Command';
import { IChangeRepository } from '../repositories/ChangeRepository';

export interface CommandExecutor {
  // Used when executing a new command
  // Executor creates and saves the change entity
  // Returns both the updated state and the change event
  executeCommand(
    tripState: TripState | undefined,
    command: Command,
    changeRepository: IChangeRepository,
    version: number
  ): Promise<{ tripState: TripState; change: TripStateChange }>;
}
