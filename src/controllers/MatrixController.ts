import { Request, Response, NextFunction } from 'express';
import { IMatrixService } from '../services/MatrixService';
import { Logger } from '../utils/Logger';
import { StatusCodes } from 'http-status-codes';

const logger = Logger.create('MatrixController');

export class MatrixController {
  constructor(private matrixService: IMatrixService) {}

  /**
   * Store a new device matrix (GPS coordinates)
   * POST /api/v1/matrix
   * Body: {
   *   deviceIdentifier: string,
   *   coordinates: { latitude: number, longitude: number },
   *   metadata?: object
   * }
   */
  storeDeviceMatrix = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { deviceIdentifier, coordinates, metadata } = req.body;

      logger.info(
        `Storing device matrix for device ${deviceIdentifier} at [${coordinates.latitude}, ${coordinates.longitude}]`
      );

      const result = await this.matrixService.storeDeviceMatrix(
        deviceIdentifier,
        coordinates,
        undefined, // tripId is calculated in service
        metadata
      );

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Device matrix stored and queued for processing',
        data: {
          matrixId: result.matrix._id,
          deviceId: result.matrix.deviceId,
          coordinates: result.matrix.coordinates,
          timestamp: result.matrix.timestamp,
          tripId: result.matrix.tripId,
          jobId: result.jobId,
        },
      });
    } catch (error) {
      logger.error('Error storing device matrix:', error);
      next(error);
    }
  };

  /**
   * Get raw device matrices with pagination
   * GET /api/v1/matrix/raw
   * Query params: page, limit, deviceIdentifier, tripId, startDate, endDate, after
   */
  getRawMatrices = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const filters: any = {};

      if (req.query.deviceIdentifier) {
        filters.deviceIdentifier = req.query.deviceIdentifier as string;
      }

      if (req.query.tripId) {
        filters.tripId = req.query.tripId as string;
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      if (req.query.after) {
        filters.afterTimestamp = new Date(req.query.after as string);
      }

      logger.info(`Fetching raw matrices - page: ${page}, limit: ${limit}`);

      const result = await this.matrixService.getRawMatrices(
        page,
        limit,
        filters
      );

      res.status(StatusCodes.OK).json({
        success: true,
        data: result.matrices,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error fetching raw matrices:', error);
      next(error);
    }
  };

  /**
   * Get processed device matrices with pagination
   * GET /api/v1/matrix/processed
   * Query params: page, limit, deviceIdentifier, tripId, startDate, endDate, after
   */
  getProcessedMatrices = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const filters: any = {};

      if (req.query.deviceIdentifier) {
        filters.deviceIdentifier = req.query.deviceIdentifier as string;
      }

      if (req.query.tripId) {
        filters.tripId = req.query.tripId as string;
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      if (req.query.after) {
        filters.afterTimestamp = new Date(req.query.after as string);
      }

      logger.info(
        `Fetching processed matrices - page: ${page}, limit: ${limit}`
      );

      const result = await this.matrixService.getProcessedMatrices(
        page,
        limit,
        filters
      );

      res.status(StatusCodes.OK).json({
        success: true,
        data: result.matrices,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error fetching processed matrices:', error);
      next(error);
    }
  };

  /**
   * Get a specific raw device matrix by ID
   * GET /api/v1/matrix/raw/:matrixId
   */
  getDeviceMatrixById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { matrixId } = req.params;

      logger.info(`Fetching device matrix by ID: ${matrixId}`);

      const matrix = await this.matrixService.getDeviceMatrixById(matrixId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: matrix,
      });
    } catch (error) {
      logger.error('Error fetching device matrix:', error);
      next(error);
    }
  };

  /**
   * Get a specific processed device matrix by ID
   * GET /api/v1/matrix/processed/:matrixId
   */
  getProcessedDeviceMatrixById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { matrixId } = req.params;

      logger.info(`Fetching processed device matrix by ID: ${matrixId}`);

      const matrix = await this.matrixService.getProcessedDeviceMatrixById(
        matrixId
      );

      res.status(StatusCodes.OK).json({
        success: true,
        data: matrix,
      });
    } catch (error) {
      logger.error('Error fetching processed device matrix:', error);
      next(error);
    }
  };
}
