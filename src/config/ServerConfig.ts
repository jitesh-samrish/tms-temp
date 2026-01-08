import dotenv from 'dotenv';
dotenv.config();

export const ServerConfig = {
  PORT: process.env.PORT || 8000,
  MONGODB_URI:
    process.env.MONGODB_URI || 'mongodb://localhost:27017/drishto-db',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  ALLOWED_ORIGINS: (
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:4000,https://drishto-queue.com'
  ).split(','),
  APP_DOWNLOAD_LINK: process.env.APP_DOWNLOAD_LINK || '',
  LOGSTASH_HOST: process.env.LOGSTASH_HOST || 'localhost',
  LOGSTASH_PORT: process.env.LOGSTASH_PORT
    ? parseInt(process.env.LOGSTASH_PORT)
    : 5044,
  SERVICE_NAME: process.env.SERVICE_NAME || 'TMSStateManagementService',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
