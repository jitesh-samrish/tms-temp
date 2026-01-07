import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';

const logger = Logger.create('RequestLogger');

export class RequestLogger {
  static log(req: Request, res: Response, next: NextFunction): void {
    const startTime = process.hrtime.bigint();
    const { method, originalUrl, ip, headers } = req;

    let logged = false;

    // 🔹 Incoming request
    logger.info('Incoming request', {
      method,
      url: originalUrl,
      ip: ip || req.socket.remoteAddress,
      userAgent: headers['user-agent'],
      contentType: headers['content-type'],
    });

    const logResponse = (event: 'finish' | 'close') => {
      if (logged) return;
      logged = true;

      const durationMs =
        Number(process.hrtime.bigint() - startTime) / 1_000_000;

      const statusCode = res.statusCode;

      const baseLog = {
        method,
        url: originalUrl,
        statusCode,
        duration: `${durationMs.toFixed(2)}ms`,
        event,
      };

      if (event === 'close' && !res.writableEnded) {
        logger.warn('Request aborted by client', baseLog);
        return;
      }

      if (statusCode >= 500) {
        logger.error('Request failed', baseLog);
      } else if (statusCode >= 400) {
        logger.warn('Request completed with client error', baseLog);
      } else {
        logger.info('Request completed', baseLog);
      }
    };

    res.once('finish', () => logResponse('finish'));
    res.once('close', () => logResponse('close'));

    next();
  }
}
