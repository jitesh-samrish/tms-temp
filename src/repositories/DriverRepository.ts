import mongoose from 'mongoose';
import DriverModel from '../models/Driver.model';
import { IDriver } from 'tms-common-db/schemas/driver.schema';

export interface IDriverRepository {
  createDriver(
    name: string,
    userId: mongoose.Types.ObjectId,
    createdBy: mongoose.Types.ObjectId
  ): Promise<IDriver>;
  getDriverById(driverId: mongoose.Types.ObjectId): Promise<IDriver | null>;
  getDriverByUserId(userId: mongoose.Types.ObjectId): Promise<IDriver | null>;
  getAllDrivers(): Promise<IDriver[]>;
  deleteDriver(driverId: mongoose.Types.ObjectId): Promise<boolean>;
}

export class DriverRepository implements IDriverRepository {
  async createDriver(
    name: string,
    userId: mongoose.Types.ObjectId,
    createdBy: mongoose.Types.ObjectId
  ): Promise<IDriver> {
    const driver = new DriverModel({
      name,
      userId,
      createdBy,
    });
    return await driver.save();
  }

  async getDriverById(
    driverId: mongoose.Types.ObjectId
  ): Promise<IDriver | null> {
    return await DriverModel.findById(driverId);
  }

  async getDriverByUserId(
    userId: mongoose.Types.ObjectId
  ): Promise<IDriver | null> {
    return await DriverModel.findOne({ userId });
  }

  async getAllDrivers(): Promise<IDriver[]> {
    return await DriverModel.find().sort({ createdAt: -1 });
  }

  async deleteDriver(driverId: mongoose.Types.ObjectId): Promise<boolean> {
    const result = await DriverModel.deleteOne({ _id: driverId });
    return result.deletedCount > 0;
  }
}
