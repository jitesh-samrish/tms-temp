import { Router } from 'express';
import { StopController } from '../../controllers/StopController';
import { StopService } from '../../services/StopService';
import {
  validateBody,
  validateQuery,
} from '../../utils/validators/Request.validator';
import {
  createStopSchema,
  searchStopQuerySchema,
} from '../../utils/validators/schemas/Stop.zodSchema';

const stopRouter = Router();
const stopService = new StopService();
const stopController = new StopController(stopService);

// Search stops by name (must come before /:stopId route)
stopRouter.get(
  '/search',
  validateQuery(searchStopQuerySchema),
  stopController.searchStopByName
);

// Get all stops
stopRouter.get('/', stopController.getAllStops);

// Create a new stop
stopRouter.post('/', validateBody(createStopSchema), stopController.createStop);

export default stopRouter;
