import { Router } from 'express';
import { TripPlanController } from '../../controllers/TripPlanController';
import { TripPlanService } from '../../services/TripPlanService';

const tripPlanRouter = Router();
const tripPlanService = new TripPlanService();
const tripPlanController = new TripPlanController(tripPlanService);

// API 1: Create trip plan with basic details
tripPlanRouter.post('/basic', tripPlanController.createTripPlanBasic);

// API 2: Attach schedule to existing trip plan
tripPlanRouter.post('/schedule', tripPlanController.attachSchedule);

// API 3: Set date ranges in trip plan
tripPlanRouter.post('/date-ranges', tripPlanController.setDateRanges);

// API 4: Set passengers list in trip plan
tripPlanRouter.post('/passengers', tripPlanController.setPassengers);

// Get trip plan by ID
tripPlanRouter.get('/:tripPlanId', tripPlanController.getTripPlanById);

export default tripPlanRouter;
