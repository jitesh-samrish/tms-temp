import { ITripRepository } from '../repositories/TripRepository';
import { IChangeRepository } from '../repositories/ChangeRepository';
import { Command } from '../dto/Command';
import { StateManager } from '../managers/StateManager';
import { TripStateChange } from '../dto/TripStateChange';
import { RedisUtils } from '../utils/RedisUtils';
import {
  FailedStreamEventRepository,
  IFailedStreamEventRepository,
} from '../repositories/FailedStreamEventRepository';
import { Logger } from '../utils/Logger';

const logger = Logger.create('StateService');

export interface IStateService {
  executeCommand(command: Command): Promise<TripStateChange>;
}

export class StateService implements IStateService {
  private failedStreamEventRepository: IFailedStreamEventRepository;

  constructor(
    private tripRepository: ITripRepository,
    private changeRepository: IChangeRepository
  ) {
    this.failedStreamEventRepository = new FailedStreamEventRepository();
  }

  async executeCommand(command: Command): Promise<TripStateChange> {
    const changeEvent = await StateManager.executeCommand(
      command,
      this.changeRepository,
      this.tripRepository
    );

    await this.publishToStream(changeEvent);

    return changeEvent;
  }

  private async publishToStream(changeEvent: TripStateChange): Promise<void> {
    const hasPendingFailedEvents = await this.hasPendingFailedEvents();

    if (hasPendingFailedEvents) {
      logger.info(
        'Pending failed events exist, saving current event to failed queue'
      );
      await this.failedStreamEventRepository.saveFailedEvent(
        changeEvent.changeId!,
        changeEvent.tripId,
        changeEvent,
        new Error('Queued due to existing failed events')
      );

      await this.retryFailedEvents();
    } else {
      try {
        await this.retryFailedEvents();
        await RedisUtils.addToStream('trip_events', changeEvent);
      } catch (error: any) {
        logger.error(
          `Failed to publish to trip_events stream for change ${changeEvent.changeId}`,
          error
        );

        await this.failedStreamEventRepository.saveFailedEvent(
          changeEvent.changeId!,
          changeEvent.tripId,
          changeEvent,
          error
        );
      }
    }
  }

  private async hasPendingFailedEvents(): Promise<boolean> {
    const failedEvents =
      await this.failedStreamEventRepository.getUnprocessedEvents(1);
    return failedEvents.length > 0;
  }

  private async retryFailedEvents(): Promise<void> {
    try {
      const failedEvents =
        await this.failedStreamEventRepository.getUnprocessedEvents(10);

      for (const failedEvent of failedEvents) {
        try {
          await RedisUtils.addToStream('trip_events', failedEvent.event_data);
          await this.failedStreamEventRepository.markAsProcessed(
            failedEvent._id.toString()
          );
          logger.info(`Successfully retried failed event ${failedEvent._id}`);
        } catch (_: any) {
          await this.failedStreamEventRepository.incrementRetryCount(
            failedEvent._id.toString()
          );
          logger.warn(
            `Retry failed for event ${failedEvent._id}, retry count: ${
              failedEvent.retry_count + 1
            }`
          );
        }
      }
    } catch (error: any) {
      logger.error('Error during retry of failed events', error);
    }
  }
}
