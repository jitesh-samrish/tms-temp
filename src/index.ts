import express from 'express';
import cors from 'cors';
import v1Router from './routers/v1/v1Router';
import { ServerConfig } from './config/ServerConfig';
import { GlobalErrorHandler } from './middlewares/GlobalErrorHandler';
import { RequestLogger } from './middlewares/RequestLogger';
import { MongoDBConfig } from './config/MongoDBConfig';
import { Logger } from './utils/Logger';
import { registerAllExecutors } from './config/executors';

const logger = Logger.create('Server');

const app = express();
app.use(
  cors({
    origin: ServerConfig.ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Log all requests and responses
app.use(RequestLogger.log);

// Register action executors
registerAllExecutors();

app.use('/qms/v1', v1Router);

// Register global error handler (must be last)
app.use(GlobalErrorHandler.handle);

// Initialize MongoDB and start server
async function startServer() {
  try {
    // Connect to MongoDB
    const mongoDb = MongoDBConfig.getInstance();
    await mongoDb.connect();

    // Start Express server
    app.listen(ServerConfig.PORT, () => {
      logger.info(`Running on port ${ServerConfig.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start', error);
    process.exit(1);
  }
}

startServer();
