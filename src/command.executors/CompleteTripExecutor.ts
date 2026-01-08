import { CommandExecutor } from '../interfaces/CommandExecutor';
import { TripState } from '../dto/TripState';
import { TripStateChange } from '../dto/TripStateChange';
import { Command } from '../dto/Command';
import { ITripRepository } from '../repositories/TripRepository';
import { IChangeRepository } from '../repositories/ChangeRepository';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';
import { BadRequestException } from '../utils/errors';

const logger = Logger.create('CompleteTripExecutor');

export class CompleteTripExecutor implements CommandExecutor {
  constructor(private tripRepository: ITripRepository) {}

  async executeCommand(
    tripState: TripState | undefined,
    command: Command,
    changeRepository: IChangeRepository,
    version: number
  ): Promise<{ tripState: TripState; change: TripStateChange }> {
    if (!tripState) {
      throw new BadRequestException(`Trip ${command.tripId} not found`);
    }

    // Validate that trip can be completed
    if (!tripState.canComplete()) {
      throw new BadRequestException(
        `Trip ${command.tripId} cannot be completed. Current status: ${tripState.status}`
      );
    }

    // Update trip status to COMPLETED in database
    await this.tripRepository.updateTripStatus(command.tripId, 'COMPLETED');

    // Update trip state
    const previousStatus = tripState.status;
    tripState.setStatus('COMPLETED');

    // Update command payload
    command.payload['status'] = 'COMPLETED';
    command.payload['previousStatus'] = previousStatus;

    logger.info(`Trip ${command.tripId} completed (status: COMPLETED)`);

    // Create change entity and save it
    const change = await this.createAndSaveChange(
      command,
      changeRepository,
      version
    );

    return { tripState, change };
  }

  /**
   * Create and save change entity after executing business logic
   */
  private async createAndSaveChange(
    command: Command,
    changeRepository: IChangeRepository,
    version: number,
    timestamp?: Date
  ): Promise<TripStateChange> {
    // Create change event
    const changeEvent = new TripStateChange(command);
    changeEvent.setVersion(version);

    // Save change to database with optional timestamp
    const tripObjectId = new mongoose.Types.ObjectId(command.tripId);
    const savedChange = await changeRepository.saveChange(
      tripObjectId,
      changeEvent,
      timestamp
    );
    changeEvent.setChangeId(savedChange._id.toString());

    logger.debug(
      `Created change ${savedChange._id} for COMPLETE_TRIP (v${version})`
    );

    return changeEvent;
  }
}
