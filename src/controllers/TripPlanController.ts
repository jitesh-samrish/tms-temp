import { Request, Response, NextFunction } from 'express';
import { ITripPlanService } from '../services/TripPlanService';
import { Logger } from '../utils/Logger';
import { StatusCodes } from 'http-status-codes';
import { BadRequestException } from '../utils/errors';

const logger = Logger.create('TripPlanController');

export class TripPlanController {
  constructor(private tripPlanService: ITripPlanService) {}

  /**
   * API 1: Create trip plan with basic details
   * POST /api/v1/trip-plans/basic
   */
  createTripPlanBasic = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, description, schedule, dateRanges, passengers } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!name) {
        throw new BadRequestException('Name is required');
      }

      const tripPlan = await this.tripPlanService.createTripPlanBasic(
        name,
        userId,
        description,
        schedule,
        dateRanges,
        passengers
      );

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Trip plan created successfully',
        data: tripPlan,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * API 2: Attach schedule to existing trip plan
   * POST /api/v1/trip-plans/schedule
   * Schedule times should be in military format: 1030 for 10:30 AM, 2210 for 10:10 PM
   */
  attachSchedule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tripPlanId, schedule, dateRanges, passengers } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!tripPlanId || !schedule || !Array.isArray(schedule)) {
        throw new BadRequestException(
          'tripPlanId and schedule array are required'
        );
      }

      if (schedule.length === 0) {
        throw new BadRequestException('Schedule array cannot be empty');
      }

      const tripPlan = await this.tripPlanService.attachScheduleToTripPlan(
        tripPlanId,
        schedule,
        userId,
        dateRanges,
        passengers
      );

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Schedule attached successfully',
        data: tripPlan,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * API 3: Set date ranges in trip plan
   * POST /api/v1/trip-plans/date-ranges
   */
  setDateRanges = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tripPlanId, dateRanges, passengers } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!tripPlanId || !dateRanges || !Array.isArray(dateRanges)) {
        throw new BadRequestException(
          'tripPlanId and dateRanges array are required'
        );
      }

      const tripPlan = await this.tripPlanService.setDateRangesInTripPlan(
        tripPlanId,
        dateRanges,
        userId,
        passengers
      );

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Date ranges set successfully',
        data: tripPlan,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * API 4: Set passengers list in trip plan
   * POST /api/v1/trip-plans/passengers
   */
  setPassengers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tripPlanId, passengers } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!tripPlanId || !passengers || !Array.isArray(passengers)) {
        throw new BadRequestException(
          'tripPlanId and passengers array are required'
        );
      }

      if (passengers.length === 0) {
        throw new BadRequestException('Passengers array cannot be empty');
      }

      const tripPlan = await this.tripPlanService.setPassengersInTripPlan(
        tripPlanId,
        passengers,
        userId
      );

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Passengers set successfully',
        data: tripPlan,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get trip plan by ID
   * GET /api/v1/trip-plans/:tripPlanId
   */
  getTripPlanById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tripPlanId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const tripPlan = await this.tripPlanService.getTripPlanById(tripPlanId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: tripPlan,
      });
    } catch (error) {
      next(error);
    }
  };
}
