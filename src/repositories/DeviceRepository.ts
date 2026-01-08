import { DeviceModel } from '../models/Device.model';
import { Logger } from '../utils/Logger';
import { IDevice } from 'tms-common-db/schemas/device.schema';

const logger = Logger.create('DeviceRepository');

export interface IDeviceRepository {
  findOrCreateDevice(
    deviceIdentifier: string,
    deviceInfo?: Record<string, any>,
    fcmToken?: string
  ): Promise<IDevice>;
  updateDeviceFCMToken(
    deviceIdentifier: string,
    fcmToken: string
  ): Promise<IDevice | null>;
  getDeviceById(deviceId: string): Promise<IDevice | null>;
  getDeviceByIdentifier(deviceIdentifier: string): Promise<IDevice | null>;
}

export class DeviceRepository implements IDeviceRepository {
  /**
   * Find or create a device by deviceIdentifier
   * New device should be created only when no device is found with the given device_identifier
   */
  async findOrCreateDevice(
    deviceIdentifier: string,
    deviceInfo?: Record<string, any>,
    fcmToken?: string
  ): Promise<IDevice> {
    try {
      // Try to find existing device
      let device = await DeviceModel.findOne({ deviceIdentifier });

      if (device) {
        // Device exists, update if needed
        let needsUpdate = false;
        const updateData: any = {};

        if (
          deviceInfo &&
          JSON.stringify(device.deviceInfo) !== JSON.stringify(deviceInfo)
        ) {
          updateData.deviceInfo = deviceInfo;
          needsUpdate = true;
        }

        if (fcmToken && device.fcmToken !== fcmToken) {
          updateData.fcmToken = fcmToken;
          needsUpdate = true;
        }

        if (needsUpdate) {
          device = await DeviceModel.findOneAndUpdate(
            { deviceIdentifier },
            { $set: updateData },
            { new: true }
          );
          logger.info(`Device updated: ${deviceIdentifier}`);
        } else {
          logger.debug(`Device found without changes: ${deviceIdentifier}`);
        }
      } else {
        // Create new device
        device = new DeviceModel({
          deviceIdentifier,
          deviceInfo,
          fcmToken,
        });
        await device.save();
        logger.info(`New device created: ${deviceIdentifier}`);
      }

      return device!;
    } catch (error) {
      logger.error(`Error finding or creating device: ${error}`);
      throw error;
    }
  }

  /**
   * Update FCM token for a device
   */
  async updateDeviceFCMToken(
    deviceIdentifier: string,
    fcmToken: string
  ): Promise<IDevice | null> {
    try {
      const device = await DeviceModel.findOneAndUpdate(
        { deviceIdentifier },
        { $set: { fcmToken } },
        { new: true }
      );

      if (device) {
        logger.info(`FCM token updated for device: ${deviceIdentifier}`);
      } else {
        logger.warn(
          `Device not found for FCM token update: ${deviceIdentifier}`
        );
      }

      return device;
    } catch (error) {
      logger.error(`Error updating device FCM token: ${error}`);
      throw error;
    }
  }

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
