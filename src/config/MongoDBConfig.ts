import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ServerConfig } from './ServerConfig';
import { Logger } from '../utils/Logger';

const logger = Logger.create('MongoDB');

dotenv.config();

export class MongoDBConfig {
  private static instance: MongoDBConfig;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoDBConfig {
    if (!MongoDBConfig.instance) {
      MongoDBConfig.instance = new MongoDBConfig();
    }
    return MongoDBConfig.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.debug('Already connected');
      return;
    }

    try {
      const MONGODB_URI =
        ServerConfig.MONGODB_URI ||
        'mongodb://localhost:27017/state-management';

      await mongoose.connect(MONGODB_URI);

      this.isConnected = true;
      logger.info('Successfully connected to database');

      mongoose.connection.on('error', (error) => {
        logger.error('Connection error', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('Disconnected from database');
        this.isConnected = false;
      });
    } catch (error) {
      logger.error('Failed to connect', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting', error);
      throw error;
    }
  }

  public getConnection() {
    return mongoose.connection;
  }
}
