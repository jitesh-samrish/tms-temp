import { Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/DriverService';
import { ResponseUtils } from '../utils/ResponseUtils';
import { StatusCodes } from 'http-status-codes';

export class DriverController {
  constructor(private driverService: DriverService) {}

  /**
   * POST /api/v1/drivers/generate-token
   * Generate a 6-digit token for driver association (expires in 5 minutes)
   */
  generateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.user!; // From auth middleware

      const result = await this.driverService.generateToken(sessionId);

      ResponseUtils.successResponse(
        res,
        'Token generated successfully. Valid for 5 minutes.',
        {
          succcess: true,
          token: result.token,
          expiresAt: result.expiresAt,
        },
        StatusCodes.CREATED
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/drivers/associate-with-trip
   * Associate a driver with a trip using a token
   */
  associateDriverWithTrip = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { token, tripId } = req.body;
      const requestingUserId = req.user!.id; // From auth middleware

      const result = await this.driverService.associateDriverWithTrip(
        token,
        tripId,
        requestingUserId
      );

      ResponseUtils.successResponse(
        res,
        'Driver successfully associated with trip',
        {
          driverId: result.driverId,
          deviceId: result.deviceId,
          tripId: result.tripId,
        }
      );
    } catch (error) {
      next(error);
    }
  };
}
