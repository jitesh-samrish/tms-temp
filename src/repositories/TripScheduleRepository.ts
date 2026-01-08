import { TripScheduleModel, ITripSchedule } from '../models/TripSchedule.model';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';

const logger = Logger.create('TripScheduleRepository');

export interface ITripScheduleInput {
  tripId: string;
  stopId: string;
  sequence: number;
  estimatedArrivalTime: Date;
  estimatedDepartureTime: Date;
  createdBy: string;
}

export interface ITripScheduleRepository {
  createScheduleStops(
    schedules: ITripScheduleInput[]
  ): Promise<ITripSchedule[]>;
  getScheduleStopsByTrip(tripId: string): Promise<ITripSchedule[]>;
  deleteScheduleStopsByTrip(tripId: string): Promise<number>;
}

export class TripScheduleRepository implements ITripScheduleRepository {
  async createScheduleStops(
    schedules: ITripScheduleInput[]
  ): Promise<ITripSchedule[]> {
    const scheduleDocs = schedules.map((schedule) => ({
      tripId: new mongoose.Types.ObjectId(schedule.tripId),
      stopId: new mongoose.Types.ObjectId(schedule.stopId),
      sequence: schedule.sequence,
      estimatedArrivalTime: schedule.estimatedArrivalTime,
      estimatedDepartureTime: schedule.estimatedDepartureTime,
      createdBy: new mongoose.Types.ObjectId(schedule.createdBy),
      updatedBy: new mongoose.Types.ObjectId(schedule.createdBy),
    }));

    const createdSchedules = await TripScheduleModel.insertMany(scheduleDocs);
    logger.info(`Created ${createdSchedules.length} trip schedule stops`);
    return createdSchedules;
  }

  async getScheduleStopsByTrip(tripId: string): Promise<ITripSchedule[]> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) return [];
    return await TripScheduleModel.find({
      tripId: new mongoose.Types.ObjectId(tripId),
    })
      .sort({ sequence: 1 })
      .exec();
  }

  async deleteScheduleStopsByTrip(tripId: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) return 0;

    const result = await TripScheduleModel.deleteMany({
      tripId: new mongoose.Types.ObjectId(tripId),
    }).exec();

    logger.info(
      `Deleted ${result.deletedCount} schedule stops for trip ${tripId}`
    );
    return result.deletedCount || 0;
  }
}
