import express from 'express';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware';
import { TripController } from '../../controllers/TripController';
import { TripService } from '../../services/TripService';
import { TripRepository } from '../../repositories/TripRepository';
import { TripPlanRepository } from '../../repositories/TripPlanRepository';
import { ChangeRepository } from '../../repositories/ChangeRepository';
import {
  validateBody,
  validateParams,
} from '../../utils/validators/Request.validator';
import {
  createTripSchema,
  tripIdParamSchema,
  cancelTripSchema,
  updateTripACLSchema,
} from '../../utils/validators/schemas/Trip.zodSchema';

const tripRouter = express.Router();

const tripRepository = new TripRepository();
const tripPlanRepository = new TripPlanRepository();
const changeRepository = new ChangeRepository();

const tripService = new TripService(
  tripRepository,
  tripPlanRepository,
  changeRepository
);
const tripController = new TripController(tripService);

// Create a new trip
tripRouter.post(
  '/',
  AuthMiddleware.authenticate,
  validateBody(createTripSchema),
  tripController.createTrip
);

// Get all trips for the authenticated user
tripRouter.get('/', AuthMiddleware.authenticate, tripController.getUserTrips);

// Get a specific trip by ID
tripRouter.get(
  '/:tripId',
  AuthMiddleware.authenticate,
  validateParams(tripIdParamSchema),
  tripController.getTripById
);

// Start a trip
tripRouter.post(
  '/:tripId/start',
  AuthMiddleware.authenticate,
  validateParams(tripIdParamSchema),
  tripController.startTrip
);

// Complete a trip
tripRouter.post(
  '/:tripId/complete',
  AuthMiddleware.authenticate,
  validateParams(tripIdParamSchema),
  tripController.completeTrip
);

// Cancel a trip
tripRouter.post(
  '/:tripId/cancel',
  AuthMiddleware.authenticate,
  validateParams(tripIdParamSchema),
  validateBody(cancelTripSchema),
  tripController.cancelTrip
);

// Update trip ACL (add/remove users)
tripRouter.put(
  '/:tripId/acl',
  AuthMiddleware.authenticate,
  validateParams(tripIdParamSchema),
  validateBody(updateTripACLSchema),
  tripController.updateTripACL
);

export default tripRouter;
