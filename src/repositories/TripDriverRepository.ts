import mongoose from 'mongoose';
import TripDriverModel from '../models/TripDriver.model';
import { ITripDriver } from 'tms-common-db/schemas/tripDriver.schema';

export interface ITripDriverRepository {
  createAssociation(
    driverId: mongoose.Types.ObjectId,
    tripId: mongoose.Types.ObjectId,
    associatedAt?: Date
  ): Promise<ITripDriver>;
  getActiveAssociationByTrip(
    tripId: mongoose.Types.ObjectId
  ): Promise<ITripDriver | null>;
  getActiveAssociationByDriver(
    driverId: mongoose.Types.ObjectId
  ): Promise<ITripDriver | null>;
  disassociateDriver(
    associationId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<ITripDriver | null>;
  disassociateAllForTrip(
    tripId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<number>;
}

export class TripDriverRepository implements ITripDriverRepository {
  async createAssociation(
    driverId: mongoose.Types.ObjectId,
    tripId: mongoose.Types.ObjectId,
    associatedAt?: Date
  ): Promise<ITripDriver> {
    const association = new TripDriverModel({
      driverId,
      tripId,
      associatedAt: associatedAt || new Date(),
      disassociatedAt: null,
    });
    return await association.save();
  }

  async getActiveAssociationByTrip(
    tripId: mongoose.Types.ObjectId
  ): Promise<ITripDriver | null> {
    return await TripDriverModel.findOne({
      tripId,
      disassociatedAt: null,
    }).sort({ associatedAt: -1 });
  }

  async getActiveAssociationByDriver(
    driverId: mongoose.Types.ObjectId
  ): Promise<ITripDriver | null> {
    return await TripDriverModel.findOne({
      driverId,
      disassociatedAt: null,
    }).sort({ associatedAt: -1 });
  }

  async disassociateDriver(
    associationId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<ITripDriver | null> {
    return await TripDriverModel.findByIdAndUpdate(
      associationId,
      { disassociatedAt: disassociatedAt || new Date() },
      { new: true }
    );
  }

  async disassociateAllForTrip(
    tripId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<number> {
    const result = await TripDriverModel.updateMany(
      { tripId, disassociatedAt: null },
      { disassociatedAt: disassociatedAt || new Date() }
    );
    return result.modifiedCount;
  }
}
