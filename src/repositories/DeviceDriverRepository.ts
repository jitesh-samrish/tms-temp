import mongoose from 'mongoose';
import DeviceDriverModel from '../models/DeviceDriver.model';
import { IDeviceDriver } from 'tms-common-db/schemas/driverDeviceSchema';

export interface IDeviceDriverRepository {
  createAssociation(
    deviceId: mongoose.Types.ObjectId,
    driverId: mongoose.Types.ObjectId,
    associatedAt?: Date
  ): Promise<IDeviceDriver>;
  getActiveAssociationByDriver(
    driverId: mongoose.Types.ObjectId
  ): Promise<IDeviceDriver | null>;
  getActiveAssociationByDevice(
    deviceId: mongoose.Types.ObjectId
  ): Promise<IDeviceDriver | null>;
  disassociateDevice(
    associationId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<IDeviceDriver | null>;
  disassociateAllForDriver(
    driverId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<number>;
}

export class DeviceDriverRepository implements IDeviceDriverRepository {
  async createAssociation(
    deviceId: mongoose.Types.ObjectId,
    driverId: mongoose.Types.ObjectId,
    associatedAt?: Date
  ): Promise<IDeviceDriver> {
    const association = new DeviceDriverModel({
      deviceId,
      driverId,
      associatedAt: associatedAt || new Date(),
      disassociatedAt: null,
    });
    return await association.save();
  }

  async getActiveAssociationByDriver(
    driverId: mongoose.Types.ObjectId
  ): Promise<IDeviceDriver | null> {
    return await DeviceDriverModel.findOne({
      driverId,
      disassociatedAt: null,
    }).sort({ associatedAt: -1 });
  }

  async getActiveAssociationByDevice(
    deviceId: mongoose.Types.ObjectId
  ): Promise<IDeviceDriver | null> {
    return await DeviceDriverModel.findOne({
      deviceId,
      disassociatedAt: null,
    }).sort({ associatedAt: -1 });
  }

  async disassociateDevice(
    associationId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<IDeviceDriver | null> {
    return await DeviceDriverModel.findByIdAndUpdate(
      associationId,
      { disassociatedAt: disassociatedAt || new Date() },
      { new: true }
    );
  }

  async disassociateAllForDriver(
    driverId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<number> {
    const result = await DeviceDriverModel.updateMany(
      { driverId, disassociatedAt: null },
      { disassociatedAt: disassociatedAt || new Date() }
    );
    return result.modifiedCount;
  }
}
