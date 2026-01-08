import express from 'express';
import tripRouter from './TripRouter';
import tripPlanRouter from './TripPlanRouter';
import stopRouter from './StopRouter';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware';

const v1Router = express.Router();

v1Router.use('/trips', AuthMiddleware.authenticate, tripRouter);
v1Router.use('/trip-plans', AuthMiddleware.authenticate, tripPlanRouter);
v1Router.use('/stops', AuthMiddleware.authenticate, stopRouter);

export default v1Router;
