import express from 'express';
import authRouter from './AuthRouter';
import queueRouter from './QueueRouter';
import tokenRouter from './TokenRouter';
import messageRouter from './MessageRouter';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware';
import userRouter from './UserRouter';
import accountRouter from './AccountRouter';

const v1Router = express.Router();

v1Router.use('/auth', authRouter);
v1Router.use('/queues', queueRouter);
v1Router.use('/tokens', tokenRouter);
v1Router.use('/messages', AuthMiddleware.authenticate, messageRouter);
v1Router.use('/users', AuthMiddleware.authenticate, userRouter);
v1Router.use('/accounts', AuthMiddleware.authenticate, accountRouter);

export default v1Router;
