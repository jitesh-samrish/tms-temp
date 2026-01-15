import mongoose from 'mongoose';
import { DeviceMatrix, IDeviceMatrix } from '../models/DeviceMatrix.model';
import {
  ProcessedDeviceMatrix,
  IProcessedDeviceMatrix,
} from '../models/ProcessedDeviceMatrix.model';
import { Logger } from '../utils/Logger';

const logger = Logger.create('MatrixRepository');

export interface IMatrixRepository {
  createDeviceMatrix(
    deviceId: string,
    coordinates: { latitude: number; longitude: number },
    tripId?: string,
    metadata?: Record<string, any>
  ): Promise<IDeviceMatrix>;

  getRawMatrices(
    page: number,
    limit: number,
    deviceId?: string,
    tripId?: string,
    startDate?: Date,
    endDate?: Date,
    afterTimestamp?: Date
  ): Promise<{
    matrices: IDeviceMatrix[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  getProcessedMatrices(
    page: number,
    limit: number,
    deviceId?: string,
    tripId?: string,
    startDate?: Date,
    endDate?: Date,
    afterTimestamp?: Date
  ): Promise<{
    matrices: IProcessedDeviceMatrix[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  getDeviceMatrixById(matrixId: string): Promise<IDeviceMatrix | null>;

  getProcessedDeviceMatrixById(
    matrixId: string
  ): Promise<IProcessedDeviceMatrix | null>;

  getLastProcessedMatrixForDevice(
    deviceId: string
  ): Promise<IProcessedDeviceMatrix | null>;
}

export class MatrixRepository implements IMatrixRepository {
  /**
   * Create a new raw device matrix entry
   */
  async createDeviceMatrix(
    deviceId: string,
    coordinates: { latitude: number; longitude: number },
    tripId?: string,
    metadata?: Record<string, any>
  ): Promise<IDeviceMatrix> {
    try {
      const deviceMatrix = new DeviceMatrix({
        timestamp: new Date(),
        deviceId: new mongoose.Types.ObjectId(deviceId),
        tripId: tripId ? new mongoose.Types.ObjectId(tripId) : undefined,
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
        metadata: metadata || {},
      });

      await deviceMatrix.save();
      logger.info(
        `Device matrix created for device ${deviceId}: ${deviceMatrix._id}`
      );

      return deviceMatrix;
    } catch (error) {
      logger.error('Error creating device matrix:', error);
      throw error;
    }
  }

  /**
   * Get raw device matrices with pagination and filters
   */
  async getRawMatrices(
    page: number = 1,
    limit: number = 50,
    deviceId?: string,
    tripId?: string,
    startDate?: Date,
    endDate?: Date,
    afterTimestamp?: Date
  ): Promise<{
    matrices: IDeviceMatrix[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      if (deviceId) {
        query.deviceId = new mongoose.Types.ObjectId(deviceId);
      }

      if (tripId) {
        query.tripId = new mongoose.Types.ObjectId(tripId);
      }

      if (startDate || endDate || afterTimestamp) {
        query.timestamp = {};
        if (afterTimestamp) {
          query.timestamp.$gt = afterTimestamp;
        } else {
          if (startDate) {
            query.timestamp.$gte = startDate;
          }
          if (endDate) {
            query.timestamp.$lte = endDate;
          }
        }
      }

      const [matrices, total] = await Promise.all([
        DeviceMatrix.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        DeviceMatrix.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(
        `Retrieved ${matrices.length} raw matrices (page ${page}/${totalPages})`
      );

      return {
        matrices: matrices as IDeviceMatrix[],
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error retrieving raw matrices:', error);
      throw error;
    }
  }

  /**
   * Get processed device matrices with pagination and filters
   */
  async getProcessedMatrices(
    page: number = 1,
    limit: number = 50,
    deviceId?: string,
    tripId?: string,
    startDate?: Date,
    endDate?: Date,
    afterTimestamp?: Date
  ): Promise<{
    matrices: IProcessedDeviceMatrix[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      if (deviceId) {
        query.deviceId = new mongoose.Types.ObjectId(deviceId);
      }

      if (tripId) {
        query.tripId = new mongoose.Types.ObjectId(tripId);
      }

      if (startDate || endDate || afterTimestamp) {
        query.timestamp = {};
        if (afterTimestamp) {
          query.timestamp.$gt = afterTimestamp;
        } else {
          if (startDate) {
            query.timestamp.$gte = startDate;
          }
          if (endDate) {
            query.timestamp.$lte = endDate;
          }
        }
      }

      const [matrices, total] = await Promise.all([
        ProcessedDeviceMatrix.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ProcessedDeviceMatrix.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(
        `Retrieved ${matrices.length} processed matrices (page ${page}/${totalPages})`
      );

      return {
        matrices: matrices as IProcessedDeviceMatrix[],
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error retrieving processed matrices:', error);
      throw error;
    }
  }

  /**
   * Get a specific device matrix by ID
   */
  async getDeviceMatrixById(matrixId: string): Promise<IDeviceMatrix | null> {
    try {
      const matrix = await DeviceMatrix.findById(matrixId).lean();
      return matrix as IDeviceMatrix | null;
    } catch (error) {
      logger.error(`Error retrieving device matrix ${matrixId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific processed device matrix by ID
   */
  async getProcessedDeviceMatrixById(
    matrixId: string
  ): Promise<IProcessedDeviceMatrix | null> {
    try {
      const matrix = await ProcessedDeviceMatrix.findById(matrixId).lean();
      return matrix as IProcessedDeviceMatrix | null;
    } catch (error) {
      logger.error(
        `Error retrieving processed device matrix ${matrixId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get the last processed matrix for a specific device
   */
  async getLastProcessedMatrixForDevice(
    deviceId: string
  ): Promise<IProcessedDeviceMatrix | null> {
    try {
      const matrix = await ProcessedDeviceMatrix.findOne({
        deviceId: new mongoose.Types.ObjectId(deviceId),
      })
        .sort({ timestamp: -1 })
        .limit(1)
        .lean();

      return matrix as IProcessedDeviceMatrix | null;
    } catch (error) {
      logger.error(
        `Error retrieving last processed matrix for device ${deviceId}:`,
        error
      );
      throw error;
    }
  }
}
