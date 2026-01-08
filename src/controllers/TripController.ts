import { Request, Response, NextFunction } from 'express';
import { ITripService } from '../services/TripService';
import { Logger } from '../utils/Logger';
import { StatusCodes } from 'http-status-codes';

const logger = Logger.create('TripController');

export class TripController {
  constructor(private tripService: ITripService) {}

  /**
   * Create a new trip
   */
  createTrip = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tripPlanId, startTime, endTime, acl } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!tripPlanId || !startTime || !endTime) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'tripPlanId, startTime, and endTime are required',
        });
        return;
      }

      const trip = await this.tripService.createTrip(
        tripPlanId,
        new Date(startTime),
        new Date(endTime),
        userId,
        acl
      );

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get trip by ID
   */
  getTripById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tripId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const trip = await this.tripService.getTripById(tripId, userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all trips for the authenticated user
   */
  getUserTrips = async (
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

      const trips = await this.tripService.getTripsByUser(userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: trips,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Start a trip
   */
  startTrip = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tripId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const trip = await this.tripService.startTrip(tripId, userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: trip,
        message: 'Trip started successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Complete a trip
   */
  completeTrip = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tripId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const trip = await this.tripService.completeTrip(tripId, userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: trip,
        message: 'Trip completed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel a trip
   */
  cancelTrip = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tripId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const trip = await this.tripService.cancelTrip(tripId, userId, reason);

      res.status(StatusCodes.OK).json({
        success: true,
        data: trip,
        message: 'Trip cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update trip ACL (add or remove user)
   */
  updateTripACL = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tripId } = req.params;
      const { targetUserId, role, action } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!targetUserId || !action) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'targetUserId and action are required',
        });
        return;
      }

      if (action !== 'add' && action !== 'remove') {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'action must be either "add" or "remove"',
        });
        return;
      }

      if (action === 'add' && !role) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'role is required when adding a user',
        });
        return;
      }

      const trip = await this.tripService.updateTripACL(
        tripId,
        userId,
        targetUserId,
        role,
        action
      );

      res.status(StatusCodes.OK).json({
        success: true,
        data: trip,
        message: `User ${
          action === 'add' ? 'added to' : 'removed from'
        } trip ACL`,
      });
    } catch (error) {
      next(error);
    }
  };
}
