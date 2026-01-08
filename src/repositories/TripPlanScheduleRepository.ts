import {
  TripPlanScheduleModel,
  ITripPlanSchedule,
} from '../models/TripPlanSchedule.model';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';

const logger = Logger.create('TripPlanScheduleRepository');

export interface IScheduleStopInput {
  stopId: string;
  sequence: number;
  arrivalTime: number; // Military time format (e.g., 1030 for 10:30 AM, 2210 for 10:10 PM)
  departureTime: number; // Military time format
}

export interface ITripPlanScheduleRepository {
  createScheduleStops(
    tripPlanId: string,
    stops: IScheduleStopInput[],
    createdBy: string
  ): Promise<ITripPlanSchedule[]>;
  getScheduleStopsByTripPlan(tripPlanId: string): Promise<ITripPlanSchedule[]>;
  deleteScheduleStopsByTripPlan(tripPlanId: string): Promise<number>;
  updateScheduleStop(
    scheduleId: string,
    updateData: Partial<IScheduleStopInput>
  ): Promise<ITripPlanSchedule | null>;
}

export class TripPlanScheduleRepository implements ITripPlanScheduleRepository {
  async createScheduleStops(
    tripPlanId: string,
    stops: IScheduleStopInput[],
    createdBy: string
  ): Promise<ITripPlanSchedule[]> {
    const scheduleDocs = stops.map((stop) => ({
      tripPlanId: new mongoose.Types.ObjectId(tripPlanId),
      stopId: new mongoose.Types.ObjectId(stop.stopId),
      sequence: stop.sequence,
      arrivalTime: stop.arrivalTime,
      departureTime: stop.departureTime,
      createdBy: new mongoose.Types.ObjectId(createdBy),
      updatedBy: new mongoose.Types.ObjectId(createdBy),
    }));

    const createdSchedules = await TripPlanScheduleModel.insertMany(
      scheduleDocs
    );
    logger.info(
      `Created ${createdSchedules.length} schedule stops for trip plan ${tripPlanId}`
    );
    return createdSchedules;
  }

  async getScheduleStopsByTripPlan(
    tripPlanId: string
  ): Promise<ITripPlanSchedule[]> {
    if (!mongoose.Types.ObjectId.isValid(tripPlanId)) return [];
    return await TripPlanScheduleModel.find({
      tripPlanId: new mongoose.Types.ObjectId(tripPlanId),
    })
      .sort({ sequence: 1 })
      .exec();
  }

  async deleteScheduleStopsByTripPlan(tripPlanId: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(tripPlanId)) return 0;

    const result = await TripPlanScheduleModel.deleteMany({
      tripPlanId: new mongoose.Types.ObjectId(tripPlanId),
    }).exec();

    logger.info(
      `Deleted ${result.deletedCount} schedule stops for trip plan ${tripPlanId}`
    );
    return result.deletedCount || 0;
  }

  async updateScheduleStop(
    scheduleId: string,
    updateData: Partial<IScheduleStopInput>
  ): Promise<ITripPlanSchedule | null> {
    if (!mongoose.Types.ObjectId.isValid(scheduleId)) return null;

    const updateObj: any = {};
    if (updateData.stopId)
      updateObj.stopId = new mongoose.Types.ObjectId(updateData.stopId);
    if (updateData.sequence !== undefined)
      updateObj.sequence = updateData.sequence;
    if (updateData.arrivalTime !== undefined)
      updateObj.arrivalTime = updateData.arrivalTime;
    if (updateData.departureTime !== undefined)
      updateObj.departureTime = updateData.departureTime;

    const schedule = await TripPlanScheduleModel.findByIdAndUpdate(
      scheduleId,
      { $set: updateObj },
      { new: true, runValidators: true }
    ).exec();

    if (schedule) {
      logger.info(`Schedule stop ${scheduleId} updated`);
    }
    return schedule;
  }
}
