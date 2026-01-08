import { CommandExecutor } from '../interfaces/CommandExecutor';
import { TripState } from '../dto/TripState';
import { TripStateChange } from '../dto/TripStateChange';
import { Command } from '../dto/Command';
import { ITripRepository } from '../repositories/TripRepository';
import { IChangeRepository } from '../repositories/ChangeRepository';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';
import { BadRequestException } from '../utils/errors';

const logger = Logger.create('StartTripExecutor');

export class StartTripExecutor implements CommandExecutor {
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

    // Validate that trip can be started
    if (!tripState.canStart()) {
      throw new BadRequestException(
        `Trip ${command.tripId} cannot be started. Current status: ${tripState.status}`
      );
    }

    // Update trip status to ACTIVE in database
    await this.tripRepository.updateTripStatus(command.tripId, 'ACTIVE');

    // Update trip state
    tripState.setStatus('ACTIVE');

    // Update command payload
    command.payload['status'] = 'ACTIVE';
    command.payload['previousStatus'] = 'PLANNED';

    logger.info(`Trip ${command.tripId} started (status: ACTIVE)`);

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
      `Created change ${savedChange._id} for START_TRIP (v${version})`
    );

    return changeEvent;
  }
}
