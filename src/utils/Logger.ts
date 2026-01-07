import winston from 'winston';
import LogstashTransport from 'winston3-logstash-transport';
import { ServerConfig } from '../config/ServerConfig';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

/**
 * Logger utility class for structured logging across the application.
 *
 * **IMPORTANT**: Always create a context-specific logger instance using Logger.create()
 * to ensure logs clearly indicate their source file.
 *
 * @example
 * ```typescript
 * import { Logger } from '../utils/Logger';
 *
 * const logger = Logger.create('YourFileName');
 *
 * logger.info('Operation completed successfully');
 * logger.error('Operation failed', error);
 * logger.debug('Debug information', { data: value });
 * ```
 *
 * DO NOT import or use a default logger instance. Each file must create its own
 * logger with an appropriate context name (typically the filename).
 */
export class Logger {
  private static instance: winston.Logger;
  private context: string;

  private constructor(context: string = 'Application') {
    this.context = context;
  }

  /**
   * Get or create the Winston logger instance
   */
  private static getWinstonLogger(): winston.Logger {
    if (!this.instance) {
      // 1. Keep your pretty print format for Console/File
      const prettyPrintFormat = winston.format.printf(
        ({ level, message, timestamp, context, ...metadata }) => {
          let msg = `${timestamp} [${level.toUpperCase()}] [${
            context || 'App'
          }]: ${message}`;
          if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        }
      );

      this.instance = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        defaultMeta: {
          service: ServerConfig.SERVICE_NAME,
          env: ServerConfig.NODE_ENV,
        },
        // Base format: Timestamp and Errors are universal
        format: winston.format.combine(
          winston.format.errors({ stack: true }),
          winston.format.splat()
        ),
        transports: [
          // CONSOLE: Uses the pretty string format
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              prettyPrintFormat
            ),
          }),
          new LogstashTransport({
            mode: 'tcp', // Explicitly set TCP
            host: ServerConfig.LOGSTASH_HOST, // 'localhost' if running locally
            port: ServerConfig.LOGSTASH_PORT, // 5555
            maxConnectRetries: -1,
            timeoutConnectRetries: 100,
            trailingLineFeed: true,
            formatted: false,
          }),
        ],
        exitOnError: true,
      });
    }

    return this.instance;
  }

  /**
   * Create a logger instance for a specific context/module
   *
   * @param context - The name of the file or module (e.g., 'TokenService', 'QueueRepository')
   * @returns A Logger instance with the specified context
   *
   * @example
   * ```typescript
   * const logger = Logger.create('TokenService');
   * logger.info('Token created successfully');
   * // Output: 2025-12-13 10:30:45 [INFO] [TokenService]: Token created successfully
   * ```
   */
  public static create(context: string): Logger {
    return new Logger(context);
  }

  /**
   * Log error messages
   */
  public error(message: string, error?: Error | any): void {
    const logger = Logger.getWinstonLogger();
    if (error instanceof Error) {
      logger.error(message, {
        context: this.context,
        error: error.message,
        stack: error.stack,
      });
    } else if (error) {
      logger.error(message, {
        context: this.context,
        error: JSON.stringify(error),
      });
    } else {
      logger.error(message, { context: this.context });
    }
  }

  /**
   * Log warning messages
   */
  public warn(message: string, meta?: any): void {
    const logger = Logger.getWinstonLogger();
    logger.warn(message, { context: this.context, ...meta });
  }

  /**
   * Log info messages
   */
  public info(message: string, meta?: any): void {
    const logger = Logger.getWinstonLogger();
    logger.info(message, { context: this.context, ...meta });
  }

  /**
   * Log HTTP request/response messages
   */
  public http(message: string, meta?: any): void {
    const logger = Logger.getWinstonLogger();
    logger.http(message, { context: this.context, ...meta });
  }

  /**
   * Log debug messages
   */
  public debug(message: string, meta?: any): void {
    const logger = Logger.getWinstonLogger();
    logger.debug(message, { context: this.context, ...meta });
  }

  /**
   * Log with custom level
   */
  public log(level: LogLevel, message: string, meta?: any): void {
    const logger = Logger.getWinstonLogger();
    logger.log(level, message, { context: this.context, ...meta });
  }
}

/**
 * LOGGING BEST PRACTICES:
 *
 * 1. Always use Logger.create() with a descriptive context name (typically the filename)
 *    ✅ const logger = Logger.create('TokenService');
 *    ❌ import { logger } from '../utils/Logger';  // This export does not exist
 *
 * 2. Use the appropriate log level for your message:
 *    - logger.error() - For errors and exceptions
 *    - logger.warn()  - For warnings and deprecated usage
 *    - logger.info()  - For important business operations
 *    - logger.http()  - For HTTP request/response logging
 *    - logger.debug() - For detailed debugging information
 *
 * 3. Include relevant metadata in your logs:
 *    logger.info('Token created', { tokenId, userId, queueId });
 *
 * 4. The context name will appear in all logs from that logger:
 *    [INFO] [TokenService]: Token created successfully
 *    [ERROR] [QueueRepository]: Failed to fetch queue
 */

// Note: Do not use a default logger instance. Always create a context-specific logger:
// const logger = Logger.create('YourFileName');
// This ensures logs clearly indicate which file they originated from.
