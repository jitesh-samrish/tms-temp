import { Router } from 'express';
import { TripPlanController } from '../../controllers/TripPlanController';
import { TripPlanService } from '../../services/TripPlanService';
import {
  validateBody,
  validateParams,
} from '../../utils/validators/Request.validator';
import {
  createTripPlanBasicSchema,
  attachScheduleSchema,
  setDateRangesSchema,
  setPassengersSchema,
  tripPlanIdParamSchema,
} from '../../utils/validators/schemas/TripPlan.zodSchema';

const tripPlanRouter = Router();
const tripPlanService = new TripPlanService();
const tripPlanController = new TripPlanController(tripPlanService);

// API 1: Create trip plan with basic details
tripPlanRouter.post(
  '/basic',
  validateBody(createTripPlanBasicSchema),
  tripPlanController.createTripPlanBasic
);

// API 2: Attach schedule to existing trip plan
tripPlanRouter.post(
  '/schedule',
  validateBody(attachScheduleSchema),
  tripPlanController.attachSchedule
);

// API 3: Set date ranges in trip plan
tripPlanRouter.post(
  '/date-ranges',
  validateBody(setDateRangesSchema),
  tripPlanController.setDateRanges
);

// API 4: Set passengers list in trip plan
tripPlanRouter.post(
  '/passengers',
  validateBody(setPassengersSchema),
  tripPlanController.setPassengers
);

// Get trip plan by ID
tripPlanRouter.get(
  '/:tripPlanId',
  validateParams(tripPlanIdParamSchema),
  tripPlanController.getTripPlanById
);

export default tripPlanRouter;
