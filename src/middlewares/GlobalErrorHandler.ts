import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { ResponseUtils } from '../utils/ResponseUtils';
import { Logger } from '../utils/Logger';

const logger = Logger.create('GlobalErrorHandler');

export class GlobalErrorHandler {
  public static handle(
    err: Error | AppError,
    req: Request,
    res: Response,
    _: NextFunction // Using _ to indicate unused parameter
  ): void {
    // Check if it's an operational error (AppError)
    if (err instanceof AppError) {
      ResponseUtils.errorResponse(res, err.message, err.statusCode);
      return;
    }

    // Programming or unknown errors: don't leak error details
    logger.error('Unhandled error', err);
    ResponseUtils.errorResponse(
      res,
      'Something went wrong!',
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}
