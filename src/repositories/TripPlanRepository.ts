import { TripPlanModel, ITripPlan } from '../models/TripPlan.model';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';

const logger = Logger.create('TripPlanRepository');

export interface ITripPlanRepository {
  createTripPlan(
    name: string,
    description: string | undefined,
    createdBy: string,
    startTime: number,
    endTime: number,
    dateRanges: Array<{ startDate: Date; endDate: Date }>
  ): Promise<ITripPlan>;
  getTripPlanById(tripPlanId: string): Promise<ITripPlan | null>;
  updateTripPlan(
    tripPlanId: string,
    updateData: {
      name?: string;
      description?: string;
      startTime?: number;
      endTime?: number;
      dateRanges?: Array<{ startDate: Date; endDate: Date }>;
    }
  ): Promise<ITripPlan | null>;
  deleteTripPlan(tripPlanId: string): Promise<boolean>;
  getAllTripPlans(): Promise<ITripPlan[]>;
  getTripPlansByCreator(userId: string): Promise<ITripPlan[]>;
}

export class TripPlanRepository implements ITripPlanRepository {
  async createTripPlan(
    name: string,
    description: string | undefined,
    createdBy: string,
    startTime: number,
    endTime: number,
    dateRanges: Array<{ startDate: Date; endDate: Date }>
  ): Promise<ITripPlan> {
    const newTripPlan = new TripPlanModel({
      name,
      description,
      createdBy: new mongoose.Types.ObjectId(createdBy),
      updatedBy: new mongoose.Types.ObjectId(createdBy),
      startTime,
      endTime,
      dateRanges,
    });

    await newTripPlan.save();
    logger.info(`Trip plan created: ${name} (ID: ${newTripPlan._id})`);
    return newTripPlan;
  }

  async getTripPlanById(tripPlanId: string): Promise<ITripPlan | null> {
    if (!mongoose.Types.ObjectId.isValid(tripPlanId)) return null;
    return await TripPlanModel.findById(tripPlanId);
  }

  async updateTripPlan(
    tripPlanId: string,
    updateData: {
      name?: string;
      description?: string;
      startTime?: number;
      endTime?: number;
      dateRanges?: Array<{ startDate: Date; endDate: Date }>;
      updatedBy?: string;
    }
  ): Promise<ITripPlan | null> {
    if (!mongoose.Types.ObjectId.isValid(tripPlanId)) return null;

    const tripPlan = await TripPlanModel.findByIdAndUpdate(
      tripPlanId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();

    if (tripPlan) {
      logger.info(`Trip plan ${tripPlanId} updated successfully`);
    }
    return tripPlan;
  }

  async deleteTripPlan(tripPlanId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(tripPlanId)) return false;

    const result = await TripPlanModel.deleteOne({
      _id: new mongoose.Types.ObjectId(tripPlanId),
    }).exec();

    if (result.deletedCount > 0) {
      logger.info(`Trip plan ${tripPlanId} deleted`);
      return true;
    }
    return false;
  }

  async getAllTripPlans(): Promise<ITripPlan[]> {
    return await TripPlanModel.find().exec();
  }

  async getTripPlansByCreator(userId: string): Promise<ITripPlan[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    return await TripPlanModel.find({
      createdBy: new mongoose.Types.ObjectId(userId),
    }).exec();
  }
}
