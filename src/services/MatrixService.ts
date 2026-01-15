import { IMatrixRepository } from '../repositories/MatrixRepository';
import { IDeviceMatrix } from '../models/DeviceMatrix.model';
import { IProcessedDeviceMatrix } from '../models/ProcessedDeviceMatrix.model';
import { DeviceRepository } from '../repositories/DeviceRepository';
import { DeviceDriverRepository } from '../repositories/DeviceDriverRepository';
import { VehicleDeviceRepository } from '../repositories/VehicleDeviceRepository';
import { TripDriverRepository } from '../repositories/TripDriverRepository';
import { VehicleTripRepository } from '../repositories/VehicleTripRepository';
import { Logger } from '../utils/Logger';
import { NotFoundException } from '../utils/errors';
import queueService from './DeviceMatrixProcessingQueueService';

const logger = Logger.create('MatrixService');

export interface IMatrixService {
  storeDeviceMatrix(
    deviceIdentifier: string,
    coordinates: { latitude: number; longitude: number },
    tripId?: string,
    metadata?: Record<string, any>
  ): Promise<{
    matrix: IDeviceMatrix;
    jobId: string;
  }>;

  getRawMatrices(
    page: number,
    limit: number,
    filters?: {
      deviceIdentifier?: string;
      tripId?: string;
      startDate?: Date;
      endDate?: Date;
      afterTimestamp?: Date;
    }
  ): Promise<{
    matrices: IDeviceMatrix[];
    pagination: {
      total: number;
      page: number;
      totalPages: number;
      limit: number;
    };
  }>;

  getProcessedMatrices(
    page: number,
    limit: number,
    filters?: {
      deviceIdentifier?: string;
      tripId?: string;
      startDate?: Date;
      endDate?: Date;
      afterTimestamp?: Date;
    }
  ): Promise<{
    matrices: IProcessedDeviceMatrix[];
    pagination: {
      total: number;
      page: number;
      totalPages: number;
      limit: number;
    };
  }>;

  getDeviceMatrixById(matrixId: string): Promise<IDeviceMatrix>;

  getProcessedDeviceMatrixById(
    matrixId: string
  ): Promise<IProcessedDeviceMatrix>;
}

export class MatrixService implements IMatrixService {
  private deviceRepository: DeviceRepository;
  private deviceDriverRepository: DeviceDriverRepository;
  private vehicleDeviceRepository: VehicleDeviceRepository;
  private tripDriverRepository: TripDriverRepository;
  private vehicleTripRepository: VehicleTripRepository;

  constructor(private matrixRepository: IMatrixRepository) {
    this.deviceRepository = new DeviceRepository();
    this.deviceDriverRepository = new DeviceDriverRepository();
    this.vehicleDeviceRepository = new VehicleDeviceRepository();
    this.tripDriverRepository = new TripDriverRepository();
    this.vehicleTripRepository = new VehicleTripRepository();
  }

  /**
   * Store a new device matrix and queue it for processing
   * Finds the device by identifier and looks up associated trips
   */
  async storeDeviceMatrix(
    deviceIdentifier: string,
    coordinates: { latitude: number; longitude: number },
    _explicitTripId?: string, // Ignored in favor of lookup, or could be used as override
    metadata?: Record<string, any>
  ): Promise<{
    matrix: IDeviceMatrix;
    jobId: string;
  }> {
    try {
      // 1. Find Device by Identifier
      const device = await this.deviceRepository.getDeviceByIdentifier(
        deviceIdentifier
      );
      if (!device) {
        throw new NotFoundException(
          `Device not found with identifier: ${deviceIdentifier}`
        );
      }
      const deviceIdStr = device._id.toString();

      // 2. Lookup Associations to find Trip
      let tripId: string | undefined = _explicitTripId;

      if (!tripId) {
        // Try to find trip via Driver
        const driverDevice =
          await this.deviceDriverRepository.getActiveAssociationByDevice(
            device._id
          );
        if (driverDevice) {
          const tripDriver =
            await this.tripDriverRepository.getActiveAssociationByDriver(
              driverDevice.driverId
            );
          if (tripDriver) {
            tripId = tripDriver.tripId.toString();
            logger.info(
              `Found Trip ${tripId} via Driver ${driverDevice.driverId} for Device ${deviceIdentifier}`
            );
          }
        }

        // If not found, try to find trip via Vehicle
        if (!tripId) {
          const vehicleDevice =
            await this.vehicleDeviceRepository.getActiveAssociationByDevice(
              device._id
            );
          if (vehicleDevice) {
            const vehicleTrip =
              await this.vehicleTripRepository.getActiveAssociationByVehicle(
                vehicleDevice.vehicleId
              );
            if (vehicleTrip) {
              tripId = vehicleTrip.tripId.toString();
              logger.info(
                `Found Trip ${tripId} via Vehicle ${vehicleDevice.vehicleId} for Device ${deviceIdentifier}`
              );
            }
          }
        }
      }

      logger.info(
        `Storing device matrix for device ${deviceIdentifier} (${deviceIdStr}) at [${coordinates.latitude}, ${coordinates.longitude}]`
      );

      const matrix = await this.matrixRepository.createDeviceMatrix(
        deviceIdStr,
        coordinates,
        tripId,
        metadata
      );

      // Step 2: Add the matrix to the processing queue
      const jobId = await queueService.addJob(matrix._id.toString());

      logger.info(
        `Device matrix ${matrix._id} queued for processing with job ID: ${jobId}`
      );

      return {
        matrix,
        jobId,
      };
    } catch (error) {
      logger.error('Error storing device matrix:', error);
      throw error;
    }
  }

