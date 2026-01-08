import { Router } from 'express';
import { StopController } from '../../controllers/StopController';
import { StopService } from '../../services/StopService';

const stopRouter = Router();
const stopService = new StopService();
const stopController = new StopController(stopService);

// Search stops by name (must come before /:stopId route)
stopRouter.get('/search', stopController.searchStopByName);

// Get all stops
stopRouter.get('/', stopController.getAllStops);

// Create a new stop
stopRouter.post('/', stopController.createStop);

export default stopRouter;
