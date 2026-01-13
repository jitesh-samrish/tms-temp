import mongoose from 'mongoose';
import { VehicleTripModel } from '../models/VehicleTrip.model';
import { IVehicleTrip } from '../models/VehicleTrip.model';
import { Logger } from '../utils/Logger';

const logger = Logger.create('VehicleTripRepository');

export interface IVehicleTripRepository {
  createAssociation(
    vehicleId: mongoose.Types.ObjectId,
    tripId: mongoose.Types.ObjectId,
    associatedAt?: Date
  ): Promise<IVehicleTrip>;
  getActiveAssociationByTrip(
    tripId: mongoose.Types.ObjectId
  ): Promise<IVehicleTrip | null>;
  getActiveAssociationByVehicle(
    vehicleId: mongoose.Types.ObjectId
  ): Promise<IVehicleTrip | null>;
  disassociateVehicle(
    associationId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<IVehicleTrip | null>;
}

export class VehicleTripRepository implements IVehicleTripRepository {
  async createAssociation(
    vehicleId: mongoose.Types.ObjectId,
    tripId: mongoose.Types.ObjectId,
    associatedAt: Date = new Date()
  ): Promise<IVehicleTrip> {
    try {
      const association = new VehicleTripModel({
        vehicleId,
        tripId,
        associatedAt,
      });
      await association.save();
      return association;
    } catch (error) {
      logger.error('Error creating vehicle-trip association:', error);
      throw error;
    }
  }

  async getActiveAssociationByTrip(
    tripId: mongoose.Types.ObjectId
  ): Promise<IVehicleTrip | null> {
    try {
      return await VehicleTripModel.findOne({
        tripId,
        disassociatedAt: null,
      }).sort({ associatedAt: -1 });
    } catch (error) {
      logger.error('Error getting active association by trip:', error);
      throw error;
    }
  }

  async getActiveAssociationByVehicle(
    vehicleId: mongoose.Types.ObjectId
  ): Promise<IVehicleTrip | null> {
    try {
      return await VehicleTripModel.findOne({
        vehicleId,
        disassociatedAt: null,
      }).sort({ associatedAt: -1 });
    } catch (error) {
      logger.error('Error getting active association by vehicle:', error);
      throw error;
    }
  }

  async disassociateVehicle(
    associationId: mongoose.Types.ObjectId,
    disassociatedAt: Date = new Date()
  ): Promise<IVehicleTrip | null> {
    try {
      return await VehicleTripModel.findByIdAndUpdate(
        associationId,
        { disassociatedAt },
        { new: true }
      );
    } catch (error) {
      logger.error('Error disassociating vehicle:', error);
      throw error;
    }
  }
}
