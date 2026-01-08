import { ChangeModel } from '../models/Change.model';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';
import { IChange } from 'tms-common-db/schemas/change.schema';
import { TripStateChange } from '../dto/TripStateChange';

const logger = Logger.create('ChangeRepository');

export interface IChangeRepository {
  saveChange(
    queueObjectId: mongoose.Types.ObjectId,
    changeEvent: TripStateChange,
    createdAt?: Date
  ): Promise<mongoose.Types.ObjectId>;
  getChangeById(changeId: mongoose.Types.ObjectId): Promise<IChange | null>;
  getChangesByQueue(queueObjectId: mongoose.Types.ObjectId): Promise<IChange[]>;
}

export class ChangeRepository implements IChangeRepository {
  async saveChange(
    queueObjectId: mongoose.Types.ObjectId,
    changeEvent: TripStateChange,
    createdAt?: Date
  ): Promise<mongoose.Types.ObjectId> {
    const changeData: any = {
      event_name: changeEvent.eventName,
      queue_id: queueObjectId,
      command_issuer: new mongoose.Types.ObjectId(changeEvent.commandIssuer),
      payload: changeEvent.payload,
      version: changeEvent.version || 1,
    };

    // If createdAt is provided, use it to ensure consistent timestamps
    if (createdAt) {
      changeData.createdAt = createdAt;
      changeData.updatedAt = createdAt;
    }

    const savedChange = await new ChangeModel(changeData).save();

    logger.debug(
      `Change saved with ID: ${savedChange._id} (v${changeEvent.version})`
    );
    return savedChange._id;
  }

  async getChangeById(
    changeId: mongoose.Types.ObjectId
  ): Promise<IChange | null> {
    return await ChangeModel.findById(changeId);
  }

  async getChangesByQueue(
    queueObjectId: mongoose.Types.ObjectId
  ): Promise<IChange[]> {
    return await ChangeModel.find({ queue_id: queueObjectId }).sort({
      createdAt: -1,
    });
  }
}
