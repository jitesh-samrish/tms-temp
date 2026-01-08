import { Request, Response, NextFunction } from 'express';
import { IStopService } from '../services/StopService';
import { Logger } from '../utils/Logger';
import { StatusCodes } from 'http-status-codes';
import { BadRequestException } from '../utils/errors';

const logger = Logger.create('StopController');

export class StopController {
  constructor(private stopService: IStopService) {}

  /**
   * Create a new stop
   * POST /api/v1/stops
   */
  createStop = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, latitude, longitude, address } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (
        !name ||
        latitude === undefined ||
        longitude === undefined ||
        !address
      ) {
        throw new BadRequestException(
          'Name, latitude, longitude, and address are required'
        );
      }

      // Validate latitude and longitude ranges
      if (latitude < -90 || latitude > 90) {
        throw new BadRequestException('Latitude must be between -90 and 90');
      }

      if (longitude < -180 || longitude > 180) {
        throw new BadRequestException('Longitude must be between -180 and 180');
      }

      const stop = await this.stopService.createStop(
        name,
        latitude,
        longitude,
        address,
        userId
      );

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Stop created successfully',
        data: stop,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all stops
   * GET /api/v1/stops
   */
  getAllStops = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const stops = await this.stopService.getAllStops();

      res.status(StatusCodes.OK).json({
        success: true,
        data: stops,
        count: stops.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search stops by name
   * GET /api/v1/stops/search?name=searchTerm
   */
  searchStopByName = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!name || typeof name !== 'string') {
        throw new BadRequestException('Search name parameter is required');
      }

      const stops = await this.stopService.searchStopByName(name);

      res.status(StatusCodes.OK).json({
        success: true,
        data: stops,
        count: stops.length,
      });
    } catch (error) {
      next(error);
    }
  };
}
