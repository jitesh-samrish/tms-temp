import express from 'express';
import tripRouter from './TripRouter';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware';

const v1Router = express.Router();

v1Router.use('/trips', AuthMiddleware.authenticate, tripRouter);

export default v1Router;
