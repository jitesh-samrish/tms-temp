import express from 'express';
import tripRouter from './TripRouter';
import tripPlanRouter from './TripPlanRouter';
import stopRouter from './StopRouter';
import driverRouter from './DriverRouter';
import matrixRouter from './MatrixRouter';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware';

const v1Router = express.Router();

v1Router.use('/trips', AuthMiddleware.authenticate, tripRouter);
v1Router.use('/trip-plans', AuthMiddleware.authenticate, tripPlanRouter);
v1Router.use('/stops', AuthMiddleware.authenticate, stopRouter);
v1Router.use('/drivers', AuthMiddleware.authenticate, driverRouter);
v1Router.use('/matrix', matrixRouter); // Matrix endpoints (no auth required for GPS tracking)

export default v1Router;
