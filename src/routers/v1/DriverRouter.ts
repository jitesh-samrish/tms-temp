import { Router } from 'express';
import { DriverController } from '../../controllers/DriverController';
import { DriverService } from '../../services/DriverService';
import { DriverAssociationTokenRepository } from '../../repositories/DriverAssociationTokenRepository';
import { DriverRepository } from '../../repositories/DriverRepository';
import { DeviceDriverRepository } from '../../repositories/DeviceDriverRepository';
import { TripDriverRepository } from '../../repositories/TripDriverRepository';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware';
import { validateBody } from '../../utils/validators/Request.validator';
import { associateDriverWithTripSchema } from '../../utils/validators/schemas/Driver.zodSchema';

const driverRouter = Router();

// Initialize repositories
const driverAssociationTokenRepo = new DriverAssociationTokenRepository();
const driverRepo = new DriverRepository();
const deviceDriverRepo = new DeviceDriverRepository();
const tripDriverRepo = new TripDriverRepository();

// Initialize service
const driverService = new DriverService(
  driverAssociationTokenRepo,
  driverRepo,
  deviceDriverRepo,
  tripDriverRepo
);

// Initialize controller
const driverController = new DriverController(driverService);

// Routes
driverRouter.post(
  '/generate-token',
  AuthMiddleware.authenticate,
  driverController.generateToken
);

driverRouter.post(
  '/associate-with-trip',
  AuthMiddleware.authenticate,
  validateBody(associateDriverWithTripSchema),
  driverController.associateDriverWithTrip
);

export default driverRouter;
