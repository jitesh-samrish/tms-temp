import { FailedStreamEventModel } from '../models/FailedStreamEvent.model';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';
import { IFailedStreamEvent } from 'qms-common-db/schemas/failedStreamEvent.schema';

const logger = Logger.create('FailedStreamEventRepository');

export interface IFailedStreamEventRepository {
  saveFailedEvent(
    changeId: string,
    queueId: string,
    eventData: any,
    error: Error
  ): Promise<IFailedStreamEvent>;
  getUnprocessedEvents(limit?: number): Promise<IFailedStreamEvent[]>;
  markAsProcessed(eventId: string): Promise<void>;
  incrementRetryCount(eventId: string): Promise<void>;
}

export class FailedStreamEventRepository
  implements IFailedStreamEventRepository
{
  async saveFailedEvent(
    changeId: string,
    queueId: string,
    eventData: any,
    error: Error
  ): Promise<IFailedStreamEvent> {
    const failedEvent = new FailedStreamEventModel({
      stream_name: 'queue_events',
      change_id: new mongoose.Types.ObjectId(changeId),
      queue_id: new mongoose.Types.ObjectId(queueId),
      event_data: eventData,
      error_message: error.message,
      error_stack: error.stack,
      retry_count: 0,
      is_processed: false,
    });

    const saved = await failedEvent.save();
    logger.info(`Saved failed stream event for change ${changeId}`);
    return saved;
  }

  async getUnprocessedEvents(
    limit: number = 10
  ): Promise<IFailedStreamEvent[]> {
    return await FailedStreamEventModel.find({ is_processed: false })
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();
  }

  async markAsProcessed(eventId: string): Promise<void> {
    const eventObjectId = new mongoose.Types.ObjectId(eventId);
    await FailedStreamEventModel.updateOne(
      { _id: eventObjectId },
      { is_processed: true }
    ).exec();
    logger.info(`Marked failed stream event ${eventId} as processed`);
  }

  async incrementRetryCount(eventId: string): Promise<void> {
    const eventObjectId = new mongoose.Types.ObjectId(eventId);
    await FailedStreamEventModel.updateOne(
      { _id: eventObjectId },
      {
        $inc: { retry_count: 1 },
        $set: { last_retry_at: new Date() },
      }
    ).exec();
    logger.debug(`Incremented retry count for failed stream event ${eventId}`);
  }
}
