import { DeviceModel } from '../models/Device.model';
import { Logger } from '../utils/Logger';
import { IDevice } from 'tms-common-db/schemas/device.schema';

const logger = Logger.create('DeviceRepository');

export interface IDeviceRepository {
  getDeviceById(deviceId: string): Promise<IDevice | null>;
  getDeviceByIdentifier(deviceIdentifier: string): Promise<IDevice | null>;
}

export class DeviceRepository implements IDeviceRepository {
  /**
   * Get device by ID
   */
  async getDeviceById(deviceId: string): Promise<IDevice | null> {
    try {
      return await DeviceModel.findById(deviceId).exec();
    } catch (error) {
      logger.error(`Error fetching device by ID: ${error}`);
      throw error;
    }
  }

  /**
   * Get device by deviceIdentifier
   */
  async getDeviceByIdentifier(
    deviceIdentifier: string
  ): Promise<IDevice | null> {
    try {
      return await DeviceModel.findOne({ deviceIdentifier }).exec();
    } catch (error) {
      logger.error(`Error fetching device by identifier: ${error}`);
      throw error;
    }
  }
}