  /**
   * Get raw device matrices with pagination and filters
   */
  async getRawMatrices(
    page: number = 1,
    limit: number = 50,
    filters?: {
      deviceIdentifier?: string;
      tripId?: string;
      startDate?: Date;
      endDate?: Date;
      afterTimestamp?: Date;
    }
  ): Promise<{
    matrices: IDeviceMatrix[];
    pagination: {
      total: number;
      page: number;
      totalPages: number;
      limit: number;
    };
  }> {
    try {
      // Validate pagination parameters
      if (page < 1) page = 1;
      if (limit < 1) limit = 50;
      if (limit > 1000) limit = 1000; // Max 1000 items per page

      let deviceId: string | undefined;

      // If deviceIdentifier is provided, look up the device
      if (filters?.deviceIdentifier) {
        const device = await this.deviceRepository.getDeviceByIdentifier(
          filters.deviceIdentifier
        );
        if (!device) {
          throw new NotFoundException(
            `Device not found with identifier: ${filters.deviceIdentifier}`
          );
        }
        deviceId = device._id.toString();
      }

      const result = await this.matrixRepository.getRawMatrices(
        page,
        limit,
        deviceId,
        filters?.tripId,
        filters?.startDate,
        filters?.endDate,
        filters?.afterTimestamp
      );

      return {
        matrices: result.matrices,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit,
        },
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
    filters?: {
      deviceIdentifier?: string;
      tripId?: string;
      startDate?: Date;
      endDate?: Date;
      afterTimestamp?: Date;
    }
  ): Promise<{
    matrices: IProcessedDeviceMatrix[];
    pagination: {
      total: number;
      page: number;
      totalPages: number;
      limit: number;
    };
  }> {
    try {
      // Validate pagination parameters
      if (page < 1) page = 1;
      if (limit < 1) limit = 50;
      if (limit > 1000) limit = 1000; // Max 1000 items per page

      let deviceId: string | undefined;

      // If deviceIdentifier is provided, look up the device
      if (filters?.deviceIdentifier) {
        const device = await this.deviceRepository.getDeviceByIdentifier(
          filters.deviceIdentifier
        );
        if (!device) {
          throw new NotFoundException(
            `Device not found with identifier: ${filters.deviceIdentifier}`
          );
        }
        deviceId = device._id.toString();
      }

      const result = await this.matrixRepository.getProcessedMatrices(
        page,
        limit,
        deviceId,
        filters?.tripId,
        filters?.startDate,
        filters?.endDate,
        filters?.afterTimestamp
      );

      return {
        matrices: result.matrices,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit,
        },
      };
    } catch (error) {
      logger.error('Error retrieving processed matrices:', error);
      throw error;
    }
  }

  /**
   * Get a specific device matrix by ID
   */
  async getDeviceMatrixById(matrixId: string): Promise<IDeviceMatrix> {
    const matrix = await this.matrixRepository.getDeviceMatrixById(matrixId);
    if (!matrix) {
      throw new NotFoundException(`Device matrix not found: ${matrixId}`);
    }
    return matrix;
  }

  /**
   * Get a specific processed device matrix by ID
   */
  async getProcessedDeviceMatrixById(
    matrixId: string
  ): Promise<IProcessedDeviceMatrix> {
    const matrix = await this.matrixRepository.getProcessedDeviceMatrixById(
      matrixId
    );
    if (!matrix) {
      throw new NotFoundException(
        `Processed device matrix not found: ${matrixId}`
      );
    }
    return matrix;
  }
}
