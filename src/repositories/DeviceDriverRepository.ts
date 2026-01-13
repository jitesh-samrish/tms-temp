import mongoose from 'mongoose';
import DriverDeviceModel from '../models/DriverDevice.model';
import { IDriverDevice } from 'tms-common-db/schemas/driverDeviceSchema';

export interface IDeviceDriverRepository {
  createAssociation(
    deviceId: mongoose.Types.ObjectId,
    driverId: mongoose.Types.ObjectId,
    associatedAt?: Date
  ): Promise<IDriverDevice>;
  getActiveAssociationByDriver(
    driverId: mongoose.Types.ObjectId
  ): Promise<IDriverDevice | null>;
  getActiveAssociationByDevice(
    deviceId: mongoose.Types.ObjectId
  ): Promise<IDriverDevice | null>;
  disassociateDevice(
    associationId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<IDriverDevice | null>;
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
  ): Promise<IDriverDevice> {
    const association = new DriverDeviceModel({
      deviceId,
      driverId,
      associatedAt: associatedAt || new Date(),
      disassociatedAt: null,
    });
    return await association.save();
  }

  async getActiveAssociationByDriver(
    driverId: mongoose.Types.ObjectId
  ): Promise<IDriverDevice | null> {
    return await DriverDeviceModel.findOne({
      driverId,
      disassociatedAt: null,
    }).sort({ associatedAt: -1 });
  }

  async getActiveAssociationByDevice(
    deviceId: mongoose.Types.ObjectId
  ): Promise<IDriverDevice | null> {
    return await DriverDeviceModel.findOne({
      deviceId,
      disassociatedAt: null,
    }).sort({ associatedAt: -1 });
  }

  async disassociateDevice(
    associationId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<IDriverDevice | null> {
    return await DriverDeviceModel.findByIdAndUpdate(
      associationId,
      { disassociatedAt: disassociatedAt || new Date() },
      { new: true }
    );
  }

  async disassociateAllForDriver(
    driverId: mongoose.Types.ObjectId,
    disassociatedAt?: Date
  ): Promise<number> {
    const result = await DriverDeviceModel.updateMany(
      { driverId, disassociatedAt: null },
      { disassociatedAt: disassociatedAt || new Date() }
    );
    return result.modifiedCount;
  }
}
