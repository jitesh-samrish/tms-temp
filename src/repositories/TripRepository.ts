import { TripState } from '../dto/TripState';
import { TripModel, ITrip } from '../models/Trip.model';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';

const logger = Logger.create('TripRepository');

export interface ITripRepository {
  getTripState(tripId: string): Promise<TripState | undefined>;
  createTrip(
    tripPlanId: string,
    startTime: Date,
    endTime: Date,
    createdBy: string,
    acl?: Array<{ userId: string; role: string }>,
    tripId?: mongoose.Types.ObjectId
  ): Promise<ITrip>;
  getTripById(tripId: string): Promise<ITrip | null>;
  updateTripStatus(
    tripId: string,
    status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  ): Promise<void>;
  updateTrip(
    tripId: string,
    updateData: {
      startTime?: Date;
      endTime?: Date;
      status?: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    }
  ): Promise<ITrip | null>;
  getTripsByTripPlanId(tripPlanId: string): Promise<ITrip[]>;
  getTripsByUserACL(userId: string, role?: string): Promise<ITrip[]>;
  checkUserRole(tripId: string, userId: string, role: string): Promise<boolean>;
  addUserToACL(
    tripId: string,
    userId: string,
    role: string
  ): Promise<ITrip | null>;
  removeUserFromACL(tripId: string, userId: string): Promise<ITrip | null>;
}

export class TripRepository implements ITripRepository {
  async getTripState(tripId: string): Promise<TripState | undefined> {
    const trip = await this.getTripById(tripId);
    if (!trip) {
      return undefined;
    }

    const tripState = new TripState(
      trip._id.toString(),
      trip.tripPlanId.toString(),
      trip.status,
      trip.startTime,
      trip.endTime,
      trip.acl.map((a) => ({ userId: a.userId.toString(), role: a.role }))
    );

    logger.debug(`Loaded trip state for ${tripId}`);
    return tripState;
  }

  async createTrip(
    tripPlanId: string,
    startTime: Date,
    endTime: Date,
    createdBy: string,
    acl: Array<{ userId: string; role: string }> = [],
    tripId?: mongoose.Types.ObjectId
  ): Promise<ITrip> {
    const newTrip = new TripModel({
      ...(tripId && { _id: tripId }),
      tripPlanId: new mongoose.Types.ObjectId(tripPlanId),
      startTime,
      endTime,
      status: 'PLANNED',
      createdBy: new mongoose.Types.ObjectId(createdBy),
      updatedBy: new mongoose.Types.ObjectId(createdBy),
      acl: acl.map((a) => ({
        userId: new mongoose.Types.ObjectId(a.userId),
        role: a.role,
      })),
    });

    await newTrip.save();
    logger.info(
      `Trip created: (ID: ${newTrip._id}) for trip plan ${tripPlanId}`
    );
    return newTrip;
  }

  async getTripById(tripId: string): Promise<ITrip | null> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) return null;
    return await TripModel.findById(tripId);
  }

  async updateTripStatus(
    tripId: string,
    status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  ): Promise<void> {
    const tripObjectId = new mongoose.Types.ObjectId(tripId);
    await TripModel.updateOne(
      { _id: tripObjectId },
      { $set: { status: status } }
    ).exec();
    logger.info(`Trip ${tripId} status updated to ${status}`);
  }

  async updateTrip(
    tripId: string,
    updateData: {
      startTime?: Date;
      endTime?: Date;
      status?: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    }
  ): Promise<ITrip | null> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) return null;

    const trip = await TripModel.findByIdAndUpdate(
      tripId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();

    if (trip) {
      logger.info(`Trip ${tripId} updated successfully`);
    }
    return trip;
  }

  async getTripsByTripPlanId(tripPlanId: string): Promise<ITrip[]> {
    if (!mongoose.Types.ObjectId.isValid(tripPlanId)) return [];
    return await TripModel.find({
      tripPlanId: new mongoose.Types.ObjectId(tripPlanId),
    }).exec();
  }

  async getTripsByUserACL(userId: string, role?: string): Promise<ITrip[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];

    const query: any = {
      'acl.userId': new mongoose.Types.ObjectId(userId),
    };

    if (role) {
      query['acl.role'] = role;
    }

    return await TripModel.find(query).exec();
  }

  async checkUserRole(
    tripId: string,
    userId: string,
    role: string
  ): Promise<boolean> {
    if (
      !mongoose.Types.ObjectId.isValid(tripId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return false;
    }

    const trip = await TripModel.findOne({
      _id: new mongoose.Types.ObjectId(tripId),
      acl: {
        $elemMatch: {
          userId: new mongoose.Types.ObjectId(userId),
          role: role,
        },
      },
    }).exec();

    return trip !== null;
  }

  async addUserToACL(
    tripId: string,
    userId: string,
    role: string
  ): Promise<ITrip | null> {
    if (
      !mongoose.Types.ObjectId.isValid(tripId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return null;
    }

    const trip = await TripModel.findByIdAndUpdate(
      tripId,
      {
        $addToSet: {
          acl: {
            userId: new mongoose.Types.ObjectId(userId),
            role: role,
          },
        },
      },
      { new: true, runValidators: true }
    ).exec();

    if (trip) {
      logger.info(`User ${userId} added to trip ${tripId} with role ${role}`);
    }
    return trip;
  }

  async removeUserFromACL(
    tripId: string,
    userId: string
  ): Promise<ITrip | null> {
    if (
      !mongoose.Types.ObjectId.isValid(tripId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return null;
    }

    const trip = await TripModel.findByIdAndUpdate(
      tripId,
      {
        $pull: {
          acl: { userId: new mongoose.Types.ObjectId(userId) },
        },
      },
      { new: true }
    ).exec();

    if (trip) {
      logger.info(`User ${userId} removed from trip ${tripId} ACL`);
    }
    return trip;
  }
}
