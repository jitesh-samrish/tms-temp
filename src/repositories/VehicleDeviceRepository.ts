import mongoose from 'mongoose';
import { VehicleDeviceModel } from '../models/VehicleDevice.model';
import { IVehicleDevice } from '../models/VehicleDevice.model';
import { Logger } from '../utils/Logger';

const logger = Logger.create('VehicleDeviceRepository');

export interface IVehicleDeviceRepository {
  createAssociation(
    deviceId: mongoose.Types.ObjectId,
    vehicleId: mongoose.Types.ObjectId,
    associatedAt?: Date
  ): Promise<IVehicleDevice>;
  getActiveAssociationByVehicle(
    vehicleId: mongoose.Types.ObjectId
  ): Promise<IVehicleDevice | null>;
  getActiveAssociationByDevice(
    deviceId: mongoose.Types.ObjectId
  ): Promise<IVehicleDevice | null>;
  disassociateDevice(
    associationId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<IVehicleDevice | null>;
}

export class VehicleDeviceRepository implements IVehicleDeviceRepository {
  async createAssociation(
    deviceId: mongoose.Types.ObjectId,
    vehicleId: mongoose.Types.ObjectId,
    associatedAt: Date = new Date()
  ): Promise<IVehicleDevice> {
    try {
      const association = new VehicleDeviceModel({
        deviceId,
        vehicleId,
        associatedAt,
      });
      await association.save();
      return association;
    } catch (error) {
      logger.error('Error creating vehicle-device association:', error);
      throw error;
    }
  }

  async getActiveAssociationByVehicle(
    vehicleId: mongoose.Types.ObjectId
  ): Promise<IVehicleDevice | null> {
    try {
      return await VehicleDeviceModel.findOne({
        vehicleId,
        disassociatedAt: null,
      }).sort({ associatedAt: -1 });
    } catch (error) {
      logger.error('Error getting active association by vehicle:', error);
      throw error;
    }
  }

  async getActiveAssociationByDevice(
    deviceId: mongoose.Types.ObjectId
  ): Promise<IVehicleDevice | null> {
    try {
      return await VehicleDeviceModel.findOne({
        deviceId,
        disassociatedAt: null,
      }).sort({ associatedAt: -1 });
    } catch (error) {
      logger.error('Error getting active association by device:', error);
      throw error;
    }
  }

  async disassociateDevice(
    associationId: mongoose.Types.ObjectId,
    disassociatedAt: Date = new Date()
  ): Promise<IVehicleDevice | null> {
    try {
      return await VehicleDeviceModel.findByIdAndUpdate(
        associationId,
        { disassociatedAt },
        { new: true }
      );
    } catch (error) {
      logger.error('Error disassociating device:', error);
      throw error;
    }
  }
}
